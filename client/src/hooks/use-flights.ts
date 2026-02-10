import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type FlightSearchParams } from "@shared/routes";

export function useFlightSearch(params: FlightSearchParams | null) {
  return useQuery({
    queryKey: [api.flights.search.path, params],
    queryFn: async () => {
      if (!params) return [];
      
      const url = buildUrl(api.flights.search.path);
      const searchParams = new URLSearchParams();
      searchParams.set("origin", params.origin);
      searchParams.set("destination", params.destination);
      searchParams.set("date", params.date);
      if (params.returnDate) searchParams.set("returnDate", params.returnDate);
      if (params.passengers) searchParams.set("passengers", params.passengers);

      const res = await fetch(`${url}?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to search flights");
      return api.flights.search.responses[200].parse(await res.json());
    },
    enabled: !!params, // Only run if params are provided
  });
}

export function usePopularFlights() {
  return useQuery({
    queryKey: [api.flights.popular.path],
    queryFn: async () => {
      const res = await fetch(api.flights.popular.path);
      if (!res.ok) throw new Error("Failed to fetch popular flights");
      return api.flights.popular.responses[200].parse(await res.json());
    },
  });
}
