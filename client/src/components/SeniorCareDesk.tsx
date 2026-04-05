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
  userId: string;
  bookingId?: number | null;
  type: string;
  status: string;
  message?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
};

type SeniorCareData = {
  seniorSessions: SeniorSession[];
  alerts: SeniorAlert[];
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
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 font-medium">Não foi possível carregar o Senior Care Desk.</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { seniorSessions, alerts, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="overflow-hidden border border-violet-200 shadow-sm">
        <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-950 via-violet-900 to-indigo-900 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-white/20 bg-white/10 text-white">Senior Care</Badge>
                <Badge className="border border-white/10 bg-white/5 text-white/80">Ao vivo</Badge>
              </div>
              <CardTitle className="mt-4 text-3xl font-bold tracking-tight text-white">
                Concierge Sênior e Suporte VIP
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-white/75">
                Monitoramento real de sessões sênior ativas e alertas de assistência. Dados atualizados a cada 20 segundos.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-center">
                <p className="text-xs text-white/60 uppercase tracking-widest">Sessões Ativas</p>
                <p className="text-2xl font-bold text-white">{summary.totalSeniorSessions}</p>
              </div>
              <div className="rounded-2xl border border-red-300/40 bg-red-500/20 px-4 py-2 text-center">
                <p className="text-xs text-white/60 uppercase tracking-widest">Alertas Pendentes</p>
                <p className="text-2xl font-bold text-red-200">{summary.pendingAlerts}</p>
              </div>
              <div className="rounded-2xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-center">
                <p className="text-xs text-white/60 uppercase tracking-widest">Em Atendimento</p>
                <p className="text-2xl font-bold text-amber-200">{summary.inProgressAlerts}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 self-center"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">

          {/* Alertas não resolvidos */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Alertas de Assistência (últimas 48h)
            </h3>

            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-emerald-700 font-semibold">Nenhum alerta pendente</p>
                <p className="text-sm text-emerald-600 mt-1">Todos os clientes sênior estão sendo atendidos ou não há alertas recentes.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-[20px] border p-5 shadow-sm ${alert.status === 'pending' ? 'border-red-200 bg-white' : 'border-amber-200 bg-amber-50'}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`border text-xs font-semibold ${alertTypeBadge(alert.type)}`}>
                            {alertTypeLabel(alert.type)}
                          </Badge>
                          <Badge className={`border text-xs ${alert.status === 'pending' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                            {alert.status === 'pending' ? 'Pendente' : 'Em Atendimento'}
                          </Badge>
                        </div>
                        {alert.message && (
                          <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          {timeSince(alert.createdAt)} · Usuário #{alert.userId.slice(0, 8)}
                          {alert.bookingId && ` · Reserva #${alert.bookingId}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {alert.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => inProgressMutation.mutate(alert.id)}
                          disabled={inProgressMutation.isPending}
                          className="gap-2 bg-amber-600 hover:bg-amber-700"
                        >
                          {inProgressMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}
                          Iniciar Atendimento
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveMutation.mutate(alert.id)}
                        disabled={resolveMutation.isPending}
                        className="gap-2"
                      >
                        {resolveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessões sênior ativas */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              Sessões Sênior Ativas
            </h3>

            {seniorSessions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-semibold">Nenhuma sessão sênior ativa no momento</p>
                <p className="text-sm text-slate-500 mt-1">As sessões aparecerão aqui quando clientes seniores iniciarem uma sessão de suporte.</p>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {seniorSessions.map((session) => (
                  <div key={session.id} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-900">
                            {session.customerName || `Sessão #${session.id}`}
                          </p>
                          <Badge className={`text-xs font-bold ${sessionStatusBadge(session.status)}`}>
                            {session.status === 'active' ? 'Ativo' : session.status === 'requested' ? 'Aguardando' : session.status}
                          </Badge>
                        </div>
                        {session.customerPhone && (
                          <p className="mt-1 text-sm text-slate-500">
                            Tel: {session.customerPhone}
                          </p>
                        )}
                        {session.customerEmail && (
                          <p className="text-sm text-slate-500">{session.customerEmail}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          Iniciado {timeSince(session.createdAt)}
                          {session.language && ` · Idioma: ${session.language.toUpperCase()}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {session.customerPhone && (
                        <Button
                          size="sm"
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => window.location.href = `tel:${session.customerPhone!.replace(/\D/g, '')}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Ligar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => window.open(`/admin/live-chat?session=${session.id}`, '_blank')}
                      >
                        <HeartHandshake className="h-3.5 w-3.5" />
                        Abrir Sessão
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
