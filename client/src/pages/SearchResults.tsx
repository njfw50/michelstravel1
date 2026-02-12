import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { FlightCard } from "@/components/FlightCard";
import { useFlightSearch } from "@/hooks/use-flights";
import { Loader2, Filter, AlertCircle, Plane, X, Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { FlightOffer } from "@shared/schema";

type SortOption = "cheapest" | "fastest" | "best";
type DepartureTime = "morning" | "afternoon" | "evening" | "night";

function parseDurationToMinutes(duration: string): number {
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  return hours * 60 + minutes;
}

function getDepartureHour(departureTime: string): number {
  try {
    return new Date(departureTime).getHours();
  } catch {
    return 0;
  }
}

function getStopsBucket(stops: number): string {
  if (stops === 0) return "direct";
  if (stops === 1) return "1stop";
  return "2plus";
}

function getDepartureTimeBucket(departureTime: string): DepartureTime {
  const hour = getDepartureHour(departureTime);
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "evening";
  return "night";
}

export default function SearchResults() {
  const [location] = useLocation();
  const { t } = useI18n();
  const searchParams = new URLSearchParams(window.location.search);
  const tripType = searchParams.get('tripType');
  const legsRaw = searchParams.get('legs');

  const isMultiCity = tripType === 'multi-city' && legsRaw;
  let multiCityLegs: { origin: string; destination: string; date: string }[] = [];
  try {
    if (isMultiCity) multiCityLegs = JSON.parse(legsRaw);
  } catch {}

  const params = isMultiCity ? {
    origin: multiCityLegs[0]?.origin || "",
    destination: multiCityLegs[0]?.destination || "",
    date: multiCityLegs[0]?.date || "",
    passengers: searchParams.get('passengers') || "1",
    adults: searchParams.get('adults') || "1",
    children: searchParams.get('children') || "0",
    infants: searchParams.get('infants') || "0",
    cabinClass: searchParams.get('cabinClass') || "economy",
  } : {
    origin: searchParams.get('origin') || "",
    destination: searchParams.get('destination') || "",
    date: searchParams.get('date') || "",
    passengers: searchParams.get('passengers') || "1",
    adults: searchParams.get('adults') || "1",
    children: searchParams.get('children') || "0",
    infants: searchParams.get('infants') || "0",
    cabinClass: searchParams.get('cabinClass') || "economy",
    returnDate: searchParams.get('returnDate') || undefined,
  };

  const { data: flights, isLoading, error } = useFlightSearch(params);

  const defaultValues = {
    origin: params.origin,
    destination: params.destination,
    date: params.date ? new Date(params.date) : undefined,
    passengers: params.passengers,
  };

  const [sortBy, setSortBy] = useState<SortOption>("cheapest");
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());
  const [selectedDepartureTimes, setSelectedDepartureTimes] = useState<Set<DepartureTime>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const uniqueAirlines = useMemo(() => {
    if (!flights) return [];
    return Array.from(new Set(flights.map(f => f.airline))).sort();
  }, [flights]);

  const priceExtents = useMemo(() => {
    if (!flights || flights.length === 0) return { min: 0, max: 1000 };
    const prices = flights.map(f => f.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [flights]);

  const toggleSetItem = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStops.size > 0) count++;
    if (selectedAirlines.size > 0) count++;
    if (selectedDepartureTimes.size > 0) count++;
    if (priceRange && (priceRange[0] > priceExtents.min || priceRange[1] < priceExtents.max)) count++;
    return count;
  }, [selectedStops, selectedAirlines, selectedDepartureTimes, priceRange, priceExtents]);

  const clearFilters = useCallback(() => {
    setSelectedStops(new Set());
    setSelectedAirlines(new Set());
    setSelectedDepartureTimes(new Set());
    setPriceRange(null);
  }, []);

  const filteredAndSortedFlights = useMemo(() => {
    if (!flights) return [];

    let filtered = flights.filter((flight: FlightOffer) => {
      if (selectedStops.size > 0) {
        const bucket = getStopsBucket(flight.stops);
        if (!selectedStops.has(bucket)) return false;
      }

      if (selectedAirlines.size > 0) {
        if (!selectedAirlines.has(flight.airline)) return false;
      }

      if (selectedDepartureTimes.size > 0) {
        const bucket = getDepartureTimeBucket(flight.departureTime);
        if (!selectedDepartureTimes.has(bucket)) return false;
      }

      if (priceRange) {
        if (flight.price < priceRange[0] || flight.price > priceRange[1]) return false;
      }

      return true;
    });

    filtered.sort((a: FlightOffer, b: FlightOffer) => {
      switch (sortBy) {
        case "cheapest":
          return a.price - b.price;
        case "fastest":
          return parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration);
        case "best": {
          const scoreA = a.price * 0.6 + parseDurationToMinutes(a.duration) * 0.4;
          const scoreB = b.price * 0.6 + parseDurationToMinutes(b.duration) * 0.4;
          return scoreA - scoreB;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [flights, selectedStops, selectedAirlines, selectedDepartureTimes, priceRange, sortBy]);

  const stopsOptions = [
    { key: "direct", label: t("flight.direct") || "Direct" },
    { key: "1stop", label: `1 ${t("flight.stop") || "stop"}` },
    { key: "2plus", label: `2+ ${t("flight.stops") || "stops"}` },
  ];

  const departureTimeOptions: { key: DepartureTime; label: string; icon: typeof Sun }[] = [
    { key: "morning", label: t("results.morning") || "Morning (06-12)", icon: Sunrise },
    { key: "afternoon", label: t("results.afternoon") || "Afternoon (12-18)", icon: Sun },
    { key: "evening", label: t("results.evening") || "Evening (18-24)", icon: Sunset },
    { key: "night", label: t("results.night") || "Night (00-06)", icon: Moon },
  ];

  const formatPrice = (amount: number) => {
    const currency = flights?.[0]?.currency || "USD";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <Filter className="h-5 w-5 text-blue-500" /> {t("results.filters") || "Filters"}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-testid="button-clear-filters"
            className="text-blue-600 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            {t("results.clear_filters") || "Clear"}
          </Button>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-700">{t("results.stops_filter") || "Stops"}</h4>
        <div className="space-y-2.5">
          {stopsOptions.map(opt => (
            <label
              key={opt.key}
              className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
              data-testid={`filter-stops-${opt.key}`}
            >
              <input
                type="checkbox"
                className="rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-500/30 h-4 w-4"
                checked={selectedStops.has(opt.key)}
                onChange={() => toggleSetItem(setSelectedStops, opt.key)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-700">{t("results.airlines_filter") || "Airlines"}</h4>
        <div className="space-y-2.5">
          {uniqueAirlines.length > 0 ? uniqueAirlines.map(airline => (
            <label
              key={airline}
              className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
              data-testid={`filter-airline-${airline}`}
            >
              <input
                type="checkbox"
                className="rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-500/30 h-4 w-4"
                checked={selectedAirlines.has(airline)}
                onChange={() => toggleSetItem(setSelectedAirlines, airline)}
              />
              {airline}
            </label>
          )) : (
            <p className="text-xs text-gray-400">{t("results.no_airlines") || "No airlines available"}</p>
          )}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-700">{t("results.price_range") || "Price Range"}</h4>
        {priceExtents.min < priceExtents.max ? (
          <div className="space-y-3">
            <Slider
              data-testid="slider-price-range"
              min={priceExtents.min}
              max={priceExtents.max}
              step={1}
              value={priceRange || [priceExtents.min, priceExtents.max]}
              onValueChange={(val) => setPriceRange([val[0], val[1]])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span data-testid="text-price-min">{formatPrice(priceRange ? priceRange[0] : priceExtents.min)}</span>
              <span data-testid="text-price-max">{formatPrice(priceRange ? priceRange[1] : priceExtents.max)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">{t("results.no_price_data") || "No price data"}</p>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-700">{t("results.departure_time") || "Departure Time"}</h4>
        <div className="space-y-2.5">
          {departureTimeOptions.map(opt => {
            const Icon = opt.icon;
            return (
              <label
                key={opt.key}
                className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                data-testid={`filter-departure-${opt.key}`}
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-500/30 h-4 w-4"
                  checked={selectedDepartureTimes.has(opt.key)}
                  onChange={() => toggleSetItem(setSelectedDepartureTimes, opt.key)}
                />
                <Icon className="h-3.5 w-3.5 text-gray-400" />
                {opt.label}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO title="Resultados da Pesquisa" description="Compare voos e encontre as melhores ofertas de passagens aéreas. Preços atualizados em tempo real." path="/search" noindex={true} />
      <div className="bg-white border-b border-gray-200 shadow-sm pb-6 pt-8 px-4">
        <div className="container mx-auto max-w-6xl">
           <FlightSearchForm defaultValues={defaultValues} />
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-24">
              {filterPanel}
            </div>
          </div>

          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent side="left" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("results.filters") || "Filters"}</SheetTitle>
                <SheetDescription>{t("results.filter_desc") || "Refine your search results"}</SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                {filterPanel}
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:col-span-9 space-y-4">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900" data-testid="text-results-count">
                  {isLoading
                    ? t("results.searching") || "Searching..."
                    : `${filteredAndSortedFlights.length} ${t("results.flights_found") || "flights found"}`}
                </h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" data-testid="badge-active-filters">
                    {activeFilterCount} {activeFilterCount === 1
                      ? (t("results.filter_active") || "filter")
                      : (t("results.filters_active") || "filters")}
                  </Badge>
                )}
                {activeFilterCount > 0 && flights && filteredAndSortedFlights.length < flights.length && (
                  <span className="text-xs text-gray-400" data-testid="text-total-count">
                    ({t("results.of") || "of"} {flights.length})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden border-gray-200 bg-white text-gray-700"
                  onClick={() => setMobileFiltersOpen(true)}
                  data-testid="button-mobile-filters"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t("results.filters") || "Filters"}
                  {activeFilterCount > 0 && (
                    <Badge variant="default" className="ml-1.5 text-[10px] px-1.5 py-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                <select
                  className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-700 cursor-pointer shadow-sm"
                  data-testid="select-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="cheapest">{t("results.sort_cheapest") || "Cheapest"}</option>
                  <option value="fastest">{t("results.sort_fastest") || "Fastest"}</option>
                  <option value="best">{t("results.sort_best") || "Best"}</option>
                </select>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">{t("results.searching_airlines") || "Searching airlines..."}</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-200 text-red-600">
                <AlertCircle className="h-10 w-10 mb-4" />
                <p className="font-medium">{t("results.error") || "Failed to load flights."}</p>
              </div>
            )}

            {!isLoading && !error && flights?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plane className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t("results.no_flights") || "No flights found"}</h3>
                <p className="text-gray-500">{t("results.no_flights_desc") || "Try adjusting your search."}</p>
              </div>
            )}

            {!isLoading && !error && flights && flights.length > 0 && filteredAndSortedFlights.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Filter className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t("results.no_matching_flights") || "No matching flights"}</h3>
                <p className="text-gray-500 mb-4">{t("results.adjust_filters") || "Try adjusting your filters."}</p>
                <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                  {t("results.clear_filters") || "Clear Filters"}
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {filteredAndSortedFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
