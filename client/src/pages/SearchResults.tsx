import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { FlightCard } from "@/components/FlightCard";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";
import SeniorFlightOptionCard from "@/components/SeniorFlightOptionCard";
import { useFlightSearch, type FlightSearchQuery } from "@/hooks/use-flights";
import {
  Loader2,
  Filter,
  AlertCircle,
  Plane,
  X,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Globe,
  BarChart3,
  Armchair,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  HeartHandshake,
  MessageCircle,
  TrendingDown,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { enforceI18n } from "@/lib/enforceI18n";
import { SEO } from "@/components/SEO";
import { format, parseISO, isValid } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  AGENCY_WHATSAPP_DISPLAY,
  buildWhatsAppHref,
  buildWhatsAppMessage,
} from "@/lib/contact";
import { openChatbotAssistant } from "@/lib/chatbot";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { FlightOffer, FlightSlice } from "@shared/schema";
import {
  buildSeniorRecommendations,
  getSeniorFlightInsight,
  type SeniorBagPreference,
  type SeniorConnectionPreference,
  type SeniorPreferences,
  type SeniorPriority,
  type SeniorTimePreference,
} from "@/lib/senior-flight";
import FlightSearchProgress from "@/components/FlightSearchProgress";

type SortOption = "cheapest" | "fastest" | "best";
type DepartureTime = "morning" | "afternoon" | "evening" | "night";

function parseDurationToMinutes(duration: string): number {
  if (!duration) return 0;
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  return hours * 60 + minutes;
}

