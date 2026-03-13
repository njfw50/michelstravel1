import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertSiteSetting } from "@shared/schema";

export interface AdminCommandCenterData {
  generatedAt: string;
  health: {
    score: number;
    level: "strong" | "watch" | "critical";
    headline: string;
    summary: string;
  };
  mission: {
    siteName: string;
    testMode: boolean;
  };
  counters: {
    pendingBookings: number;
    ticketIssues: number;
    confirmationBacklog: number;
    liveRequests: number;
    activeLiveSessions: number;
    openEscalations: number;
    unreadInboxMessages: number;
    openInboxThreads: number;
    activeDeals: number;
    publishedPosts: number;
    todayBookings: number;
    todaySearches: number;
  };
  revenue: {
    today: number;
    last7Days: number;
    atRisk: number;
    avgBookingValue: number;
  };
  urgentBookings: Array<{
    id: number;
    referenceCode?: string | null;
    contactEmail: string;
    contactPhone?: string | null;
    route: string;
    status: string;
    ticketStatus: string;
    totalPrice: number;
    currency: string;
    urgency: number;
    reason: string;
    createdAt?: string | null;
  }>;
  liveRequests: Array<{
    id: number;
    language?: string | null;
    status: string;
    bookingStatus?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    createdAt?: string | null;
  }>;
  activeLiveSessions: Array<{
    id: number;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    createdAt?: string | null;
  }>;
  inboxThreads: Array<{
    id: number;
    subject: string;
    status: string;
    userName?: string | null;
    userEmail?: string | null;
    unreadCount: number;
    lastMessageAt?: string | null;
  }>;
  escalations: Array<{
    id: number;
    type: string;
    reason: string;
    customerPhone?: string | null;
    summary?: string | null;
    status: string;
    createdAt?: string | null;
  }>;
  opportunityRoutes: Array<{
    routeKey: string;
    route: string;
    searches: number;
    bookings: number;
    revenue: number;
    isPromoted: boolean;
  }>;
  recentWins: Array<{
    id: number;
    referenceCode?: string | null;
    contactEmail: string;
    route: string;
    totalPrice: number;
    currency: string;
    createdAt?: string | null;
  }>;
  recommendedActions: Array<{
    id: string;
    level: "critical" | "attention" | "growth";
    title: string;
    description: string;
    action: "open-live-chat" | "open-bookings" | "focus-inbox" | "open-settings";
    actionLabel: string;
  }>;
  shiftBrief: string;
}

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

export function useAdminCommandCenter() {
  return useQuery<AdminCommandCenterData>({
    queryKey: ["/api/admin/command-center"],
    queryFn: async () => {
      const res = await fetch("/api/admin/command-center", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch command center");
      return res.json();
    },
    refetchInterval: 15000,
  });
}
