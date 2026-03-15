import { type ReactNode, useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowRight,
  Flame,
  Headphones,
  Mail,
  MessageSquare,
  Phone,
  ScanLine,
  Smartphone,
  Wallet,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminOwnerDeskData } from "@/hooks/use-admin";

type OwnerDeskCase = AdminOwnerDeskData["cases"][number];
type OwnerDeskAction = OwnerDeskCase["availableActions"][number];
type FilterKey = "all" | "hot" | "senior" | "payment" | "live" | "mobile";

const filterLabels: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "hot", label: "Quentes" },
  { key: "senior", label: "Senior" },
  { key: "payment", label: "Pagamento" },
  { key: "live", label: "Ao vivo" },
  { key: "mobile", label: "App" },
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
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (stage === "respond-now" || stage === "payment-follow-up" || stage === "active-live") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (stage === "senior-watch") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function priorityTone(priorityBand: OwnerDeskCase["priorityBand"]) {
  if (priorityBand === "hot") return "border-red-200 bg-red-50 text-red-700";
  if (priorityBand === "warm") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
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
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
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
      case "mobile":
        return source.filter((item) => item.appLinked);
      default:
        return source;
    }
  }, [data?.cases, filter]);

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
    <Card className="overflow-hidden border border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-white/20 bg-white/10 text-white">Owner Desk</Badge>
              <Badge className="border border-white/10 bg-white/5 text-white/80">Atualizado {formatMoment(data.generatedAt)}</Badge>
            </div>
            <CardTitle className="mt-4 text-3xl font-bold tracking-tight text-white">
              Sua fila unica de clientes
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-white/75">
              Veja quem precisa de voce agora, onde a venda travou e qual e a proxima acao mais forte para fechar ou proteger o atendimento.
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryCard title="Casos" value={data.summary.totalCases} hint="Clientes vivos no radar" icon={<Users className="h-5 w-5" />} />
            <SummaryCard title="Quentes" value={data.summary.hotCases} hint="Pedem resposta rapida" icon={<Flame className="h-5 w-5" />} />
            <SummaryCard title="Senior" value={data.summary.seniorCases} hint="Pedem conducao calma" icon={<Headphones className="h-5 w-5" />} />
            <SummaryCard title="Pagamento" value={data.summary.paymentWatch} hint="Dinheiro em risco" icon={<Wallet className="h-5 w-5" />} />
            <SummaryCard title="Ao vivo" value={data.summary.liveNow} hint="Atendimento humano" icon={<MessageSquare className="h-5 w-5" />} />
            <SummaryCard title="App" value={data.summary.mobileLinked} hint="Clientes ja ligados ao celular" icon={<Smartphone className="h-5 w-5" />} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap gap-2">
          {filterLabels.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant={filter === item.key ? "default" : "outline"}
              className={filter === item.key ? "bg-slate-900 text-white hover:bg-slate-800" : ""}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {filteredCases.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Nenhum cliente entrou nesse recorte agora.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredCases.slice(0, 8).map((ownerCase) => {
              const secondaryActions = ownerCase.availableActions.filter(
                (action) => action !== ownerCase.nextBestAction.action,
              );

              return (
                <div key={ownerCase.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{ownerCase.customerName}</p>
                        <Badge className={`border ${priorityTone(ownerCase.priorityBand)}`}>
                          {ownerCase.priorityBand === "hot" ? "Quente" : ownerCase.priorityBand === "warm" ? "Atencao" : "Monitorar"}
                        </Badge>
                        <Badge className={`border ${stageTone(ownerCase.stage)}`}>{ownerCase.stageLabel}</Badge>
                        {ownerCase.serviceMode === "senior" && (
                          <Badge className="border border-violet-200 bg-violet-50 text-violet-700">Senior</Badge>
                        )}
                        {ownerCase.needsHumanHelp && (
                          <Badge className="border border-amber-200 bg-amber-50 text-amber-800">Quer humano</Badge>
                        )}
                        {ownerCase.appLinked && (
                          <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">App ligado</Badge>
                        )}
                        {ownerCase.scannerHandoffEnabled && (
                          <Badge className="border border-blue-200 bg-blue-50 text-blue-700">
                            <ScanLine className="mr-1 h-3.5 w-3.5" />
                            Scanner
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {ownerCase.route || "Rota ainda nao definida"} · {ownerCase.sourceLabel}
                        {ownerCase.preferredLanguage ? ` · ${ownerCase.preferredLanguage.toUpperCase()}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Heat score</p>
                      <p className="mt-1 text-3xl font-bold text-slate-900">{ownerCase.heatScore}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatMoment(ownerCase.lastTouchAt)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Receita</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{formatMoney(ownerCase.totalRevenue)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Reservas</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{ownerCase.totalBookings}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Inbox</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{ownerCase.unreadInboxCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Dispositivos</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{ownerCase.deviceCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-blue-600">Proxima melhor acao</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{ownerCase.nextBestAction.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{ownerCase.nextBestAction.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={() => onRunAction(ownerCase, ownerCase.nextBestAction.action)} className="gap-2">
                        {ownerCase.nextBestAction.label}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      {secondaryActions.slice(0, 3).map((action) => (
                        <Button
                          key={action}
                          variant="outline"
                          onClick={() => onRunAction(ownerCase, action)}
                        >
                          {actionLabel(action)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr,1fr]">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Leitura rapida</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {ownerCase.latestSummary || "Sem resumo recente. Abra a linha do cliente e conduza o proximo passo."}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Linha do tempo</p>
                      <div className="mt-3 space-y-3">
                        {ownerCase.timeline.slice(0, 3).map((item) => (
                          <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-500">{formatMoment(item.createdAt)}</p>
                            </div>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{item.status}</p>
                            <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    {ownerCase.customerPhone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {ownerCase.customerPhone}
                      </span>
                    )}
                    {ownerCase.customerEmail && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        {ownerCase.customerEmail}
                      </span>
                    )}
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
