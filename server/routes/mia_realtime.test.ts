import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { registerMiaRealtimeRoutes } from "./mia_realtime";
import { once } from "node:events";

test("pilot HTTP regression — mocked upstream only, not live voice", async () => {
  const originalFetch = globalThis.fetch;
  const oldEnabled = process.env.MIA_REALTIME_ENABLED;
  const oldKey = process.env.MIA_REALTIME_API_KEY;
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.assign(req, { session: { isAdmin: req.get("x-test-admin") === "yes" }, sessionID: req.get("x-test-owner") || "owner" });
    next();
  });
  registerMiaRealtimeRoutes(app);
  const listener = app.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const addr = listener.address();
  assert.ok(addr && typeof addr !== "string");
  const base = "http://127.0.0.1:" + addr.port + "/api/mia/realtime";
  const headers = { "x-test-admin": "yes", "sec-fetch-site": "same-origin", origin: "http://127.0.0.1", "content-type": "application/json" };
  const id = "abc00000-0000-4000-8000-000000000001";
  const payload = { requestId: id, sdp: "v=0\\r\\nm=audio 9 UDP/TLS/RTP/SAVPF 111", language: "es", consent: true };
  const post = (path: string, body: object, overrides = {}) => originalFetch(base + path, { method: "POST", headers: { ...headers, ...overrides }, body: JSON.stringify(body) });
  let signalEntered!: () => void;
  const entered = new Promise<void>(r => { signalEntered = r; });
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  let starts = 0, hangups = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/hangup")) { hangups++; return new Response(null, { status: 204 }); }
    assert.equal(url, "https://api.openai.com/v1/realtime/calls");
    starts++;
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer synthetic-test-only");
    const form = init?.body as FormData;
    assert.match(String(form.get("session")), /Spanish/);
    signalEntered();
    await gate;
    return new Response("v=0", { status: 201, headers: { location: "/v1/realtime/calls/call_test" } });
  };
  try {
    process.env.MIA_REALTIME_ENABLED = "false";
    process.env.MIA_REALTIME_API_KEY = "synthetic-test-only";
    assert.deepEqual(await (await originalFetch(base + "/status", { headers })).json(), { available: false });
    assert.equal((await post("/start", payload)).status, 403);
    process.env.MIA_REALTIME_ENABLED = "true";
    assert.deepEqual(await (await originalFetch(base + "/status", { headers })).json(), { available: true });
    assert.equal((await post("/start", payload, { "x-test-admin": "no" })).status, 403);
    assert.equal((await post("/start", payload, { "sec-fetch-site": "cross-site" })).status, 403);
    assert.equal((await post("/start", { ...payload, consent: false })).status, 400);
    assert.equal((await post("/start", { ...payload, requestId: "invalid" })).status, 400);
    const inFlight = post("/start", payload);
    await Promise.race([entered, inFlight.then(r => { throw new Error("Start returned before upstream: " + r.status); })]);
    assert.equal((await post("/start", { ...payload, requestId: "abc00000-0000-4000-8000-000000000002" })).status, 429);
    assert.equal((await post("/stop", { requestId: id }, { "x-test-owner": "other" })).status, 204);
    assert.equal(hangups, 0);
    assert.equal((await post("/stop", { requestId: id })).status, 204);
    release();
    assert.equal((await inFlight).status, 502);
    assert.equal(starts, 1);
    assert.equal(hangups, 1);
    assert.equal((await post("/start", payload)).status, 409);
  } finally {
    release();
    globalThis.fetch = originalFetch;
    if (oldEnabled === undefined) delete process.env.MIA_REALTIME_ENABLED; else process.env.MIA_REALTIME_ENABLED = oldEnabled;
    if (oldKey === undefined) delete process.env.MIA_REALTIME_API_KEY; else process.env.MIA_REALTIME_API_KEY = oldKey;
    listener.closeAllConnections();
    await new Promise<void>(resolve => listener.close(() => resolve()));
  }
});
