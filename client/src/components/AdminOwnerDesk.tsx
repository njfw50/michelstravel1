import { type ReactNode, useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowRight,
  Flame,
  Headphones,
  Mail,
  MessageSquare,
  Phone,
  ScanLine,
  Wallet,
  BellRing,
  Users,
  Sparkles,
  // LEI 6: Smartphone removido para conformidade Web-Only.
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOwnerPushSubscription, subscribeOwnerPush } from "@/lib/ownerPush";
import type { AdminOwnerDeskData } from "@/hooks/use-admin";

type OwnerDeskCase = AdminOwnerDeskData["cases"][number];
type OwnerDeskAction = OwnerDeskCase["availableActions"][number];
type OwnerDeskAlert = AdminOwnerDeskData["alerts"][number];
type OwnerDeskFollowUp = AdminOwnerDeskData["followUps"][number];
type FilterKey = "all" | "hot" | "senior" | "payment" | "live";

const filterLabels: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "hot", label: "Quentes" },
  { key: "senior", label: "Senior" },
  { key: "payment", label: "Pagamento" },
  { key: "live", label: "Ao vivo" },
];

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatMoment(value?: string | null) {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

function actionLabel(action: OwnerDeskAction) {
  switch (action) {
    case "open-live-desk":
      return "Abrir caso";
    case "open-bookings":
      return "Reserva";
    case "focus-inbox":
      return "Inbox";
    case "call":
      return "Ligar";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    default:
      return "Abrir";
  }
}

function stageTone(stage: OwnerDeskCase["stage"]) {
  if (stage === "service-recovery" || stage === "ticket-issue") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
  }
  if (stage === "respond-now" || stage === "payment-follow-up" || stage === "active-live") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
  }
  if (stage === "senior-watch") {
    return "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]";
  }
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]";
}

function priorityTone(priorityBand: OwnerDeskCase["priorityBand"]) {
  if (priorityBand === "hot") return "border-rose-500/40 bg-rose-500/15 text-rose-300 font-bold";
  if (priorityBand === "warm") return "border-amber-500/40 bg-amber-500/15 text-amber-300 font-bold";
  return "border-slate-500/30 bg-slate-500/10 text-slate-400 font-medium";
}

function SummaryCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/5 bg-white/5 p-5 group hover:border-indigo-500/20 transition-all duration-500 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 group-hover:text-indigo-300 transition-colors uppercase">{title}</p>
          <p className="text-3xl font-bold text-white font-display tracking-tight">{value}</p>
          <p className="mt-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">{hint}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function AdminOwnerDesk({
  data,
  isLoading,
  isError,
  error,
  onRunAction,
}: {
  data?: AdminOwnerDeskData;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRunAction: (ownerCase: OwnerDeskCase, action: OwnerDeskAction) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const filteredCases = useMemo(() => {
    const source = data?.cases || [];
    switch (filter) {
      case "hot":
        return source.filter((item) => item.priorityBand === "hot");
      case "senior":
        return source.filter((item) => item.serviceMode === "senior");
      case "payment":
        return source.filter((item) => item.stage === "payment-follow-up" || item.pendingBookings > 0);
      case "live":
        return source.filter((item) => item.liveRequests > 0 || item.activeLiveSessions > 0);

      default:
        return source;
    }
  }, [data?.cases, filter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
    void getOwnerPushSubscription().then((subscription) => {
      setPushEnabled(Boolean(subscription));
    }).catch(() => {
      setPushEnabled(false);
    });
  }, []);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPushLoading(true);

    try {
      await subscribeOwnerPush({ deviceLabel: "Owner Desk" });
      setNotificationPermission("granted");
      setPushEnabled(true);
    } catch (error) {
      console.error("[OWNER PUSH] subscribe failed:", error);
      setNotificationPermission(Notification.permission);
    } finally {
      setPushLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6 text-sm text-slate-500">Montando o Owner Desk...</CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border border-red-200 bg-red-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-red-700">Owner Desk indisponivel</CardTitle>
          <CardDescription className="text-red-600">
            {error?.message || "Nao foi possivel montar a visao unificada do cliente."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    // LEI 5: Este componente centraliza a visibilidade executiva (Livro da Vida).
    // LEI 6: Isolamento de camadas: O Owner Desk foca em visibilidade Web, sem dependências mobile.
    <Card className="overflow-hidden border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-[32px]">
      <CardHeader className="border-b border-white/5 bg-gradient-to-br from-indigo-500/10 via-slate-900/40 to-cyan-500/10 p-8 sm:p-10 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[100px] pointer-events-none" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
                Owner Desk Pro
              </Badge>
              <Badge className="border border-white/10 bg-white/5 text-slate-400 font-medium px-3 py-1 rounded-full text-[10px]">
                Atualizado {formatMoment(data.generatedAt)}
              </Badge>
            </div>
            <CardTitle className="mt-6 text-4xl font-bold tracking-tight text-white font-display uppercase tracking-tighter">
              Fila Única de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Alta Prioridade</span>
            </CardTitle>
            <CardDescription className="mt-4 max-w-2xl text-slate-400 leading-relaxed text-base font-medium">
              Centro de comando executivo: monitore gargalos, converta leads quentes e proteja a receita em tempo real com inteligência preditiva.
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:w-[480px]">
            <SummaryCard title="Casos Ativos" value={data.summary.totalCases} hint="Radar de Operação" icon={<Users className="h-5 w-5" />} />
            <SummaryCard title="Leads Quentes" value={data.summary.hotCases} hint="Resposta Crítica" icon={<Flame className="h-5 w-5 text-orange-400" />} />
            <SummaryCard title="Cuidado Sênior" value={data.summary.seniorCases} hint="Condução White-Glove" icon={<Headphones className="h-5 w-5 text-indigo-400" />} />
            <SummaryCard title="Em Pagamento" value={data.summary.paymentWatch} hint="Receita em Validação" icon={<Wallet className="h-5 w-5 text-cyan-400" />} />
            <SummaryCard title="Suporte Realtime" value={data.summary.liveNow} hint="Chat de Elite" icon={<MessageSquare className="h-5 w-5 text-emerald-400" />} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 glass-card p-6 border-indigo-500/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BellRing className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-400/80">Monitor de Operações Web</p>
              <p className="mt-1 text-lg font-bold text-white">Radar Operacional Ativo</p>
              <p className="mt-1 text-sm text-slate-400 font-medium italic">
                {data.summary.alertingNow} sinais críticos · {data.summary.overdueFollowUps} pendências vencidas
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!pushEnabled && notificationPermission !== "unsupported" && (
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2.5 rounded-2xl border-indigo-500/30 bg-indigo-500/5 text-indigo-300 hover:bg-indigo-500/15 hover:border-indigo-500/50 transition-all font-bold px-6" 
                onClick={enableNotifications} 
                disabled={pushLoading}
              >
                <BellRing className="h-4.5 w-4.5" />
                {pushLoading ? "Sincronizando..." : "Habilitar Notificações Push"}
              </Button>
            )}
            {pushEnabled && (
              <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Push Real-time Ativo
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {filterLabels.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant="ghost"
              className={`rounded-2xl px-6 py-2 font-bold tracking-tight transition-all duration-300 border ${
                filter === item.key 
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                : "text-slate-400 border-transparent hover:bg-white/5 hover:text-white"
              }`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr,1fr]">
          <div className="glass-card p-8 border-white/5">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Fluxo de Incidentes</p>
                <h3 className="mt-2 text-2xl font-bold text-white font-display tracking-tight">Owner Alerts</h3>
              </div>
              <Badge className="border border-rose-500/20 bg-rose-500/10 text-rose-400 font-bold px-4 py-1.5 rounded-full">
                {data.summary.alertingNow} Ocorrências Críticas
              </Badge>
            </div>
            <div className="space-y-4">
              {data.alerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm font-medium text-slate-500">
                  Operação nominal. Nenhum alerta crítico detectado no momento.
                </div>
              ) : (
                data.alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="group rounded-2xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition-all hover:border-indigo-500/20">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-base font-bold text-white">{alert.title}</p>
                          <Badge className={`border uppercase text-[10px] font-black px-2 py-0.5 rounded-md ${
                            alert.level === "critical"
                              ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                              : alert.level === "attention"
                                ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                                : "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                          }`}>
                            {alert.level}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-slate-400 font-medium leading-relaxed">{alert.summary}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
                          <span className="flex items-center gap-1.5 text-indigo-400">
                            <Users className="h-3.5 w-3.5" />
                            {alert.customerName || "Visitante"}
                          </span>
                          {alert.route && <span className="text-slate-400">{alert.route}</span>}
                          <span className="px-2 py-0.5 bg-white/5 rounded-md">{alert.stageLabel}</span>
                          <span className="text-cyan-400">Heat Score: {alert.heatScore}</span>
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="rounded-xl font-bold bg-white/10 border border-white/10 hover:bg-white/20 text-white"
                        onClick={() => onRunAction(
                          data.cases.find((item) => item.id === alert.customerCaseId) || data.cases[0],
                          alert.action,
                        )}
                      >
                        {alert.actionLabel}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-8 border-white/5">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Monitor de CRM</p>
                <h3 className="mt-2 text-2xl font-bold text-white font-display tracking-tight">Auto Follow-up</h3>
              </div>
              <Badge className="border border-amber-500/20 bg-amber-500/10 text-amber-400 font-bold px-4 py-1.5 rounded-full">
                {data.summary.overdueFollowUps} Próximas Ações
              </Badge>
            </div>
            <div className="space-y-4">
              {data.followUps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm font-medium text-slate-500">
                  Agenda livre. Todos os contatos sob controle.
                </div>
              ) : (
                data.followUps.slice(0, 6).map((item) => {
                  const ownerCase = data.cases.find((candidate) => candidate.id === item.customerCaseId);
                  if (!ownerCase) return null;

                  return (
                    <div key={item.id} className="group rounded-2xl border border-white/5 bg-indigo-500/5 p-5 hover:bg-indigo-500/10 transition-all border-l-4 border-l-indigo-500/30">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-base font-bold text-white">{item.customerName || "Cliente"}</p>
                            <Badge className={`border uppercase text-[10px] font-black px-2 py-0.5 rounded-md ${
                              item.urgency === "overdue"
                                ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                                : item.urgency === "soon"
                                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                                  : "border-slate-500/40 bg-slate-500/15 text-slate-400"
                            }`}>
                              {item.urgency === "overdue" ? "Atrasado" : item.urgency === "soon" ? "Emergente" : "Programado"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {item.route || "Planejamento"} · <span className="text-indigo-400">{formatMoment(item.dueAt)}</span>
                          </p>
                          <p className="mt-3 text-sm text-slate-400 leading-relaxed font-medium capitalize">{item.reason}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="rounded-xl font-bold text-indigo-300 hover:bg-indigo-500/20"
                          onClick={() => onRunAction(ownerCase, item.channel)}
                        >
                          {item.actionLabel}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-white/10 bg-white/5 p-12 text-center text-slate-500 font-medium">
            Nenhum dossiê de cliente corresponde aos filtros atuais.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredCases.slice(0, 8).map((ownerCase) => {
              const secondaryActions = ownerCase.availableActions.filter(
                (action) => action !== ownerCase.nextBestAction.action,
              );

              return (
                <div key={ownerCase.id} className="glass-card hover:border-indigo-500/30 group transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
                  
                  <div className="p-8 sm:p-10 relative z-10">
                    <div className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b border-white/5">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2.5 mb-4">
                          <p className="text-2xl font-bold text-white font-display tracking-tight group-hover:text-indigo-300 transition-colors uppercase">{ownerCase.customerName}</p>
                          <Badge className={`border uppercase text-[10px] font-black px-2.5 py-1 rounded-lg ${priorityTone(ownerCase.priorityBand)}`}>
                            {ownerCase.priorityBand === "hot" ? "Crítico" : ownerCase.priorityBand === "warm" ? "Alerta" : "Normal"}
                          </Badge>
                          <Badge className={`border uppercase text-[10px] font-bold px-2.5 py-1 rounded-lg ${stageTone(ownerCase.stage)}`}>{ownerCase.stageLabel}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                          {ownerCase.serviceMode === "senior" && (
                            <Badge className="border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold px-3 py-1 rounded-full text-[10px] uppercase">WHITE-GLOVE</Badge>
                          )}
                          {ownerCase.needsHumanHelp && (
                            <Badge className="border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold px-3 py-1 rounded-full text-[10px] uppercase underline underline-offset-4 decoration-2">Solicitou Humano</Badge>
                          )}

                        </div>
                        <p className="mt-6 text-sm font-medium text-slate-400 flex items-center gap-2">
                          <span className="text-white font-bold">{ownerCase.route || "Planejamento Livre"}</span> 
                          <span className="h-1 w-1 rounded-full bg-slate-600" />
                          {ownerCase.sourceLabel}
                          {ownerCase.preferredLanguage ? ` · ${ownerCase.preferredLanguage.toUpperCase()}` : ""}
                        </p>
                      </div>
                      <div className="text-right p-4 rounded-3xl bg-white/5 border border-white/10 min-w-[120px]">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Heat Score</p>
                        <p className="mt-1 text-4xl font-bold text-white font-display shadow-indigo-500/20">{ownerCase.heatScore}</p>
                        <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatMoment(ownerCase.lastTouchAt)}</p>
                      </div>
                    </div>

                    <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <MetricBlock label="Receita Estimada" value={formatMoney(ownerCase.totalRevenue)} icon={<Wallet className="h-4 w-4 text-emerald-400" />} />
                      <MetricBlock label="Volume" value={ownerCase.totalBookings} unit="Reservas" icon={<Users className="h-4 w-4 text-indigo-400" />} />
                      <MetricBlock label="Inbox" value={ownerCase.unreadInboxCount} unit="Mensagens" icon={<MessageSquare className="h-4 w-4 text-cyan-400" />} />
                    </div>

                    <div className="mt-10 rounded-[28px] bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-slate-900 border border-indigo-500/20 p-8 shadow-inner shadow-indigo-500/5">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="h-5 w-5 text-indigo-400 fill-indigo-400/20" />
                        <p className="text-[10px] uppercase tracking-[0.25em] font-black text-indigo-400">Next Best Action</p>
                      </div>
                      <p className="mt-2 text-xl font-bold text-white leading-tight">{ownerCase.nextBestAction.label}</p>
                      <p className="mt-3 text-base text-slate-400 font-medium leading-relaxed">{ownerCase.nextBestAction.description}</p>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Button 
                          onClick={() => onRunAction(ownerCase, ownerCase.nextBestAction.action)} 
                          className="gap-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 px-8 shadow-[0_0_25px_rgba(99,102,241,0.3)] transform transition hover:scale-105"
                        >
                          Executar Comando
                          <ArrowRight className="h-4.5 w-4.5" />
                        </Button>
                        {secondaryActions.slice(0, 3).map((action) => (
                          <Button
                            key={action}
                            variant="ghost"
                            className="rounded-2xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 hover:text-white h-12 px-6"
                            onClick={() => onRunAction(ownerCase, action)}
                          >
                            {actionLabel(action)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr,1fr]">
                      <div className="rounded-[28px] border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-500 mb-4">Dossiê do Cliente (IA)</p>
                        <p className="text-sm leading-7 text-slate-300 font-medium italic">
                          "{ownerCase.latestSummary || "Análise executiva pendente. Aguardando novo touchpoint do cliente para gerar síntese de prioridade."}"
                        </p>
                      </div>
                      <div className="rounded-[28px] border border-white/5 bg-white/5 p-6">
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-500 mb-6">Linha do Tempo</p>
                        <div className="space-y-4">
                          {ownerCase.timeline.slice(0, 3).map((item) => (
                            <div key={item.id} className="relative pl-6 border-l border-white/10 py-1 mb-4 last:mb-0 group/time">
                              <div className="absolute left-0 top-3 -ml-1 h-2 w-2 rounded-full bg-indigo-500/50 group-hover/time:bg-indigo-400 transition-colors" />
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <p className="text-sm font-bold text-slate-200">{item.title}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatMoment(item.createdAt)}</p>
                              </div>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.1em] mb-1.5">{item.status}</p>
                              <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap items-center gap-6">
                      {ownerCase.customerPhone && (
                        <button className="flex items-center gap-2.5 text-sm font-bold text-slate-400 hover:text-indigo-400 transition-colors group/link" onClick={() => onRunAction(ownerCase, "call")}>
                          <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/link:border-indigo-500/30">
                            <Phone className="h-4 w-4" />
                          </div>
                          {ownerCase.customerPhone}
                        </button>
                      )}
                      {ownerCase.customerEmail && (
                        <button className="flex items-center gap-2.5 text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors group/link" onClick={() => onRunAction(ownerCase, "email")}>
                          <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/link:border-cyan-500/30">
                            <Mail className="h-4 w-4" />
                          </div>
                          {ownerCase.customerEmail}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBlock({ label, value, unit, icon }: { label: string; value: string | number; unit?: string; icon: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-white/5 bg-white/5 p-4 sm:p-5 group/metric hover:border-indigo-500/20 transition-all min-w-0">
      <div className="flex items-center justify-between gap-2 mb-3 text-slate-500 group-hover/metric:text-indigo-400 transition-colors">
        <p className="text-[9px] uppercase tracking-[0.1em] font-black truncate flex-1 min-w-0">{label}</p>
        <div className="h-7 w-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
        <p className="text-lg font-bold text-white truncate">{value}</p>
        {unit && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate shrink-0">{unit}</span>}
      </div>
    </div>
  );
}
