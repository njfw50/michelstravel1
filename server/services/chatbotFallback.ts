export type SupportedChatLanguage = "pt" | "en" | "es";

export interface BasicChatFallback {
  message: string;
  escalate: boolean;
}

export type AgentFallbackAction =
  | {
      type: "search_flights";
      args: {
        origin: string;
        destination: string;
        date: string;
        returnDate?: string;
        adults: string;
        cabinClass: "economy" | "premium_economy" | "business" | "first";
      };
    }
  | {
      type: "lookup_booking";
      args: {
        reference: string;
        email: string;
      };
    }
  | {
      type: "escalate";
      message: string;
    }
  | {
      type: "reply";
      message: string;
    };

export interface BookingSummaryInput {
  referenceCode: string;
  status: string;
  ticketStatus?: string | null;
  airlineReference?: string | null;
  airline?: string | null;
  origin?: string | null;
  destination?: string | null;
  departureDate?: string | null;
  passengerCount?: number;
}

const HUMAN_KEYWORDS = [
  "humano",
  "atendente",
  "agente",
  "pessoa",
  "representante",
  "human",
  "person",
  "representative",
  "agent",
  "agente humano",
  "humana",
  "asesor",
  "persona",
];

const SEARCH_KEYWORDS = [
  "voo",
  "voos",
  "passagem",
  "passagens",
  "flight",
  "flights",
  "fare",
  "fares",
  "vuelo",
  "vuelos",
  "pasaje",
  "pasajes",
  "ticket",
  "tickets",
];

const BAGGAGE_KEYWORDS = ["bagagem", "mala", "males", "bag", "bags", "baggage", "equipaje", "maleta", "maletas"];
const PAYMENT_KEYWORDS = ["pagamento", "cartao", "cartão", "payment", "card", "stripe", "pago", "pagar", "tarjeta"];
const CHANGE_KEYWORDS = ["cancel", "cance", "refund", "reembolso", "troca", "change", "remarca", "modificar", "cancelar"];
const BOOKING_KEYWORDS = ["reserva", "booking", "book", "my trips", "minhas viagens", "viaje", "ticket status", "localizador"];

const CITY_TO_IATA: Array<{ aliases: string[]; code: string }> = [
  { aliases: ["sao paulo", "sao paulo sp", "guarulhos"], code: "GRU" },
  { aliases: ["rio de janeiro", "rio"], code: "GIG" },
  { aliases: ["miami"], code: "MIA" },
  { aliases: ["orlando"], code: "MCO" },
  { aliases: ["new york", "nyc"], code: "JFK" },
  { aliases: ["newark"], code: "EWR" },
  { aliases: ["boston"], code: "BOS" },
  { aliases: ["los angeles", "la"], code: "LAX" },
  { aliases: ["lisbon", "lisboa"], code: "LIS" },
  { aliases: ["madrid"], code: "MAD" },
  { aliases: ["barcelona"], code: "BCN" },
  { aliases: ["paris"], code: "CDG" },
  { aliases: ["london", "londres"], code: "LHR" },
  { aliases: ["tokyo", "toquio", "tóquio"], code: "HND" },
];

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function formatDateForSummary(date: string, language: SupportedChatLanguage): string {
  try {
    const parsed = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    const locale =
      language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US";

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsed);
  } catch {
    return date;
  }
}

function inferYear(month: number, day: number): number {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const candidate = new Date(Date.UTC(currentYear, month - 1, day, 12, 0, 0));
  return candidate < now ? currentYear + 1 : currentYear;
}

function parseSlashDate(raw: string, language: SupportedChatLanguage): string | null {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!match) return null;

  let first = parseInt(match[1], 10);
  let second = parseInt(match[2], 10);
  const explicitYear = match[3] ? parseInt(match[3], 10) : null;

  let month = language === "en" ? first : second;
  let day = language === "en" ? second : first;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    month = second;
    day = first;
  }

  const year = explicitYear ? (explicitYear < 100 ? 2000 + explicitYear : explicitYear) : inferYear(month, day);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractDates(content: string, language: SupportedChatLanguage): string[] {
  const isoDates = Array.from(content.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g), (match) => match[1]);
  if (isoDates.length > 0) {
    return isoDates;
  }

  const slashDates = Array.from(content.matchAll(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/g))
    .map((match) => parseSlashDate(match[1], language))
    .filter((value): value is string => Boolean(value));

  return slashDates;
}

