import { type FlightOffer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, ArrowRight, Luggage } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";

const formatDuration = (duration: string) => {
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? hoursMatch[1] : "0";
  const minutes = minutesMatch ? minutesMatch[1] : "0";
  return `${hours}h ${minutes}m`;
};

const formatPrice = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface FlightCardProps {
  flight: FlightOffer;
}

export function FlightCard({ flight }: FlightCardProps) {
  const { t } = useI18n();
  const formattedDuration = flight.duration.startsWith("P") ? formatDuration(flight.duration) : flight.duration;
  
  const stopsLabel = flight.stops === 0 
    ? t("flight.direct") 
    : `${flight.stops} ${flight.stops > 1 ? t("flight.stops") : t("flight.stop")}`;

  const cabinClassName = flight.passengers?.[0]?.cabinClassName;
  const checkedBags = flight.passengers?.[0]?.baggages?.find(b => b.type === "checked");
  const carryOnBags = flight.passengers?.[0]?.baggages?.find(b => b.type === "carry_on");
  const fareBrand = flight.passengers?.[0]?.fareBrandName;

  const searchParams = new URLSearchParams(window.location.search);
  const bookUrl = `/book/${flight.id}?${searchParams.toString()}`;

  return (
    <Card data-testid={`flight-card-${flight.id}`} className="p-0 overflow-hidden border border-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300 group bg-white/5 backdrop-blur-sm rounded-2xl">
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        <div className="md:col-span-3 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center p-2 overflow-hidden shadow-inner shrink-0">
            {flight.logoUrl ? (
              <img src={flight.logoUrl} alt={flight.airline} className="w-full h-full object-contain" />
            ) : (
              <Plane className="text-white/50 h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight" data-testid="text-airline-name">{flight.airline}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs text-amber-200/80 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-block" data-testid="text-flight-number">
                {flight.flightNumber}
              </span>
              {cabinClassName && (
                <span className="text-xs text-teal-200/80 font-medium bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full inline-block">
                  {cabinClassName}
                </span>
              )}
            </div>
            {fareBrand && (
              <div className="text-[10px] text-white/30 mt-1">{fareBrand}</div>
            )}
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col justify-center px-4 md:px-0">
          <div className="flex justify-between items-end mb-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-white leading-none" data-testid="text-departure-time">{format(parseISO(flight.departureTime), "HH:mm")}</div>
              <div className="text-xs text-white/50 font-medium uppercase tracking-wide mt-1">
                {flight.originCode || "DEP"}
              </div>
              {flight.originCity && (
                <div className="text-[10px] text-white/40 mt-0.5 max-w-[80px] truncate">{flight.originCity}</div>
              )}
            </div>
            <div className="flex-1 flex flex-col items-center px-6">
              <div className="text-xs text-white/50 mb-1 flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3" />
                {formattedDuration}
              </div>
              <div className="w-full h-[2px] bg-white/10 relative my-1">
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between items-center px-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400/60"></div>
                  <Plane className="h-4 w-4 text-amber-400 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-[1px]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400/60"></div>
                </div>
              </div>
              <div className={`text-xs font-bold mt-1 ${flight.stops === 0 ? "text-emerald-400" : "text-amber-400"}`} data-testid="text-stops">
                {stopsLabel}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white leading-none" data-testid="text-arrival-time">{format(parseISO(flight.arrivalTime), "HH:mm")}</div>
              <div className="text-xs text-white/50 font-medium uppercase tracking-wide mt-1">
                {flight.destinationCode || "ARR"}
              </div>
              {flight.destinationCity && (
                <div className="text-[10px] text-white/40 mt-0.5 max-w-[80px] truncate">{flight.destinationCity}</div>
              )}
            </div>
          </div>
          {(checkedBags || carryOnBags || flight.aircraftType) && (
            <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              {flight.aircraftType && (
                <span className="text-[10px] text-white/30 flex items-center gap-1">
                  <Plane className="h-2.5 w-2.5" /> {flight.aircraftType}
                </span>
              )}
              {checkedBags && checkedBags.quantity > 0 && (
                <span className="text-[10px] text-emerald-300/70 flex items-center gap-1" data-testid="text-checked-bags">
                  <Luggage className="h-2.5 w-2.5" /> {checkedBags.quantity}x {t("booking.checked_bag")}
                </span>
              )}
              {carryOnBags && carryOnBags.quantity > 0 && (
                <span className="text-[10px] text-teal-300/70 flex items-center gap-1">
                  <Luggage className="h-2.5 w-2.5" /> {carryOnBags.quantity}x {t("booking.carry_on")}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-4 flex flex-col items-end justify-center border-l-0 md:border-l border-white/10 pl-0 md:pl-6 gap-3 pt-4 md:pt-0 border-t md:border-t-0 mt-4 md:mt-0">
          <div className="text-right w-full md:w-auto flex justify-between md:block items-center">
            <span className="text-xs text-white/50 font-medium md:block hidden">{t("flight.total_price")}</span>
            <span className="text-sm text-white/50 md:hidden">{t("flight.price_per_adult")}</span>
            <div className="text-3xl font-display font-bold text-white" data-testid="text-price">
              {formatPrice(flight.price, flight.currency)}
            </div>
          </div>
          <Link href={bookUrl} className="w-full">
            <Button data-testid="button-select-flight" className="w-full rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 transition-all h-12 text-base border-0 text-white">
              {t("flight.select")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
