import { SeniorPreferences } from "../types/app";
import { FlightOffer, FlightPassengerInfo, FlightSlice } from "../types/flights";

export type SeniorRecommendationKind = "comfort" | "fastest" | "balanced";

export type SeniorFlightInsight = {
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
};

export type SeniorRecommendation = {
  kind: SeniorRecommendationKind;
  flight: FlightOffer;
  insight: SeniorFlightInsight;
  fallbackApplied: boolean;
};

function parseDurationToMinutes(raw?: string | null) {
  if (!raw) return 0;

  const upper = raw.toUpperCase();
  const dayMatch = upper.match(/(\d+)D/);
  const hourMatch = upper.match(/(\d+)H/);
  const minuteMatch = upper.match(/(\d+)M/);

  if (dayMatch || hourMatch || minuteMatch) {
    return (dayMatch ? Number.parseInt(dayMatch[1], 10) * 24 * 60 : 0)
      + (hourMatch ? Number.parseInt(hourMatch[1], 10) * 60 : 0)
      + (minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0);
  }

  const shortHourMatch = raw.match(/(\d+)\s*h/i);
  const shortMinuteMatch = raw.match(/(\d+)\s*m/i);

  return (shortHourMatch ? Number.parseInt(shortHourMatch[1], 10) * 60 : 0)
    + (shortMinuteMatch ? Number.parseInt(shortMinuteMatch[1], 10) : 0);
}

function getRelevantPassengers(passengers?: FlightPassengerInfo[]) {
  const list = passengers || [];
  const withoutLapInfants = list.filter((passenger) => passenger.passengerType !== "infant_without_seat");
  return withoutLapInfants.length > 0 ? withoutLapInfants : list;
}

function sumBaggage(passenger: FlightPassengerInfo, type: string) {
  return (passenger.baggages || [])
    .filter((baggage) => baggage.type === type)
    .reduce((total, baggage) => total + (baggage.quantity || 0), 0);
}

function diffInMinutes(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;

  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.round((endMs - startMs) / 60000));
}

function getFlightSlices(flight: FlightOffer): FlightSlice[] {
  return flight.slices || [];
}

function getLongestLayoverMinutes(slices: FlightSlice[]) {
  let longest = 0;

  for (const slice of slices) {
    const segments = slice.segments || [];

    for (let index = 0; index < segments.length - 1; index += 1) {
      longest = Math.max(longest, diffInMinutes(segments[index].arrivalTime, segments[index + 1].departureTime));
    }
  }

  return longest;
}

function hasSensitiveHour(flight: FlightOffer) {
  const timestamps: string[] = [];
  const slices = getFlightSlices(flight);

  if (slices.length > 0) {
    for (const slice of slices) {
      const segments = slice.segments || [];
      const first = segments[0];
      const last = segments[segments.length - 1];
      if (first?.departureTime) timestamps.push(first.departureTime);
      if (last?.arrivalTime) timestamps.push(last.arrivalTime);
    }
  } else {
    if (flight.departureTime) timestamps.push(flight.departureTime);
    if (flight.arrivalTime) timestamps.push(flight.arrivalTime);
  }

  return timestamps.some((value) => {
    const hour = new Date(value).getHours();
    return hour < 6 || hour >= 22;
  });
}

function hasTerminalChange(slices: FlightSlice[]) {
  return slices.some((slice) => {
    const segments = slice.segments || [];

    return segments.some((segment, index) => {
      if (index === segments.length - 1) return false;
      const nextSegment = segments[index + 1];

      return Boolean(
        segment.destinationTerminal
        && nextSegment?.originTerminal
        && segment.destinationTerminal !== nextSegment.originTerminal,
      );
    });
  });
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

export function getSeniorFlightInsight(flight: FlightOffer, preferences: SeniorPreferences): SeniorFlightInsight {
  const slices = getFlightSlices(flight);
  const passengers = getRelevantPassengers(flight.passengers);
  const totalStops = slices.length > 0
    ? slices.reduce((total, slice) => total + Math.max(0, (slice.segments || []).length - 1), 0)
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
    else if (longestLayoverMinutes > 360) layoverPenalty += 220;
    else if (longestLayoverMinutes > 240) layoverPenalty += 100;
  }

  const timePenalty = hasSensitiveHourFlag ? (preferences.time === "day" ? 220 : 80) : 0;
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

function compareByKind(kind: SeniorRecommendationKind, preferences: SeniorPreferences) {
  return (left: SeniorRecommendation, right: SeniorRecommendation) => {
    if (kind === "fastest") {
      return (
        left.insight.totalDurationMinutes - right.insight.totalDurationMinutes
        || left.insight.comfortScore - right.insight.comfortScore
        || left.flight.price - right.flight.price
      );
    }

    if (kind === "balanced") {
      if (preferences.priority === "cheapest") {
        return (
          left.flight.price - right.flight.price
          || left.insight.balancedScore - right.insight.balancedScore
          || left.insight.totalDurationMinutes - right.insight.totalDurationMinutes
        );
      }

      return (
        left.insight.balancedScore - right.insight.balancedScore
        || left.flight.price - right.flight.price
        || left.insight.totalDurationMinutes - right.insight.totalDurationMinutes
      );
    }

    return (
      left.insight.comfortScore - right.insight.comfortScore
      || left.insight.totalDurationMinutes - right.insight.totalDurationMinutes
      || left.flight.price - right.flight.price
    );
  };
}

export function buildSeniorRecommendations(flights: FlightOffer[], preferences: SeniorPreferences) {
  const enhanced = flights.map((flight) => ({
    flight,
    insight: getSeniorFlightInsight(flight, preferences),
  }));

  const strictMatches = enhanced.filter(({ insight }) => {
    if (preferences.connections === "none") return insight.totalStops === 0;
    if (preferences.connections === "one") return insight.totalStops <= 1;
    return true;
  });

  const pool = strictMatches.length > 0 ? strictMatches : enhanced;
  const fallbackApplied = strictMatches.length === 0 && preferences.connections !== "any";
  const baseItems: SeniorRecommendation[] = pool.map(({ flight, insight }) => ({
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
    const ranked = baseItems.map((item) => ({ ...item, kind })).sort(compareByKind(kind, preferences));
    const next = ranked.find((item) => !selectedIds.has(item.flight.id)) || ranked[0];

    if (!next) continue;

    selectedIds.add(next.flight.id);
    recommendations.push(next);
  }

  const primaryKind: SeniorRecommendationKind =
    preferences.priority === "fastest"
      ? "fastest"
      : preferences.priority === "balanced" || preferences.priority === "cheapest"
        ? "balanced"
        : "comfort";

  return {
    recommendations,
    rankedFlights: baseItems
      .map((item) => ({ ...item, kind: primaryKind }))
      .sort(compareByKind(primaryKind, preferences)),
    fallbackApplied,
  };
}
