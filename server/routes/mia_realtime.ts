import type { Express, Request } from "express";
import { createHash } from "node:crypto";

const API = "https://api.openai.com/v1/realtime/calls";
const LIMIT_MS = 5 * 60_000;
const COOLDOWN_MS = 30_000;
const enabled = () => process.env.MIA_REALTIME_ENABLED === "true" && Boolean(process.env.MIA_REALTIME_API_KEY?.trim());
const admin = (req: Request) => Boolean((req.session as unknown as { isAdmin?: boolean } | undefined)?.isAdmin);
const sameOrigin = (req: Request) => req.get("sec-fetch-site") === "same-origin" && Boolean(req.get("origin"));
let lastStart = 0;
let busy = false;
let active: { callId: string; owner: string; timeout: ReturnType<typeof setTimeout> } | null = null;

async function hangup(callId: string) {
  const key = process.env.MIA_REALTIME_API_KEY?.trim();
  if (!key) return false;
  try {
    const res = await fetch(API + "/" + encodeURIComponent(callId) + "/hangup", {
      method: "POST", headers: { Authorization: "Bearer " + key },
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok || res.status === 404;
  } catch { return false; }
}

async function closeActive(owner?: string) {
  const call = active;
  if (!call || (owner && call.owner !== owner)) return false;
  if (!await hangup(call.callId)) return false;
  if (active === call) { clearTimeout(call.timeout); active = null; }
  return true;
}

export function registerMiaRealtimeRoutes(app: Express) {
  app.get("/api/mia/realtime/status", (req, res) => {
    res.set("Cache-Control", "no-store").json({ available: enabled() && admin(req) });
  });
  app.post("/api/mia/realtime/start", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!enabled() || !admin(req) || !sameOrigin(req)) return res.status(403).json({ error: "Voice pilot unavailable" });
    const { sdp, language, consent } = req.body ?? {};
    if (consent !== true || typeof sdp !== "string" || sdp.length > 32_000 || !sdp.startsWith("v=0") || !sdp.includes("m=audio")) return res.status(400).json({ error: "Invalid voice request" });
    if (busy || active || Date.now() - lastStart < COOLDOWN_MS) return res.status(429).json({ error: "Voice pilot busy" });
    busy = true;
    lastStart = Date.now();
    const key = process.env.MIA_REALTIME_API_KEY!.trim();
    const owner = req.sessionID;
    const lang = language === "en" ? "English" : language === "es" ? "Spanish" : "Portuguese";
    const form = new FormData();
    form.set("sdp", sdp);
    form.set("session", JSON.stringify({
      type: "realtime",
      model: process.env.MIA_REALTIME_MODEL?.trim() || "gpt-realtime-2.1",
      instructions: "You are Mia, the AI travel concierge of Michels Travel. Start in " + lang + " and adapt to the user's language. Be concise and helpful. This voice pilot provides general travel guidance only. You have no live inventory, booking or payment tools. Never invent fares, booking confirmations, availability or immigration rules. Do not ask for sensitive personal, payment or document details. Direct live searches and reservations to the existing text chat. Do not claim to be human.",
      audio: { input: { turn_detection: { type: "semantic_vad", eagerness: "auto", create_response: true, interrupt_response: true } }, output: { voice: "marin" } },
    }));
    try {
      const upstream = await fetch(API, {
        method: "POST", headers: { Authorization: "Bearer " + key, "OpenAI-Safety-Identifier": createHash("sha256").update(owner).digest("hex") },
        body: form, signal: AbortSignal.timeout(25_000),
      });
      if (!upstream.ok) return res.status(502).json({ error: "Voice service unavailable" });
      const location = upstream.headers.get("location") || "";
      const callId = location.split("/").pop() || "";
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(callId)) return res.status(502).json({ error: "Voice session could not be managed" });
      const timeout = setTimeout(() => { void closeActive(); }, LIMIT_MS);
      timeout.unref();
      active = { callId, owner, timeout };
      const answer = await upstream.text();
      if (!answer.startsWith("v=0") || res.destroyed) { await closeActive(owner); return res.status(502).json({ error: "Invalid voice response" }); }
      return res.json({ sdp: answer });
    } catch {
      await closeActive(owner);
      return res.status(502).json({ error: "Voice connection failed" });
    } finally { busy = false; }
  });
  app.post("/api/mia/realtime/stop", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!admin(req) || !sameOrigin(req)) return res.sendStatus(403);
    if (!active || active.owner !== req.sessionID) return res.sendStatus(204);
    return res.sendStatus(await closeActive(req.sessionID) ? 204 : 502);
  });
}
