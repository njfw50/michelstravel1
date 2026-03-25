/**
 * Scanner Bridge — Comunicação entre o site principal e o scanner no celular
 *
 * FLUXO:
 * 1. Site principal gera uma sessão (sessionId) e abre o scanner via URL:
 *    https://scanner.michelstravel.com/?mode=scan&session=ABC123&lang=pt&callback=https://site.com/booking
 *
 * 2. O celular abre o scanner no navegador (sem instalar nada)
 *
 * 3. Após escanear e confirmar, os dados são enviados de volta via:
 *    a) BroadcastChannel (se mesma origem) — para quando o scanner abre em nova aba no mesmo dispositivo
 *    b) localStorage polling — fallback para cross-tab no mesmo dispositivo
 *    c) URL callback com dados codificados — para quando o scanner está em dispositivo diferente (QR code)
 *
 * 4. O site principal recebe os dados e preenche o formulário
 */

import type { MergedDocumentScanResult } from "./documentScan";

export interface ScannerSession {
  sessionId: string;
  mode: "standalone" | "scan";
  lang: string;
  callback?: string;
  origin?: string;
}

// Generate a short session ID
export function generateSessionId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Parse session from URL params
export function parseSessionFromUrl(): ScannerSession {
  const params = new URLSearchParams(window.location.search);
  return {
    sessionId: params.get("session") || "",
    mode: params.get("mode") === "scan" ? "scan" : "standalone",
    lang: params.get("lang") || "pt",
    callback: params.get("callback") || undefined,
    origin: params.get("origin") || undefined,
  };
}

// Build scanner URL with session params
export function buildScannerUrl(
  scannerBaseUrl: string,
  session: { sessionId: string; lang: string; callback?: string; origin?: string }
): string {
  const url = new URL(scannerBaseUrl);
  url.searchParams.set("mode", "scan");
  url.searchParams.set("session", session.sessionId);
  url.searchParams.set("lang", session.lang);
  if (session.callback) url.searchParams.set("callback", session.callback);
  if (session.origin) url.searchParams.set("origin", session.origin);
  return url.toString();
}

// ─── SENDER (Scanner side) ─────────────────────────────────

const CHANNEL_NAME = "michels-scanner-bridge";
const STORAGE_KEY_PREFIX = "michels-scan-result-";

export function sendScanResult(sessionId: string, data: MergedDocumentScanResult): boolean {
  let sent = false;

  // Method 1: BroadcastChannel (same origin, cross-tab)
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "scan-result", sessionId, data });
    channel.close();
    sent = true;
  } catch {
    // BroadcastChannel not supported
  }

  // Method 2: localStorage (fallback, same origin)
  try {
    localStorage.setItem(
      STORAGE_KEY_PREFIX + sessionId,
      JSON.stringify({ data, timestamp: Date.now() })
    );
    sent = true;
  } catch {
    // localStorage not available
  }

  return sent;
}

// Method 3: Redirect with data in URL (cross-device via QR code)
export function buildCallbackUrl(callbackUrl: string, sessionId: string, data: MergedDocumentScanResult): string {
  const url = new URL(callbackUrl);
  url.searchParams.set("session", sessionId);
  url.searchParams.set("scanData", btoa(JSON.stringify(data)));
  return url.toString();
}

// ─── RECEIVER (Site side) ──────────────────────────────────

type ScanResultCallback = (data: MergedDocumentScanResult) => void;

export function listenForScanResult(
  sessionId: string,
  callback: ScanResultCallback
): () => void {
  const cleanups: (() => void)[] = [];

  // Method 1: BroadcastChannel
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const handler = (event: MessageEvent) => {
      if (
        event.data?.type === "scan-result" &&
        event.data?.sessionId === sessionId &&
        event.data?.data
      ) {
        callback(event.data.data);
      }
    };
    channel.addEventListener("message", handler);
    cleanups.push(() => {
      channel.removeEventListener("message", handler);
      channel.close();
    });
  } catch {
    // BroadcastChannel not supported
  }

  // Method 2: localStorage polling
  const storageKey = STORAGE_KEY_PREFIX + sessionId;
  const pollInterval = setInterval(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data && Date.now() - parsed.timestamp < 300000) {
          localStorage.removeItem(storageKey);
          callback(parsed.data);
        }
      }
    } catch {
      // ignore
    }
  }, 1000);
  cleanups.push(() => clearInterval(pollInterval));

  // Method 3: Check URL params for callback data
  const params = new URLSearchParams(window.location.search);
  const scanDataParam = params.get("scanData");
  if (scanDataParam && params.get("session") === sessionId) {
    try {
      const data = JSON.parse(atob(scanDataParam));
      // Clean URL
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("scanData");
      cleanUrl.searchParams.delete("session");
      window.history.replaceState({}, "", cleanUrl.toString());
      setTimeout(() => callback(data), 100);
    } catch {
      // invalid data
    }
  }

  return () => cleanups.forEach((fn) => fn());
}

// Clean up old sessions from localStorage
export function cleanupOldSessions(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (now - parsed.timestamp > 600000) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    }
  } catch {
    // ignore
  }
}
