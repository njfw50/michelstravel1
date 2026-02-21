import { type FlightOffer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, ArrowRight, Luggage, Leaf } from "lucide-react";
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
  
  const cabinClassName = flight.passengers?.[0]?.cabinClassName;
  const checkedBags = flight.passengers?.[0]?.baggages?.find(b => b.type === "checked");
  const carryOnBags = flight.passengers?.[0]?.baggages?.find(b => b.type === "carry_on");
  const fareBrand = flight.passengers?.[0]?.fareBrandName;

  const searchParams = new URLSearchParams(window.location.search);
  const bookUrl = `/book/${flight.id}?${searchParams.toString()}`;

  // Check if we have slices (round trip) or single flight
  const hasSlices = flight.slices && flight.slices.length > 0;

  return (
    <Card data-testid={`flight-card-${flight.id}`} className="p-0 overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group bg-white rounded-2xl">
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Airline Info */}
        <div className="md:col-span-3 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center p-2 overflow-hidden shrink-0">
            {flight.logoUrl ? (
              <img src={flight.logoUrl} alt={flight.airline} className="w-full h-full object-contain" />
            ) : (
              <Plane className="text-gray-400 h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight" data-testid="text-airline-name">{flight.airline}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md inline-block" data-testid="text-flight-number">
                {flight.flightNumber}
              </span>
              {cabinClassName && (
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md inline-block">
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
        <div className="md:col-span-5 flex flex-col justify-center px-4 md:px-0">
          {hasSlices ? (
            // Display slices separately for round trips
            <div className="space-y-4">
              {flight.slices.map((slice, index) => {
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
                    <div className="flex justify-between items-center">
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
                      <div className="flex-1 flex flex-col items-center px-4">
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
            <div className="flex justify-between items-end mb-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 leading-none" data-testid="text-departure-time">
                  {format(parseISO(flight.departureTime), "HH:mm")}
                </div>
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">
                  {flight.originCode || "DEP"}
                </div>
                {flight.originCity && (
                  <div className="text-[10px] text-gray-400 mt-0.5 max-w-[80px] truncate">{flight.originCity}</div>
                )}
              </div>
              <div className="flex-1 flex flex-col items-center px-6">
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
                <div className="text-2xl font-bold text-gray-900 leading-none" data-testid="text-arrival-time">
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
          
          {/* Baggage and Aircraft Info */}
          {(checkedBags || carryOnBags || flight.aircraftType) && (
            <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              {flight.aircraftType && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Plane className="h-2.5 w-2.5" /> {flight.aircraftType}
                </span>
              )}
              {checkedBags && checkedBags.quantity > 0 && (
                <span className="text-[10px] text-emerald-600 flex items-center gap-1" data-testid="text-checked-bags">
                  <Luggage className="h-2.5 w-2.5" /> {checkedBags.quantity}x {t("booking.checked_bag")}
                </span>
              )}
              {carryOnBags && carryOnBags.quantity > 0 && (
                <span className="text-[10px] text-blue-600 flex items-center gap-1">
                  <Luggage className="h-2.5 w-2.5" /> {carryOnBags.quantity}x {t("booking.carry_on")}
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

        {/* Price and Select Button */}
        <div className="md:col-span-4 flex flex-col items-end justify-center border-l-0 md:border-l border-gray-200 pl-0 md:pl-6 gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 mt-4 md:mt-0">
          <div className="text-right w-full md:w-auto flex justify-between md:block items-center">
            <span className="text-xs text-gray-500 font-medium md:block hidden">{t("flight.total_price")}</span>
            <span className="text-sm text-gray-500 md:hidden">{t("flight.price_per_adult")}</span>
            <div className="text-3xl font-display font-bold text-gray-900" data-testid="text-price">
              {formatPrice(flight.price, flight.currency)}
            </div>
            {flight.baseAmount && flight.taxAmount && (
              <div className="text-[10px] text-gray-400 mt-0.5 flex flex-col items-end gap-0">
                <span>{t("flight.base_fare") || "Base"}: {formatPrice(parseFloat(flight.baseAmount), flight.currency)}</span>
                <span>{t("flight.taxes") || "Taxes"}: {formatPrice(parseFloat(flight.taxAmount), flight.currency)}</span>
              </div>
            )}
          </div>
          <Link href={bookUrl} className="w-full">
            <Button data-testid="button-select-flight" className="w-full rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all h-12 text-base border-0 text-white">
              {t("flight.select")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
