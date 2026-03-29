import { api } from "../lib/api";

export type DestinationPlace = {
  id: string;
  name: string;
  category?: string[];
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
  website?: string;
  wikipedia?: string;
  rating?: number | null;
  kinds?: string | null;
  distance_m?: number | null;
};

export type DestinationResponse = {
  center: { lat: number; lon: number };
  total: number;
  items: DestinationPlace[];
};

export async function getDestinationHighlights(params: {
  city: string;
  country: string;
  lang: string;
  limit?: number;
}): Promise<DestinationResponse> {
  const response = await api.get<DestinationResponse>("/api/destinations/highlights", {
    params: {
      city: params.city,
      country: params.country,
      lang: params.lang,
      limit: params.limit ?? 18,
    },
    timeout: 15000,
  });

  return response.data;
}
