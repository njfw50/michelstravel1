import { api } from "../lib/api";
import { FlightOffer, FlightSearchRequest } from "../types/flights";

export async function searchFlightOffers(params: FlightSearchRequest): Promise<FlightOffer[]> {
  const requestParams = params.tripType === "multi-city" && params.legs
    ? {
        ...params,
        legs: JSON.stringify(params.legs),
      }
    : params;

  const response = await api.get<FlightOffer[]>("/api/flights/search", {
    params: requestParams,
    timeout: 25000,
  });
  return response.data;
}

export async function getFlightOffer(offerId: string): Promise<FlightOffer> {
  const response = await api.get<FlightOffer>(`/api/flights/${offerId}`, {
    timeout: 20000,
  });
  return response.data;
}
