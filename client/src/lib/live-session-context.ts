import type { FlightOffer } from "@shared/schema";
import {
  getSeniorFlightInsight,
  type SeniorBagPreference,
  type SeniorConnectionPreference,
  type SeniorPreferences,
  type SeniorPriority,
  type SeniorRecommendationKind,
  type SeniorTimePreference,
} from "@/lib/senior-flight";

export type LiveSessionServiceMode = "standard" | "senior";

export interface LiveSessionContextSnapshot {
  sourcePath?: string;
  currentStage?: "planning" | "results" | "booking" | "general";
  tripType?: string;
  origin?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  passengers?: string;
  cabinClass?: string;
  seniorPriority?: SeniorPriority;
  seniorConnections?: SeniorConnectionPreference;
  seniorBags?: SeniorBagPreference;
  seniorTime?: SeniorTimePreference;
}

export interface LiveSessionTheme {
  accentHex: string;
  headerClass: string;
  strongButtonClass: string;
  softPanelClass: string;
  badgeClass: string;
  userBubbleClass: string;
  userAvatarClass: string;
  accentTextClass: string;
  activeRowClass: string;
  chipClass: string;
  guidanceCardClass: string;
  guidanceTitleClass: string;
}

export interface SharedFlightGuidance {
  title: string;
  bullets: string[];
}

function normalizeServiceMode(mode?: string | null): LiveSessionServiceMode {
  return mode === "senior" ? "senior" : "standard";
}

export function isSeniorServiceMode(mode?: string | null) {
  return normalizeServiceMode(mode) === "senior";
}

export function getLiveSessionTheme(mode?: string | null): LiveSessionTheme {
  if (normalizeServiceMode(mode) === "senior") {
    return {
      accentHex: "#b7791f",
      headerClass:
        "bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(254,243,199,0.96),rgba(253,230,138,0.96))] text-amber-950 border-b border-amber-200",
      strongButtonClass: "bg-amber-600 hover:bg-amber-700 text-white",
      softPanelClass: "border border-amber-200 bg-amber-50 text-amber-950",
      badgeClass: "border-amber-200 bg-white text-amber-900",
      userBubbleClass: "bg-amber-600 text-white",
      userAvatarClass: "bg-amber-600 text-white",
      accentTextClass: "text-amber-700",
      activeRowClass: "bg-amber-50 border border-amber-300",
      chipClass: "border border-amber-200 bg-white text-amber-900 hover:bg-amber-100",
      guidanceCardClass: "border border-amber-200 bg-amber-50",
      guidanceTitleClass: "text-amber-900",
    };
  }

  return {
    accentHex: "#0074DE",
    headerClass: "bg-[#0074DE] text-white border-b border-[#0066c2]",
    strongButtonClass: "bg-[#0074DE] hover:bg-[#005bb5] text-white",
    softPanelClass: "border border-blue-200 bg-blue-50 text-slate-900",
    badgeClass: "border-blue-200 bg-white text-blue-700",
    userBubbleClass: "bg-[#0074DE] text-white",
    userAvatarClass: "bg-[#0074DE] text-white",
    accentTextClass: "text-[#0074DE]",
    activeRowClass: "bg-[#0074DE]/10 border border-[#0074DE]/30",
    chipClass: "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
    guidanceCardClass: "border border-blue-200 bg-blue-50",
    guidanceTitleClass: "text-slate-900",
  };
}

function getCurrentStage(pathname: string): LiveSessionContextSnapshot["currentStage"] {
  if (pathname === "/senior" || pathname === "/easy") return "planning";
  if (pathname === "/search") return "results";
  if (pathname.startsWith("/book/")) return "booking";
  return "general";
}

