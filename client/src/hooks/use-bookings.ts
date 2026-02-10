import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertBooking } from "@shared/routes";

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBooking) => {
      const res = await fetch(api.bookings.create.path, {
        method: api.bookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.bookings.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create booking");
      }
      return api.bookings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.dashboard_stats.path] });
    },
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: [api.bookings.list.path],
    queryFn: async () => {
      const res = await fetch(api.bookings.list.path, { credentials: "include" });
      if (res.status === 401) return null; // Not logged in
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return api.bookings.list.responses[200].parse(await res.json());
    },
  });
}

export function useBooking(id: number) {
  return useQuery({
    queryKey: [api.bookings.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.bookings.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch booking");
      return api.bookings.get.responses[200].parse(await res.json());
    },
  });
}
