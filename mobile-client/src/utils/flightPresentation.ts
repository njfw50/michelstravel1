import { AppLanguage } from "../types/app";
import { FlightOffer, FlightPassengerInfo, FlightSlice } from "../types/flights";

function formatTimestamp(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDate(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatFlightPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(price || 0);
}

export function getFlightRouteLabel(offer: FlightOffer) {
  const slice = offer.slices?.[0];
  const origin = slice?.originCity || offer.originCity || offer.originCode || "--";
  const destination = slice?.destinationCity || offer.destinationCity || offer.destinationCode || "--";
  return `${origin} -> ${destination}`;
}

export function getFlightCodesLabel(offer: FlightOffer) {
  const slice = offer.slices?.[0];
  const origin = slice?.originCode || offer.originCode || "--";
  const destination = slice?.destinationCode || offer.destinationCode || "--";
  return `${origin} -> ${destination}`;
}

export function getFlightScheduleLabel(offer: FlightOffer) {
  return `${formatTimestamp(offer.departureTime)} - ${formatTimestamp(offer.arrivalTime)} · ${offer.duration}`;
}

export function getFlightDateLabel(offer: FlightOffer) {
  return formatDate(offer.departureTime);
}

export function getFlightStopsLabel(offer: FlightOffer, language: AppLanguage = "pt") {
  if (!offer.stops) {
    return language === "en" ? "Direct" : language === "es" ? "Directo" : "Direto";
  }

  if (offer.stops === 1) {
    return language === "en" ? "1 stop" : language === "es" ? "1 escala" : "1 parada";
  }

  return language === "en"
    ? `${offer.stops} stops`
    : language === "es"
      ? `${offer.stops} escalas`
      : `${offer.stops} paradas`;
}

export function getConnectionLabel(offer: FlightOffer) {
  const firstSlice = offer.slices?.[0];
  const segments = firstSlice?.segments || [];
  if (segments.length < 2) return null;

  const connectionSegment = segments[0];
  const city = connectionSegment.destinationCity || connectionSegment.destinationName || connectionSegment.destinationCode;
  const code = connectionSegment.destinationCode;
  if (!city && !code) return null;

  return code && city && !String(city).includes(code) ? `${city} (${code})` : city || code;
}

export function getBaggageSummary(passengers?: FlightPassengerInfo[], language: AppLanguage = "pt") {
  if (!passengers?.length) {
    return language === "en"
      ? "Detailed baggage information appears in the next step"
      : language === "es"
        ? "El detalle del equipaje aparece en el siguiente paso"
        : "A bagagem detalhada aparece na próxima etapa";
  }

  const firstPassenger = passengers[0];
  const baggages = firstPassenger.baggages || [];
  if (!baggages.length) {
    return language === "en"
      ? "No baggage included"
      : language === "es"
        ? "Sin equipaje incluido"
        : "Sem bagagem incluída";
  }

  return baggages
    .map((item) => `${item.quantity} ${item.type}`)
    .join(" · ");
}

export function getPrimarySlice(offer: FlightOffer): FlightSlice | undefined {
  return offer.slices?.[0];
}