export function buildLiveSessionRequestContext(pathname: string, search: string): {
  serviceMode: LiveSessionServiceMode;
  entryPoint: string;
  contextSnapshot: LiveSessionContextSnapshot;
} {
  const params = new URLSearchParams(search);
  const uiMode = params.get("ui");
  const isSeniorPath = pathname === "/senior" || pathname === "/easy" || uiMode === "easy";
  const serviceMode: LiveSessionServiceMode = isSeniorPath ? "senior" : "standard";

  let entryPoint = "chatbot";
  if (pathname === "/senior" || pathname === "/easy") entryPoint = "senior-home";
  else if (pathname === "/search" && serviceMode === "senior") entryPoint = "senior-search";
  else if (pathname.startsWith("/book/") && serviceMode === "senior") entryPoint = "senior-booking";
  else if (pathname === "/search") entryPoint = "search";
  else if (pathname.startsWith("/book/")) entryPoint = "booking";

  const passengerCount =
    params.get("passengers") ||
    String(
      Number.parseInt(params.get("adults") || "1", 10) +
      Number.parseInt(params.get("children") || "0", 10) +
      Number.parseInt(params.get("infants") || "0", 10),
    );

  const contextSnapshot: LiveSessionContextSnapshot = {
    sourcePath: pathname,
    currentStage: getCurrentStage(pathname),
    tripType: params.get("tripType") || undefined,
    origin: params.get("origin") || undefined,
    destination: params.get("destination") || undefined,
    date: params.get("date") || undefined,
    returnDate: params.get("returnDate") || undefined,
    passengers: passengerCount,
    cabinClass: params.get("cabinClass") || undefined,
  };

  if (serviceMode === "senior") {
    contextSnapshot.seniorPriority = (params.get("seniorPriority") || "comfort") as SeniorPriority;
    contextSnapshot.seniorConnections = (params.get("seniorConnections") || "one") as SeniorConnectionPreference;
    contextSnapshot.seniorBags = (params.get("seniorBags") || "flexible") as SeniorBagPreference;
    contextSnapshot.seniorTime = (params.get("seniorTime") || "day") as SeniorTimePreference;
  }

  return { serviceMode, entryPoint, contextSnapshot };
}

export function formatLiveSessionEntryPoint(entryPoint?: string | null) {
  switch (entryPoint) {
    case "senior-home":
      return "Atendimento senior";
    case "senior-search":
      return "Busca senior";
    case "senior-booking":
      return "Reserva senior";
    case "search":
      return "Busca normal";
    case "booking":
      return "Reserva normal";
    default:
      return "Chat / site";
  }
}

export function getSeniorPreferencesFromContext(
  context?: LiveSessionContextSnapshot | null,
): SeniorPreferences {
  return {
    priority: ["comfort", "fastest", "balanced", "cheapest"].includes(context?.seniorPriority || "")
      ? (context?.seniorPriority as SeniorPriority)
      : "comfort",
    connections: ["none", "one", "any"].includes(context?.seniorConnections || "")
      ? (context?.seniorConnections as SeniorConnectionPreference)
      : "one",
    bags: ["checked", "carry", "flexible"].includes(context?.seniorBags || "")
      ? (context?.seniorBags as SeniorBagPreference)
      : "flexible",
    time: ["day", "any"].includes(context?.seniorTime || "")
      ? (context?.seniorTime as SeniorTimePreference)
      : "day",
  };
}

function getPriorityLabel(priority: SeniorPriority) {
  switch (priority) {
    case "fastest":
      return "Menor tempo total";
    case "balanced":
      return "Equilibrio entre preco e conforto";
    case "cheapest":
      return "Preco mais baixo";
    default:
      return "Menos cansaco";
  }
}

function getConnectionsLabel(connections: SeniorConnectionPreference) {
  switch (connections) {
    case "none":
      return "Preferencia por voo direto";
    case "any":
      return "Aceita mais conexoes";
    default:
      return "No maximo 1 conexao";
  }
}

function getBagsLabel(bags: SeniorBagPreference) {
  switch (bags) {
    case "checked":
      return "Quer mala despachada";
    case "carry":
      return "Quer bagagem de mao";
    default:
      return "Bagagem flexivel";
  }
}

function getTimeLabel(time: SeniorTimePreference) {
  return time === "day" ? "Evitar horario sensivel" : "Horario flexivel";
}

export function buildSeniorSessionSummary(context?: LiveSessionContextSnapshot | null) {
  if (!context) return [];

  const items: Array<{ label: string; value: string }> = [];

  if (context.origin && context.destination) {
    items.push({ label: "Rota", value: `${context.origin} -> ${context.destination}` });
  }

  if (context.date) {
    items.push({
      label: "Datas",
      value: context.returnDate ? `${context.date} ate ${context.returnDate}` : context.date,
    });
  }

  if (context.passengers) {
    items.push({ label: "Passageiros", value: context.passengers });
  }

  if (context.seniorPriority) {
    items.push({ label: "Prioridade", value: getPriorityLabel(context.seniorPriority) });
  }

  if (context.seniorConnections) {
    items.push({ label: "Conexoes", value: getConnectionsLabel(context.seniorConnections) });
  }

  if (context.seniorBags) {
    items.push({ label: "Bagagem", value: getBagsLabel(context.seniorBags) });
  }

  if (context.seniorTime) {
    items.push({ label: "Horario", value: getTimeLabel(context.seniorTime) });
  }

  return items;
}

