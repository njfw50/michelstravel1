import { api } from "../lib/api";
import { JourneyMode } from "../types/app";

export type ChatbotProvider = "gemini" | "cerebras" | "none";

export type ChatbotStatus = {
  provider: ChatbotProvider;
  available: boolean;
  agentMode: "ai" | "basic";
  label: string;
  primaryModel: string | null;
  fallbackModel: string | null;
  agentModel: string | null;
};

export type ChatbotFlightResult = {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  logoUrl?: string | null;
  originCode?: string;
  destinationCode?: string;
  originCity?: string | null;
  destinationCity?: string | null;
};

export type ChatbotStreamEvent =
  | { type: "text"; content: string }
  | { type: "flights"; flights: ChatbotFlightResult[] }
  | { type: "done"; escalated?: boolean }
  | { type: "error"; error?: string };

export async function getChatbotStatus(): Promise<ChatbotStatus> {
  const response = await api.get<ChatbotStatus>("/api/chatbot/status");
  return response.data;
}

export async function createChatbotSession(language: "pt" | "en" | "es"): Promise<number> {
  const visitorId = `mobile-${Math.random().toString(36).slice(2, 12)}`;
  const response = await api.post<{ sessionId: number }>("/api/chatbot/session", {
    visitorId,
    language,
  });
  return response.data.sessionId;
}

type SendChatbotMessageArgs = {
  sessionId: number;
  content: string;
  language: "pt" | "en" | "es";
  agentMode: boolean;
  mode: JourneyMode;
  onEvent: (event: ChatbotStreamEvent) => void;
};

export async function sendChatbotMessage({
  sessionId,
  content,
  language,
  agentMode,
  mode,
  onEvent,
}: SendChatbotMessageArgs): Promise<void> {
  const endpoint = `${api.defaults.baseURL}${agentMode ? "/api/chatbot/agent-message" : "/api/chatbot/message"}`;

  await new Promise<void>((resolve, reject) => {
    let lastProcessed = 0;

    const processChunk = (rawChunk: string) => {
      const lines = rawChunk.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (!payload) continue;
        try {
          const event = JSON.parse(payload);
          if (event.type === "flights" && Array.isArray(event.flights)) {
            onEvent({ type: "flights", flights: event.flights });
          } else if (event.content) {
            onEvent({ type: "text", content: String(event.content) });
          } else if (event.done) {
            onEvent({ type: "done", escalated: Boolean(event.escalated) });
          } else if (event.error) {
            onEvent({ type: "error", error: String(event.error) });
          }
        } catch {
          // Ignore malformed SSE lines.
        }
      }
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 60000;

    xhr.onprogress = () => {
      const newChunk = xhr.responseText.substring(lastProcessed);
      lastProcessed = xhr.responseText.length;
      processChunk(newChunk);
    };

    xhr.onload = () => {
      const remaining = xhr.responseText.substring(lastProcessed);
      if (remaining) {
        processChunk(remaining);
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`Chatbot request failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.ontimeout = () => reject(new Error("Request timeout"));

    xhr.send(
      JSON.stringify({
        sessionId,
        content,
        language,
        context: {
          pathname: "/mobile/help",
          serviceMode: mode,
        },
      }),
    );
  });
}
