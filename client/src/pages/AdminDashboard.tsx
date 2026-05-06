import { useAdminStats, useAllBookings, useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart
} from 'recharts';
import { 
  Loader2, DollarSign, Users, Plane, TrendingUp, ShieldCheck, ToggleRight, 
  Save, LogOut, MessageSquare, AlertTriangle, CheckCircle2, XCircle, 
  Phone, Megaphone, Plus, Trash2, ExternalLink, Copy, Search, RefreshCw, 
  ChevronDown, ChevronUp, Calendar, MapPin, LayoutDashboard, Settings, 
  Activity, Eye, EyeOff, Download, Upload, Zap, Clock, AlertCircle,
  Smartphone, BookOpen, ShieldAlert, ToggleLeft, CheckCircle
} from "lucide-react";
import { VoiceEscalations } from "@/components/VoiceEscalations";
import { AdminCommandCenter } from "@/components/AdminCommandCenter";
import { SeniorCareDesk } from "@/components/SeniorCareDesk";
import { useI18n } from "@/lib/i18n";
import { AdminKnowledgeHub } from "@/components/AdminKnowledgeHub";
import { AdminCustomerInsights } from "@/components/AdminCustomerInsights";
import { MobileConfigurator } from "@/components/MobileConfigurator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, Fragment } from "react";
import { AdStudio } from "@/components/AdStudio";
import { TestModeControl } from "@/components/TestModeControl";
import { CommissionControl } from "@/components/CommissionControl";
import { FeaturedDealsManager } from "@/components/FeaturedDealsManager";
import { DocumentScannerForm } from "@/components/document/DocumentScannerForm";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter 
} from "@/components/ui/alert-dialog";

// ============================================================================
// AUXILIARY COMPONENTS
// ============================================================================

function AutoFitText({ children, className, minFontSize = 12, maxFontSize = 40, ...props }: any) {
  return (
    <div className={className} style={{ fontSize: `${maxFontSize}px` }} {...props}>
      {children}
    </div>
  );
}

// Mobile Release Controls (Placeholder for future expansion)
function MobileAppChannelControl() { return null; }
function MobileAppReleaseControl() { return null; }

