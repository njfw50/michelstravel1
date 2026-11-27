import type { Express, Request } from "express";
import { createHash } from "node:crypto";

const API = "https://api.openai.com/v1/realtime/calls";
const LIMIT_MS = 5 * 60_000;
const COOLDOWN_MS = 30_000;
const enabled = () => process.env.MIA_REALTIME_ENABLED === "true" && Boolean(process.env.MIA_REALTIME_API_KEY?.trim());
const admin = (req: Request) => Boolean((req.session as unknown as { isAdmin?: boolean } | undefined)?.isAdmin);
const sameOrigin = (req: Request) => req.get("sec-fetch-site") === "same-origin" && Boolean(req.get("origin"));
let lastStart = 0;
let pending: { owner: string; requestId: string; cancelled: boolean } | null = null;
let uncertain = false;
let active: { callId: string; owner: string; requestId: string; timeout: ReturnType<typeof setTimeout>; closing?: Promise<boolean> } | null = null;
const validRequestId = (id: unknown): id is string => typeof id === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
const cancelled = new Map<string, number>();
function rememberCancellation(key: string) {
  const now = Date.now();
  for (const [k, expires] of cancelled) if (expires <= now) cancelled.delete(k);
  if (cancelled.size >= 128) cancelled.delete(cancelled.keys().next().value!);
  cancelled.set(key, now + 60_000);
}

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
  if (call.closing) return call.closing;
  call.closing = (async () => {
    if (!await hangup(call.callId)) return false;
    if (active === call) { clearTimeout(call.timeout); active = null; }
    return true;
  })();
  const closed = await call.closing;
  if (!closed) call.closing = undefined;
  return closed;
}

export function registerMiaRealtimeRoutes(app: Express) {
  app.get("/api/mia/realtime/status", (req, res) => {
    res.set("Cache-Control", "no-store").json({ available: enabled() && admin(req) });
  });
  app.post("/api/mia/realtime/start", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!enabled() || !admin(req) || !sameOrigin(req)) return res.status(403).json({ error: "Voice pilot unavailable" });
    const { sdp, language, consent, requestId } = req.body ?? {};
    if (!validRequestId(requestId) || consent !== true || typeof sdp !== "string" || sdp.length > 32_000 || !sdp.startsWith("v=0") || !sdp.includes("m=audio")) return res.status(400).json({ error: "Invalid voice request" });
    const owner = req.sessionID;
    if ((cancelled.get(owner + ":" + requestId) ?? 0) > Date.now()) return res.sendStatus(409);
    if (pending || active || uncertain || Date.now() - lastStart < COOLDOWN_MS) return res.status(429).json({ error: "Voice pilot busy" });
    const attempt = { owner, requestId, cancelled: false };
    pending = attempt;
    res.once("close", () => { if (!res.writableFinished) attempt.cancelled = true; });
    lastStart = Date.now();
    const key = process.env.MIA_REALTIME_API_KEY!.trim();
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
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(callId)) { uncertain = true; return res.status(502).json({ error: "Voice session could not be managed" }); }
      const timeout = setTimeout(() => { void closeActive(); }, LIMIT_MS);
      timeout.unref();
      active = { callId, owner, requestId, timeout };
      const answer = await upstream.text();
      if (attempt.cancelled || !answer.startsWith("v=0") || res.destroyed) { await closeActive(owner); if (!res.destroyed) return res.status(502).json({ error: "Voice session cancelled or invalid" }); return; }
      return res.json({ sdp: answer });
    } catch {
      if (active?.requestId === requestId) await closeActive(owner);
      else uncertain = true; // An ambiguous upstream failure may have created a call.
      if (!res.destroyed) return res.status(502).json({ error: "Voice connection failed" });
    } finally { if (pending === attempt) pending = null; }
  });
  app.post("/api/mia/realtime/stop", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!admin(req) || !sameOrigin(req)) return res.sendStatus(403);
    const { requestId } = req.body ?? {};
    if (!validRequestId(requestId)) return res.sendStatus(400);
    const owner = req.sessionID;
    rememberCancellation(owner + ":" + requestId);
    if (pending?.owner === owner && pending.requestId === requestId) pending.cancelled = true;
    if (!active || active.owner !== owner || active.requestId !== requestId) return res.sendStatus(204);
    return res.sendStatus(await closeActive(owner) ? 204 : 502);
  });
}
