import { FlightOffer, FlightSlice } from "../types/flights";

export type RoundTripSliceOption = {
  key: string;
  matchKey: string;
  slice: FlightSlice;
  airline: string;
  logoUrl?: string | null;
  lowestPrice: number;
  offer: FlightOffer;
};

export type RoundTripReturnOption = {
  key: string;
  slice: FlightSlice;
  airline: string;
  logoUrl?: string | null;
  offer: FlightOffer;
  price: number;
};

export function hasRoundTripSlices(offer: FlightOffer) {
  return Boolean(offer.slices && offer.slices.length >= 2);
}

export function getOutboundKey(offer: FlightOffer) {
  if (!hasRoundTripSlices(offer)) return offer.id;
  const slice = offer.slices![0];
  return (slice.segments || []).map((segment) => `${segment.flightNumber || "--"}-${segment.departureTime || "--"}`).join("|");
}

export function getReturnKey(offer: FlightOffer) {
  if (!hasRoundTripSlices(offer)) return offer.id;
  const slice = offer.slices![1];
  return (slice.segments || []).map((segment) => `${segment.flightNumber || "--"}-${segment.departureTime || "--"}`).join("|");
}

export function getOrderedOutboundOptions(offers: FlightOffer[]): RoundTripSliceOption[] {
  const grouped = new Map<string, RoundTripSliceOption>();

  for (const offer of offers) {
    if (!hasRoundTripSlices(offer)) continue;
    const matchKey = getOutboundKey(offer);
    const key = `${matchKey}::${offer.price.toFixed(2)}::${offer.id}`;
    if (grouped.has(key)) continue;

    grouped.set(key, {
      key,
      matchKey,
      slice: offer.slices![0],
      airline: offer.airline,
      logoUrl: offer.logoUrl,
      lowestPrice: offer.price,
      offer,
    });
  }

  return Array.from(grouped.values());
}

export function getOrderedReturnOptions(offers: FlightOffer[], selectedOutboundKey: string | null): RoundTripReturnOption[] {
  if (!selectedOutboundKey) return [];

  const grouped = new Map<string, RoundTripReturnOption>();

  for (const offer of offers) {
    if (!hasRoundTripSlices(offer)) continue;
    const outboundKey = getOutboundKey(offer);
    if (outboundKey !== selectedOutboundKey) continue;

    const returnKey = getReturnKey(offer);
    if (grouped.has(returnKey)) continue;

    grouped.set(returnKey, {
      key: returnKey,
      slice: offer.slices![1],
      airline: offer.airline,
      logoUrl: offer.logoUrl,
      offer,
      price: offer.price,
    });
  }

  return Array.from(grouped.values());
}
