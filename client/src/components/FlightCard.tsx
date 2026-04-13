import { type FlightOffer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Clock, ArrowRight, Leaf, ArrowRightLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";

interface FlightCardProps {
  flight: FlightOffer;
  simplified?: boolean;
}

type FlightSegmentLike = {
  departureTime: string;
  arrivalTime: string;
  destinationCity?: string;
  destinationCode?: string;
  destinationName?: string;
};

type FlightSliceLike = {
  duration: string;
  originCode?: string;
  originCity?: string;
  destinationCode?: string;
  destinationCity?: string;
  segments: FlightSegmentLike[];
};

const formatDuration = (duration?: string) => {
  if (!duration) return "0h 0m";

  if (!duration.startsWith("P")) {
    return duration;
  }

  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);

  const hours = hoursMatch?.[1] ?? "0";
  const minutes = minutesMatch?.[1] ?? "0";

  return `${hours}h ${minutes}m`;
};

const safeFormatTime = (dateString?: string) => {
  if (!dateString) return "--:--";

  try {
    return format(parseISO(dateString), "HH:mm");
  } catch {
    return "--:--";
  }
};

const safeFormatMonthDay = (dateString?: string) => {
  if (!dateString) return "";

  try {
    return format(parseISO(dateString), "MMM d");
  } catch {
    return "";
  }
};

const getStopsLabel = (
  stopsCount: number,
  t: (key: string, params?: any) => string,
) => {
  if (stopsCount === 0) {
    return t("flight.direct");
  }

  if (stopsCount === 1) {
    return t("flight.stop", { count: 1 });
  }

  return t("flight.stops", { count: stopsCount });
};

const getConnectionCities = (slice: FlightSliceLike) => {
  if (!slice.segments || slice.segments.length <= 1) {
    return [];
  }

  const connections: { city?: string; code?: string; label: string; airport?: string }[] = [];

  for (let i = 0; i < slice.segments.length - 1; i++) {
    const segment = slice.segments[i];

    const city = segment.destinationCity;
    const code = segment.destinationCode;
    const airport = segment.destinationName;

    const label = city
      ? code
        ? `${city} (${code})`
        : city
      : airport
        ? code
          ? `${airport} (${code})`
          : airport
        : code || "Conexão";

    connections.push({ city, code, label, airport });
  }

  return connections;
};

const formatCurrency = (
  value: number | string,
  currency: string,
  locale: string,
) => {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return "";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
};

