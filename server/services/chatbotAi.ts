import OpenAI from "openai";

export type ChatbotAiProvider = "openai" | "gemini" | "none";

export interface ChatbotAiStatus {
  provider: ChatbotAiProvider;
  available: boolean;
  agentMode: "ai" | "basic";
  label: string;
  primaryModel: string | null;
  fallbackModel: string | null;
  agentModel: string | null;
}

export interface ChatbotAiClientConfig extends ChatbotAiStatus {
  client: OpenAI | null;
  baseURL: string | null;
}

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

let cachedConfig: ChatbotAiClientConfig | null = null;

function pickProvider(): { provider: ChatbotAiProvider; apiKey: string | null; baseURL: string | null } {
  const requestedProvider = (process.env.AI_PROVIDER || "auto").trim().toLowerCase();
  const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim() || null;
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || null;

  if (requestedProvider === "gemini" && geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseURL: process.env.GEMINI_BASE_URL?.trim() || DEFAULT_GEMINI_BASE_URL,
    };
  }

  if (requestedProvider === "openai" && openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim() || DEFAULT_OPENAI_BASE_URL,
    };
  }

  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseURL: process.env.GEMINI_BASE_URL?.trim() || DEFAULT_GEMINI_BASE_URL,
    };
  }

  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim() || DEFAULT_OPENAI_BASE_URL,
    };
  }

  return {
    provider: "none",
    apiKey: null,
    baseURL: null,
  };
}

export function getChatbotAiClient(): ChatbotAiClientConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const providerSelection = pickProvider();

  if (providerSelection.provider === "none" || !providerSelection.apiKey) {
    cachedConfig = {
      provider: "none",
      available: false,
      agentMode: "basic",
      label: "Basic",
      primaryModel: null,
      fallbackModel: null,
      agentModel: null,
      client: null,
      baseURL: null,
    };
    return cachedConfig;
  }

  const providerDefaults =
    providerSelection.provider === "gemini"
      ? {
          label: "Gemini",
          primaryModel: process.env.CHATBOT_PRIMARY_MODEL?.trim() || "gemini-2.5-flash",
          fallbackModel: process.env.CHATBOT_FALLBACK_MODEL?.trim() || "gemini-2.5-flash-lite",
          agentModel: process.env.CHATBOT_AGENT_MODEL?.trim() || process.env.CHATBOT_PRIMARY_MODEL?.trim() || "gemini-2.5-flash",
        }
      : {
          label: "OpenAI",
          primaryModel: process.env.CHATBOT_PRIMARY_MODEL?.trim() || "gpt-4o-mini",
          fallbackModel: process.env.CHATBOT_FALLBACK_MODEL?.trim() || "gpt-4o-mini",
          agentModel: process.env.CHATBOT_AGENT_MODEL?.trim() || process.env.CHATBOT_PRIMARY_MODEL?.trim() || "gpt-4o-mini",
        };

  cachedConfig = {
    provider: providerSelection.provider,
    available: true,
    agentMode: "ai",
    label: providerDefaults.label,
    primaryModel: providerDefaults.primaryModel,
    fallbackModel: providerDefaults.fallbackModel,
    agentModel: providerDefaults.agentModel,
    client: new OpenAI({
      apiKey: providerSelection.apiKey,
      baseURL: providerSelection.baseURL || undefined,
    }),
    baseURL: providerSelection.baseURL,
  };

  return cachedConfig;
}

export function getChatbotAiStatus(): ChatbotAiStatus {
  const { client: _client, baseURL: _baseURL, ...status } = getChatbotAiClient();
  return status;
}
