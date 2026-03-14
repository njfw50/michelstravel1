import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";
import type { FlightOffer } from "@shared/schema";
import type { SeniorFlightInsight, SeniorRecommendationKind } from "@/lib/senior-flight";
import { ArrowRight, Clock3, Plane, Route, ShoppingBag, Sunrise } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";

type CopySet = {
  comfort: string;
  fastest: string;
  balanced: string;
  total: string;
  direct: string;
  stops: (count: number) => string;
  layover: string;
  noLayover: string;
  day: string;
  caution: string;
  why: string;
  select: string;
  outbound: string;
  inbound: string;
};

const COPY: Record<"pt" | "en" | "es", CopySet> = {
  pt: {
    comfort: "Mais calmo para viajar",
    fastest: "Menor tempo total",
    balanced: "Melhor equilibrio",
    total: "Tempo total",
    direct: "Sem conexao",
    stops: (count) => `${count} ${count === 1 ? "conexao" : "conexoes"}`,
    layover: "Maior espera",
    noLayover: "Sem espera entre voos",
    day: "Horario mais tranquilo",
    caution: "Pode cansar mais",
    why: "Bom para voce porque",
    select: "Escolher este voo",
    outbound: "Ida",
    inbound: "Volta",
  },
  en: {
    comfort: "Calmest option",
    fastest: "Shortest total time",
    balanced: "Best balance",
    total: "Total travel time",
    direct: "No connection",
    stops: (count) => `${count} ${count === 1 ? "connection" : "connections"}`,
    layover: "Longest wait",
    noLayover: "No wait between flights",
    day: "Calmer schedule",
    caution: "May feel more tiring",
    why: "Good for you because",
    select: "Choose this flight",
    outbound: "Outbound",
    inbound: "Return",
  },
  es: {
    comfort: "Mas tranquilo para viajar",
    fastest: "Menor tiempo total",
    balanced: "Mejor equilibrio",
    total: "Tiempo total",
    direct: "Sin conexion",
    stops: (count) => `${count} ${count === 1 ? "conexion" : "conexiones"}`,
    layover: "Mayor espera",
    noLayover: "Sin espera entre vuelos",
    day: "Horario mas tranquilo",
    caution: "Puede cansar mas",
    why: "Bueno para usted porque",
    select: "Elegir este vuelo",
    outbound: "Ida",
    inbound: "Vuelta",
  },
};

