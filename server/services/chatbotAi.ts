import OpenAI from "openai";

export type ChatbotAiProvider = "gemini" | "cerebras" | "none";

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

const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const DEFAULT_CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";

let cachedConfig: ChatbotAiClientConfig | null = null;

function pickProvider(): { provider: ChatbotAiProvider; apiKey: string | null; baseURL: string | null } {
  const requestedProvider = (process.env.AI_PROVIDER || "auto").trim().toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || null;
  const cerebrasKey = process.env.CEREBRAS_API_KEY?.trim() || null;

  if (requestedProvider === "cerebras" && cerebrasKey) {
    return {
      provider: "cerebras",
      apiKey: cerebrasKey,
      baseURL: process.env.CEREBRAS_BASE_URL?.trim() || DEFAULT_CEREBRAS_BASE_URL,
    };
  }

  if (requestedProvider === "gemini" && geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseURL: process.env.GEMINI_BASE_URL?.trim() || DEFAULT_GEMINI_BASE_URL,
    };
  }

  if (cerebrasKey) {
    return {
      provider: "cerebras",
      apiKey: cerebrasKey,
      baseURL: process.env.CEREBRAS_BASE_URL?.trim() || DEFAULT_CEREBRAS_BASE_URL,
    };
  }

  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseURL: process.env.GEMINI_BASE_URL?.trim() || DEFAULT_GEMINI_BASE_URL,
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
      : providerSelection.provider === "cerebras"
        ? {
            label: "Cerebras",
            primaryModel: process.env.CHATBOT_PRIMARY_MODEL?.trim() || "llama3.1-8b",
            fallbackModel: process.env.CHATBOT_FALLBACK_MODEL?.trim() || "llama3.1-8b",
            agentModel: process.env.CHATBOT_AGENT_MODEL?.trim() || "llama3.1-8b",
          }
        : {
            label: "Basic",
            primaryModel: null,
            fallbackModel: null,
            agentModel: null,
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
