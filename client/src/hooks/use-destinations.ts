import { useQuery } from "@tanstack/react-query";

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

type Params = {
  city?: string;
  country?: string;
  lang?: string;
  limit?: number;
};

export function useDestinationHighlights(params: Params) {
  const { city = "", country = "us", lang = "en", limit = 20 } = params;

  return useQuery<DestinationResponse>({
    queryKey: ["destinations", city, country, lang, limit],
    queryFn: async () => {
      const qs = new URLSearchParams({
        city,
        country,
        lang,
        limit: String(limit),
      });
      const res = await fetch(`/api/destinations/highlights?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to load destinations");
      return res.json();
    },
    enabled: Boolean(city),
    staleTime: 1000 * 60 * 30, // 30 min cache
    // Rodada 4: sem flash cinza ao trocar o idioma — os cartões do
    // idioma anterior ficam visíveis enquanto o novo carrega (o
    // esqueleto só aparece na primeira carga, sem dado algum).
    placeholderData: (previousData) => previousData,
  });
}
