import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect as useReactEffect, useMemo as useReactMemo } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Copy, DollarSign, ExternalLink, Loader2, Mail, MessageSquare, Phone, Plane, RefreshCw, Send, ShieldAlert, Smartphone, Sparkles, TrendingUp, Users } from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AutoFitText } from "@/components/ui/auto-fit-text";
import { AdminOwnerDesk } from "@/components/AdminOwnerDesk";
import { useAdminCommandCenter, useAdminOwnerDesk, type AdminCommandCenterData, type AdminOwnerDeskData } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { fetchAppReleaseManifest, getAdminAndroidPrimaryUrl, hasAdminAndroidRelease, DEFAULT_APP_RELEASE_MANIFEST } from "@/lib/app-release";
import { formatBytes } from "@/lib/formatBytes";

// Fallback Expo build page (token-based)
const EXPO_ADMIN_BUILD_URL = "https://expo.dev/accounts/njfw23/projects/michels-travel-admin/builds?token=GgvD0zgdlx6ARx_OdBgblAuTZEPJqAMpJ6TzMbfH";

interface AdminCommandCenterProps {
  onOpenLiveDesk: (options?: { sessionId?: number }) => void;
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

interface QuickDealDraft {
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  returnDate: string;
  price: string;
  currency: string;
  airline: string;
  cabinClass: string;
  headline: string;
  description: string;
  stops: number;
  duration: string;
}

type SystemHealth = {
  timestamp: string;
  uptimeSec: number;
  nodeVersion: string;
  env: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
};

type DealSearchOffer = {
  id: string;
  airline?: string;
  price?: number;
  currency?: string;
  departureTime?: string;
  origin?: string;
  destination?: string;
};

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
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    attention: "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    calm: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    growth: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
  }[tone];

  return (
    <Card className="glass-card border-white/5 hover:border-white/20 transition-all duration-500 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 group-hover:text-indigo-400 transition-colors uppercase">{title}</p>
            <p className="mt-3 text-3xl font-bold text-white font-display tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-slate-400 font-medium leading-relaxed">{description}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneStyles} transition-transform group-hover:scale-110`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductAppCard({
  title,
  audience,
  description,
  status,
  icon,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  audience: string;
  description: string;
  status: string;
  icon: ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="glass-card border-white/5 hover:border-indigo-500/20 transition-all duration-500 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] -mr-12 -mt-12 group-hover:bg-indigo-500/15 transition-all" />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge className="border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold px-3 py-0.5 rounded-full text-[10px] uppercase">{audience}</Badge>
            <h3 className="mt-4 text-xl font-bold text-white font-display tracking-tight">{title}</h3>
            <p className="mt-2 text-sm text-slate-400 font-medium leading-relaxed">{description}</p>
            <p className="mt-4 text-[10px] uppercase tracking-[0.18em] font-black text-slate-500">{status}</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 group-hover:text-indigo-400 transition-colors">
            {icon}
          </div>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {primaryAction && (
              <Button className="gap-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="ghost" className="gap-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 font-bold px-5" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function buildQuickDealDraft(route: { route: string; routeKey: string }): QuickDealDraft {
  const [origin = "", destination = ""] = route.routeKey.split("-");
  return {
    origin,
    destination,
    originCity: "",
    destinationCity: "",
    departureDate: "",
    returnDate: "",
    price: "",
    currency: "USD",
    airline: "",
    cabinClass: "economy",
    headline: `Special fares for ${route.route}`,
    description: `Demand is strong for ${route.route}. Publish this featured fare and direct travelers to Michels Travel for human support.`,
    stops: 0,
    duration: "Varia",
  };
}

const replyMacros = [
  {
    label: "Acknowledge",
    create: (name?: string | null) =>
      `Hello${name ? ` ${name}` : ""}, thank you for contacting Michels Travel. I am reviewing your request now and I will stay with you until we have a clear solution.`,
  },
  {
    label: "Call Offer",
    create: () =>
      "If you prefer, I can continue this by phone and guide everything step by step. Send me the best number and time, or call our team directly for immediate help.",
  },
  {
    label: "Payment Follow-up",
    create: () =>
      "I am checking your reservation and payment status now. Please keep this conversation open and avoid creating a second booking until I confirm the next safe step.",
  },
  {
    label: "Senior Support",
    create: () =>
      "If this booking is for an older traveler or you want a simpler guided process, we can handle it slowly and clearly together, including a phone-assisted checkout.",
  },
];

export function AdminCommandCenter({ onOpenLiveDesk, onOpenBookings, onOpenSettings }: AdminCommandCenterProps) {
  // --- App Admin Download Integration ---
  const { data: appRelease } = useQuery({
    queryKey: ["/app-release.json"],
    queryFn: fetchAppReleaseManifest,
    staleTime: 30000,
  });
  const manifest = appRelease ?? DEFAULT_APP_RELEASE_MANIFEST;
  const releaseReady = hasAdminAndroidRelease(manifest);
  const primaryUrl = getAdminAndroidPrimaryUrl(manifest);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useAdminCommandCenter();
  const ownerDeskQuery = useAdminOwnerDesk();
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [dealDraft, setDealDraft] = useState<QuickDealDraft | null>(null);
  const [dealOffers, setDealOffers] = useState<DealSearchOffer[]>([]);
  const [dealSearchLoading, setDealSearchLoading] = useState(false);
  const [dealSearchError, setDealSearchError] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemHealthLoading, setSystemHealthLoading] = useState(false);
  const [dealSearchParams, setDealSearchParams] = useState({
    tripType: "one-way",
    departureDate: "",
    returnDate: "",
    adults: "1",
    children: "0",
    infants: "0",
    cabinClass: "economy",
  });

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

  // System health polling (30s)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setSystemHealthLoading(true);
        const res = await fetch("/api/admin/system-health", { credentials: "include" });
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (mounted) setSystemHealth(json);
      } catch (err) {
        if (mounted) setSystemHealth(null);
      } finally {
        if (mounted) setSystemHealthLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      const preferred = threads.find((thread) => Number(thread.unreadCount || 0) > 0) || threads[0];
      setSelectedThreadId(preferred.id);
    }
  }, [selectedThreadId, threads]);

  const invalidateMissionControl = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/command-center"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/owner-desk"] });
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

  const createDealMutation = useMutation({
    mutationFn: async (payload: QuickDealDraft) => {
      const response = await apiRequest("POST", "/api/admin/featured-deals", {
        ...payload,
        price: payload.price || undefined,
        isActive: true,
      });
      return response.json();
    },
    onSuccess: () => {
      setDealDraft(null);
      invalidateMissionControl();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-deals"] });
      toast({
        title: "Featured deal created",
        description: "The growth launchpad sent a new offer to your deal catalog.",
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Unable to create featured deal",
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

  const handleOpenAdminInstallPage = () => {
    if (releaseReady && primaryUrl) {
      window.open(primaryUrl, "_blank", "noopener,noreferrer");
    } else {
      // Fallback para Expo
      window.open(EXPO_ADMIN_BUILD_URL, "_blank", "noopener,noreferrer");
      toast({
        title: "Instalador via Expo",
        description: "O app admin nativo ainda não foi publicado. Você será redirecionado para a página de builds do Expo.",
      });
    }
  };

  const handleCopyAdminInstallLink = async () => {
    if (releaseReady && primaryUrl) {
      try {
        await navigator.clipboard.writeText(primaryUrl);
        toast({
          title: "Link de instalação copiado",
          description: "Abra no seu celular para instalar o app admin.",
        });
      } catch {
        toast({
          title: "Clipboard indisponível",
          description: "Não foi possível copiar o link nesta sessão.",
          variant: "destructive",
        });
      }
    } else {
      try {
        await navigator.clipboard.writeText(EXPO_ADMIN_BUILD_URL);
        toast({
          title: "Link do Expo copiado",
          description: "Abra no seu celular para acessar a página de builds do Expo.",
        });
      } catch {
        toast({
          title: "Clipboard indisponível",
          description: "Não foi possível copiar o link nesta sessão.",
          variant: "destructive",
        });
      }
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

  const openWhatsApp = (phone?: string | null, customerName?: string | null) => {
    if (!phone) return;
    const digits = phone.replace(/\D+/g, "");
    if (!digits) return;
    const intro = customerName
      ? `Oi ${customerName}, aqui e a Michels Travel. Estou com seu atendimento aberto e posso continuar com voce por aqui.`
      : "Oi, aqui e a Michels Travel. Estou com seu atendimento aberto e posso continuar com voce por aqui.";
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(intro)}`, "_blank", "noopener,noreferrer");
  };

  const focusInbox = (threadId?: number | null) => {
    if (threads.length === 0) return;
    const preferred = (threadId ? threads.find((thread) => thread.id === threadId) : null) ||
      threads.find((thread) => Number(thread.unreadCount || 0) > 0) ||
      threads[0];
    setSelectedThreadId(preferred.id);
    window.setTimeout(() => {
      document.getElementById("client-inbox-relay")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
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

  const runOwnerDeskAction = (
    ownerCase: AdminOwnerDeskData["cases"][number],
    action: AdminOwnerDeskData["cases"][number]["availableActions"][number],
  ) => {
    switch (action) {
      case "open-live-desk":
        onOpenLiveDesk(ownerCase.liveSessionId ? { sessionId: ownerCase.liveSessionId } : undefined);
        break;
      case "open-bookings":
        onOpenBookings({
          bookingId: ownerCase.bookingId || undefined,
          status: ownerCase.pendingBookings > 0 ? "pending" : undefined,
          search: ownerCase.customerEmail || ownerCase.customerPhone || undefined,
        });
        break;
      case "focus-inbox":
        focusInbox(ownerCase.threadId);
        break;
      case "call":
        openPhone(ownerCase.customerPhone);
        break;
      case "whatsapp":
        openWhatsApp(ownerCase.customerPhone, ownerCase.customerName);
        break;
      case "email":
        openEmail(ownerCase.customerEmail);
        break;
    }
  };

  const openDealLaunchpad = (route: { route: string; routeKey: string }) => {
    setDealDraft(buildQuickDealDraft(route));
    setDealOffers([]);
    setDealSearchError(null);
  };

  const copyCampaignBrief = async (route: { route: string; searches: number; bookings: number }) => {
    const brief = [
      `Campaign angle for ${route.route}.`,
      `${route.searches} searches and ${route.bookings} bookings already show live demand.`,
      "Lead with personal support, safer booking guidance and fast human follow-up.",
      "Push to site search, live help and senior support mode.",
    ].join(" ");

    try {
      await navigator.clipboard.writeText(brief);
      toast({
        title: "Campaign brief copied",
        description: `Growth brief for ${route.route} is ready to paste into marketing notes.`,
      });
    } catch {
      toast({
        title: "Clipboard unavailable",
        description: "Could not copy the campaign brief from this browser session.",
        variant: "destructive",
      });
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
    <div className="space-y-8 pb-10">
      <Card className={`overflow-hidden border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-[32px]`}>
        <CardContent className="p-0">
          <div className="relative grid gap-8 overflow-hidden p-8 sm:p-10 xl:grid-cols-[minmax(0,1.8fr)_minmax(360px,0.95fr)] 2xl:grid-cols-[minmax(0,1.95fr)_minmax(380px,0.9fr)]">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
                  Mission Control Pro
                </Badge>
                <Badge className="border border-white/10 bg-white/5 text-slate-400 font-medium px-3 py-1 rounded-full text-[10px]">
                  Score Global {data.health.score}
                </Badge>
                <Badge className={`border px-3 py-1 rounded-full text-[10px] font-black uppercase ${data.mission.testMode ? "border-amber-500/40 bg-amber-500/15 text-amber-300" : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"}`}>
                  {data.mission.testMode ? "Mode Teste Ativo" : "Produção Live"}
                </Badge>
              </div>
              <AutoFitText
                as="h2"
                minFontSize={30}
                maxFontSize={76}
                maxLines={2}
                containerClassName="mt-8 max-w-[min(100%,42rem)]"
                className="font-display font-bold tracking-tight text-white leading-[0.92]"
              >
                {data.health.headline.split(" ").map((word, i) =>
                  i === 0 || i === 1 ? (
                    <span key={i}>{word} </span>
                  ) : (
                    <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                      {word}{" "}
                    </span>
                  ),
                )}
              </AutoFitText>
              <p className="mt-6 max-w-2xl text-lg text-slate-400 font-medium leading-relaxed italic">
                "{data.health.summary}"
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button 
                  className="h-14 gap-3 rounded-2xl bg-indigo-600 px-6 font-bold text-white shadow-[0_0_25px_rgba(99,102,241,0.3)] transition whitespace-nowrap hover:scale-105 hover:bg-indigo-500 active:scale-95 sm:px-8" 
                  onClick={() => onOpenLiveDesk()}
                >
                  <MessageSquare className="h-5 w-5" />
                  Abrir Atendimento Live
                </Button>
                <Button
                  variant="secondary"
                  className="h-14 gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 font-bold text-slate-300 transition-all whitespace-nowrap hover:bg-white/15 hover:text-white sm:px-7"
                  onClick={handleOpenAdminInstallPage}
                >
                  <Smartphone className="h-5 w-5" />
                  Instalar App Admin
                </Button>
                
                <div className="flex items-center gap-2">
                   <Button
                    variant="secondary"
                    size="icon"
                    className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                    onClick={handleCopyAdminInstallLink}
                    title="Copiar link do app"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                    onClick={handleCopyBrief}
                    title="Copiar briefing do turno"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                    onClick={() => onOpenBookings({ status: "pending" })}
                    title="Resgatar Reservas"
                  >
                    <ShieldAlert className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative z-10 grid w-full gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-inner shadow-white/5 backdrop-blur xl:max-w-[31rem] xl:justify-self-end">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Revenue Today</p>
                  <p className="text-3xl font-bold text-white font-display tracking-tight">{formatCurrency(data.revenue.today)}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Fluxo Positivo
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Exposure At Risk</p>
                  <p className="text-3xl font-bold text-rose-400 font-display tracking-tight">{formatCurrency(data.revenue.atRisk)}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Precisa Resgate
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Bookings (24h)</p>
                  <p className="text-3xl font-bold text-white font-display tracking-tight">{data.counters.todayBookings}</p>
                  <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Atividade de Venda</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Searches (24h)</p>
                  <p className="text-3xl font-bold text-cyan-400 font-display tracking-tight">{data.counters.todaySearches}</p>
                  <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intenção de Compra</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between px-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Updated {formatMoment(data.generatedAt)}
                </p>
                <p className="text-[10px] text-indigo-400/60 font-black uppercase tracking-widest">
                  AVG Ticket: {formatCurrency(data.revenue.avgBookingValue)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <ProductAppCard
          title="Michels Travel Admin"
          audience="Operacao"
          description="Seu app separado de operacao e atendimento. Ele nao e o app do cliente."
          status="Instalacao separada do app do cliente"
          icon={<Smartphone className="h-5 w-5" />}
          primaryAction={{ label: "Instalar app admin", onClick: handleOpenAdminInstallPage }}
          secondaryAction={{ label: "Copiar link de instalacao", onClick: handleCopyAdminInstallLink }}
        />
        <ProductAppCard
          title="Modo senior no app Michels Travel"
          audience="Idosos"
          description="O app do cliente inclui o modo senior com fluxo facilitado, ajuda calma e jornada dedicada ao cliente idoso."
          status="Disponivel dentro do app do cliente"
          icon={<Users className="h-5 w-5" />}
        />
        <ProductAppCard
          title="Michels Travel Cliente"
          audience="Busca e compra"
          description="App principal do cliente para pesquisar voos, comparar, comprar e acompanhar reservas no mesmo produto."
          status="Separado do admin"
          icon={<Plane className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-[30px] -mr-12 -mt-12 pointer-events-none" />
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="flex items-center gap-3 text-white font-display tracking-tight text-base">
              <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              Monitoramento (Runtime)
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Estado Vital do Cluster Node/Render
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {systemHealthLoading && (
              <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Interrogando Sistema...
              </div>
            )}
            {systemHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uptime Executivo</span>
                  <span className="text-xs font-black text-white">{Math.round(systemHealth.uptimeSec / 60)} min</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memória Alocada</span>
                  <span className="text-xs font-black text-cyan-400">{formatBytes(systemHealth.memory.rss)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Heap Dinâmico</span>
                  <span className="text-xs font-black text-white">{formatBytes(systemHealth.memory.heapUsed)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Binário Node</span>
                  <span className="text-xs font-mono font-bold text-slate-400">{systemHealth.nodeVersion}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ambiente</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 uppercase">{systemHealth.env}</span>
                </div>
                <p className="pt-2 text-[8px] font-black text-slate-600 uppercase tracking-widest border-t border-white/5">
                  Atualizado {formatDistanceToNowStrict(new Date(systemHealth.timestamp), { addSuffix: true })}
                </p>
              </div>
            ) : !systemHealthLoading ? (
              <div className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                <AlertTriangle className="h-4 w-4" />
                Erro Critical no Telemetria
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

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

      <AdminOwnerDesk
        data={ownerDeskQuery.data}
        isLoading={ownerDeskQuery.isLoading}
        isError={ownerDeskQuery.isError}
        error={ownerDeskQuery.error as Error | null | undefined}
        onRunAction={runOwnerDeskAction}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-6">
          <Card className="glass-card border-white/5 shadow-2xl overflow-hidden transition-all duration-500 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between gap-4 p-8 border-b border-white/5">
              <div>
                <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">Revenue Rescue Board</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Reservas de Risco que Demandam Resgate Imediato
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                className="rounded-xl font-bold text-[10px] uppercase tracking-widest text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 px-5 h-11 transition-all" 
                onClick={() => onOpenBookings({ status: "pending" })}
              >
                Ativar Arquivo Global
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {data.urgentBookings.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-emerald-500/20 bg-emerald-500/5 p-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Controle Operacional Total - Sem Riscos Detectados</p>
                </div>
              ) : (
                data.urgentBookings.map((booking) => (
                  <div key={booking.id} className="rounded-3xl border border-white/5 bg-slate-950/40 p-6 hover:bg-white/5 transition-colors group/item">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-bold text-white tracking-tight">{booking.route}</p>
                          <Badge className="border border-rose-500/30 bg-rose-500/15 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-lg">Urgência {booking.urgency}</Badge>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 border border-white/5">{booking.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-lg">{booking.reason}</p>
                        <div className="flex flex-wrap items-center gap-4 pt-1">
                           <div className="flex items-center gap-2">
                             <Mail className="h-3 w-3 text-slate-600" />
                             <span className="text-[10px] font-bold text-slate-500">{booking.contactEmail}</span>
                           </div>
                           {booking.referenceCode && (
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-indigo-400/60 font-mono tracking-tighter uppercase">#{booking.referenceCode}</span>
                             </div>
                           )}
                           <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{formatMoment(booking.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-white font-display tracking-tight">{formatCurrency(booking.totalPrice, booking.currency)}</p>
                        <p className="text-[9px] font-bold text-rose-500/60 uppercase tracking-widest mt-1">Exposição Financeira</p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10"
                        onClick={() => onOpenBookings({
                          status: booking.status === "payment_pending" ? "pending" : "all",
                          search: booking.referenceCode || booking.contactEmail,
                          bookingId: booking.id,
                        })}
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5 text-indigo-400" />
                        Inspecionar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all"
                        disabled={syncBookingMutation.isPending}
                        onClick={() => syncBookingMutation.mutate(booking.id)}
                      >
                        <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncBookingMutation.isPending ? "animate-spin" : ""}`} />
                        Sync Provid.
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-10 w-10 p-0 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10" 
                        onClick={() => openEmail(booking.contactEmail)}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                      {booking.contactPhone && (
                        <Button 
                           size="sm" 
                           variant="ghost" 
                           className="h-10 w-10 p-0 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10" 
                           onClick={() => openPhone(booking.contactPhone)}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">Growth Radar</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Sinais de Demanda, Cobertura de Conteúdo e Conversões Recentes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[24px] border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Ofertas Ativas</p>
                  <p className="text-3xl font-bold text-emerald-400 font-display tracking-tight">{data.counters.activeDeals}</p>
                </div>
                <div className="rounded-[24px] border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Posts Publicados</p>
                  <p className="text-3xl font-bold text-cyan-400 font-display tracking-tight">{data.counters.publishedPosts}</p>
                </div>
              </div>

              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em]">Janelas de Oportunidade</h3>
                  <Button variant="ghost" size="sm" className="h-9 rounded-xl border border-white/5 text-[9px] font-black uppercase text-slate-400 hover:bg-white/5" onClick={onOpenSettings}>
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    Growth Controls
                  </Button>
                </div>
                <div className="space-y-4">
                  {data.opportunityRoutes.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/5 bg-white/5 p-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      Demanda Totalmente Suportada
                    </p>
                  ) : (
                    data.opportunityRoutes.map((route) => (
                      <div key={route.routeKey} className="rounded-2xl border border-white/5 bg-slate-950/20 p-5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-white tracking-tight">{route.route}</p>
                            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                              {route.searches} Buscas · {route.bookings} Conversões
                            </p>
                          </div>
                          <div className="text-right text-sm font-black text-white font-display">
                            {formatCurrency(route.revenue)}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:bg-indigo-500/20" onClick={() => openDealLaunchpad(route)}>
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            Lançar Oferta
                          </Button>
                          <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5" onClick={() => copyCampaignBrief(route)}>
                            <Copy className="mr-2 h-3.5 w-3.5" />
                            Briefing
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-5 text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Recent Victories</h3>
                <div className="space-y-3">
                  {data.recentWins.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/5 bg-white/5 p-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      Aguardando Novas Conversões
                    </p>
                  ) : (
                    data.recentWins.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 group-hover:bg-white/5 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-white opacity-80">{booking.route}</p>
                          <p className="mt-0.5 text-[9px] font-medium text-slate-500">{booking.contactEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">{formatCurrency(booking.totalPrice, booking.currency)}</p>
                          <p className="mt-0.5 text-[8px] font-black text-indigo-400/40 uppercase tracking-tighter">{formatMoment(booking.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">Action Playbooks</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Sugestões Operacionais baseadas em Inteligência Live
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {data.recommendedActions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/5 bg-white/5 p-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  Sem Pendências Estratégicas
                </div>
              ) : (
                data.recommendedActions.map((item) => {
                  const tone =
                    item.level === "critical"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                      : item.level === "attention"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

                  return (
                    <div key={item.id} className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 hover:bg-white/5 transition-colors">
                      <Badge className={`text-[8px] font-black uppercase tracking-[0.2em] rounded-md border ${tone}`}>{item.level}</Badge>
                      <p className="mt-3 text-sm font-bold text-white tracking-tight">{item.title}</p>
                      <p className="mt-2 text-xs text-slate-400 font-medium leading-relaxed">{item.description}</p>
                      <Button className="mt-5 w-full h-10 gap-2 rounded-xl border border-white/10 bg-white/5 text-[9px] font-black uppercase text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all" variant="ghost" onClick={() => runRecommendedAction(item.action)}>
                        {item.level === "growth" ? <TrendingUp className="h-3.5 w-3.5" /> : item.level === "attention" ? <Users className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
                        {item.actionLabel}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">Service Radar</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Atendimento Humano, Fila Live e Resgate de Jornadas (Escalation)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="rounded-[24px] border border-white/5 bg-slate-950/40 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Live Requests</p>
                    <p className="mt-1 text-3xl font-bold text-white font-display tracking-tight">{data.counters.liveRequests}</p>
                  </div>
                  <Button size="sm" className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20" onClick={() => onOpenLiveDesk()}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Desk
                  </Button>
                </div>
                <div className="space-y-3">
                  {data.liveRequests.length === 0 ? (
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic py-4">Fila de Espera Vazia</p>
                  ) : (
                    data.liveRequests.map((session) => (
                      <div key={session.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-white opacity-90">
                              {session.customerName || session.customerEmail || `Visitor ${session.id}`}
                            </p>
                            <p className="mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              {session.language?.toUpperCase() || "PT"} · {formatMoment(session.createdAt)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white/5 border border-white/5 text-slate-400">{session.status}</Badge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-9 px-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:bg-indigo-500/20"
                            disabled={acceptLiveMutation.isPending}
                            onClick={() => acceptLiveMutation.mutate(session.id)}
                          >
                            {acceptLiveMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-9 w-9 p-0 rounded-xl border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={() => onOpenLiveDesk({ sessionId: session.id })}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/5 bg-slate-950/40 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-rose-500/60">Service Rescue</p>
                    <p className="mt-1 text-3xl font-bold text-rose-400 font-display tracking-tight">{data.counters.openEscalations}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">
                      {data.counters.activeLiveSessions} Active Sessions
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {data.escalations.length === 0 ? (
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic py-4 text-center">Nenhuma Escalada Pendente</p>
                  ) : (
                    data.escalations.map((escalation) => (
                      <div key={escalation.id} className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{escalation.reason}</p>
                            <p className="mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              {escalation.type} · {formatMoment(escalation.createdAt)}
                            </p>
                            {escalation.summary && <p className="mt-2 text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-2">"{escalation.summary}"</p>}
                          </div>
                          <Badge className="border border-rose-500/40 bg-rose-500/20 text-rose-300 text-[8px] font-black uppercase tracking-widest rounded-md">{escalation.status}</Badge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-9 px-4 rounded-xl border border-rose-500/10 bg-rose-500/10 text-[9px] font-black uppercase tracking-widest text-rose-300 hover:bg-rose-500/20"
                            disabled={resolveEscalationMutation.isPending}
                            onClick={() => resolveEscalationMutation.mutate(escalation.id)}
                          >
                            {resolveEscalationMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                            Resolve
                          </Button>
                          {escalation.customerPhone && (
                            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl border border-white/5 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => openPhone(escalation.customerPhone)}>
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="client-inbox-relay" className="glass-card border-white/5 shadow-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-start justify-between gap-4 p-8 border-b border-white/5">
              <div>
                <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">Client Inbox Relay</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Atendimento Multicanal com Macros, Empatia e Escalada Imediata
                </CardDescription>
              </div>
              <Badge className="border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-black px-3 py-1 rounded-full uppercase tracking-widest text-[9px]">
                {data.counters.unreadInboxMessages} Unread
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-0 lg:grid-cols-[280px,1fr] min-h-[500px]">
                {/* Sidebar - Thread List */}
                <div className="border-r border-white/5 bg-slate-950/20 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {threads.length === 0 ? (
                    <div className="p-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      Nenhuma Conversa Detectada
                    </div>
                  ) : (
                    threads.slice(0, 15).map((thread) => {
                      const unreadCount = Number(thread.unreadCount || 0);
                      const isActive = thread.id === selectedThreadId;
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => setSelectedThreadId(thread.id)}
                          className={`w-full p-5 text-left transition-all relative border-b border-white/[0.03] ${
                            isActive
                              ? "bg-indigo-500/10"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                          <div className="flex items-start justify-between gap-2">
                            <p className={`line-clamp-2 text-xs font-bold ${isActive ? "text-white" : "text-slate-300"}`}>{thread.subject}</p>
                            {unreadCount > 0 && (
                              <Badge className="border-0 bg-indigo-600 text-white text-[8px] font-black h-4 min-w-4 p-0 flex items-center justify-center rounded-full">{unreadCount}</Badge>
                            )}
                          </div>
                          <p className="mt-1.5 text-[10px] font-medium text-slate-500 italic">
                            {thread.userName || thread.userEmail || `User ${thread.userId}`}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{thread.status}</span>
                            <span className="text-[8px] font-bold text-slate-600">{formatMoment(thread.lastMessageAt)}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Chat Area */}
                <div className="bg-slate-900/40 flex flex-col h-full max-h-[600px]">
                  {!selectedThread ? (
                    <div className="flex flex-1 items-center justify-center p-10">
                      <div className="text-center">
                        <MessageSquare className="h-10 w-10 text-slate-800 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Selecione uma transmissão para iniciar o relay</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      {/* Thread Header */}
                      <div className="p-6 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-white tracking-tight">{selectedThread.subject}</p>
                          <p className="text-[10px] font-bold text-indigo-400 opacity-60 uppercase tracking-widest mt-1">
                            {selectedThread.userName || selectedThread.userEmail || `ID: ${selectedThread.userId}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {selectedThread.userEmail && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-10 w-10 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                              onClick={() => openEmail(selectedThread.userEmail)}
                            >
                              <Mail className="h-4.5 w-4.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Messages Flow */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20 shadow-inner">
                        {threadMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 opacity-20">
                             <Loader2 className="h-6 w-6 animate-spin mb-3" />
                             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Carregando Histórico...</p>
                          </div>
                        ) : (
                          threadMessages.map((message) => {
                            const isAdmin = message.senderRole === "admin";
                            return (
                              <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-3xl px-5 py-3 text-sm relative group/msg ${
                                  isAdmin
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 rounded-tr-none"
                                    : "bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-none backdrop-blur-sm"
                                }`}>
                                  <p className="font-medium leading-relaxed">{message.content}</p>
                                  <p className={`mt-2 text-[8px] font-black uppercase tracking-widest opacity-40 ${isAdmin ? "text-indigo-200" : "text-slate-400"}`}>
                                    {format(new Date(message.createdAt), "HH:mm")}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Input Area */}
                      <div className="p-6 bg-slate-950/40 border-t border-white/5">
                        <div className="mb-4 flex flex-wrap gap-2">
                          {replyMacros.map((macro) => (
                            <Button
                              key={macro.label}
                              size="sm"
                              variant="secondary"
                              className="h-8 px-4 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                              onClick={() => setReplyText(macro.create(selectedThread.userName))}
                            >
                              {macro.label}
                            </Button>
                          ))}
                        </div>
                        <div className="flex gap-3">
                          <Input
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Responda como Michels Travel Intelligence..."
                            className="flex-1 h-12 bg-slate-950/60 border-white/10 text-white font-medium rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey && replyText.trim() && selectedThreadId) {
                                event.preventDefault();
                                replyMutation.mutate({ threadId: selectedThreadId, content: replyText.trim() });
                              }
                            }}
                          />
                          <Button
                            className="h-12 px-6 gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                            disabled={!replyText.trim() || !selectedThreadId || replyMutation.isPending}
                            onClick={() => {
                              if (!selectedThreadId || !replyText.trim()) return;
                              replyMutation.mutate({ threadId: selectedThreadId, content: replyText.trim() });
                            }}
                          >
                            {replyMutation.isPending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
                            Relay
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(dealDraft)} onOpenChange={(open) => { if (!open) setDealDraft(null); }}>
        <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col bg-slate-900/95 backdrop-blur-3xl border border-white/5 shadow-3xl rounded-[32px] ring-0 p-0">
          <DialogHeader className="p-6 border-b border-white/5">
            <DialogTitle className="text-2xl font-black text-white font-display tracking-tight">Growth Launchpad</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Publicação de Ofertas Estratégicas Baseada em Demanda Live
            </DialogDescription>
          </DialogHeader>

          {dealDraft && (
            <div className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="rounded-[24px] border border-indigo-500/20 bg-indigo-500/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all border-glow-indigo">
                <div className="flex-1">
                  <p className="font-black uppercase text-[10px] tracking-[0.2em] text-indigo-400">Curadoria de Inteligência</p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Configure os parâmetros abaixo para buscar tarifas em tempo real e pré-preencher a oferta estratégica.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                  disabled={dealSearchLoading || !dealDraft?.origin || !dealDraft?.destination}
                  onClick={async () => {
                    if (!dealDraft?.origin || !dealDraft?.destination) return;
                    setDealSearchLoading(true);
                    setDealSearchError(null);
                    setDealOffers([]);
                    try {
                      const date = dealSearchParams.departureDate
                        ? new Date(dealSearchParams.departureDate)
                        : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })();
                      const dateStr = date.toISOString().slice(0, 10);
                      const returnStr = dealSearchParams.tripType === "round-trip" && dealSearchParams.returnDate
                        ? dealSearchParams.returnDate
                        : "";
                      const qs = new URLSearchParams({
                        origin: dealDraft.origin,
                        destination: dealDraft.destination,
                        date: dateStr,
                        returnDate: returnStr,
                        passengers: (
                          (parseInt(dealSearchParams.adults, 10) || 0) +
                          (parseInt(dealSearchParams.children, 10) || 0) +
                          (parseInt(dealSearchParams.infants, 10) || 0) ||
                          1
                        ).toString(),
                        adults: dealSearchParams.adults,
                        children: dealSearchParams.children,
                        infants: dealSearchParams.infants,
                        cabinClass: dealSearchParams.cabinClass || dealDraft?.cabinClass || "economy",
                        tripType: dealSearchParams.tripType,
                      });
                      const res = await fetch(`/api/flights/search?${qs.toString()}`);
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      const json = await res.json();
                      const offers: DealSearchOffer[] = (json || []).slice(0, 8).map((f: any) => ({
                        id: f.id,
                        airline: f.airline || f.owner?.name,
                        price: f.price,
                        currency: f.currency || "USD",
                        departureTime: f.departureTime,
                        origin: f.originCode || f.origin,
                        destination: f.destinationCode || f.destination,
                      }));
                      setDealOffers(offers);
                      if (offers.length > 0) {
                        const best = offers[0];
                        setDealDraft((current) =>
                          current
                            ? {
                                ...current,
                                price: best.price ? String(best.price) : current.price,
                                currency: best.currency || current.currency,
                                headline: `${best.airline || "Oferta"} ${best.origin} → ${best.destination} desde ${best.currency || "USD"} ${best.price ?? ""}`,
                                stops: 0,
                                duration: "Varia",
                              }
                            : current,
                        );
                      }
                    } catch (err: any) {
                      setDealSearchError(err.message || "Falha ao buscar tarifas");
                    } finally {
                      setDealSearchLoading(false);
                    }
                  }}
                >
                  {dealSearchLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Scanner Providores
                </Button>
              </div>

              {dealSearchError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[10px] font-black uppercase text-rose-400">
                  {dealSearchError}
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Missão</Label>
                  <select
                    className="w-full h-11 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white font-medium focus:border-indigo-500/50 outline-none"
                    value={dealSearchParams.tripType}
                    onChange={(e) => setDealSearchParams((s) => ({ ...s, tripType: e.target.value }))}
                  >
                    <option value="one-way">Só Ida</option>
                    <option value="round-trip">Ida e Volta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Janela de Ida</Label>
                  <Input
                    type="date"
                    className="h-11 bg-slate-950/60 border-white/10 text-white font-medium rounded-xl"
                    value={dealSearchParams.departureDate}
                    onChange={(e) => setDealSearchParams((s) => ({ ...s, departureDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Janela de Volta</Label>
                  <Input
                    type="date"
                    className="h-11 bg-slate-950/60 border-white/10 text-white font-medium rounded-xl disabled:opacity-30"
                    disabled={dealSearchParams.tripType !== "round-trip"}
                    value={dealSearchParams.returnDate}
                    onChange={(e) => setDealSearchParams((s) => ({ ...s, returnDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cabine Operacional</Label>
                  <select
                    className="w-full h-11 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white font-medium focus:border-indigo-500/50 outline-none"
                    value={dealSearchParams.cabinClass}
                    onChange={(e) => setDealSearchParams((s) => ({ ...s, cabinClass: e.target.value }))}
                  >
                    <option value="economy">Economy</option>
                    <option value="premium_economy">P. Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adultos</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-11 bg-slate-950/60 border-white/10 text-white font-medium rounded-xl"
                    value={dealSearchParams.adults}
                    onChange={(e) => setDealSearchParams((s) => ({ ...s, adults: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Crianças</Label>
                  <Input
                    type="number"
                    min={0}
                    className="h-11 bg-slate-950/60 border-white/10 text-white font-medium rounded-xl"
                    value={dealSearchParams.children}
                    onChange={(e) => setDealSearchParams((s) => ({ ...s, children: e.target.value }))}
                  />
                </div>
              </div>

              {dealOffers.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inteligência de Mercado:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dealOffers.map((offer) => {
                      const isSelected = dealDraft?.price === String(offer.price) && 
                                        dealDraft?.airline === offer.airline;
                      return (
                        <button
                          key={offer.id}
                          type="button"
                          className={`rounded-2xl border p-5 text-left transition-all group/offer ${
                            isSelected 
                              ? "bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10" 
                              : "border-white/5 bg-slate-950/60 hover:bg-indigo-500/10 hover:border-indigo-500/30"
                          }`}
                          onClick={() => {
                            setDealDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    origin: offer.origin || current.origin,
                                    destination: offer.destination || current.destination,
                                    price: offer.price ? String(offer.price) : current.price,
                                    currency: offer.currency || current.currency,
                                    airline: offer.airline || current.airline,
                                    headline: `${offer.airline || "Tarifa Especial"} ${offer.origin} → ${offer.destination}`,
                                    description: `Voo operado por ${offer.airline || "Parceiro"} a partir de ${offer.currency || "USD"} ${offer.price ?? ""}. Curadoria premium em classe ${current.cabinClass || "economy"}.`,
                                    stops: 0,
                                    duration: "Varia",
                                  }
                                : current,
                            );
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {isSelected && <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />}
                              <div>
                                <p className={`text-sm font-black tracking-tight ${isSelected ? "text-white" : "text-white/90"}`}>
                                  {offer.origin} → {offer.destination}
                                </p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-widest">{offer.airline || "—"}</p>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className={`text-sm font-black font-display ${isSelected ? "text-indigo-400" : "text-slate-300"}`}>
                                 {offer.currency || "USD"} {offer.price ?? "—"}
                               </p>
                               <p className="text-[8px] font-bold text-slate-600 uppercase">Live Rate</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Origem (IATA)</Label>
                  <Input value={dealDraft.origin} className="h-11 bg-slate-950/60 border-white/10 text-white font-black uppercase rounded-xl" onChange={(event) => setDealDraft((current) => current ? { ...current, origin: event.target.value.toUpperCase() } : current)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Destino (IATA)</Label>
                  <Input value={dealDraft.destination} className="h-11 bg-slate-950/60 border-white/10 text-white font-black uppercase rounded-xl" onChange={(event) => setDealDraft((current) => current ? { ...current, destination: event.target.value.toUpperCase() } : current)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade Origem</Label>
                  <Input value={dealDraft.originCity} className="h-11 bg-slate-950/60 border-white/10 text-white font-medium rounded-xl" onChange={(event) => setDealDraft((current) => current ? { ...current, originCity: event.target.value } : current)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade Destino</Label>
                  <Input value={dealDraft.destinationCity} className="h-11 bg-slate-950/60 border-white/10 text-white font-medium rounded-xl" onChange={(event) => setDealDraft((current) => current ? { ...current, destinationCity: event.target.value } : current)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tarifa Sugerida</Label>
                  <Input value={dealDraft.price} placeholder="599.00" className="h-11 bg-slate-950/60 border-white/10 text-indigo-400 font-black text-lg rounded-xl" onChange={(event) => setDealDraft((current) => current ? { ...current, price: event.target.value } : current)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Moeda ISO</Label>
                  <Input value={dealDraft.currency} className="h-11 bg-slate-950/60 border-white/10 text-white font-black uppercase rounded-xl" onChange={(event) => setDealDraft((current) => current ? { ...current, currency: event.target.value.toUpperCase() } : current)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Escalas</Label>
                  <Input 
                    type="number"
                    min={0}
                    value={dealDraft.stops} 
                    className="h-11 bg-slate-950/60 border-white/10 text-white font-bold rounded-xl" 
                    onChange={(event) => setDealDraft((current) => current ? { ...current, stops: parseInt(event.target.value, 10) || 0 } : current)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duração</Label>
                  <Input 
                    value={dealDraft.duration} 
                    placeholder="10h 30m"
                    className="h-11 bg-slate-950/60 border-white/10 text-white font-bold rounded-xl" 
                    onChange={(event) => setDealDraft((current) => current ? { ...current, duration: event.target.value } : current)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Headline Publicitária</Label>
                <Input 
                   value={dealDraft?.headline || ""} 
                   className="h-11 bg-slate-950/60 border-white/10 text-white font-bold rounded-xl placeholder:text-slate-700"
                   onChange={(event) => setDealDraft((current) => current ? { ...current, headline: event.target.value } : current)} 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Narrativa da Oferta</Label>
                <Textarea
                  rows={4}
                  className="resize-none bg-slate-950/60 border-white/10 text-white font-medium rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700 custom-scrollbar"
                  value={dealDraft?.description || ""}
                  onChange={(event) => setDealDraft((current) => current ? { ...current, description: event.target.value } : current)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="p-6 md:p-8 border-t border-white/5 bg-slate-950/60 mt-auto">
            <Button variant="secondary" className="h-12 px-6 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/10 transition-all" onClick={() => setDealDraft(null)}>
              Abortar Missão
            </Button>
            <Button
              className="h-12 px-8 gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
              disabled={!dealDraft || !dealDraft?.origin || !dealDraft?.destination || createDealMutation.isPending}
              onClick={() => {
                if (!dealDraft) return;
                createDealMutation.mutate(dealDraft);
              }}
            >
              {createDealMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-cyan-400" />}
              Lançar Oferta no Radar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