function extractAirports(content: string): { origin?: string; destination?: string } {
  const upper = content.toUpperCase();
  const iataCodes = Array.from(upper.matchAll(/\b[A-Z]{3}\b/g))
    .map((match) => match[0])
    .filter((code, index, all) => all.indexOf(code) === index);

  if (iataCodes.length >= 2) {
    return { origin: iataCodes[0], destination: iataCodes[1] };
  }

  const normalized = stripAccents(content).toLowerCase();
  const matches = CITY_TO_IATA.flatMap((entry) =>
    entry.aliases
      .map((alias) => ({ alias, index: normalized.indexOf(stripAccents(alias).toLowerCase()), code: entry.code }))
      .filter((item) => item.index >= 0),
  ).sort((a, b) => a.index - b.index);

  const distinctCodes = matches
    .map((match) => match.code)
    .filter((code, index, all) => all.indexOf(code) === index);

  if (distinctCodes.length >= 2) {
    return { origin: distinctCodes[0], destination: distinctCodes[1] };
  }

  return {};
}

function extractAdults(content: string): string {
  const match = content.match(/\b(\d+)\s*(adult|adults|adulto|adultos|pasajero|pasajeros|passenger|passengers)\b/i);
  return match?.[1] || "1";
}

function extractCabinClass(content: string): "economy" | "premium_economy" | "business" | "first" {
  const normalized = stripAccents(content).toLowerCase();
  if (normalized.includes("first")) return "first";
  if (normalized.includes("business") || normalized.includes("executiva")) return "business";
  if (normalized.includes("premium")) return "premium_economy";
  return "economy";
}

export function normalizeChatLanguage(language?: string | null): SupportedChatLanguage {
  if (language === "en" || language === "es") return language;
  return "pt";
}

function buildHumanEscalation(language: SupportedChatLanguage): string {
  if (language === "en") {
    return "[ESCALATE] I’m connecting you with a human agent now. Our team has been notified and will reply soon through the site messenger.";
  }
  if (language === "es") {
    return "[ESCALATE] Te estoy conectando con un agente humano. Nuestro equipo ya fue notificado y responderá pronto por el mensajero del sitio.";
  }
  return "[ESCALATE] Vou te conectar com um atendente humano agora. Nossa equipe já foi notificada e responderá em breve pelo mensageiro do site.";
}

export function buildBasicChatResponse(content: string, languageInput?: string | null): BasicChatFallback {
  const language = normalizeChatLanguage(languageInput);
  const normalized = stripAccents(content).toLowerCase();

  if (includesAny(normalized, HUMAN_KEYWORDS)) {
    return { message: buildHumanEscalation(language), escalate: true };
  }

  if (includesAny(normalized, SEARCH_KEYWORDS)) {
    return {
      escalate: false,
      message:
        language === "en"
          ? "I can help with flight searches. Use the search bar on the homepage, or switch on Agent Mode and send a structured request like: GRU to MCO on 2026-06-15."
          : language === "es"
            ? "Puedo ayudarte con la búsqueda de vuelos. Usa el buscador de la página principal, o activa el Modo Agente y envía una solicitud estructurada como: GRU a MCO el 2026-06-15."
            : "Posso ajudar com a busca de voos. Use a busca da página inicial, ou ative o Modo Agente e envie uma solicitação estruturada como: GRU para MCO em 2026-06-15.",
    };
  }

  if (includesAny(normalized, BAGGAGE_KEYWORDS)) {
    return {
      escalate: false,
      message:
        language === "en"
          ? "Baggage rules depend on the airline and fare. During booking you’ll see what is included and what costs extra. If you want, I can connect you with a human agent for route-specific help."
          : language === "es"
            ? "Las reglas de equipaje dependen de la aerolínea y de la tarifa. Durante la reserva verás qué está incluido y qué tiene costo extra. Si quieres, puedo conectarte con un agente humano."
            : "As regras de bagagem dependem da companhia e da tarifa. Durante a reserva você verá o que está incluído e o que tem custo extra. Se quiser, posso te conectar com um atendente humano.",
    };
  }

  if (includesAny(normalized, PAYMENT_KEYWORDS)) {
    return {
      escalate: false,
      message:
        language === "en"
          ? "Payments on Michels Travel are processed securely by card on the site. If your payment failed or looks unusual, I recommend talking to a human agent so we can verify it quickly."
          : language === "es"
            ? "Los pagos en Michels Travel se procesan de forma segura con tarjeta dentro del sitio. Si tu pago falló o parece extraño, te recomiendo hablar con un agente humano."
            : "Os pagamentos na Michels Travel são processados com segurança por cartão dentro do site. Se o pagamento falhou ou parece estranho, recomendo falar com um atendente humano.",
    };
  }

  if (includesAny(normalized, CHANGE_KEYWORDS) || includesAny(normalized, BOOKING_KEYWORDS)) {
    return {
      escalate: false,
      message:
        language === "en"
          ? "For booking changes, cancellations, refunds, or ticket checks, use the My Trips page. If you already have your MT reference and email, Agent Mode can help look it up, or I can connect you with a human agent."
          : language === "es"
            ? "Para cambios, cancelaciones, reembolsos o consulta de boleto, usa la página Mis Viajes. Si ya tienes tu referencia MT y el correo, el Modo Agente puede ayudarte a consultarlo, o puedo conectarte con un agente humano."
            : "Para alterações, cancelamentos, reembolsos ou consulta de bilhete, use a página Minhas Viagens. Se você já tiver a referência MT e o e-mail, o Modo Agente pode ajudar a consultar, ou posso te conectar com um atendente humano.",
    };
  }

  return {
    escalate: false,
    message:
      language === "en"
        ? "I can help with flight search, booking questions, baggage, payments, and connecting you with a human agent. If you want automatic search help, turn on Agent Mode and send: origin, destination, and date."
        : language === "es"
          ? "Puedo ayudarte con búsqueda de vuelos, reservas, equipaje, pagos y conexión con un agente humano. Si quieres ayuda automática para buscar, activa el Modo Agente y envía: origen, destino y fecha."
          : "Posso ajudar com busca de voos, reservas, bagagem, pagamentos e conexão com um atendente humano. Se quiser ajuda automática para pesquisar, ative o Modo Agente e envie: origem, destino e data.",
  };
}

