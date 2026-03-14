import type { FlightOffer, FlightPassengerInfo, FlightSlice } from "@shared/schema";

export type SeniorPriority = "comfort" | "fastest" | "balanced" | "cheapest";
export type SeniorConnectionPreference = "none" | "one" | "any";
export type SeniorBagPreference = "checked" | "carry" | "flexible";
export type SeniorTimePreference = "day" | "any";

export interface SeniorPreferences {
  priority: SeniorPriority;
  connections: SeniorConnectionPreference;
  bags: SeniorBagPreference;
  time: SeniorTimePreference;
}

export interface SeniorFlightInsight {
  totalDurationMinutes: number;
  totalStops: number;
  longestLayoverMinutes: number;
  hasCheckedBag: boolean;
  hasCarryOn: boolean;
  hasSensitiveHour: boolean;
  hasTerminalChange: boolean;
  comfortScore: number;
  balancedScore: number;
  routeScore: number;
  priceScore: number;
  reasonLine: string;
}

export type SeniorRecommendationKind = "comfort" | "fastest" | "balanced";

export interface SeniorRecommendation {
  kind: SeniorRecommendationKind;
  flight: FlightOffer;
  insight: SeniorFlightInsight;
  fallbackApplied: boolean;
}

function parseDurationToMinutes(raw?: string | null): number {
  if (!raw) return 0;

  const upper = raw.toUpperCase();
  const hoursMatch = upper.match(/(\d+)H/);
  const minutesMatch = upper.match(/(\d+)M/);
  const dayMatch = upper.match(/(\d+)D/);
  const hours = hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : 0;
  const days = dayMatch ? Number.parseInt(dayMatch[1], 10) : 0;

  if (days || hours || minutes) {
    return days * 24 * 60 + hours * 60 + minutes;
  }

  const shortHours = raw.match(/(\d+)\s*h/i);
  const shortMinutes = raw.match(/(\d+)\s*m/i);
  return (shortHours ? Number.parseInt(shortHours[1], 10) * 60 : 0) + (shortMinutes ? Number.parseInt(shortMinutes[1], 10) : 0);
}

function getRelevantPassengers(passengers?: FlightPassengerInfo[]) {
  const allPassengers = passengers || [];
  const nonInfants = allPassengers.filter((passenger) => passenger.passengerType !== "infant_without_seat");
  return nonInfants.length > 0 ? nonInfants : allPassengers;
}

function sumBaggage(passenger: FlightPassengerInfo, type: string) {
  return (passenger.baggages || [])
    .filter((baggage) => baggage.type === type)
    .reduce((total, baggage) => total + (baggage.quantity || 0), 0);
}

function getFlightSlices(flight: FlightOffer) {
  return flight.slices || [];
}

function diffInMinutes(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.round((endMs - startMs) / 60000));
}

function getLongestLayoverMinutes(slices: FlightSlice[]) {
  let longest = 0;

  for (const slice of slices) {
    for (let index = 0; index < slice.segments.length - 1; index += 1) {
      const current = slice.segments[index];
      const next = slice.segments[index + 1];
      longest = Math.max(longest, diffInMinutes(current.arrivalTime, next.departureTime));
    }
  }

  return longest;
}

function hasSensitiveHour(flight: FlightOffer) {
  const moments: string[] = [];
  const slices = getFlightSlices(flight);

  if (slices.length > 0) {
    for (const slice of slices) {
      const first = slice.segments[0];
      const last = slice.segments[slice.segments.length - 1];
      if (first?.departureTime) moments.push(first.departureTime);
      if (last?.arrivalTime) moments.push(last.arrivalTime);
    }
  } else {
    if (flight.departureTime) moments.push(flight.departureTime);
    if (flight.arrivalTime) moments.push(flight.arrivalTime);
  }

  return moments.some((value) => {
    const hour = new Date(value).getHours();
    return hour < 6 || hour >= 22;
  });
}

function hasTerminalChange(slices: FlightSlice[]) {
  return slices.some((slice) =>
    slice.segments.some((segment, index) => {
      if (index === slice.segments.length - 1) return false;
      const next = slice.segments[index + 1];
      if (!segment.destinationTerminal || !next.originTerminal) return false;
      return segment.destinationTerminal !== next.originTerminal;
    }),
  );
}

