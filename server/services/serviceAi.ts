import { conversations } from "@shared/schema";
import { nanoid } from "nanoid";

import { db } from "../db";
import { getChatbotAiClient, getChatbotAiStatus, type ChatbotAiClientConfig, type ChatbotAiStatus } from "./chatbotAi";
import { buildBasicChatResponse, normalizeChatLanguage, type SupportedChatLanguage } from "./chatbotFallback";

export interface ServiceAiRequestContext {
  pathname?: string | null;
  search?: string | null;
  serviceMode?: string | null;
}

export interface ServiceAiSessionInput {
  visitorId?: string | null;
  language?: string | null;
}

export interface ServiceAiStatus extends ChatbotAiStatus {
  service: "mia-service-ai";
  channel: "sales-support";
  capabilities: string[];
}

const serviceAiClient = getChatbotAiClient();

const SERVICE_AI_CAPABILITIES = [
  "sales-guidance",
  "flight-search",
  "booking-lookup",
  "booking-prefill",
  "human-escalation",
];

const SUPPORT_SYSTEM_PROMPT = `You are Mia, the commercial service assistant for Michels Travel.

RULES:
- Stay inside Michels Travel sales and service topics
- Answer in the same language used by the customer
- Be concise, commercial, and direct
- Never invent prices, availability, baggage rules, or airline policies
- Never mention APIs, providers, or internal systems
- When a human should take over, start the reply with [ESCALATE]

YOU HELP WITH:
- flight search and booking guidance
- comparing options
- reservation lookup with MT reference code and email
- booking form guidance
- payment and baggage guidance at a high level`;

const AGENT_SYSTEM_PROMPT = `${SUPPORT_SYSTEM_PROMPT}

AGENT MODE:
- Use internal tools only for flight search, booking lookup, and booking form prefill
- Never collect card number, CVV, passwords, or hidden payment secrets in chat
- If data is incomplete, ask only for the missing reservation detail`;

export const SERVICE_AI_AGENT_TOOLS: any[] = [
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search flights when the customer provides origin, destination, and departure date.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string" },
          destination: { type: "string" },
          date: { type: "string" },
          returnDate: { type: "string" },
          adults: { type: "string" },
          cabinClass: { type: "string", enum: ["economy", "premium_economy", "business", "first"] },
        },
        required: ["origin", "destination", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_booking",
      description: "Look up a customer booking by reference code and email.",
      parameters: {
        type: "object",
        properties: {
          reference: { type: "string" },
          email: { type: "string" },
        },
        required: ["reference", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fill_booking_form",
      description: "Prefill the booking form with passenger and contact information when the customer is already on a booking page and explicitly asks for help.",
      parameters: {
        type: "object",
        properties: {
          contactEmail: { type: "string" },
          contactPhone: { type: "string" },
          passengers: { type: "array" },
        },
        required: ["passengers"],
      },
    },
  },
];

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function buildWelcomeReply(language: SupportedChatLanguage, context?: ServiceAiRequestContext | null) {
  const pathname = context?.pathname || "";

  if (language === "en") {
    if (pathname.startsWith("/book/")) return "I can help you finish this reservation. Send the missing passenger or contact details and I will guide the next step.";
    if (pathname.startsWith("/search")) return "I can compare the options on this page and help you move to booking.";
    return "I can help you search flights, compare options, check a reservation, or guide the next booking step.";
  }

  if (language === "es") {
    if (pathname.startsWith("/book/")) return "Puedo ayudarte a terminar esta reserva. Enviame los datos faltantes del pasajero o del contacto y te guio con el siguiente paso.";
    if (pathname.startsWith("/search")) return "Puedo comparar las opciones de esta pagina y ayudarte a avanzar a la reserva.";
    return "Puedo ayudarte a buscar vuelos, comparar opciones, consultar una reserva o indicar el siguiente paso de compra.";
  }

  if (pathname.startsWith("/book/")) return "Posso ajudar voce a concluir esta reserva. Envie os dados que faltam do passageiro ou contato e eu guio o proximo passo.";
  if (pathname.startsWith("/search")) return "Posso comparar as opcoes desta pagina e ajudar voce a avancar para a reserva.";
  return "Posso ajudar voce a buscar voos, comparar opcoes, consultar uma reserva ou indicar o proximo passo da compra.";
}

