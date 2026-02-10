import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { FlightSearchParams } from "@shared/schema";

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