function AdminLoginForm() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <Card className="w-full max-w-md glass-card border-indigo-500/20">
        <CardContent className="p-12 text-center space-y-8">
           <div className="h-20 w-20 bg-indigo-500/20 rounded-3xl border border-indigo-500/30 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(99,102,241,0.2)]">
             <ShieldAlert className="h-10 w-10 text-indigo-400" />
           </div>
           <div className="space-y-2">
             <h2 className="text-3xl font-black text-white font-display tracking-tight">Sessão Expirada</h2>
             <p className="text-slate-500 text-sm">Autenticação de Concierge necessária para acessar este terminal.</p>
           </div>
           <Button onClick={() => setLocation("/")} className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all">
             Voltar ao Login Principal
           </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusDotColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'bg-emerald-400 text-emerald-400';
    case 'pending': return 'bg-amber-400 text-amber-400';
    case 'cancelled': return 'bg-rose-400 text-rose-400';
    default: return 'bg-gray-400';
  }
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: bookings } = useAllBookings();
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"command" | "overview" | "bookings" | "settings" | "senior" | "crm" | "kb" | "mobile" | "ads">("command");

  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const syncMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await apiRequest('POST', `/api/bookings/${bookingId}/sync`);
      return res.json();
    },
    onSuccess: (data, bookingId) => {
      qc.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      toast({
        title: "Sincronizado",
        description: data.synced ? `Reserva #${bookingId} sincronizada com sucesso` : `Reserva #${bookingId} - sem alteracoes`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
  };

  const openBookingsView = (options?: { status?: string; search?: string; bookingId?: string }) => {
    setActiveTab("bookings");
    setStatusFilter(options?.status ?? "all");
    setSearchQuery(options?.search ?? "");
    setExpandedBookingId(options?.bookingId ?? null);
  };

  const openSettingsView = () => {
    setActiveTab("settings");
  };

  if (adminCheckLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  if (!adminCheck?.isAdmin) {
    return <AdminLoginForm />;
  }

  if (statsLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  const filteredBookings = (bookings || []).filter((booking: any) => {
    const matchesSearch = searchQuery === "" || 
      booking.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.referenceCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(booking.id).includes(searchQuery);
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const chartData = stats?.dailyRevenue?.map((d) => ({
    date: d.date,
    revenue: d.revenue,
    commission: d.commission,
    bookings: d.bookings,
  })) || [];

  const statusBreakdown = stats?.statusBreakdown || {};
  const topRoutes = stats?.topRoutes || [];
  
  const activeTitle =
    activeTab === "command"
      ? "Painel Concierge Automático"
      : activeTab === "senior"
        ? "Suporte de Elite para a Melhor Idade"
        : activeTab === "overview"
          ? "Visão Global Executiva"
          : activeTab === "crm"
            ? "Inteligência de Clientes & Financeiro"
            : activeTab === "kb"
              ? "Central de Conhecimento (Treinar Mia)"
              : activeTab === "bookings"
                ? "Controle de Viagens Premium"
                : activeTab === "mobile"
                  ? "Configurador de Experiência Mobile (Samsung Preview)"
                  : activeTab === "ads"
                    ? "Estúdio Criativo de Marketing (Instagram/Facebook)"
                    : "Configurações Operacionais da Agência";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans selection:bg-indigo-500/30">
      {/* Sidebar Area - Floating Glass Panel */}
      <aside className="hidden md:flex w-64 lg:w-72 flex-col bg-slate-900/40 backdrop-blur-xl border-r border-white/5 z-20">
        <div className="p-4 md:p-8 border-b border-white/5 flex flex-col items-start relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <LayoutDashboard className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Michels Concierge</h2>
          <p className="text-[10px] text-indigo-300/60 tracking-[0.3em] uppercase font-bold mt-1.5 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
            Painel Executivo
          </p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "command" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("command")}
          >
            <ShieldCheck className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "command" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Painel Concierge</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "senior" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("senior")}
          >
            <Phone className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "senior" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Monitoramento Sênior</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "overview" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("overview")}
          >
            <TrendingUp className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "overview" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Inteligência Estratégica</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "bookings" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("bookings")}
          >
            <Plane className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "bookings" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Jornadas sob Curadoria</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "crm" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("crm")}
          >
            <Users className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "crm" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Clientes & CRM</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "kb" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("kb")}
          >
            <BookOpen className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "kb" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Treinamento (IA)</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "mobile" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("mobile")}
          >
            <Smartphone className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "mobile" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Canais do App Mobile</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "ads" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("ads")}
          >
            <Megaphone className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "ads" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Estúdio de Marketing</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "settings" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("settings")}
          >
            <Settings className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "settings" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Ajustes da Agência</span>
          </Button>
        </nav>
        
        <div className="p-4 md:p-6 border-t border-white/5">
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full justify-start gap-3.5 rounded-2xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all px-4 py-6 font-semibold"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Encerrar Sessão</span>
          </Button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Header - Glassmorphic Blur */}
        <header className="sticky top-0 z-10 flex h-[80px] items-center justify-between border-b border-white/5 bg-slate-900/20 px-6 backdrop-blur-xl md:px-12">
          <div className="flex min-w-0 items-center gap-4 md:hidden">
            <LayoutDashboard className="h-6 w-6 text-indigo-500" />
            <h1 className="text-xl font-bold font-display text-white tracking-tight">Concierge</h1>
          </div>
          
          <div className="hidden min-w-0 flex-1 md:flex md:max-w-[min(52vw,44rem)] md:flex-col">
            <AutoFitText
              as="h1"
              minFontSize={18}
              maxFontSize={34}
              maxLines={1}
              className="font-display font-bold tracking-tight text-white leading-tight"
            >
              {activeTitle}
            </AutoFitText>
            <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-[0.3em] mt-1.5">
              {t("admin.welcome")}. Visão atualizada
            </p>
          </div>
          
          <div className="flex min-w-0 items-center gap-3 md:gap-5">
            <div className="group hidden items-center rounded-2xl border border-white/5 bg-white/5 px-4 py-2 transition-all focus-within:border-indigo-500/50 lg:flex lg:min-w-[13rem] lg:max-w-[16rem] xl:min-w-[16rem]">
              <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Pesquisa rápida..." 
                className="w-full border-none bg-transparent px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-0"
              />
            </div>

            <Button 
              data-testid="button-admin-live-chat" 
              onClick={() => setLocation("/admin/live-chat")} 
              className="gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-6 font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all whitespace-nowrap hover:scale-[1.02] hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] sm:px-6"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Assistência ao Vivo</span>
            </Button>
            
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl h-11 w-11">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-none">
          <div className="mx-auto w-full max-w-[1920px] animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">

            {activeTab === "command" && (
              <div className="animate-in fade-in duration-300">
                <AdminCommandCenter
                onOpenLiveDesk={(options) =>
                  setLocation(options?.sessionId ? `/admin/live-chat?session=${options.sessionId}` : "/admin/live-chat")
                }
                onOpenBookings={openBookingsView}
                onOpenSettings={openSettingsView}
              />
              </div>
            )}

            {activeTab === "senior" && (
              <div className="animate-in fade-in duration-300">
                <SeniorCareDesk />
              </div>
            )}

            {activeTab === "crm" && (
              <div className="animate-in fade-in duration-300">
                <AdminCustomerInsights />
              </div>
            )}

            {activeTab === "kb" && (
              <div className="animate-in fade-in duration-300">
                <AdminKnowledgeHub />
              </div>
            )}

            {activeTab === "mobile" && (
              <div className="animate-in fade-in duration-300">
                <MobileConfigurator />
              </div>
            )}

            {activeTab === "ads" && (
              <div className="animate-in fade-in duration-300">
                <AdStudio />
              </div>
            )}

            {/* Vision Tab - Strategic Intelligence */}
            {activeTab === "overview" && (
              <div className="animate-in fade-in duration-300 space-y-8">
                {/* Stats Grid - Vision Pulse */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: t("admin.total_revenue"), value: `$${((stats as any)?.totalRevenue ?? 0).toLocaleString()}`, today: `$${((stats as any)?.revenueToday ?? 0).toLocaleString()}`, icon: DollarSign, color: "emerald", accent: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "bg-emerald-500/5", tid: "text-stat-revenue" },
                    { label: t("admin.commissions"), value: `$${((stats as any)?.totalCommission ?? 0).toLocaleString()}`, today: `7d: $${((stats as any)?.revenue7Days ?? 0).toLocaleString()}`, icon: TrendingUp, color: "indigo", accent: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "bg-indigo-500/5", tid: "text-stat-commission" },
                    { label: t("admin.total_bookings"), value: (stats as any)?.totalBookings ?? 0, today: `7d: ${(stats as any)?.bookings7Days ?? 0}`, icon: Plane, color: "cyan", accent: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "bg-cyan-500/5", tid: "text-stat-bookings" },
                    { label: "Vazão de Buscas", value: (stats as any)?.searchesToday ?? 0, today: `Live: ${(stats as any)?.recentSearches ?? 0}`, icon: Search, color: "amber", accent: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "bg-amber-500/5", tid: "text-stat-searches" }
                  ].map((stat) => (
                    <Card key={stat.label} className="glass-card border-white/5 shadow-2xl overflow-hidden group transition-all duration-500 hover:border-white/10">
                      <CardContent className="p-4 md:p-8 flex items-center justify-between gap-5 relative z-10">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.glow} blur-[40px] -mr-12 -mt-12 transition-opacity group-hover:opacity-100 opacity-50`} />
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 mb-4 group-hover:text-white transition-colors">{stat.label}</p>
                          <h3 className="text-4xl font-black text-white font-display tracking-tight leading-none" data-testid={stat.tid}>{stat.value}</h3>
                          <div className="mt-4 flex items-center gap-2">
                            <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${stat.bg} ${stat.accent} ${stat.border}`}>
                              {stat.today.includes('$') ? 'LIVE' : 'METRIC'}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.today}</span>
                          </div>
                        </div>
                        <div className={`h-12 md:h-14 w-14 rounded-2xl border ${stat.border} ${stat.bg} flex items-center justify-center ${stat.accent} shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                          <stat.icon className="h-7 w-7" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Revenue Chart - Midnight Performance */}
                  <Card className="lg:col-span-2 glass-card border-white/5 shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-indigo-400" />
                          <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">Performance de Receita & Comissões</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950/40 p-1 rounded-xl border border-white/5">
                           <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[10px] font-black text-indigo-400 bg-indigo-500/15 uppercase tracking-widest">30D</Button>
                           <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">Macro</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-10">
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700}} tickFormatter={(str) => str.slice(5)} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} tickFormatter={(value) => `$${value}`} />
                            <Tooltip 
                              cursor={{fill: 'rgba(255,255,255,0.03)'}}
                              contentStyle={{borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', color: '#ffffff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}} 
                              itemStyle={{fontSize: '11px', fontWeight: 'bold'}}
                              labelStyle={{fontSize: '10px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em'}}
                            />
                            <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} name="Receita" />
                            <Line type="monotone" dataKey="commission" stroke="#818cf8" strokeWidth={3} dot={{r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#1e293b'}} activeDot={{r: 6, stroke: '#818cf8', strokeWidth: 2, fill: '#ffffff'}} name="Comissão" />
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-8">
                    {/* Status Insights Card */}
                    <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
                      <CardHeader className="pb-3 border-b border-white/5">
                        <CardTitle className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 group-hover:text-cyan-400 transition-colors">Estado das Operações</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        {Object.entries(statusBreakdown).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 opacity-30">
                            <Activity className="h-8 w-8 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Monitorando Pulse...</p>
                          </div>
                        ) : (
                          Object.entries(statusBreakdown).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all group/stat">
                              <div className="flex items-center gap-3">
                                <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] transition-transform group-hover/stat:scale-125 ${getStatusDotColor(status)}`} />
                                <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{status}</span>
                              </div>
                              <span className="text-sm font-black text-white" data-testid={`text-status-count-${status}`}>{count as number}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* Hot Routes Card */}
                    <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
                      <CardHeader className="pb-3 border-b border-white/5">
                        <CardTitle className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 group-hover:text-indigo-400 transition-colors">Rotas de Elite</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        {topRoutes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 opacity-30">
                            <Plane className="h-8 w-8 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Aguardando Decolagem...</p>
                          </div>
                        ) : (
                          topRoutes.slice(0, 5).map((route: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-300 truncate tracking-tight">{route.route}</span>
                              </div>
                              <div className="text-right shrink-0 flex flex-col">
                                <span className="text-xs font-black text-white">{route.count}x</span>
                                <span className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-tighter">${parseFloat(route.revenue).toLocaleString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Recent Activity Feed - Elegant Glass Table */}
                <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                  <CardHeader className="border-b border-white/5 p-8 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">{t("admin.recent_bookings")}</CardTitle>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Transações de Alta Prioridade</p>
                    </div>
                    <Button variant="ghost" className="rounded-xl font-bold text-[10px] uppercase tracking-widest text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 px-5" onClick={() => setActiveTab("bookings")}>
                      Acessar Arquivo Glogal
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {bookings?.slice(0, 8).map((booking: any) => {
                        const flightOrigin = (booking.flightData as any)?.origin || '';
                        const flightDest = (booking.flightData as any)?.destination || '';
                        const routeLabel = flightOrigin && flightDest ? `${flightOrigin} → ${flightDest}` : 'Curadoria Manual';
                        return (
                          <div 
                            key={booking.id} 
                            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" 
                            data-testid={`card-recent-booking-${booking.id}`}
                            onClick={() => openBookingsView({ bookingId: booking.id })}
                          >
                            <div className="flex items-center gap-5">
                              <div className="h-12 w-12 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                                <Plane className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-black text-sm text-white opacity-90">{booking.contactEmail}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{routeLabel}</span>
                                  {booking.referenceCode && (
                                    <>
                                      <span className="text-slate-700">•</span>
                                      <span className="text-[10px] font-black text-indigo-400/60 font-mono tracking-tight uppercase">#{booking.referenceCode}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <p className="font-black text-base text-white font-display tracking-tight">${parseFloat(booking.totalPrice).toLocaleString()}</p>
                              <div className="flex gap-2">
                                <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border ${
                                  booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' :
                                  booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {booking.status}
                                </Badge>
                                {booking.ticketStatus && booking.ticketStatus !== 'pending' && (
                                  <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border ${
                                    booking.ticketStatus === 'issued' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                                    booking.ticketStatus === 'schedule_changed' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  }`}>
                                    {booking.ticketStatus}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!bookings?.length && <div className="py-20 text-center opacity-30 uppercase font-black tracking-widest text-[10px]">{t("admin.no_bookings")}</div>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bookings Tab - Advanced Journey Control */}
            {activeTab === "bookings" && (
              <div className="animate-in fade-in duration-300 space-y-8">
                <Card className="glass-card border-white/5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                  <CardHeader className="p-4 md:p-8 border-b border-white/5">
                    <CardTitle className="text-xl font-bold text-white font-display tracking-tight">Gerenciamento de Reservas</CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Arquivo Central de Operações</p>
                  </CardHeader>
                  <CardContent className="p-4 md:p-8 space-y-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <Input
                          data-testid="input-booking-search"
                          placeholder="Localizar por ID, Email ou Localizador..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-12 md:h-14 pl-14 bg-slate-950/40 border-white/5 text-white font-medium rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                        />
                      </div>
                      <div className="flex items-center gap-3 bg-slate-950/40 p-1.5 rounded-[20px] border border-white/5">
                        {[
                          { id: "all", label: "Global" },
                          { id: "pending", label: "Pendente" },
                          { id: "confirmed", label: "Sucesso" },
                          { id: "cancelled", label: "Retido" }
                        ].map((s) => (
                          <Button
                            key={s.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusFilter(s.id)}
                            className={`h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              statusFilter === s.id 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            {s.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/5 overflow-hidden bg-slate-950/20 shadow-inner">
                      <Table>
                        <TableHeader className="bg-slate-950/40 border-b border-white/5">
                          <TableRow className="border-0 hover:bg-transparent">
                            <TableHead className="w-[80px] text-[10px] h-12 md:h-14 uppercase tracking-widest font-black text-slate-500 px-8">REF ID</TableHead>
                            <TableHead className="text-[10px] h-12 md:h-14 uppercase tracking-widest font-black text-slate-500">Curadoria / Cliente</TableHead>
                            <TableHead className="text-[10px] h-12 md:h-14 uppercase tracking-widest font-black text-slate-500">Rota Estratégica</TableHead>
                            <TableHead className="text-right text-[10px] h-12 md:h-14 uppercase tracking-widest font-black text-slate-500">Investment</TableHead>
                            <TableHead className="text-[10px] h-12 md:h-14 uppercase tracking-widest font-black text-slate-500 text-center">Status</TableHead>
                            <TableHead className="w-[120px] text-[10px] h-12 md:h-14 uppercase tracking-widest font-black text-slate-500 text-right px-8">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBookings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-24">
                                <Activity className="h-10 w-10 text-slate-800 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Nenhuma jornada detectada</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredBookings.map((booking: any) => {
                              const flightOrigin = (booking.flightData as any)?.origin || '';
                              const flightDest = (booking.flightData as any)?.destination || '';
                              const routeLabel = flightOrigin && flightDest ? `${flightOrigin} → ${flightDest}` : '-';
                              const isExpanded = expandedBookingId === booking.id;

                              return (
                                <Fragment key={booking.id}>
                                  <TableRow 
                                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group/row ${isExpanded ? "bg-indigo-500/[0.03]" : ""}`} 
                                    onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                                  >
                                    <TableCell className="px-8 font-mono text-[10px] font-black text-slate-500 uppercase tracking-tighter">#{booking.id}</TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="text-sm font-bold text-white opacity-90">{booking.contactEmail}</p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">{booking.contactPhone || "No terminal phone"}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Plane className="h-3.5 w-3.5 text-indigo-400/60" />
                                        <span className="text-xs font-bold text-slate-300">{routeLabel}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <p className="text-sm font-black text-white font-display tracking-tight">${parseFloat(booking.totalPrice).toLocaleString()}</p>
                                      <p className="text-[9px] font-bold text-indigo-400/40 uppercase tracking-widest mt-0.5">Fee: ${booking.commissionAmount || '0.00'}</p>
                                    </TableCell>
                                    <TableCell className="text-center">
                                       <div className="flex flex-col items-center gap-1.5">
                                          <Badge className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-lg border ${
                                            booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' :
                                            booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                          }`}>
                                            {booking.status}
                                          </Badge>
                                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                            TK: {booking.ticketStatus || 'pending'}
                                          </span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            syncMutation.mutate(booking.id);
                                          }}
                                          className="h-9 w-9 rounded-xl border border-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all"
                                        >
                                          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                        </Button>
                                        <div className={`h-9 w-9 rounded-xl border border-white/5 flex items-center justify-center transition-all ${isExpanded ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 group-hover/row:text-slate-300 grow-hover/row:border-white/20"}`}>
                                           {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded && (
                                    <TableRow key={`${booking.id}-details`} className="bg-indigo-950/10 hover:bg-indigo-950/10 border-b border-white/5">
                                      <TableCell colSpan={6} className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in slide-in-from-top-2 duration-500">
                                          <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                              <MapPin className="h-3.5 w-3.5" /> Curadoria de Itinerário
                                            </h4>
                                            <div className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/5">
                                              <p className="text-xs text-slate-400 font-medium">Companhia: <span className="text-white font-bold">{(booking.flightData as any).airline || 'N/A'}</span></p>
                                              <p className="text-xs text-slate-400 font-medium">Equipamento/Voo: <span className="text-white font-bold">{(booking.flightData as any).flightNumber || 'N/A'}</span></p>
                                              <p className="text-xs text-slate-400 font-medium">Rota: <span className="text-white font-bold">{routeLabel}</span></p>
                                            </div>
                                          </div>
                                          <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                              <Calendar className="h-3.5 w-3.5" /> Referenciamento Global
                                            </h4>
                                            <div className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/5">
                                              <p className="text-xs text-slate-400 font-medium">Locator: <span className="text-indigo-400 font-mono font-bold tracking-tight uppercase">#{booking.referenceCode || '---'}</span></p>
                                              <p className="text-[10px] text-slate-500 font-mono break-all leading-tight opacity-40">Duffel-X: {booking.duffelOrderId || 'Untracked'}</p>
                                              {booking.ticketNumber && <p className="text-xs text-slate-400 font-medium">ETKT/DOC: <span className="text-white font-mono">{booking.ticketNumber}</span></p>}
                                              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">{booking.createdAt && format(parseISO(booking.createdAt), 'PPPP')}</p>
                                            </div>
                                          </div>
                                          <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                              <Users className="h-3.5 w-3.5" /> Manifesto de Passageiros
                                            </h4>
                                            <div className="space-y-3">
                                              {Array.isArray(booking.passengerDetails) ? (
                                                (booking.passengerDetails as any[]).map((p: any, idx: number) => (
                                                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                     <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase">
                                                       {p.type?.[0]}
                                                     </div>
                                                     <p className="text-xs font-black text-white opacity-80 uppercase tracking-tight">
                                                       {p.firstName || p.given_name || ''} {p.lastName || p.family_name || ''}
                                                     </p>
                                                  </div>
                                                ))
                                              ) : (
                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center py-4 italic">Sem manifesto digital</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  </Fragment>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="animate-in fade-in duration-300 space-y-8">
                <TestModeControl />
                <CommissionControl />
                <FeaturedDealsManager />
                <VoiceEscalations />
                <Card className="glass-card border-white/5 overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] -mr-12 -mt-12 pointer-events-none" />
                  <CardHeader className="border-b border-white/5">
                    <CardTitle className="flex items-center gap-3 text-white font-display tracking-tight text-lg">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      Painel de Verificação de Identidade (TSA)
                    </CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Validação de Documentos e Biometria Digital</p>
                  </CardHeader>
                  <CardContent className="p-4 md:p-8 space-y-6">
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                       <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Utilize o motor de visão Mia para realizar OCR e validação de autenticidade em documentos de viagem. Esta ferramenta simula o processamento realizado no Terminal Sênior.
                      </p>
                    </div>
                    <DocumentScannerForm />
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