export function parseAgentFallbackRequest(content: string, languageInput?: string | null): AgentFallbackAction {
  const language = normalizeChatLanguage(languageInput);
  const normalized = stripAccents(content).toLowerCase();

  if (includesAny(normalized, HUMAN_KEYWORDS)) {
    return { type: "escalate", message: buildHumanEscalation(language) };
  }

  const referenceMatch = content.match(/\bMT-[A-Z0-9]{4,}\b/i);
  const emailMatch = content.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  if (referenceMatch && emailMatch) {
    return {
      type: "lookup_booking",
      args: {
        reference: referenceMatch[0].toUpperCase(),
        email: emailMatch[0].toLowerCase(),
      },
    };
  }

  if (includesAny(normalized, CHANGE_KEYWORDS)) {
    return {
      type: "escalate",
      message:
        language === "en"
          ? "[ESCALATE] Booking changes, cancellations, and refund disputes are better handled by a human agent. I’m notifying the team now."
          : language === "es"
            ? "[ESCALATE] Los cambios, cancelaciones y disputas de reembolso se manejan mejor con un agente humano. Estoy notificando al equipo ahora."
            : "[ESCALATE] Alterações, cancelamentos e disputas de reembolso são melhor tratados por um atendente humano. Estou notificando a equipe agora.",
    };
  }

  const dates = extractDates(content, language);
  const route = extractAirports(content);
  const searchIntent = includesAny(normalized, SEARCH_KEYWORDS) || Boolean(route.origin && route.destination);

  if (route.origin && route.destination && dates.length > 0) {
    return {
      type: "search_flights",
      args: {
        origin: route.origin,
        destination: route.destination,
        date: dates[0],
        returnDate: dates[1],
        adults: extractAdults(content),
        cabinClass: extractCabinClass(content),
      },
    };
  }

  if (searchIntent) {
    return {
      type: "reply",
      message:
        language === "en"
          ? "For Agent Mode without an external AI key, send your request in a structured way. Example: GRU to MCO on 2026-06-15 for 2 adults."
          : language === "es"
            ? "Para usar el Modo Agente sin una IA externa, envía la solicitud de forma estructurada. Ejemplo: GRU a MCO el 2026-06-15 para 2 adultos."
            : "Para usar o Modo Agente sem uma IA externa, envie a solicitação de forma estruturada. Exemplo: GRU para MCO em 2026-06-15 para 2 adultos.",
    };
  }

  return {
    type: "reply",
    message: buildBasicChatResponse(content, language).message,
  };
}

