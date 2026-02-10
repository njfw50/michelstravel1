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

export function useFlightSearch(params: Partial<FlightSearchParams>) {
  // Only enable query if essential params are present
  const isEnabled = !!(params.origin && params.destination && params.date);

  return useQuery({
    queryKey: [api.flights.search.path, params],
    queryFn: async () => {
      // Create a URLSearchParams object but filter out undefined values
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, String(value));
      });

      const url = `${api.flights.search.path}?${searchParams.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
        if (res.status === 400) throw new Error("Invalid search parameters");
        throw new Error("Failed to search flights");
      }
      
      return api.flights.search.responses[200].parse(await res.json());
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
