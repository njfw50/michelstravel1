import { type FlightOffer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plane, Clock, ArrowRight, ArrowRightLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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
  if (!duration.startsWith("P")) return duration;
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

const getStopsLabel = (stopsCount: number, t: any) => {
  if (stopsCount === 0) return t("flight.direct");
  return stopsCount === 1 ? t("flight.stop", { count: 1 }) : t("flight.stops", { count: stopsCount });
};

function SliceTimeline({ slice, index, t }: { slice: FlightSliceLike; index: number; t: any }) {
  const firstSegment = slice.segments?.[0];
  const lastSegment = slice.segments?.[slice.segments.length - 1];
  if (!firstSegment || !lastSegment) return null;

  const stopsCount = Math.max((slice.segments?.length ?? 1) - 1, 0);
  const stopsLabel = getStopsLabel(stopsCount, t);

  return (
    <div className="flex flex-col gap-3 py-2 px-1 rounded-2xl transition-all group/slice">
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          {index === 0 ? (t("results.outbound") || "Ida") : (t("results.return") || "Volta")}
        </span>
        <span className="text-[10px] font-bold text-slate-400">
          {safeFormatMonthDay(firstSegment.departureTime)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-8">
        <div className="flex-1 flex items-center gap-8">
          <div className="text-left">
            <div className="text-2xl font-black text-slate-900 leading-none tracking-tighter">
              {safeFormatTime(firstSegment.departureTime)}
            </div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              {slice.originCode || "DEP"}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">{formatDuration(slice.duration)}</span>
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

          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 leading-none tracking-tighter">
              {safeFormatTime(lastSegment.arrivalTime)}
            </div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              {slice.destinationCode || "ARR"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlightCard({ flight, simplified = false }: FlightCardProps) {
  const { t, language } = useI18n();
  const slices = Array.isArray(flight.slices) ? flight.slices : [];
  const hasSlices = slices.length > 0;
  
  const currentSearch = typeof window !== "undefined" ? window.location.search : "";
  const bookUrl = `/book/${flight.id}${currentSearch}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "group relative grid grid-cols-1 md:grid-cols-[1fr_260px] overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:border-blue-200 hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.1)]",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-600/[0.03] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
      )}
    >
      <div className="p-5 md:p-8 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6 border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4 min-w-[180px]">
            <div className="h-14 w-14 shrink-0 flex items-center justify-center rounded-[18px] bg-slate-50 border border-slate-100 p-2 group-hover:bg-white transition-colors">
              {flight.logoUrl ? (
                <img src={flight.logoUrl} alt={flight.airline} className="h-full w-full object-contain" />
              ) : (
                <Plane className="h-8 w-8 text-slate-200" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{flight.airline}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{flight.flightNumber}</span>
                {flight.passengers?.[0]?.cabinClassName && (
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{flight.passengers[0].cabinClassName}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            {hasSlices ? (
              <div className="space-y-8">
                {slices.map((slice, index) => (
                  <SliceTimeline key={index} slice={slice as any} index={index} t={t} />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Detalhes Indisponíveis</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <FlightBaggageHighlights flight={flight} simplified={simplified} compact />
          <div className="flex items-center gap-4">
            {flight.conditions?.changeBeforeDeparture?.allowed && (
               <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 transition-all hover:bg-emerald-100">
                 <ArrowRightLeft className="h-3 w-3" />
                 {t("flight.changeable") || "Alt. Disponível"}
               </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-6 md:p-8 flex flex-col justify-center items-center md:items-end gap-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 text-center md:text-right space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Vago por Passageiro</p>
          <div className="flex items-baseline justify-center md:justify-end gap-1 text-slate-900">
            <span className="text-sm font-black text-blue-600">{flight.currency === "USD" ? "US$" : flight.currency}</span>
            <span className="text-5xl font-black tracking-tighter leading-none">
              {typeof flight.price === "number" ? Math.floor(flight.price) : flight.price}
            </span>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Taxas e Encargos Incluídos</p>
        </div>

        <Link href={bookUrl} className="w-full relative z-10">
          <Button className="w-full h-14 rounded-[20px] bg-blue-600 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 active:scale-95 group">
            {t("flight.select")}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
