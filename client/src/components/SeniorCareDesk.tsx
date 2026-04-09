import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mic, HeartHandshake, AlertCircle, ShieldCheck, Activity, RefreshCw, Loader2, CheckCircle2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNowStrict } from "date-fns";

type SeniorSession = {
  id: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  status: string;
  bookingStatus?: string | null;
  language?: string | null;
  createdAt?: string | null;
};

type SeniorAlert = {
  id: number;
  userId: string | null;
  bookingId?: number | null;
  type: string;
  status: string;
  message?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
};

type VoiceLog = {
  id: number;
  sessionId: number;
  role: string;
  content: string;
  createdAt: string;
  customerName?: string | null;
};

type SeniorCareData = {
  seniorSessions: SeniorSession[];
  alerts: SeniorAlert[];
  voiceLogs: VoiceLog[];
  summary: {
    totalSeniorSessions: number;
    pendingAlerts: number;
    inProgressAlerts: number;
  };
};

function alertTypeLabel(type: string) {
  switch (type) {
    case "panic_button": return "Botão de Pânico";
    case "confusion_detected": return "Confusão Detectada";
    case "connection_risk": return "Risco de Conexão";
    case "gate_change": return "Mudança de Portão";
    default: return type;
  }
}

function alertTypeBadge(type: string) {
  switch (type) {
    case "panic_button": return "border-red-200 bg-red-50 text-red-700";
    case "confusion_detected": return "border-amber-200 bg-amber-50 text-amber-700";
    case "connection_risk": return "border-orange-200 bg-orange-50 text-orange-700";
    case "gate_change": return "border-blue-200 bg-blue-50 text-blue-700";
    default: return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function sessionStatusBadge(status: string) {
  switch (status) {
    case "active": return "bg-emerald-500 text-white";
    case "requested": return "bg-amber-500 text-white";
    case "closed": return "border-gray-200 bg-gray-100 text-gray-600";
    default: return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function timeSince(ts?: string | null) {
  if (!ts) return "agora";
  try {
    return formatDistanceToNowStrict(new Date(ts), { addSuffix: true });
  } catch {
    return "";
  }
}

export function SeniorCareDesk() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<SeniorCareData>({
    queryKey: ["/api/admin/senior-care"],
    queryFn: async () => {
      const res = await fetch("/api/admin/senior-care", { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar dados do Senior Care");
      return res.json();
    },
    refetchInterval: 20000,
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await fetch(`/api/admin/senior-alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "resolved" }),
      });
      if (!res.ok) throw new Error("Falha ao resolver alerta");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/senior-care"] });
      toast({ title: "Alerta resolvido", description: "O alerta foi marcado como resolvido." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const inProgressMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await fetch(`/api/admin/senior-alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "in_progress" }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar alerta");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/senior-care"] });
      toast({ title: "Em atendimento", description: "Alerta marcado como em andamento." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="bg-rose-500/10 border border-rose-500/30 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-10 text-center space-y-4">
          <div className="h-16 w-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <p className="text-white font-bold text-xl">Command Center Offline</p>
          <div className="text-xs text-rose-400 font-mono bg-slate-950/50 p-4 rounded-2xl border border-rose-500/10 max-w-lg mx-auto">
            {isError && (data as any)?.details ? (data as any).details : "Falha crítica na conexão com o banco de dados do Senior Care."}
          </div>
          <Button variant="outline" onClick={() => refetch()} className="border-white/10 text-white hover:bg-white/5 rounded-2xl gap-2 mt-4">
            <RefreshCw className="h-4 w-4" /> Reiniciar Sistemas
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { seniorSessions, alerts, summary } = data;

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Sessões Ativas", value: summary.totalSeniorSessions, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Alertas Pendentes", value: summary.pendingAlerts, icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10", glow: "shadow-[0_0_20px_rgba(244,63,94,0.3)]" },
          { label: "Em Atendimento", value: summary.inProgressAlerts, icon: Phone, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <Card key={i} className={`bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl rounded-3xl p-6 ${stat.glow || ''}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <div className={`p-2.5 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-4xl font-bold font-display tracking-tight ${stat.color === 'text-rose-400' ? 'text-white' : 'text-white'}`}>{stat.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Alerts and Sessions */}
        <div className="lg:col-span-12 space-y-8">
          
          {/* Assistência Prioritária */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                Intervenções Prioritárias
              </h3>
              <Badge className="bg-slate-800 text-slate-400 border-white/5 py-1 px-3">Últimas 48 Horas</Badge>
            </div>

            {alerts.length === 0 ? (
              <Card className="bg-slate-900/40 backdrop-blur-md border-emerald-500/20 rounded-3xl p-10 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-70" />
                <p className="text-white font-bold text-lg">Todos os clientes seniores estão seguros.</p>
                <p className="text-slate-500 text-sm mt-1">Sistemas de monitoramento ativo operando normalmente.</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {alerts.map((alert) => (
                  <Card 
                    key={alert.id}
                    className={`bg-slate-900/60 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 group ${alert.status === 'pending' ? 'ring-1 ring-rose-500/30' : 'border-amber-500/20'}`}
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <Badge className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-tighter ${alertTypeBadge(alert.type)}`}>
                            {alertTypeLabel(alert.type)}
                          </Badge>
                          <h4 className="text-white font-bold group-hover:text-indigo-300 transition-colors">
                            {alert.message || "Ação requerida imediata"}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{timeSince(alert.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users className="h-3.5 w-3.5" />
                          <span>#{alert.userId?.slice(0, 8) || "GUEST"}</span>
                        </div>
                        {alert.bookingId && (
                           <div className="flex items-center gap-1.5 text-indigo-400">
                             <Activity className="h-3.5 w-3.5" />
                             <span>Reserva #{alert.bookingId}</span>
                           </div>
                        )}
                      </div>

                      <div className="pt-2 flex gap-3">
                        {alert.status === 'pending' ? (
                          <Button
                            onClick={() => inProgressMutation.mutate(alert.id)}
                            disabled={inProgressMutation.isPending}
                            className="flex-1 bg-white text-slate-950 hover:bg-slate-200 rounded-2xl font-bold text-xs uppercase tracking-widest py-5"
                          >
                            {inProgressMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4 mr-2" />}
                            Atender Agora
                          </Button>
                        ) : (
                          <div className="flex-1 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 flex items-center justify-center font-bold text-[10px] uppercase tracking-widest">
                            <Activity className="h-3.5 w-3.5 mr-2 animate-pulse" />
                            Operador Atuando
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                          className="bg-slate-950/50 text-slate-400 hover:text-white rounded-2xl px-5 border border-white/5"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Voice Feed */}
        <Card className="lg:col-span-8 bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-2xl h-[500px] flex flex-col">
          <CardHeader className="bg-slate-950/30 border-b border-white/5 flex flex-row items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Mic className="h-5 w-5 text-indigo-400" />
                <div className="absolute top-0 right-0 h-2 w-2 bg-indigo-500 rounded-full animate-ping" />
              </div>
              <CardTitle className="text-white font-bold text-lg tracking-tight">Audio AI Live Feed</CardTitle>
            </div>
            <Badge className="bg-slate-950 border-white/10 text-slate-500 text-[10px] uppercase tracking-widest font-black">Voice Engine 4.0</Badge>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-950/20">
            {data.voiceLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                <Activity className="h-10 w-10 mb-4" />
                <p className="font-bold uppercase tracking-widest text-[10px]">Aguardando conexões neurais...</p>
              </div>
            ) : (
              data.voiceLogs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start group">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all duration-300 ${log.role === 'mia_voice' ? 'bg-indigo-500/20 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-800 border-white/5 shadow-inner'}`}>
                    {log.role === 'mia_voice' ? <Activity className="h-4 w-4 text-indigo-400" /> : <Users className="h-4 w-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${log.role === 'mia_voice' ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {log.role === 'mia_voice' ? "MIA ANALYTICS" : (log.customerName || "VIRTUAL AGENT")}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 font-mono">{timeSince(log.createdAt)}</span>
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg transition-transform group-hover:scale-[1.005] ${log.role === 'mia_voice' ? 'bg-indigo-600 text-white font-medium rounded-tl-none ring-1 ring-white/10' : 'bg-slate-900/80 border border-white/5 text-slate-200 rounded-tr-none'}`}>
                      {log.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Panel: Operations Info */}
        <Card className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-2xl h-[500px] flex flex-col group">
          <CardHeader className="bg-slate-950/30 border-b border-white/5 py-5">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-white font-bold text-lg tracking-tight">Status Operacional</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Conexões Ativas</p>
              {seniorSessions.length === 0 ? (
                <div className="bg-slate-950/30 rounded-2xl p-6 text-center border border-white/5">
                  <p className="text-slate-600 text-xs font-bold italic">Sem sessões remotas abertas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {seniorSessions.map((session) => (
                    <div key={session.id} className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all cursor-pointer group/item">
                       <div className="flex justify-between items-center mb-1">
                         <span className="text-white font-bold text-sm tracking-tight">{session.customerName || `Terminal #${session.id}`}</span>
                         <div className={`h-2 w-2 rounded-full ${session.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold mb-3">{session.customerPhone || "Sem contato vinculado"}</p>
                       <div className="flex gap-2">
                         <Button size="icon" className="h-8 w-8 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 rounded-lg">
                           <Phone className="h-3.5 w-3.5" />
                         </Button>
                         <Button 
                           onClick={() => window.open(`/admin/live-chat?session=${session.id}`, '_blank')}
                           className="h-8 flex-1 bg-white text-slate-950 hover:bg-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                          >
                           Sincronizar
                         </Button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-3">
               <div className="flex items-center gap-2 text-indigo-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Protocolos Concierge</span>
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                 Todos os atendimentos sênior são gravados localmente. O suporte via voz prioriza clareza e paciência. Utilize o botão de sincronização para assumir o chat em tempo real.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