export function buildSeniorAgentTips(context?: LiveSessionContextSnapshot | null) {
  const preferences = getSeniorPreferencesFromContext(context);
  const tips = [
    "Mostre poucas opcoes e explique uma por vez.",
    "Evite linguagem tecnica e confirme nomes, datas e bagagem antes de fechar.",
  ];

  if (preferences.connections === "none") {
    tips.push("Priorize voos diretos antes de falar em economia.");
  } else if (preferences.connections === "one") {
    tips.push("Prefira ate 1 conexao e destaque o tempo de espera.");
  }

  if (preferences.bags === "checked") {
    tips.push("Confirme cedo se ha mala despachada incluida.");
  }

  if (preferences.time === "day") {
    tips.push("Evite madrugada e chegada muito tarde quando houver alternativa.");
  }

  return tips.slice(0, 4);
}

export function buildSeniorQuickReplies(context?: LiveSessionContextSnapshot | null) {
  const preferences = getSeniorPreferencesFromContext(context);
  const replies = [
    "Vou separar so as opcoes mais tranquilas e explicar devagar.",
    "Eu posso te mostrar primeiro as opcoes com menos cansaco.",
    "Antes de pagar, vou confirmar bagagem, horario e conexoes com voce.",
  ];

  if (preferences.connections === "none") {
    replies.push("Vou priorizar voo direto antes de pensar em economia.");
  } else {
    replies.push("Vou priorizar menos conexoes e esperas mais confortaveis.");
  }

  if (preferences.bags === "checked") {
    replies.push("Vou conferir quais opcoes ja tem mala despachada.");
  }

  return replies.slice(0, 4);
}

function formatMinutes(minutes: number) {
  if (minutes <= 0) return "sem espera longa";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMinutes}min`;
}

export function getSeniorRecommendationLabel(kind: SeniorRecommendationKind) {
  switch (kind) {
    case "fastest":
      return "Mais rapido";
    case "balanced":
      return "Mais equilibrado";
    default:
      return "Mais calmo";
  }
}

export function buildSharedFlightGuidance(
  flight: FlightOffer,
  serviceMode?: string | null,
  context?: LiveSessionContextSnapshot | null,
): SharedFlightGuidance | null {
  if (!isSeniorServiceMode(serviceMode)) return null;

  const preferences = getSeniorPreferencesFromContext(context);
  const insight = getSeniorFlightInsight(flight, preferences);
  const bullets = [
    preferences.priority === "comfort"
      ? "Esta opcao foi colocada na frente pensando em menos cansaco."
      : preferences.priority === "fastest"
        ? "Esta opcao foi colocada na frente pensando em menor tempo total."
        : preferences.priority === "cheapest"
          ? "Esta opcao combina preco com leitura mais simples da viagem."
          : "Esta opcao tenta equilibrar preco, conforto e clareza.",
    insight.totalStops === 0
      ? "Voo direto, sem troca de aviao no caminho."
      : insight.totalStops === 1
        ? "Tem 1 conexao, com leitura mais simples do percurso."
        : `Tem ${insight.totalStops} conexoes, o que exige mais atencao.`,
    `Tempo total de viagem: ${Math.floor(insight.totalDurationMinutes / 60)}h ${String(insight.totalDurationMinutes % 60).padStart(2, "0")}m.`,
  ];

  if (insight.totalStops > 0) {
    bullets.push(`Maior espera entre voos: ${formatMinutes(insight.longestLayoverMinutes)}.`);
  }

  if (insight.hasCheckedBag) {
    bullets.push("Ja aparece com mala despachada incluida.");
  } else if (insight.hasCarryOn) {
    bullets.push("Tem bagagem de mao incluida, mas confira a mala despachada.");
  } else {
    bullets.push("Tarifa mais enxuta. Vale confirmar bagagem antes de pagar.");
  }

  if (!insight.hasSensitiveHour) {
    bullets.push("O horario parece mais tranquilo para esta preferencia.");
  }

  return {
    title: "Por que esta opcao pode ser melhor para voce",
    bullets: bullets.slice(0, 5),
  };
}