function SliceTimeline({
  slice,
  index,
  t,
}: {
  slice: FlightSliceLike;
  index: number;
  t: (key: string) => string;
}) {
  const firstSegment = slice.segments?.[0];
  const lastSegment = slice.segments?.[slice.segments.length - 1];

  if (!firstSegment || !lastSegment) {
    return null;
  }

  const stopsCount = Math.max((slice.segments?.length ?? 1) - 1, 0);
  const stopsLabel = getStopsLabel(stopsCount, t as any);

  return (
    <div className="flex flex-col gap-3 py-2 px-1 hover:bg-slate-50/50 rounded-2xl transition-all group/slice">
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          {index === 0 ? (t("results.outbound") || "Voo de Ida") : (t("results.return") || "Voo de Volta")}
        </span>
        <span className="text-[10px] font-bold text-slate-400">
          {safeFormatMonthDay(firstSegment.departureTime)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-8">
        <div className="flex-1 flex items-center gap-8">
          {/* Departure */}
          <div className="text-left">
            <div className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
              {safeFormatTime(firstSegment.departureTime)}
            </div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {slice.originCode || "DEP"}
            </div>
          </div>

          {/* Connection Line */}
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-2">{formatDuration(slice.duration)}</span>
            <div className="relative w-full h-[2px] bg-slate-100 rounded-full">
              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/slice:opacity-100 transition-opacity" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <Plane className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-all rotate-90" />
              </div>
            </div>
            <div className={`mt-2 text-[10px] font-black uppercase tracking-widest ${stopsCount === 0 ? "text-emerald-500" : "text-amber-500"}`}>
              {stopsLabel}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
              {safeFormatTime(lastSegment.arrivalTime)}
            </div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {slice.destinationCode || "ARR"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SingleFlightTimeline({
  flight,
  t,
}: {
  flight: FlightOffer;
  t: (key: string) => string;
}) {
  const stopsLabel = getStopsLabel(flight.stops, t as any);

  return (
    <div className="flex items-center justify-between gap-8 py-2 px-1">
      <div className="flex-1 flex items-center gap-8">
        {/* Departure */}
        <div className="text-left">
          <div className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
            {safeFormatTime(flight.departureTime)}
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {flight.originCode || "DEP"}
          </div>
        </div>

        {/* Connection Line */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-2">{formatDuration(flight.duration)}</span>
          <div className="relative w-full h-[2px] bg-slate-100 rounded-full">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              <Plane className="h-4 w-4 text-slate-300 rotate-90" />
            </div>
          </div>
          <div className={`mt-2 text-[10px] font-black uppercase tracking-widest ${flight.stops === 0 ? "text-emerald-500" : "text-amber-500"}`}>
            {stopsLabel}
          </div>
        </div>

        {/* Arrival */}
        <div className="text-right">
          <div className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
            {safeFormatTime(flight.arrivalTime)}
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {flight.destinationCode || "ARR"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlightCard({ flight, simplified = false }: FlightCardProps) {
  const { t, language } = useI18n();

  const locale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";

  const cabinClassName = flight.passengers?.[0]?.cabinClassName;
  const fareBrand = flight.passengers?.[0]?.fareBrandName;
  const changeAllowed = flight.conditions?.changeBeforeDeparture?.allowed;
  const refundAllowed = flight.conditions?.refundBeforeDeparture?.allowed;

  const currentSearch =
    typeof window !== "undefined" ? window.location.search : "";

  const searchParams = new URLSearchParams(currentSearch);
  const bookUrl = `/book/${flight.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const slices = Array.isArray(flight.slices) ? flight.slices : [];
  const hasSlices = slices.length > 0;

  return (
    <Card
      data-testid={`flight-card-${flight.id}`}
      className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Main Content Area */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Airline Identity */}
            <div className="flex items-center gap-5 min-w-[180px]">
              <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-[20px] bg-slate-50 border border-slate-100 p-2 group-hover:bg-white transition-colors">
                {flight.logoUrl ? (
                  <img
                    src={flight.logoUrl}
                    alt={flight.airline}
                    className="h-full w-full object-contain grayscale-[0.2] group-hover:grayscale-0 transition-all"
                  />
                ) : (
                  <Plane className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-2">
                  {flight.airline}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    {flight.flightNumber}
                  </span>
                  {cabinClassName && (
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      {cabinClassName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Flight Timeline */}
            <div className="flex-1 w-full">
              {hasSlices ? (
                <div className="space-y-6">
                  {slices.map((slice, index) => (
                    <SliceTimeline
                      key={`${flight.id}-slice-${index}`}
                      slice={slice as FlightSliceLike}
                      index={index}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <SingleFlightTimeline flight={flight} t={t} />
              )}
            </div>
          </div>

          {/* Luxury Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <FlightBaggageHighlights
                flight={flight}
                simplified={simplified}
                compact
              />
              <div className="h-4 w-[1px] bg-slate-100 hidden sm:block" />
              {fareBrand && (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {fareBrand}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
               {changeAllowed && (
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                   <ArrowRightLeft className="h-3 w-3" />
                   {t("flight.changeable") || "Flexível"}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Action Sidebar/Area */}
        <div className="w-full lg:w-[260px] bg-slate-50/50 border-t lg:border-t-0 lg:border-l border-slate-100 p-8 flex flex-col justify-center items-center lg:items-end text-center lg:text-right gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total por Passageiro</p>
            <div className="flex items-baseline justify-center lg:justify-end gap-1 text-slate-900">
              <span className="text-sm font-black opacity-40">{flight.currency === "USD" ? "US$" : flight.currency}</span>
              <span className="text-5xl font-black tracking-tighter leading-none">
                {typeof flight.price === "number" ? Math.floor(flight.price) : flight.price}
              </span>
            </div>
            {flight.taxAmount && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+ Taxas incluídas</p>
            )}
          </div>

          <Link href={bookUrl} className="w-full">
            <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 active:scale-95 group">
              {t("flight.select")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
