/**
 * Scanner Bridge — Comunicação entre o site principal e o scanner no celular
 * Adaptado do scanner-module para integração direta.
 */

import type { MergedDocumentScanResult } from "./documentScan";

export interface ScannerSession {
  sessionId: string;
  mode: "standalone" | "scan";
  lang: string;
  callback?: string;
  origin?: string;
}

const CHANNEL_NAME = "michels-scanner-bridge";
const STORAGE_KEY_PREFIX = "michels-scan-result-";
const SCANNER_BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://www.michelstravel.agency";

// Generate a short session ID
export function generateSessionId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Build scanner URL with session params
export function buildScannerLink(
  session: { sessionId: string; lang: string; callback?: string; origin?: string }
): string {
  const url = new URL(SCANNER_BASE_URL + "/scan");
  url.searchParams.set("mode", "scan");
  url.searchParams.set("session", session.sessionId);
  url.searchParams.set("lang", session.lang);
  if (session.callback) url.searchParams.set("callback", session.callback);
  if (session.origin) url.searchParams.set("origin", session.origin);
  return url.toString();
}

// ─── RECEIVER (Site side) ──────────────────────────────────

type ScanResultCallback = (data: MergedDocumentScanResult) => void;

export function listenForScanResult(
  sessionId: string,
  callback: ScanResultCallback
): () => void {
  const cleanups: (() => void)[] = [];

  // Register session in backend so phone can upload
  fetch("/api/scanner/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch(err => console.error("[SCANNER BRIDGE] Failed to register session:", err));

  // Method 1: BroadcastChannel (if scanner is opened in new tab on same device)
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
    // ignore
  }

  // Method 2: localStorage polling (fallback for cross-tab or cross-device if synced somehow)
  const storageKey = STORAGE_KEY_PREFIX + sessionId;
  const pollInterval = setInterval(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data && Date.now() - parsed.timestamp < 600000) {
          localStorage.removeItem(storageKey);
          callback(parsed.data);
        }
      }
    } catch {
      // ignore
    }
  }, 1200);
  cleanups.push(() => clearInterval(pollInterval));

  // Method 3: Backend polling (Essential for PC -> Phone flow)
  const backendInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/scanner/session/${sessionId}`);
      if (response.ok) {
        const session = await response.json();
        if (session.data) {
          callback(session.data);
        }
      }
    } catch {
       // ignore
    }
  }, 2000);
  cleanups.push(() => clearInterval(backendInterval));

  // Method 4: Check URL params for callback data (the most common for QR code redirect)
  const checkUrl = () => {
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
        callback(data);
      } catch (e) {
        console.error("[SCANNER BRIDGE] Failed to parse URL data:", e);
      }
    }
  };

  // Run once immediately
  checkUrl();
  
  // Also run on popstate in case of navigation
  window.addEventListener('popstate', checkUrl);
  cleanups.push(() => window.removeEventListener('popstate', checkUrl));

  return () => cleanups.forEach((fn) => fn());
}

// ─── SENDER (Phone side) ──────────────────────────────────

export async function sendScanResult(
  sessionId: string,
  data: MergedDocumentScanResult
) {
  // 1. BroadcastChannel (Same device)
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "scan-result", sessionId, data });
    channel.close();
  } catch {
    // ignore
  }

  // 2. localStorage (Same device fallback)
  const storageKey = STORAGE_KEY_PREFIX + sessionId;
  localStorage.setItem(storageKey, JSON.stringify({ data, timestamp: Date.now() }));

  // 3. Backend (Cross device)
  try {
    await fetch(`/api/scanner/result/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
  } catch (err) {
    console.error("[SCANNER BRIDGE] Failed to upload result to backend:", err);
  }
}
