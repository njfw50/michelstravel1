import { FlightOffer, FlightSearchRequest } from "../types/flights";

export type NearbySearchOption = {
  search: FlightSearchRequest;
  offerCount: number;
  fromPrice: number;
  currency: string;
};

function parseIsoDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

function getTripLength(search: FlightSearchRequest) {
  if (!search.returnDate) return 0;
  const departure = parseIsoDate(search.date);
  const returning = parseIsoDate(search.returnDate);
  const diffMs = returning.getTime() - departure.getTime();
  return Math.max(0, Math.round(diffMs / 86400000));
}

export function buildNearbySearchRequests(search: FlightSearchRequest, shifts = [1, 2, 3]): FlightSearchRequest[] {
  if (search.tripType === "multi-city") return [];

  const tripLength = getTripLength(search);

  return shifts.map((shift) => ({
    ...search,
    date: addDays(search.date, shift),
    returnDate:
      search.tripType === "round-trip" && search.returnDate
        ? addDays(search.date, shift + tripLength)
        : undefined,
  }));
}

export function summarizeNearbySearchOption(search: FlightSearchRequest, offers: FlightOffer[]): NearbySearchOption | null {
  if (!offers.length) return null;

  return {
    search,
    offerCount: offers.length,
    fromPrice: Math.min(...offers.map((offer) => offer.price)),
    currency: offers[0].currency || "USD",
  };
}