function getStopsBucket(stops: number): string {
  if (stops === 0) return "direct";
  if (stops === 1) return "1stop";
  return "2plus";
}

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const searchParams = new URLSearchParams(window.location.search);

  // URL State
  const tripType = searchParams.get("tripType");
  const legsRaw = searchParams.get("legs");
  const isRoundTrip = !!searchParams.get("returnDate");

  // Memoized Helpers
  const isMultiCity = tripType === "multi-city" && !!legsRaw;

  const multiCityLegs = useMemo(() => {
    try {
      return isMultiCity ? JSON.parse(legsRaw!) : [];
    } catch {
      return [];
    }
  }, [isMultiCity, legsRaw]);

  const params: FlightSearchQuery = useMemo(() => (isMultiCity ? {
    origin: multiCityLegs[0]?.origin || "",
    destination: multiCityLegs[0]?.destination || "",
    date: multiCityLegs[0]?.date || "",
    passengers: searchParams.get("passengers") || "1",
    adults: searchParams.get("adults") || "1",
    children: searchParams.get("children") || "0",
    infants: searchParams.get("infants") || "0",
    cabinClass: searchParams.get("cabinClass") || "economy",
    tripType: "multi-city",
    legs: legsRaw || undefined,
  } : {
    origin: searchParams.get("origin") || "",
    destination: searchParams.get("destination") || "",
    date: searchParams.get("date") || "",
    passengers: searchParams.get("passengers") || "1",
    adults: searchParams.get("adults") || "1",
    children: searchParams.get("children") || "0",
    infants: searchParams.get("infants") || "0",
    cabinClass: searchParams.get("cabinClass") || "economy",
    returnDate: searchParams.get("returnDate") || undefined,
    tripType: searchParams.get("tripType") || "one-way",
  }), [isMultiCity, multiCityLegs, searchParams, legsRaw]);

  // Data Loading
  const { data: flights, isLoading, isFetching } = useFlightSearch(params);

  // Component State
  const [showAnimation, setShowAnimation] = useState(true);
  const [selectedOutboundKey, setSelectedOutboundKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("cheapest");
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const priceLocale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";

  // Animation Control
  const searchKey = useMemo(() => JSON.stringify(params), [params]);
  useEffect(() => {
    setShowAnimation(true);
    setSelectedOutboundKey(null);
  }, [searchKey]);

  useEffect(() => {
    if (!isLoading && !isFetching && showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isFetching, showAnimation]);

  const isSearching = isLoading || isFetching || showAnimation;

  // Derived Values
  const priceExtents = useMemo(() => {
    if (!flights || flights.length === 0) return { min: 0, max: 10000 };
    const prices = flights.map((f) => f.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [flights]);

  const uniqueAirlines = useMemo(() => {
    if (!flights) return [];
    return Array.from(new Set(flights.map((f) => f.airline))).sort();
  }, [flights]);

  const defaultValues = useMemo(() => {
    const parseDate = (d: any) => {
      if (!d) return undefined;
      const parsed = parseISO(d);
      return isValid(parsed) ? parsed : undefined;
    };
    const { date, returnDate, ...rest } = params;
    return {
      ...rest,
      origin: params.origin || "",
      destination: params.destination || "",
      passengers: params.passengers || "1",
      date: parseDate(date),
      returnDate: parseDate(returnDate),
      tripType: params.tripType || (isRoundTrip ? "round-trip" : "one-way"),
      legs: isMultiCity ? multiCityLegs.map((l: any) => ({ ...l, date: parseDate(l.date) })) : undefined,
    };
  }, [params, isRoundTrip, isMultiCity, multiCityLegs]);

  // Common sorting logic
  const compareFlights = useCallback((a: any, b: any) => {
    switch (sortBy) {
      case "cheapest": return a.price - b.price;
      case "fastest": return parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration);
      case "best": return (a.price * 0.6 + parseDurationToMinutes(a.duration) * 0.4) - (b.price * 0.6 + parseDurationToMinutes(b.duration) * 0.4);
      default: return 0;
    }
  }, [sortBy]);

  // Filter Logic
  const filteredAndSortedFlights = useMemo(() => {
    if (!flights) return [];
    let filtered = flights.filter((flight) => {
      if (selectedStops.size > 0 && !selectedStops.has(getStopsBucket(flight.stops))) return false;
      if (selectedAirlines.size > 0 && !selectedAirlines.has(flight.airline)) return false;
      if (priceRange && (flight.price < priceRange[0] || flight.price > priceRange[1])) return false;
      return true;
    });
    return filtered.sort(compareFlights);
  }, [flights, selectedStops, selectedAirlines, priceRange, compareFlights]);

  const getOutboundKey = useCallback((flight: any) => {
    if (!flight.slices?.[0]) return flight.id;
    return flight.slices[0].segments.map((seg: any) => `${seg.flightNumber}-${seg.departureTime}`).join("|");
  }, []);

  const offerMatrix = useMemo(() => {
    if (!isRoundTrip || !flights?.length) return null;
    const outboundMap = new Map<string, any>();
    flights.forEach(f => {
      if (!f.slices || f.slices.length < 2) return;
      const obKey = getOutboundKey(f);
      if (!outboundMap.has(obKey) || f.price < outboundMap.get(obKey).lowestPrice) {
        outboundMap.set(obKey, { slice: f.slices[0], airline: f.airline, logoUrl: f.logoUrl, lowestPrice: f.price, offer: f });
      }
    });
    return { outboundMap };
  }, [flights, isRoundTrip, getOutboundKey]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStops.size > 0) count++;
    if (selectedAirlines.size > 0) count++;
    if (priceRange && (priceRange[0] > priceExtents.min || priceRange[1] < priceExtents.max)) count++;
    return count;
  }, [selectedStops, selectedAirlines, priceRange, priceExtents]);

  const toggleSetItem = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  }, []);

  const formatPrice = (amount: number) => {
    const currency = flights?.[0]?.currency || "USD";
    return new Intl.NumberFormat(priceLocale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const showTwoStepFlow = isRoundTrip && offerMatrix !== null;

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-blue-500/30">
      <SEO title="Search Results | Michels Travel" path="/search" noindex={true} />
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-50 w-full mb-10 pt-8">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl p-1 overflow-hidden transition-all hover:bg-slate-900/60">
            <FlightSearchForm defaultValues={defaultValues as any} isCompact={true} className="shadow-none border-none !bg-transparent" />
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Filters Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8">
            <div className="sticky top-[140px] bg-slate-900/60 backdrop-blur-3xl rounded-[32px] border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                  <Filter className="h-4 w-4 text-blue-500" />
                  {t("results.filters") || "Filters"}
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setSelectedStops(new Set()); setSelectedAirlines(new Set()); setPriceRange(null); }} className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors">
                    {t("results.clear_filters")}
                  </button>
                )}
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("results.price_range")}</p>
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400 text-[10px] font-black">{formatPrice(priceRange?.[1] || priceExtents.max)}</Badge>
                  </div>
                  <Slider 
                    min={priceExtents.min} 
                    max={priceExtents.max} 
                    value={priceRange || [priceExtents.min, priceExtents.max]} 
                    onValueChange={v => setPriceRange([v[0], v[1]])} 
                    className="!py-4"
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <span>{formatPrice(priceRange?.[0] || priceExtents.min)}</span>
                    <span>{formatPrice(priceRange?.[1] || priceExtents.max)}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("results.airlines_filter")}</p>
                  <div className="flex flex-col gap-4">
                    {uniqueAirlines.map(airline => (
                      <label key={airline} className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity">
                        <div className="relative flex items-center justify-center">
                           <input 
                             type="checkbox" 
                             checked={selectedAirlines.has(airline)} 
                             onChange={() => toggleSetItem(setSelectedAirlines, airline)}
                             className="peer h-6 w-6 rounded-xl border-2 border-white/5 bg-slate-950 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer appearance-none shadow-xl"
                           />
                           <CheckCircle2 className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest truncate">{airline}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results Main Section */}
          <main className="lg:col-span-9">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full shadow-xl shadow-blue-500/5">
                    {t("results.senior_badge")}
                  </span>
                  {flights && flights.length > 0 && (
                    <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-400 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                       <TrendingDown className="h-3 w-3" />
                       {t("results.filter_active")}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                  {filteredAndSortedFlights.length} {filteredAndSortedFlights.length === 1 ? t("results.option") : t("results.options")} {t("results.found")}
                </h1>
              </div>
              
              {!isSearching && (
                <div className="flex items-center gap-3">
                  <Sheet>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="lg:hidden h-12 rounded-2xl border-white/10 bg-slate-900/60 text-[10px] font-black uppercase tracking-widest text-white gap-2">
                          <Filter className="h-4 w-4 text-blue-400" />
                          {t("results.filters")}
                          {activeFilterCount > 0 && <Badge className="ml-1 bg-blue-600 h-5 w-5 p-0 flex items-center justify-center rounded-full">{activeFilterCount}</Badge>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[calc(100vw-2rem)] p-6 bg-slate-950/95 backdrop-blur-3xl border-white/10 rounded-[32px] shadow-2xl">
                         <div className="space-y-8">
                            <div className="flex justify-between items-center">
                              <h3 className="text-sm font-black uppercase tracking-widest text-white">Filtros</h3>
                              {activeFilterCount > 0 && (
                                <button onClick={() => { setSelectedStops(new Set()); setSelectedAirlines(new Set()); setPriceRange(null); }} className="text-[10px] font-black uppercase tracking-widest text-blue-400">Limpar</button>
                              )}
                            </div>
                            <div className="space-y-6">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preço Máximo</p>
                              <Slider 
                                min={priceExtents.min} 
                                max={priceExtents.max} 
                                value={priceRange || [priceExtents.min, priceExtents.max]} 
                                onValueChange={v => setPriceRange([v[0], v[1]])} 
                              />
                              <div className="flex justify-between text-[10px] font-black text-slate-400">
                                <span>{formatPrice(priceRange?.[0] || priceExtents.min)}</span>
                                <span>{formatPrice(priceRange?.[1] || priceExtents.max)}</span>
                              </div>
                            </div>
                         </div>
                      </PopoverContent>
                    </Popover>
                  </Sheet>

                  <div className="flex items-center gap-4 bg-slate-900/60 p-1 rounded-2xl border border-white/5 shadow-2xl">
                    <select 
                      value={sortBy} 
                      onChange={e => setSortBy(e.target.value as SortOption)} 
                      className="h-10 md:h-12 rounded-xl bg-transparent px-4 md:px-6 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none transition-all cursor-pointer min-w-[140px] md:min-w-[200px]"
                    >
                      <option value="cheapest" className="bg-slate-950">{t("results.sort_cheapest")}</option>
                      <option value="fastest" className="bg-slate-950">{t("results.sort_fastest")}</option>
                      <option value="best" className="bg-slate-950">{t("results.sort_best")}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isSearching && (
                <div className="flex items-center justify-center min-h-[500px] w-full py-20">
                  <FlightSearchProgress 
                    origin={params.origin || "---"} 
                    destination={params.destination || "---"} 
                  />
                </div>
              )}
            </AnimatePresence>

            {!isSearching && (
              <div className="space-y-8">
                {/* Legal Info Card */}
                <div className="relative overflow-hidden rounded-[32px] border border-blue-500/10 bg-blue-500/5 p-6 backdrop-blur-md mb-8">
                   <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                         <Info className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 leading-none">{t("results.transparency_title")}</p>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed">
                          {t("results.transparency_desc")}
                        </p>
                      </div>
                   </div>
                </div>

                {showTwoStepFlow && !selectedOutboundKey ? (
                  Array.from(offerMatrix!.outboundMap.entries()).map(([k, o]) => (
                    <Card 
                      key={k} 
                      className="group relative overflow-hidden rounded-[40px] border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:bg-slate-900/60 hover:-translate-y-1 cursor-pointer"
                      onClick={() => setSelectedOutboundKey(k)}
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-8 md:p-10">
                          <div className="flex items-center gap-8">
                            <div className="h-20 w-20 bg-white/5 backdrop-blur-md flex items-center justify-center rounded-[24px] border border-white/10 p-4 transition-all group-hover:scale-105 shadow-xl">
                              <img src={o.logoUrl} alt={o.airline} className="h-full w-full object-contain" />
                            </div>
                             <div>
                               <p className="text-2xl font-black text-white tracking-tight leading-none">{o.airline}</p>
                               <div className="mt-4 flex items-center gap-6">
                                  <span className="text-4xl font-black text-white tracking-tighter">{format(parseISO(o.slice.segments[0].departureTime), "HH:mm")}</span>
                                  <ArrowRight className="h-5 w-5 text-slate-700" />
                                  <span className="text-4xl font-black text-white tracking-tighter">{format(parseISO(o.slice.segments[o.slice.segments.length-1].arrivalTime), "HH:mm")}</span>
                               </div>
                               <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">{o.slice.originCode} <span className="text-slate-700 mx-2">→</span> {o.slice.destinationCode}</p>
                             </div>
                          </div>
                        </div>
                        <div className="w-full md:w-[280px] bg-white/5 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/5 p-8 md:p-10 flex flex-col justify-center items-center md:items-end gap-6 shadow-inner">
                          <div className="text-center md:text-right">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Outbound from</p>
                             <p className="text-5xl font-black text-white tracking-tighter leading-none mt-2">{formatPrice(o.lowestPrice)}</p>
                          </div>
                          <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
                            SELECT OUTBOUND <ArrowRight className="ml-3 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : showTwoStepFlow && selectedOutboundKey ? (
                  <div className="space-y-8">
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-600 p-8 rounded-[40px] shadow-2xl shadow-blue-600/20 text-white flex justify-between items-center"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-200">{t("results.outbound_selected")}</p>
                        <h3 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">{t("results.select_return")}</h3>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedOutboundKey(null)} className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20 font-black uppercase text-[10px] tracking-widest px-8 h-12 shadow-xl">{t("results.change_outbound")}</Button>
                    </motion.div>
                    {filteredAndSortedFlights.filter(f => getOutboundKey(f) === selectedOutboundKey).map(f => (
                      <FlightCard key={f.id} flight={f} />
                    ))}
                  </div>
                ) : filteredAndSortedFlights.length > 0 ? (
                  filteredAndSortedFlights.map(f => (
                    <FlightCard key={f.id} flight={f} />
                  ))
                ) : (
                  <Card className="p-24 text-center rounded-[50px] border-dashed border-2 border-white/5 bg-slate-900/20 backdrop-blur-xl">
                    <AlertCircle className="h-16 w-16 text-slate-800 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t("results.no_flights")}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm mx-auto">{t("results.no_flights_desc")}</p>
                    <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mt-8 text-blue-400 font-black uppercase tracking-widest text-[10px] hover:text-white">{t("results.adjust_search")}</Button>
                  </Card>
                )}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
