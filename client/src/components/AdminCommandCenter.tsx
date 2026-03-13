import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Copy, DollarSign, ExternalLink, Loader2, Mail, MessageSquare, Phone, Plane, RefreshCw, Send, ShieldAlert, Sparkles, TrendingUp, Users } from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminCommandCenter, type AdminCommandCenterData } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminCommandCenterProps {
  onOpenLiveDesk: () => void;
  onOpenBookings: (options?: { status?: string; search?: string; bookingId?: number }) => void;
  onOpenSettings: () => void;
}

interface AdminThread {
  id: number;
  subject: string;
  status: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  unreadCount?: number | string;
  lastMessageAt?: string | null;
}

interface AdminMessage {
  id: number;
  senderRole: "admin" | "user";
  senderName?: string | null;
  content: string;
  createdAt: string;
}

function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `$${(amount || 0).toFixed(2)}`;
  }
}

function formatMoment(value?: string | null) {
  if (!value) return "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

function getHealthStyles(level: AdminCommandCenterData["health"]["level"]) {
  switch (level) {
    case "strong":
      return {
        shell: "border-emerald-200 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 text-white",
        badge: "border-emerald-300/40 bg-emerald-500/15 text-emerald-100",
      };
    case "watch":
      return {
        shell: "border-amber-200 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white",
        badge: "border-amber-300/40 bg-amber-500/15 text-amber-100",
      };
    default:
      return {
        shell: "border-red-200 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white",
        badge: "border-red-300/40 bg-red-500/15 text-red-100",
      };
  }
}

function QueueCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  tone: "danger" | "attention" | "calm" | "growth";
}) {
  const toneStyles = {
    danger: "border-red-200 bg-red-50 text-red-700",
    attention: "border-amber-200 bg-amber-50 text-amber-700",
    calm: "border-blue-200 bg-blue-50 text-blue-700",
    growth: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneStyles}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminCommandCenter({ onOpenLiveDesk, onOpenBookings, onOpenSettings }: AdminCommandCenterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useAdminCommandCenter();
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: threads = [] } = useQuery<AdminThread[]>({
    queryKey: ["/api/admin/messenger/threads"],
    queryFn: async () => {
      const res = await fetch("/api/admin/messenger/threads", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load admin inbox");
      return res.json();
    },
    refetchInterval: 12000,
  });

  const { data: threadMessages = [] } = useQuery<AdminMessage[]>({
    queryKey: ["/api/admin/messenger/threads", selectedThreadId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/messenger/threads/${selectedThreadId}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load thread messages");
      return res.json();
    },
    enabled: Boolean(selectedThreadId),
    refetchInterval: 8000,
  });

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      const preferred = threads.find((thread) => Number(thread.unreadCount || 0) > 0) || threads[0];
      setSelectedThreadId(preferred.id);
    }
  }, [selectedThreadId, threads]);

  const invalidateMissionControl = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/command-center"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/messenger/threads"] });
    queryClient.invalidateQueries({ queryKey: ["/api/live-sessions/admin/requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/voice/escalations"] });
  };

  const syncBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/sync`);
      return response.json();
    },
    onSuccess: (_, bookingId) => {
      invalidateMissionControl();
      toast({
        title: "Booking synced",
        description: `Reservation #${bookingId} was refreshed against the provider.`,
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Sync failed",
        description: mutationError.message,
        variant: "destructive",
      });
    },
  });

  const acceptLiveMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest("POST", `/api/live-sessions/admin/${sessionId}/accept`, {});
      return response.json();
    },
    onSuccess: () => {
      invalidateMissionControl();
      toast({
        title: "Live request accepted",
        description: "The traveler is now in the active service queue.",
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Unable to accept live request",
        description: mutationError.message,
        variant: "destructive",
      });
    },
  });

  const resolveEscalationMutation = useMutation({
    mutationFn: async (escalationId: number) => {
      const response = await apiRequest("PATCH", `/api/voice/escalations/${escalationId}`, { status: "resolved" });
      return response.json();
    },
    onSuccess: () => {
      invalidateMissionControl();
      toast({
        title: "Escalation resolved",
        description: "The service rescue queue is up to date.",
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Unable to update escalation",
        description: mutationError.message,
        variant: "destructive",
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/admin/messenger/threads/${threadId}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      setReplyText("");
      invalidateMissionControl();
      if (selectedThreadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/messenger/threads", selectedThreadId, "messages"] });
      }
      toast({
        title: "Reply sent",
        description: "The customer inbox has been updated.",
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Reply failed",
        description: mutationError.message,
        variant: "destructive",
      });
    },
  });

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [selectedThreadId, threads],
  );

  const handleCopyBrief = async () => {
    if (!data?.shiftBrief) return;
    try {
      await navigator.clipboard.writeText(data.shiftBrief);
      toast({
        title: "Shift brief copied",
        description: "You can paste it into WhatsApp, Messenger or your internal notes.",
      });
    } catch {
      toast({
        title: "Clipboard unavailable",
        description: "Copying is not available in this browser session.",
        variant: "destructive",
      });
    }
  };

  const openEmail = (email?: string | null) => {
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };

  const openPhone = (phone?: string | null) => {
    if (!phone) return;
    window.location.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
  };

  const focusInbox = () => {
    if (threads.length === 0) return;
    const preferred = threads.find((thread) => Number(thread.unreadCount || 0) > 0) || threads[0];
    setSelectedThreadId(preferred.id);
  };

  const runRecommendedAction = (action: AdminCommandCenterData["recommendedActions"][number]["action"]) => {
    switch (action) {
      case "open-live-chat":
        onOpenLiveDesk();
        break;
      case "open-bookings":
        onOpenBookings({ status: "pending" });
        break;
      case "focus-inbox":
        focusInbox();
        break;
      case "open-settings":
        onOpenSettings();
        break;
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border border-red-200 bg-red-50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Command center unavailable
          </CardTitle>
          <CardDescription className="text-red-600">
            {(error as Error | undefined)?.message || "The operation layer could not be loaded."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const healthStyles = getHealthStyles(data.health.level);

  return (
    <div className="space-y-6">
      <Card className={`overflow-hidden border shadow-sm ${healthStyles.shell}`}>
        <CardContent className="p-0">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.6fr,1fr]">
            <div>
              <div className="flex items-center gap-2">
                <Badge className={`border ${healthStyles.badge}`}>Mission Control</Badge>
                <Badge className="border border-white/10 bg-white/5 text-white/80">Score {data.health.score}</Badge>
                <Badge className="border border-white/10 bg-white/5 text-white/80">
                  {data.mission.testMode ? "Test mode" : "Production mode"}
                </Badge>
              </div>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight">{data.health.headline}</h2>
              <p className="mt-3 max-w-3xl text-sm text-white/75">{data.health.summary}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button className="gap-2 bg-white text-slate-900 hover:bg-white/90" onClick={onOpenLiveDesk}>
                  <MessageSquare className="h-4 w-4" />
                  Open live desk
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
                  onClick={handleCopyBrief}
                >
                  <Copy className="h-4 w-4" />
                  Copy shift brief
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => onOpenBookings({ status: "pending" })}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Rescue bookings
                </Button>
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Revenue today</p>
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(data.revenue.today)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">At risk</p>
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(data.revenue.atRisk)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Bookings today</p>
                  <p className="mt-2 text-2xl font-bold">{data.counters.todayBookings}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Searches today</p>
                  <p className="mt-2 text-2xl font-bold">{data.counters.todaySearches}</p>
                </div>
              </div>
              <p className="text-xs text-white/55">
                Updated {formatMoment(data.generatedAt)}. Average booking value {formatCurrency(data.revenue.avgBookingValue)}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QueueCard
          title="Pending bookings"
          value={data.counters.pendingBookings}
          description="Travelers waiting for confirmation or payment clearance."
          icon={<Plane className="h-5 w-5" />}
          tone={data.counters.pendingBookings > 0 ? "attention" : "calm"}
        />
        <QueueCard
          title="Ticket issues"
          value={data.counters.ticketIssues}
          description="Failed, cancelled or changed tickets that can damage trust."
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={data.counters.ticketIssues > 0 ? "danger" : "calm"}
        />
        <QueueCard
          title="Unread inbox"
          value={data.counters.unreadInboxMessages}
          description="Customer messages needing a human reply."
          icon={<Mail className="h-5 w-5" />}
          tone={data.counters.unreadInboxMessages > 0 ? "attention" : "calm"}
        />
        <QueueCard
          title="Open escalations"
          value={data.counters.openEscalations}
          description="Voice or service rescue cases still unresolved."
          icon={<Phone className="h-5 w-5" />}
          tone={data.counters.openEscalations > 0 ? "danger" : "growth"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-gray-900">Revenue Rescue Board</CardTitle>
                <CardDescription>
                  Prioritized bookings that can lose money or trust if you do not act quickly.
                </CardDescription>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => onOpenBookings({ status: "pending" })}>
                Open bookings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.urgentBookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  No urgent bookings right now. The revenue rescue queue is under control.
                </div>
              ) : (
                data.urgentBookings.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{booking.route}</p>
                          <Badge className="border border-red-200 bg-red-50 text-red-700">urgency {booking.urgency}</Badge>
                          <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                          <Badge variant="outline" className="capitalize">{booking.ticketStatus}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{booking.reason}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>{booking.contactEmail}</span>
                          {booking.referenceCode && <span className="font-mono text-blue-600">{booking.referenceCode}</span>}
                          <span>{formatMoment(booking.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(booking.totalPrice, booking.currency)}</p>
                        <p className="text-xs text-gray-500">Potentially exposed revenue</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => onOpenBookings({
                          status: booking.status === "payment_pending" ? "pending" : "all",
                          search: booking.referenceCode || booking.contactEmail,
                          bookingId: booking.id,
                        })}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open booking
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={syncBookingMutation.isPending}
                        onClick={() => syncBookingMutation.mutate(booking.id)}
                      >
                        <RefreshCw className={`h-4 w-4 ${syncBookingMutation.isPending ? "animate-spin" : ""}`} />
                        Sync
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => openEmail(booking.contactEmail)}>
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                      {booking.contactPhone && (
                        <Button size="sm" variant="outline" className="gap-2" onClick={() => openPhone(booking.contactPhone)}>
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Growth Radar</CardTitle>
              <CardDescription>
                Demand signals, content coverage and recently won bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Active deals</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-900">{data.counters.activeDeals}</p>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Published posts</p>
                  <p className="mt-2 text-2xl font-bold text-blue-900">{data.counters.publishedPosts}</p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Demand gaps</h3>
                  <Button size="sm" variant="outline" className="gap-2" onClick={onOpenSettings}>
                    <Sparkles className="h-4 w-4" />
                    Open growth controls
                  </Button>
                </div>
                <div className="space-y-3">
                  {data.opportunityRoutes.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                      Current demand is already supported by active promotions.
                    </p>
                  ) : (
                    data.opportunityRoutes.map((route) => (
                      <div key={route.routeKey} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{route.route}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {route.searches} searches · {route.bookings} bookings
                            </p>
                          </div>
                          <div className="text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(route.revenue)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Recent wins</h3>
                <div className="space-y-3">
                  {data.recentWins.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                      Confirmed bookings will appear here as you close sales.
                    </p>
                  ) : (
                    data.recentWins.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{booking.route}</p>
                          <p className="mt-1 text-xs text-gray-500">{booking.contactEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(booking.totalPrice, booking.currency)}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatMoment(booking.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Action Playbooks</CardTitle>
              <CardDescription>
                Real-time operational suggestions based on bookings, service and demand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recommendedActions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  No urgent playbooks right now. You can focus on growth and service polish.
                </div>
              ) : (
                data.recommendedActions.map((item) => {
                  const tone =
                    item.level === "critical"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : item.level === "attention"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700";

                  return (
                    <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <Badge className={`border ${tone}`}>{item.level}</Badge>
                      <p className="mt-3 text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                      <Button className="mt-4 w-full gap-2" variant="outline" onClick={() => runRecommendedAction(item.action)}>
                        {item.level === "growth" ? <TrendingUp className="h-4 w-4" /> : item.level === "attention" ? <Users className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                        {item.actionLabel}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
