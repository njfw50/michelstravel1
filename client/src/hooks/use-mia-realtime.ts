import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "connecting" | "connected" | "error";
type Call = { pc?: RTCPeerConnection; stream?: MediaStream; audio?: HTMLAudioElement; timer?: ReturnType<typeof setTimeout>; abort: AbortController; requested: boolean; requestId: string };
export function useMiaRealtime(active: boolean, language: string) {
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [muted, setMuted] = useState(false);
  const call = useRef<Call | null>(null);
  const stop = useCallback((failed = false) => {
    const c = call.current;
    call.current = null;
    if (c) {
      c.abort.abort();
      clearTimeout(c.timer);
      c.stream?.getTracks().forEach(t => t.stop());
      c.pc?.close();
      if (c.audio) { c.audio.pause(); c.audio.srcObject = null; }
      if (c.requested) void fetch("/api/mia/realtime/stop", { method: "POST", credentials: "same-origin", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: c.requestId }) }).catch(() => {});
    }
    setMuted(false);
    setStatus(failed ? "error" : "idle");
  }, []);
  useEffect(() => {
    if (!active) { stop(); return; }
    const abort = new AbortController();
    setAvailable(false);
    if (window.isSecureContext && typeof window.RTCPeerConnection === "function" && typeof navigator.mediaDevices?.getUserMedia === "function") {
      void fetch("/api/mia/realtime/status", { signal: abort.signal, credentials: "same-origin" })
        .then(r => r.ok ? r.json() : null).then(x => { if (!abort.signal.aborted) setAvailable(x?.available === true); }).catch(() => {});
    }
    return () => { abort.abort(); stop(); };
  }, [active, language, stop]);
  const start = async () => {
    if (!available || !active || call.current) return;
    const c: Call = { abort: new AbortController(), requested: false, requestId: crypto.randomUUID() };
    call.current = c;
    setStatus("connecting");
    c.timer = setTimeout(() => { if (call.current === c) stop(true); }, 45_000);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (call.current !== c) { stream.getTracks().forEach(t => t.stop()); return; }
      c.stream = stream;
      const pc = new RTCPeerConnection();
      c.pc = pc;
      const audio = new Audio();
      c.audio = audio;
      audio.autoplay = true;
      pc.ontrack = event => {
        if (call.current !== c) return;
        audio.srcObject = event.streams[0] || new MediaStream([event.track]);
        void audio.play().catch(() => { if (call.current === c) stop(true); });
      };
      pc.onconnectionstatechange = () => {
        if (call.current !== c) return;
        if (pc.connectionState === "connected") {
          clearTimeout(c.timer);
          c.timer = setTimeout(() => { if (call.current === c) stop(); }, 4 * 60_000 + 30_000);
          setStatus("connected");
        } else if (["failed", "closed", "disconnected"].includes(pc.connectionState)) stop(true);
      };
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = event => {
        try { if (JSON.parse(event.data).type === "error" && call.current === c) stop(true); } catch { /* ignore malformed event */ }
      };
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (call.current !== c) return;
      c.requested = true;
      const res = await fetch("/api/mia/realtime/start", {
        method: "POST", credentials: "same-origin", signal: c.abort.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, language, consent: true, requestId: c.requestId }),
      });
      if (!res.ok) throw new Error("Voice unavailable");
      const answer = await res.json();
      if (call.current !== c) return;
      if (typeof answer.sdp !== "string") throw new Error("Invalid SDP");
      await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
    } catch { if (call.current === c) stop(true); }
  };
  const toggleMute = () => {
    const tracks = call.current?.stream?.getAudioTracks();
    if (!tracks?.length) return;
    const next = !muted;
    tracks.forEach(t => { t.enabled = !next; });
    setMuted(next);
  };
  return { available, status, muted, start, stop, toggleMute };
}
