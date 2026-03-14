import { type FlightOffer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, ArrowRight, Leaf } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";

const formatDuration = (duration: string) => {
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? hoursMatch[1] : "0";
  const minutes = minutesMatch ? minutesMatch[1] : "0";
  return `${hours}h ${minutes}m`;
};

interface FlightCardProps {
  flight: FlightOffer;
  simplified?: boolean;
}

export function FlightCard({ flight, simplified = false }: FlightCardProps) {
  const { t, language } = useI18n();
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  
  const cabinClassName = flight.passengers?.[0]?.cabinClassName;
  const fareBrand = flight.passengers?.[0]?.fareBrandName;

  const searchParams = new URLSearchParams(window.location.search);
  const bookUrl = `/book/${flight.id}?${searchParams.toString()}`;

  // Check if we have slices (round trip) or single flight
  const slices = flight.slices ?? [];
  const hasSlices = slices.length > 0;

  return (
    <Card data-testid={`flight-card-${flight.id}`} className="group overflow-hidden rounded-[24px] border border-gray-200 bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_32px_-8px_hsl(213_90%_50%/0.18)] md:rounded-2xl">
      <div className="grid grid-cols-1 items-start gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-12 md:gap-6 md:p-6">
        
        {/* Airline Info */}
        <div className="md:col-span-3 flex items-start gap-3 sm:items-center sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 p-2 sm:h-12 sm:w-12">
            {flight.logoUrl ? (
              <img src={flight.logoUrl} alt={flight.airline} className="w-full h-full object-contain" />
            ) : (
              <Plane className="text-gray-400 h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight" data-testid="text-airline-name">{flight.airline}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="guide-tag" data-testid="text-flight-number">
                {flight.flightNumber}
              </span>
              {cabinClassName && (
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  {cabinClassName}
                </span>
              )}
            </div>
            {fareBrand && (
              <div className="text-[10px] text-gray-400 mt-1">{fareBrand}</div>
            )}
          </div>
        </div>

        {/* Flight Details */}
        <div className="md:col-span-5 flex flex-col justify-center px-0 md:px-0">
          {hasSlices ? (
            // Display slices separately for round trips
            <div className="space-y-4">
              {slices.map((slice, index) => {
                const firstSegment = slice.segments[0];
                const lastSegment = slice.segments[slice.segments.length - 1];
                const sliceDuration = slice.duration.startsWith("P") ? formatDuration(slice.duration) : slice.duration;
                const stopsCount = slice.segments.length - 1;
                const stopsLabel = stopsCount === 0 
                  ? t("flight.direct") 
                  : `${stopsCount} ${stopsCount > 1 ? t("flight.stops") : t("flight.stop")}`;

                return (
                  <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-2">
                      <span>{index === 0 ? t("booking.outbound") : t("booking.return_flight")}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {format(parseISO(firstSegment.departureTime), "MMM d")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 leading-none">
                          {format(parseISO(firstSegment.departureTime), "HH:mm")}
                        </div>
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">
                          {slice.originCode}
                        </div>
                        {slice.originCity && (
                          <div className="text-[10px] text-gray-400 mt-0.5 max-w-[80px] truncate">{slice.originCity}</div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col items-center px-2 sm:px-4">
                        <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {sliceDuration}
                        </div>
                        <div className="w-full h-[2px] bg-gray-200 relative my-1">
                          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between items-center px-1">
                            <div className="h-2 w-2 rounded-full bg-blue-400 border-2 border-white"></div>
                            <Plane className="h-4 w-4 text-blue-500 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-[1px]" />
                            <div className="h-2 w-2 rounded-full bg-blue-400 border-2 border-white"></div>
                          </div>
                        </div>
                        <div className={`text-xs font-medium mt-1 ${stopsCount === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                          {stopsLabel}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 leading-none">
                          {format(parseISO(lastSegment.arrivalTime), "HH:mm")}
                        </div>
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">
                          {slice.destinationCode}
                        </div>
                        {slice.destinationCity && (
                          <div className="text-[10px] text-gray-400 mt-0.5 max-w-[80px] truncate">{slice.destinationCity}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback for flights without slices (single flight)
            <div className="mb-2 flex items-end justify-between gap-2">
              <div className="text-center">
                <div className="text-xl font-bold leading-none text-gray-900 sm:text-2xl" data-testid="text-departure-time">
                  {format(parseISO(flight.departureTime), "HH:mm")}
                </div>
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">
                  {flight.originCode || "DEP"}
                </div>
                {flight.originCity && (
                  <div className="text-[10px] text-gray-400 mt-0.5 max-w-[80px] truncate">{flight.originCity}</div>
                )}
              </div>
              <div className="flex flex-1 flex-col items-center px-2 sm:px-6">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1 font-medium">
                  <Clock className="h-3 w-3" />
                  {flight.duration.startsWith("P") ? formatDuration(flight.duration) : flight.duration}
                </div>
                <div className="w-full h-[2px] bg-gray-200 relative my-1">
                  <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between items-center px-1">
                    <div className="h-2 w-2 rounded-full bg-blue-400 border-2 border-white"></div>
                    <Plane className="h-4 w-4 text-blue-500 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-[1px]" />
                    <div className="h-2 w-2 rounded-full bg-blue-400 border-2 border-white"></div>
                  </div>
                </div>
                <div className={`text-xs font-bold mt-1 ${flight.stops === 0 ? "text-emerald-600" : "text-amber-600"}`} data-testid="text-stops">
                  {flight.stops === 0 ? t("flight.direct") : `${flight.stops} ${flight.stops > 1 ? t("flight.stops") : t("flight.stop")}`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold leading-none text-gray-900 sm:text-2xl" data-testid="text-arrival-time">
                  {format(parseISO(flight.arrivalTime), "HH:mm")}
                </div>
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">
                  {flight.destinationCode || "ARR"}
                </div>
                {flight.destinationCity && (
                  <div className="text-[10px] text-gray-400 mt-0.5 max-w-[80px] truncate">{flight.destinationCity}</div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-3 space-y-2">
            <FlightBaggageHighlights flight={flight} simplified={simplified} compact />

            {(flight.aircraftType || (flight as any).totalEmissionsKg) && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
              {flight.aircraftType && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Plane className="h-2.5 w-2.5" /> {flight.aircraftType}
                </span>
              )}
              {(flight as any).totalEmissionsKg && (
                <span className="text-[10px] text-emerald-500 flex items-center gap-1" data-testid="text-co2-emissions">
                  <Leaf className="h-2.5 w-2.5" /> {Math.round((flight as any).totalEmissionsKg)} kg CO₂
                </span>
              )}
              </div>
            )}
          </div>
        </div>

        {/* Price and Select Button */}
        <div className="md:col-span-4 mt-1 flex flex-col items-stretch justify-center gap-3 rounded-[22px] border border-gray-100 bg-slate-50/80 px-4 py-4 md:mt-0 md:items-end md:rounded-none md:border-0 md:border-l md:border-gray-200 md:bg-transparent md:px-0 md:py-0 md:pl-6">
          <div className="flex w-full items-center justify-between text-left md:block md:w-auto md:text-right">
            <span className="text-xs text-gray-500 font-medium md:block hidden">{t("flight.total_price")}</span>
            <span className="text-sm text-gray-500 md:hidden">{t("flight.price_per_adult")}</span>
            <div className="text-2xl font-display font-bold text-gray-900 sm:text-3xl" data-testid="text-price">
              {new Intl.NumberFormat(locale, {
                style: "currency",
                currency: flight.currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(flight.price)}
            </div>
            {flight.baseAmount && flight.taxAmount && (
              <div className="mt-0.5 flex flex-col gap-0 text-[10px] text-gray-400 md:items-end">
                <span>{t("flight.base_fare") || "Base"}: {new Intl.NumberFormat(locale, { style: "currency", currency: flight.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(flight.baseAmount))}</span>
                <span>{t("flight.taxes") || "Taxes"}: {new Intl.NumberFormat(locale, { style: "currency", currency: flight.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(flight.taxAmount))}</span>
              </div>
            )}
          </div>
          <Link href={bookUrl} className="w-full">
            <Button data-testid="button-select-flight" className="h-12 w-full rounded-xl border-0 bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700">
              {t("flight.select")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
