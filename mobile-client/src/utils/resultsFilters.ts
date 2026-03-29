import { FlightOffer, FlightSlice } from "../types/flights";

export type ResultsSortOption = "best" | "cheapest" | "fastest";
export type ResultsStopsOption = "all" | "direct" | "one" | "many";
export type ResultsBaggageOption = "all" | "checked" | "carry" | "light";
export type ResultsTimeOption = "all" | "morning" | "afternoon" | "evening" | "night";
export type ResultsPriceBand = "all" | "budget" | "mid" | "premium";

export type ResultsFilterState = {
  sortBy: ResultsSortOption;
  stops: ResultsStopsOption;
  baggage: ResultsBaggageOption;
  departureTime: ResultsTimeOption;
  priceBand: ResultsPriceBand;
  airlines: string[];
};

export type ResultsPriceThresholds = {
  budgetMax: number;
  premiumMin: number;
};

function getSlices(offer: FlightOffer): FlightSlice[] {
  if (offer.slices && offer.slices.length > 0) {
    return offer.slices;
  }

  return [];
}

export function parseDurationToMinutes(duration?: string | null) {
  if (!duration) return 0;

  const upper = duration.toUpperCase();
  const dayMatch = upper.match(/(\d+)D/);
  const hourMatch = upper.match(/(\d+)H/);
  const minuteMatch = upper.match(/(\d+)M/);

  if (dayMatch || hourMatch || minuteMatch) {
    return (dayMatch ? Number.parseInt(dayMatch[1], 10) * 24 * 60 : 0)
      + (hourMatch ? Number.parseInt(hourMatch[1], 10) * 60 : 0)
      + (minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0);
  }

  const shortHourMatch = duration.match(/(\d+)\s*h/i);
  const shortMinuteMatch = duration.match(/(\d+)\s*m/i);

  return (shortHourMatch ? Number.parseInt(shortHourMatch[1], 10) * 60 : 0)
    + (shortMinuteMatch ? Number.parseInt(shortMinuteMatch[1], 10) : 0);
}

export function getOfferStops(offer: FlightOffer) {
  const slices = getSlices(offer);
  if (slices.length > 0) {
    return slices.reduce((total, slice) => total + Math.max(0, (slice.segments || []).length - 1), 0);
  }

  return offer.stops || 0;
}

function sumBaggage(offer: FlightOffer, type: "checked" | "carry_on") {
  const passengers = (offer.passengers || []).filter((passenger) => passenger.passengerType !== "infant_without_seat");

  return passengers.reduce((total, passenger) => {
    return total + (passenger.baggages || [])
      .filter((baggage) => baggage.type === type)
      .reduce((baggageTotal, baggage) => baggageTotal + (baggage.quantity || 0), 0);
  }, 0);
}

export function hasCheckedBag(offer: FlightOffer) {
  return sumBaggage(offer, "checked") > 0;
}

export function hasCarryOnBag(offer: FlightOffer) {
  return sumBaggage(offer, "carry_on") > 0;
}

export function getOfferDepartureHour(offer: FlightOffer) {
  const slices = getSlices(offer);
  const departureTime = slices[0]?.segments?.[0]?.departureTime || offer.departureTime;
  const date = new Date(departureTime);

  if (Number.isNaN(date.getTime())) return 0;
  return date.getHours();
}

export function getOfferDepartureBucket(offer: FlightOffer): ResultsTimeOption {
  const hour = getOfferDepartureHour(offer);
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "evening";
  return "night";
}

export function getPriceThresholds(offers: FlightOffer[]): ResultsPriceThresholds {
  if (offers.length === 0) {
    return { budgetMax: 0, premiumMin: 0 };
  }

  const prices = offers.map((offer) => offer.price).sort((left, right) => left - right);
  const budgetIndex = Math.max(0, Math.floor((prices.length - 1) * 0.33));
  const premiumIndex = Math.max(0, Math.floor((prices.length - 1) * 0.66));

  return {
    budgetMax: prices[budgetIndex],
    premiumMin: prices[premiumIndex],
  };
}

export function getOfferPriceBand(offer: FlightOffer, thresholds: ResultsPriceThresholds): ResultsPriceBand {
  if (offer.price <= thresholds.budgetMax) return "budget";
  if (offer.price >= thresholds.premiumMin) return "premium";
  return "mid";
}

export function filterOffers(
  offers: FlightOffer[],
  filters: ResultsFilterState,
  thresholds: ResultsPriceThresholds,
) {
  return offers.filter((offer) => {
    const stops = getOfferStops(offer);
    const checked = hasCheckedBag(offer);
    const carry = hasCarryOnBag(offer);
    const departureBucket = getOfferDepartureBucket(offer);
    const priceBand = getOfferPriceBand(offer, thresholds);

    if (filters.stops === "direct" && stops !== 0) return false;
    if (filters.stops === "one" && stops !== 1) return false;
    if (filters.stops === "many" && stops < 2) return false;

    if (filters.baggage === "checked" && !checked) return false;
    if (filters.baggage === "carry" && !carry) return false;
    if (filters.baggage === "light" && (checked || carry)) return false;

    if (filters.departureTime !== "all" && departureBucket !== filters.departureTime) return false;
    if (filters.priceBand !== "all" && priceBand !== filters.priceBand) return false;
    if (filters.airlines.length > 0 && !filters.airlines.includes(offer.airline)) return false;

    return true;
  });
}

export function sortOffers(offers: FlightOffer[], sortBy: ResultsSortOption) {
  const copy = [...offers];

  if (sortBy === "cheapest") {
    return copy.sort((left, right) => left.price - right.price || parseDurationToMinutes(left.duration) - parseDurationToMinutes(right.duration));
  }

  if (sortBy === "fastest") {
    return copy.sort((left, right) => parseDurationToMinutes(left.duration) - parseDurationToMinutes(right.duration) || left.price - right.price);
  }

  return copy.sort((left, right) => {
    const leftStops = getOfferStops(left);
    const rightStops = getOfferStops(right);

    return left.price - right.price
      || leftStops - rightStops
      || parseDurationToMinutes(left.duration) - parseDurationToMinutes(right.duration);
  });
}

export function getAirlineOptions(offers: FlightOffer[]) {
  return Array.from(new Set(offers.map((offer) => offer.airline).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}
