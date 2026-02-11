import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertSiteSetting } from "@shared/schema";

export function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.dashboard_stats.path],
    queryFn: async () => {
      const res = await fetch(api.admin.dashboard_stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.admin.dashboard_stats.responses[200].parse(await res.json());
    },
  });
}

export function useAllBookings() {
  return useQuery({
    queryKey: [api.admin.bookings_all.path],
    queryFn: async () => {
      const res = await fetch(api.admin.bookings_all.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch all bookings");
      return api.admin.bookings_all.responses[200].parse(await res.json());
    },
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: [api.admin.settings_get.path],
    queryFn: async () => {
      const res = await fetch(api.admin.settings_get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.admin.settings_get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSiteSetting) => {
      const res = await fetch(api.admin.settings_update.path, {
        method: api.admin.settings_update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return api.admin.settings_update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.settings_get.path] });
    },
  });
}