function formatMinutes(minutes: number) {
  if (minutes <= 0) return "sem espera";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMinutes}min`;
}

function buildReasonLine(
  totalStops: number,
  longestLayoverMinutes: number,
  hasCheckedBag: boolean,
  hasCarryOn: boolean,
  hasSensitiveHourFlag: boolean,
) {
  const parts: string[] = [];

  if (totalStops === 0) {
    parts.push("sem conexao");
  } else if (totalStops === 1) {
    parts.push("1 conexao");
  } else {
    parts.push(`${totalStops} conexoes`);
  }

  if (totalStops > 0) {
    parts.push(`maior espera ${formatMinutes(longestLayoverMinutes)}`);
  }

  if (hasCheckedBag) {
    parts.push("mala despachada incluida");
  } else if (hasCarryOn) {
    parts.push("bagagem de mao incluida");
  } else {
    parts.push("tarifa mais enxuta");
  }

  if (!hasSensitiveHourFlag) {
    parts.push("horario mais tranquilo");
  }

  return parts.join(" · ");
}

export function getSeniorFlightInsight(
  flight: FlightOffer,
  preferences: SeniorPreferences,
): SeniorFlightInsight {
  const slices = getFlightSlices(flight);
  const passengers = getRelevantPassengers(flight.passengers);
  const totalStops = slices.length > 0
    ? slices.reduce((total, slice) => total + Math.max(0, slice.segments.length - 1), 0)
    : flight.stops || 0;
  const totalDurationMinutes = parseDurationToMinutes(flight.duration);
  const longestLayoverMinutes = getLongestLayoverMinutes(slices);
  const hasSensitiveHourFlag = hasSensitiveHour(flight);
  const hasTerminalChangeFlag = hasTerminalChange(slices);
  const hasCheckedBag = passengers.some((passenger) => sumBaggage(passenger, "checked") > 0);
  const hasCarryOn = passengers.some((passenger) => sumBaggage(passenger, "carry_on") > 0);

  let connectionPenalty = totalStops * 170;
  if (preferences.connections === "none" && totalStops > 0) connectionPenalty += 280;
  if (preferences.connections === "one" && totalStops > 1) connectionPenalty += 220;

  let layoverPenalty = 0;
  if (totalStops > 0 && longestLayoverMinutes > 0) {
    if (longestLayoverMinutes < 60) layoverPenalty += 220;
    else if (longestLayoverMinutes < 90) layoverPenalty += 120;
    else if (longestLayoverMinutes > 240) layoverPenalty += 100;
    else if (longestLayoverMinutes > 360) layoverPenalty += 220;
  }

  const timePenalty = hasSensitiveHourFlag
    ? preferences.time === "day" ? 220 : 80
    : 0;
  const baggagePenalty =
    preferences.bags === "checked" && !hasCheckedBag
      ? 260
      : preferences.bags === "carry" && !hasCarryOn
        ? 140
        : 0;
  const terminalPenalty = hasTerminalChangeFlag ? 160 : 0;
  const routeScore = totalDurationMinutes + connectionPenalty + layoverPenalty + timePenalty + terminalPenalty;
  const priceScore = flight.price * 0.85;
  const comfortScore = routeScore + baggagePenalty + priceScore * 0.35;
  const balancedScore = routeScore * 0.7 + baggagePenalty * 0.9 + priceScore * 0.55;

  return {
    totalDurationMinutes,
    totalStops,
    longestLayoverMinutes,
    hasCheckedBag,
    hasCarryOn,
    hasSensitiveHour: hasSensitiveHourFlag,
    hasTerminalChange: hasTerminalChangeFlag,
    comfortScore,
    balancedScore,
    routeScore,
    priceScore,
    reasonLine: buildReasonLine(totalStops, longestLayoverMinutes, hasCheckedBag, hasCarryOn, hasSensitiveHourFlag),
  };
}

function compareFlightByKind(
  kind: SeniorRecommendationKind,
  preferences: SeniorPreferences,
) {
  return (a: SeniorRecommendation, b: SeniorRecommendation) => {
    if (kind === "fastest") {
      return (
        a.insight.totalDurationMinutes - b.insight.totalDurationMinutes ||
        a.insight.comfortScore - b.insight.comfortScore ||
        a.flight.price - b.flight.price
      );
    }

    if (kind === "balanced") {
      if (preferences.priority === "cheapest") {
        return (
          a.flight.price - b.flight.price ||
          a.insight.balancedScore - b.insight.balancedScore ||
          a.insight.totalDurationMinutes - b.insight.totalDurationMinutes
        );
      }

      return (
        a.insight.balancedScore - b.insight.balancedScore ||
        a.flight.price - b.flight.price ||
        a.insight.totalDurationMinutes - b.insight.totalDurationMinutes
      );
    }

    return (
      a.insight.comfortScore - b.insight.comfortScore ||
      a.insight.totalDurationMinutes - b.insight.totalDurationMinutes ||
      a.flight.price - b.flight.price
    );
  };
}

export function buildSeniorRecommendations(
  flights: FlightOffer[],
  preferences: SeniorPreferences,
) {
  const enhanced = flights.map((flight) => ({
    flight,
    insight: getSeniorFlightInsight(flight, preferences),
  }));

  const strictMatches = enhanced.filter(({ insight }) => {
    if (preferences.connections === "none") return insight.totalStops === 0;
    if (preferences.connections === "one") return insight.totalStops <= 1;
    return true;
  });

  const activePool = strictMatches.length > 0 ? strictMatches : enhanced;
  const fallbackApplied = strictMatches.length === 0 && preferences.connections !== "any";
  const baseRecommendations: SeniorRecommendation[] = activePool.map(({ flight, insight }) => ({
    kind: "comfort",
    flight,
    insight,
    fallbackApplied,
  }));

  const kinds: SeniorRecommendationKind[] = preferences.priority === "fastest"
    ? ["fastest", "comfort", "balanced"]
    : preferences.priority === "cheapest"
      ? ["balanced", "comfort", "fastest"]
      : preferences.priority === "balanced"
        ? ["balanced", "comfort", "fastest"]
        : ["comfort", "fastest", "balanced"];

  const selectedIds = new Set<string>();
  const recommendations: SeniorRecommendation[] = [];

  for (const kind of kinds) {
    const ranked = baseRecommendations
      .map((item) => ({ ...item, kind }))
      .sort(compareFlightByKind(kind, preferences));

    const next = ranked.find((item) => !selectedIds.has(item.flight.id)) || ranked[0];
    if (!next) continue;

    selectedIds.add(next.flight.id);
    recommendations.push(next);
  }

  return {
    recommendations,
    rankedFlights: baseRecommendations
      .map((item) => ({ ...item, kind: preferences.priority === "fastest" ? "fastest" : preferences.priority === "cheapest" ? "balanced" : "comfort" as SeniorRecommendationKind }))
      .sort(compareFlightByKind(preferences.priority === "fastest" ? "fastest" : preferences.priority === "cheapest" ? "balanced" : preferences.priority === "balanced" ? "balanced" : "comfort", preferences)),
    fallbackApplied,
  };
}
