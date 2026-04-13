import { type FlightOffer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plane, Clock, ArrowRight, ArrowRightLeft, ShieldCheck, Info } from "lucide-react";
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

function SliceTimeline({ slice, index, t, totalSlices }: { slice: FlightSliceLike; index: number; t: any; totalSlices: number }) {
  const firstSegment = slice.segments?.[0];
  const lastSegment = slice.segments?.[slice.segments.length - 1];
  if (!firstSegment || !lastSegment) return null;

  const stopsCount = Math.max((slice.segments?.length ?? 1) - 1, 0);
  const stopsLabel = getStopsLabel(stopsCount, t);

  return (
    <div className="flex flex-col gap-3 py-2 px-1 rounded-2xl transition-all group/slice">
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          {totalSlices > 2 
            ? `${t("results.leg") || "Leg"} ${index + 1}`
            : index === 0 ? (t("results.outbound") || "Outbound") : (t("results.return") || "Return")}
        </span>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {safeFormatMonthDay(firstSegment.departureTime)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-8">
        <div className="flex-1 flex items-center gap-8">
          <div className="text-left">
            <div className="text-2xl md:text-3xl font-black text-white leading-none tracking-tighter">
              {safeFormatTime(firstSegment.departureTime)}
            </div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-0.5">
              {slice.originCode || "DEP"}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">{formatDuration(slice.duration)}</span>
            <div className="relative w-full h-[1px] bg-white/10 rounded-full">
               <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/slice:opacity-100 transition-opacity" />
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 border border-white/5 rounded-full py-1">
                 <Plane className="h-3 w-3 text-slate-600 group-hover:text-blue-400 transition-all rotate-90" />
               </div>
            </div>
            <div className={`mt-3 text-[9px] font-black uppercase tracking-[0.25em] ${stopsCount === 0 ? "text-emerald-500/80" : "text-amber-500/80"}`}>
              {stopsLabel}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl md:text-3xl font-black text-white leading-none tracking-tighter">
              {safeFormatTime(lastSegment.arrivalTime)}
            </div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pr-0.5">
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

  const formattedPrice = new Intl.NumberFormat(language === "pt" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: flight.currency || "USD",
  }).format(Number(flight.price));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "group relative grid grid-cols-1 md:grid-cols-[1fr_280px] overflow-hidden rounded-[40px] border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:bg-slate-900/60 hover:shadow-blue-500/5",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-600/[0.04] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
      )}
    >
      <div className="p-6 md:p-10 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8 border-b border-white/5 pb-8">
          <div className="flex items-center gap-6 min-w-[200px]">
            <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-[24px] bg-white/5 border border-white/10 p-3 shadow-xl transition-all group-hover:scale-105">
              {flight.logoUrl ? (
                <img src={flight.logoUrl || ""} alt={flight.airline || ""} className="h-full w-full object-contain" />
              ) : (
                <Plane className="h-8 w-8 text-slate-700" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-3">{flight.airline}</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 border border-white/5 px-3 py-1 rounded-full">{flight.flightNumber}</span>
                {flight.passengers?.[0]?.cabinClassName && (
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{flight.passengers[0].cabinClassName}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            {hasSlices ? (
              <div className="space-y-10">
                {slices.map((slice, index) => (
                  <SliceTimeline key={index} slice={slice as any} index={index} t={t} totalSlices={slices.length} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Flight Details Unavailable</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="bg-white/5 rounded-3xl p-1 border border-white/5">
             <FlightBaggageHighlights flight={flight} simplified={simplified} compact />
          </div>
          <div className="flex items-center gap-4">
            {flight.conditions?.changeBeforeDeparture?.allowed && (
               <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] bg-emerald-500/10 px-5 py-2 rounded-full border border-emerald-500/20 transition-all hover:bg-emerald-500/20">
                 <ShieldCheck className="h-4 w-4" />
                 {t("flight.changeable") || "Changeable"}
               </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative bg-white/5 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/5 p-8 md:p-10 flex flex-col justify-center items-center md:items-end gap-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
        
        <div className="relative z-10 text-center md:text-right space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Price per Traveler</p>
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
              {formattedPrice}
            </span>
          </div>
          <p className="flex items-center justify-center md:justify-end gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
             <Info className="h-3 w-3" />
             Final Price with Taxes Included
          </p>
        </div>

        <Link href={bookUrl} className="w-full relative z-10">
          <Button className="w-full h-16 rounded-[24px] bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 group">
            {t("flight.select")}
            <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-2" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