function parseMinutes(duration: number) {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatRouteDate(value?: string) {
  if (!value) return "";
  try {
    return format(parseISO(value), "MMM d");
  } catch {
    return "";
  }
}

function formatRouteTime(value?: string) {
  if (!value) return "";
  try {
    return format(parseISO(value), "HH:mm");
  } catch {
    return "";
  }
}

function getKindLabel(kind: SeniorRecommendationKind, copy: CopySet) {
  if (kind === "fastest") return copy.fastest;
  if (kind === "balanced") return copy.balanced;
  return copy.comfort;
}

function getKindTone(kind: SeniorRecommendationKind) {
  if (kind === "fastest") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (kind === "balanced") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

export default function SeniorFlightOptionCard({
  flight,
  insight,
  kind,
}: {
  flight: FlightOffer;
  insight: SeniorFlightInsight;
  kind: SeniorRecommendationKind;
}) {
  const { language } = useI18n();
  const copy = COPY[language === "en" ? "en" : language === "es" ? "es" : "pt"];
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const searchParams = new URLSearchParams(window.location.search);
  const bookUrl = `/book/${flight.id}?${searchParams.toString()}`;
  const slices = flight.slices || [];
  const routeSlices = slices.length > 0
    ? slices
    : [
        {
          duration: flight.duration,
          originCode: flight.originCode || "",
          originCity: flight.originCity || null,
          destinationCode: flight.destinationCode || "",
          destinationCity: flight.destinationCity || null,
          segments: [
            {
              segmentId: flight.id,
              carrierCode: "",
              carrierName: flight.airline,
              flightNumber: flight.flightNumber,
              aircraftType: flight.aircraftType || null,
              departureTime: flight.departureTime,
              arrivalTime: flight.arrivalTime,
              duration: flight.duration,
              originCode: flight.originCode || "",
              originName: flight.originCode || "",
              originCity: flight.originCity || null,
              originTerminal: null,
              destinationCode: flight.destinationCode || "",
              destinationName: flight.destinationCode || "",
              destinationCity: flight.destinationCity || null,
              destinationTerminal: null,
            },
          ],
        },
      ];

  return (
    <Card className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_-46px_rgba(15,23,42,0.32)]">
      <div className="p-5 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${getKindTone(kind)}`}>
              {getKindLabel(kind, copy)}
            </span>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2">
                {flight.logoUrl ? (
                  <img src={flight.logoUrl} alt={flight.airline} className="h-full w-full object-contain" />
                ) : (
                  <Plane className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-950">{flight.airline}</p>
                <p className="text-sm text-slate-500">
                  {flight.originCode} - {flight.destinationCode}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-4 text-right">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Preco total</p>
            <p className="mt-1 text-4xl font-extrabold text-slate-950">
              {new Intl.NumberFormat(locale, {
                style: "currency",
                currency: flight.currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(flight.price)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-4">
            {routeSlices.map((slice, index) => {
              const firstSegment = slice.segments[0];
              const lastSegment = slice.segments[slice.segments.length - 1];
              const label = index === 0 ? copy.outbound : copy.inbound;
              return (
                <div key={`${label}-${firstSegment?.departureTime || index}`} className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{label}</p>
                    <p className="text-xs text-slate-500">{formatRouteDate(firstSegment?.departureTime)}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-[84px_minmax(0,1fr)_84px] items-center gap-3">
                    <div>
                      <p className="text-3xl font-extrabold text-slate-950">{formatRouteTime(firstSegment?.departureTime)}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{slice.originCode}</p>
                      <p className="text-xs text-slate-500">{slice.originCity || slice.originCode}</p>
                    </div>
                    <div className="text-center">
                      <p className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        <Clock3 className="h-3.5 w-3.5" />
                        {parseMinutes(insight.totalDurationMinutes)}
                      </p>
                      <div className="mt-3 h-[2px] w-full bg-slate-200 relative">
                        <Route className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white text-blue-600" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        {slice.segments.length <= 1 ? copy.direct : copy.stops(slice.segments.length - 1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold text-slate-950">{formatRouteTime(lastSegment?.arrivalTime)}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{slice.destinationCode}</p>
                      <p className="text-xs text-slate-500">{slice.destinationCity || slice.destinationCode}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <FlightBaggageHighlights flight={flight} simplified compact />

            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-sm font-bold text-emerald-950">{copy.why} {insight.reasonLine}.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{copy.total}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{parseMinutes(insight.totalDurationMinutes)}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Conexoes</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">
                {insight.totalStops === 0 ? copy.direct : copy.stops(insight.totalStops)}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{copy.layover}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">
                {insight.longestLayoverMinutes > 0 ? parseMinutes(insight.longestLayoverMinutes) : copy.noLayover}
              </p>
            </div>
            <div className={`rounded-[24px] border px-4 py-4 ${insight.hasSensitiveHour ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>
              <div className="flex items-center gap-2">
                <Sunrise className="h-4 w-4" />
                <p className="text-sm font-bold">
                  {insight.hasSensitiveHour ? copy.caution : copy.day}
                </p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-700">
                  {insight.hasCheckedBag ? "Mala despachada incluida" : insight.hasCarryOn ? "Leva bagagem de mao" : "Bagagem enxuta"}
                </p>
              </div>
            </div>
            <Link href={bookUrl}>
              <Button className="mt-2 min-h-14 w-full rounded-2xl bg-blue-600 text-base font-extrabold text-white hover:bg-blue-700">
                {copy.select}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