export function buildServiceAiFallback(content: string, languageInput?: string | null, context?: ServiceAiRequestContext | null) {
  const language = normalizeChatLanguage(languageInput);
  const normalized = stripAccents(content).toLowerCase().trim();

  if (!normalized || /^(oi|ola|hello|hi|hola|buenas|bom dia|boa tarde|boa noite)$/.test(normalized)) {
    return { message: buildWelcomeReply(language, context), escalate: false };
  }

  if ((context?.pathname || "").startsWith("/book/") && includesAny(normalized, ["ajuda", "help", "ayuda", "form", "formulario", "reserva", "reservation", "payment", "pagamento"])) {
    return {
      message:
        language === "en"
          ? "You are already on the reservation page. Send the passenger and contact details you want to complete, and I will guide the form step."
          : language === "es"
            ? "Ya estas en la pagina de reserva. Envia los datos del pasajero y del contacto que quieras completar y te guio con el formulario."
            : "Voce ja esta na pagina da reserva. Envie os dados do passageiro e do contato que deseja completar e eu guio o preenchimento.",
      escalate: false,
    };
  }

  if ((context?.pathname || "").startsWith("/search") && includesAny(normalized, ["compare", "comparar", "barato", "cheap", "mejor", "melhor", "horario", "schedule", "stops", "escalas", "bagagem", "equipaje", "baggage"])) {
    return {
      message:
        language === "en"
          ? "I can compare price, stops, schedule, and baggage for the options on this page. Tell me what matters most."
          : language === "es"
            ? "Puedo comparar precio, escalas, horario y equipaje para las opciones de esta pagina. Dime que es lo mas importante para ti."
            : "Posso comparar preco, conexoes, horario e bagagem para as opcoes desta pagina. Me diga o que pesa mais para voce.",
      escalate: false,
    };
  }

  return buildBasicChatResponse(content, languageInput);
}

function buildContextPrompt(context?: ServiceAiRequestContext | null) {
  const pathname = typeof context?.pathname === "string" ? context.pathname.trim() : "";
  const search = typeof context?.search === "string" ? context.search.trim() : "";
  const serviceMode = typeof context?.serviceMode === "string" ? context.serviceMode.trim() : "";

  if (!pathname && !search && !serviceMode) return null;

  const lines = ["CURRENT PAGE CONTEXT:"];
  if (pathname) lines.push(`- Pathname: ${pathname}`);
  if (search) lines.push(`- Query string: ${search}`);
  if (serviceMode) lines.push(`- Service mode: ${serviceMode}`);
  return lines.join("\n");
}

export function buildServiceAiHistory(
  existingMessages: Array<{ role: string; content: string }>,
  mode: "support" | "agent",
  context?: ServiceAiRequestContext | null,
) {
  const history: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: mode === "agent" ? AGENT_SYSTEM_PROMPT : SUPPORT_SYSTEM_PROMPT },
  ];

  const contextPrompt = buildContextPrompt(context);
  if (contextPrompt) history.push({ role: "system", content: contextPrompt });

  history.push(
    ...existingMessages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
  );

  return history;
}

export function getServiceAiClient(): ChatbotAiClientConfig {
  return serviceAiClient;
}

export function getServiceAiStatus(): ServiceAiStatus {
  return {
    ...getChatbotAiStatus(),
    service: "mia-service-ai",
    channel: "sales-support",
    capabilities: SERVICE_AI_CAPABILITIES,
  };
}

export async function createServiceAiSession(input: ServiceAiSessionInput = {}) {
  const [conversation] = await db
    .insert(conversations)
    .values({
      title: "Mia Service AI",
      visitorId: input.visitorId?.trim() || nanoid(10),
      language: normalizeChatLanguage(input.language),
      escalated: false,
      resolved: false,
    })
    .returning();

  return { sessionId: conversation.id, visitorId: conversation.visitorId };
}

export async function createServiceAiCompletionWithFallback(options: Record<string, unknown>) {
  const { model, fallbackModel, ...rest } = options as { model?: string | null; fallbackModel?: string | null } & Record<string, unknown>;
  const candidates = [model, fallbackModel].filter((candidate, index, all): candidate is string => Boolean(candidate) && all.indexOf(candidate) === index);
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      return await serviceAiClient.client!.chat.completions.create({ ...rest, model: candidate } as any);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No service AI model configured");
}

export async function createServiceAiStreamingCompletionWithFallback(options: Record<string, unknown>) {
  const { model, fallbackModel, ...rest } = options as { model?: string | null; fallbackModel?: string | null } & Record<string, unknown>;
  const candidates = [model, fallbackModel].filter((candidate, index, all): candidate is string => Boolean(candidate) && all.indexOf(candidate) === index);
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      return await serviceAiClient.client!.chat.completions.create({ ...rest, model: candidate, stream: true } as any);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No service AI model configured");
}
