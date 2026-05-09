import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertSiteSetting } from "@shared/schema";
import { useAuth } from "./use-auth";
import { useLocation } from "wouter";

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

export interface AdminOwnerDeskData {
  generatedAt: string;
  summary: {
    totalCases: number;
    hotCases: number;
    seniorCases: number;
    paymentWatch: number;
    liveNow: number;
    alertingNow: number;
    overdueFollowUps: number;
  };
  alerts: Array<{
    id: string;
    level: "critical" | "attention" | "info";
    title: string;
    summary: string;
    customerCaseId: string;
    customerName: string | null;
    route: string | null;
    stageLabel: string;
    heatScore: number;
    triggeredAt: string | null;
    action: "open-live-desk" | "open-bookings" | "focus-inbox" | "call" | "whatsapp" | "email";
    actionLabel: string;
    actionUrl: string;
    customerPhone: string | null;
    customerEmail: string | null;
    liveSessionId: number | null;
    bookingId: number | null;
    threadId: number | null;
  }>;
  followUps: Array<{
    id: string;
    customerCaseId: string;
    customerName: string | null;
    route: string | null;
    dueAt: string;
    overdue: boolean;
    urgency: "overdue" | "soon" | "planned";
    reason: string;
    channel: "open-live-desk" | "open-bookings" | "focus-inbox" | "call" | "whatsapp" | "email";
    actionLabel: string;
    actionUrl: string;
    customerPhone: string | null;
    customerEmail: string | null;
    liveSessionId: number | null;
    bookingId: number | null;
    threadId: number | null;
  }>;
  cases: Array<{
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    preferredLanguage: string | null;
    serviceMode: "standard" | "senior";
    needsHumanHelp: boolean;
    route: string | null;
    sourceLabel: string;
    stage: string;
    stageLabel: string;
    priorityBand: "hot" | "warm" | "watch";
    heatScore: number;
    nextBestAction: {
      action: "open-live-desk" | "open-bookings" | "focus-inbox" | "call" | "whatsapp" | "email";
      label: string;
      description: string;
    };
    availableActions: Array<"open-live-desk" | "open-bookings" | "focus-inbox" | "call" | "whatsapp" | "email">;
    lastTouchAt: string | null;
    latestSummary: string | null;
    totalRevenue: number;
    totalBookings: number;
    pendingBookings: number;
    unreadInboxCount: number;
    openEscalations: number;
    liveRequests: number;
    activeLiveSessions: number;
    bookingId: number | null;
    threadId: number | null;
    liveSessionId: number | null;
    escalationId: number | null;
    timeline: Array<{
      id: string;
      type: "booking" | "live" | "inbox" | "escalation" | "account";
      title: string;
      summary: string;
      status: string;
      createdAt: string;
    }>;
  }>;
}

export function useAdminStats() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isAdminPath = location.startsWith("/admin");

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
  const { user } = useAuth();
  const [location] = useLocation();
  const isAdminPath = location.startsWith("/admin");

  return useQuery<AdminCommandCenterData>({
    queryKey: ["/api/admin/command-center"],
    queryFn: async () => {
      const res = await fetch("/api/admin/command-center", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch command center");
      return res.json();
    },
    refetchInterval: 15000,
    enabled: !!user?.isAdmin && isAdminPath,
  });
}

export function useAdminOwnerDesk() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isAdminPath = location.startsWith("/admin");

  return useQuery<AdminOwnerDeskData>({
    queryKey: ["/api/admin/owner-desk"],
    queryFn: async () => {
      const res = await fetch("/api/admin/owner-desk", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch owner desk");
      return res.json();
    },
    refetchInterval: 15000,
    enabled: !!user?.isAdmin && isAdminPath,
  });
}

export function useAdminFeaturedDeals() {
  return useQuery({
    queryKey: [api.admin.featured_deals.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.featured_deals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch featured deals");
      return api.admin.featured_deals.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFeaturedDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.admin.featured_deals.create.path, {
        method: api.admin.featured_deals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create featured deal");
      return api.admin.featured_deals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.featured_deals.list.path] });
    },
  });
}

export function useUpdateFeaturedDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const url = api.admin.featured_deals.update.path.replace(":id", id);
      const res = await fetch(url, {
        method: api.admin.featured_deals.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update featured deal");
      return api.admin.featured_deals.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.featured_deals.list.path] });
    },
  });
}

export function useDeleteFeaturedDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = api.admin.featured_deals.delete.path.replace(":id", id);
      const res = await fetch(url, {
        method: api.admin.featured_deals.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete featured deal");
      return api.admin.featured_deals.delete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.featured_deals.list.path] });
    },
  });
}