export function buildAgentSearchSummary(
  languageInput: string | null | undefined,
  flights: Array<{ price: number; currency: string }>,
  origin: string,
  destination: string,
  date: string,
): string {
  const language = normalizeChatLanguage(languageInput);

  if (flights.length === 0) {
    if (language === "en") {
      return `I didn’t find flight options from ${origin} to ${destination} for ${formatDateForSummary(date, language)}. Try another date, nearby airport, or ask a human agent for help.`;
    }
    if (language === "es") {
      return `No encontré opciones de vuelo de ${origin} a ${destination} para ${formatDateForSummary(date, language)}. Prueba otra fecha, un aeropuerto cercano o pide ayuda a un agente humano.`;
    }
    return `Não encontrei opções de voo de ${origin} para ${destination} em ${formatDateForSummary(date, language)}. Tente outra data, aeroporto próximo ou peça ajuda a um atendente humano.`;
  }

  const minPrice = Math.min(...flights.map((flight) => flight.price));
  const maxPrice = Math.max(...flights.map((flight) => flight.price));
  const currency = flights[0].currency;

  if (language === "en") {
    return `I found ${flights.length} options from ${origin} to ${destination} for ${formatDateForSummary(date, language)}. Prices currently range from ${currency} ${minPrice.toFixed(2)} to ${currency} ${maxPrice.toFixed(2)}. You can click Book on any result below.`;
  }
  if (language === "es") {
    return `Encontré ${flights.length} opciones de ${origin} a ${destination} para ${formatDateForSummary(date, language)}. Los precios ahora van de ${currency} ${minPrice.toFixed(2)} a ${currency} ${maxPrice.toFixed(2)}. Puedes hacer clic en Reservar en cualquiera de los resultados abajo.`;
  }
  return `Encontrei ${flights.length} opções de ${origin} para ${destination} em ${formatDateForSummary(date, language)}. Os preços neste momento vão de ${currency} ${minPrice.toFixed(2)} até ${currency} ${maxPrice.toFixed(2)}. Você pode clicar em Reservar em qualquer resultado abaixo.`;
}

export function buildAgentLookupSummary(languageInput: string | null | undefined, booking: BookingSummaryInput): string {
  const language = normalizeChatLanguage(languageInput);
  const segment = booking.origin && booking.destination ? `${booking.origin} → ${booking.destination}` : null;

  if (language === "en") {
    return [
      `I found your booking ${booking.referenceCode}.`,
      `Booking status: ${booking.status}.`,
      booking.ticketStatus ? `Ticket status: ${booking.ticketStatus}.` : null,
      booking.airline ? `Airline: ${booking.airline}.` : null,
      segment ? `Route: ${segment}.` : null,
      booking.departureDate ? `Departure: ${booking.departureDate}.` : null,
      booking.airlineReference ? `Airline reference: ${booking.airlineReference}.` : null,
      typeof booking.passengerCount === "number" ? `Passengers: ${booking.passengerCount}.` : null,
      "If you need changes, cancellation help, or human support, let me know.",
    ].filter(Boolean).join(" ");
  }

  if (language === "es") {
    return [
      `Encontré tu reserva ${booking.referenceCode}.`,
      `Estado de la reserva: ${booking.status}.`,
      booking.ticketStatus ? `Estado del boleto: ${booking.ticketStatus}.` : null,
      booking.airline ? `Aerolínea: ${booking.airline}.` : null,
      segment ? `Ruta: ${segment}.` : null,
      booking.departureDate ? `Salida: ${booking.departureDate}.` : null,
      booking.airlineReference ? `Referencia de la aerolínea: ${booking.airlineReference}.` : null,
      typeof booking.passengerCount === "number" ? `Pasajeros: ${booking.passengerCount}.` : null,
      "Si necesitas cambios, cancelación o ayuda humana, avísame.",
    ].filter(Boolean).join(" ");
  }

  return [
    `Encontrei sua reserva ${booking.referenceCode}.`,
    `Status da reserva: ${booking.status}.`,
    booking.ticketStatus ? `Status do bilhete: ${booking.ticketStatus}.` : null,
    booking.airline ? `Companhia: ${booking.airline}.` : null,
    segment ? `Trecho: ${segment}.` : null,
    booking.departureDate ? `Saída: ${booking.departureDate}.` : null,
    booking.airlineReference ? `Localizador da companhia: ${booking.airlineReference}.` : null,
    typeof booking.passengerCount === "number" ? `Passageiros: ${booking.passengerCount}.` : null,
    "Se precisar de alteração, cancelamento ou atendimento humano, me avise.",
  ].filter(Boolean).join(" ");
}

export function buildBookingNotFoundMessage(languageInput: string | null | undefined, reference: string): string {
  const language = normalizeChatLanguage(languageInput);
  if (language === "en") {
    return `I couldn't find a booking for ${reference}. Please double-check the MT reference code and the email used in the reservation.`;
  }
  if (language === "es") {
    return `No encontré una reserva para ${reference}. Revisa el código MT y el correo usado en la reserva.`;
  }
  return `Não encontrei uma reserva para ${reference}. Confira o código MT e o e-mail usados na reserva.`;
}

export function buildSearchErrorMessage(languageInput: string | null | undefined): string {
  const language = normalizeChatLanguage(languageInput);
  if (language === "en") {
    return "I tried to search flights but hit a technical problem. Please try again with origin, destination, and date, or use the homepage search form.";
  }
  if (language === "es") {
    return "Intenté buscar vuelos, pero hubo un problema técnico. Intenta de nuevo con origen, destino y fecha, o usa el buscador de la página principal.";
  }
  return "Tentei buscar voos, mas houve um problema técnico. Tente novamente com origem, destino e data, ou use a busca da página principal.";
}
