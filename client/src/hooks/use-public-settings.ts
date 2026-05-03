import { useQuery } from "@tanstack/react-query";

export interface PublicSettings {
  siteName: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  promotionalBanner: string | null;
  mobileLayout: any[] | null;
}

export function usePublicSettings() {
  return useQuery<PublicSettings>({
    queryKey: ["/api/public/settings"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings");
      if (!res.ok) throw new Error("Failed to fetch public settings");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
