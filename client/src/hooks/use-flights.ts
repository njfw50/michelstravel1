import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { FlightSearchParams } from "@shared/schema";

interface DuffelAirline {
  id: string;
  name: string;
  iataCode: string | null;
  logoUrl: string | null;
  logoSymbolUrl: string | null;
  conditionsUrl: string | null;
}

interface DuffelAirport {
  id: string;
  name: string;
  iataCode: string | null;
  icaoCode: string | null;
  cityName: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
  timeZone: string | null;
}

interface DuffelAircraft {
  id: string;
  name: string;
  iataCode: string | null;
}

export interface PublicFeaturedDeal {
  id: number;
  origin: string;
  origin_city: string;
  destination: string;
  destination_city: string;
  departure_date: string;
  return_date: string;
  price: string;
  price_value: number | null;
  currency: string;
  airline: string;
  cabin_class: string;
  headline: string;
  description: string;
  booking_url: string;
  created_at: string;
}

interface PublicFeaturedDealsResponse {
  deals: PublicFeaturedDeal[];
  count: number;
  site: string;
  generated_at: string;
}

export type FlightSearchQuery = Omit<Partial<FlightSearchParams>, "legs"> & {
  legs?: string;
  tripType?: string;
};

export function useFlightSearch(params: FlightSearchQuery) {
  const isEnabled = !!(params.origin && params.destination && params.date);

  return useQuery({
    queryKey: [api.flights.search.path, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, String(value));
      });

      const url = `${api.flights.search.path}?${searchParams.toString()}`;

      const MIN_SEARCH_TIME = 3500;
      const startTime = Date.now();

      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
        if (res.status === 400) throw new Error("Invalid search parameters");
        throw new Error("Failed to search flights");
      }
      
      const data = api.flights.search.responses[200].parse(await res.json());

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_SEARCH_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_SEARCH_TIME - elapsed));
      }

      return data;
    },
    enabled: isEnabled,
  });
}

export function usePopularFlights() {
  return useQuery({
    queryKey: [api.flights.popular.path],
    queryFn: async () => {
      const res = await fetch(api.flights.popular.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch popular flights");
      return api.flights.popular.responses[200].parse(await res.json());
    },
  });
}

export function useAirlines(limit = 50) {
  return useQuery<DuffelAirline[]>({
    queryKey: ['/api/airlines', limit],
    queryFn: async () => {
      const res = await fetch(`/api/airlines?limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch airlines");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useFeaturedAirports() {
  return useQuery<DuffelAirport[]>({
    queryKey: ['/api/airports', 'featured'],
    queryFn: async () => {
      const res = await fetch('/api/airports?featured=true', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch airports");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useFeaturedDeals() {
  return useQuery<PublicFeaturedDeal[]>({
    queryKey: ["/api/public/flight-deals"],
    queryFn: async () => {
      const res = await fetch("/api/public/flight-deals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch featured deals");
      const data = (await res.json()) as PublicFeaturedDealsResponse;
      return data.deals || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useAircraft() {
  return useQuery<DuffelAircraft[]>({
    queryKey: ['/api/aircraft'],
    queryFn: async () => {
      const res = await fetch('/api/aircraft?limit=50', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch aircraft");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });
}
