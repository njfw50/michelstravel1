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

function formatDurationUtil(duration: string): string {
  if (!duration) return "";
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
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

const SEARCH_STEPS = [
  { key: "step1", icon: Globe },
  { key: "step2", icon: BarChart3 },
  { key: "step3", icon: Armchair },
  { key: "step4", icon: Sparkles },
  { key: "step5", icon: CheckCircle2 },
];

import FlightSearchProgress from "@/components/FlightSearchProgress";

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
      tripType: (params as any).tripType || (isRoundTrip ? "round-trip" : "one-way"),
      legs: isMultiCity ? multiCityLegs : undefined,
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
    <div className="min-h-screen bg-slate-50/50">
      <SEO title="Resultados da Pesquisa | Michels Travel" path="/search" noindex={true} />
      
      <div className="sticky top-[88px] z-40 w-full mb-8">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="bg-white/40 backdrop-blur-3xl border border-white/20 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-1">
            <FlightSearchForm defaultValues={defaultValues} isCompact={true} className="shadow-none border-none !bg-transparent" />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <aside className="hidden lg:block lg:col-span-3 space-y-10">
            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  {t("results.filters") || "Filtros"}
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setSelectedStops(new Set()); setSelectedAirlines(new Set()); setPriceRange(null); }} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-black transition-colors">
                    Limpar
                  </button>
                )}
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faixa de Preço</p>
                  <Slider 
                    min={priceExtents.min} 
                    max={priceExtents.max} 
                    value={priceRange || [priceExtents.min, priceExtents.max]} 
                    onValueChange={v => setPriceRange([v[0], v[1]])} 
                    className="!py-4"
                  />
                  <div className="flex justify-between text-[11px] font-black text-slate-900 font-mono">
                    <span>{formatPrice(priceRange?.[0] || priceExtents.min)}</span>
                    <span>{formatPrice(priceRange?.[1] || priceExtents.max)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Companhias</p>
                  <div className="flex flex-col gap-3">
                    {uniqueAirlines.map(airline => (
                      <label key={airline} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                           <input 
                             type="checkbox" 
                             checked={selectedAirlines.has(airline)} 
                             onChange={() => toggleSetItem(setSelectedAirlines, airline)}
                             className="peer h-5 w-5 rounded-lg border-2 border-slate-200 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer appearance-none"
                           />
                           <CheckCircle2 className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{airline}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-slate-100 pb-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 px-4 py-1.5 bg-blue-50 rounded-full">
                  Curadoria Michels Travel
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
                  {filteredAndSortedFlights.length} {filteredAndSortedFlights.length === 1 ? "Opção Disponível" : "Opções Encontradas"}
                </h1>
              </div>
              
              {!isSearching && (
                <div className="flex items-center gap-4">
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value as SortOption)} 
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-900 focus:border-blue-600 focus:outline-none transition-all shadow-sm"
                  >
                    <option value="cheapest">Menor Preço</option>
                    <option value="fastest">Mais Rápido</option>
                    <option value="best">Melhor Custo</option>
                  </select>
                </div>
              )}
            </div>

            <AnimatePresence>
              {isSearching && (
                <FlightSearchProgress 
                  origin={params.origin || "---"} 
                  destination={params.destination || "---"} 
                />
              )}
            </AnimatePresence>

            {!isSearching && (
              <div className="space-y-6">
                {showTwoStepFlow && !selectedOutboundKey ? (
                  Array.from(offerMatrix!.outboundMap.entries()).map(([k, o]) => (
                    <Card 
                      key={k} 
                      className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                      onClick={() => setSelectedOutboundKey(k)}
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-8">
                          <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-slate-50 flex items-center justify-center rounded-2xl border border-slate-100 p-3">
                              <img src={o.logoUrl} className="h-full w-full object-contain" />
                            </div>
                             <div>
                               <p className="text-xl font-black text-slate-900 tracking-tight">{o.airline}</p>
                               <div className="mt-2 flex items-center gap-4">
                                  <span className="text-3xl font-black text-slate-900">{format(parseISO(o.slice.segments[0].departureTime), "HH:mm")}</span>
                                  <ArrowRight className="h-4 w-4 text-slate-300" />
                                  <span className="text-3xl font-black text-slate-900">{format(parseISO(o.slice.segments[o.slice.segments.length-1].arrivalTime), "HH:mm")}</span>
                               </div>
                               <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{o.slice.originCode} para {o.slice.destinationCode}</p>
                             </div>
                          </div>
                        </div>
                        <div className="w-full md:w-[240px] bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-8 flex flex-col justify-center items-center md:items-end gap-6">
                          <div className="text-center md:text-right">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ida a partir de</p>
                             <p className="text-4xl font-black text-blue-600 tracking-tighter leading-none mt-1">{formatPrice(o.lowestPrice)}</p>
                          </div>
                          <Button className="w-full h-12 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20">
                            Selecionar Ida <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : showTwoStepFlow && selectedOutboundKey ? (
                  <div className="space-y-6">
                    <div className="bg-blue-600 p-6 rounded-[30px] shadow-xl text-white flex justify-between items-center animate-in fade-in slide-in-from-top-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100">Voo de Ida selecionado</p>
                        <h3 className="text-xl font-bold mt-1">Agora selecione seu voo de Volta</h3>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedOutboundKey(null)} className="rounded-full border-white/30 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest px-6 h-10">Mudar Ida</Button>
                    </div>
                    {filteredAndSortedFlights.filter(f => getOutboundKey(f) === selectedOutboundKey).map(f => (
                      <FlightCard key={f.id} flight={f} />
                    ))}
                  </div>
                ) : filteredAndSortedFlights.length > 0 ? (
                  filteredAndSortedFlights.map(f => (
                    <FlightCard key={f.id} flight={f} />
                  ))
                ) : (
                  <Card className="p-20 text-center rounded-[40px] border-dashed border-2 bg-transparent">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nenhum voo encontrado</h3>
                    <p className="text-sm text-slate-400 mt-1">Tente ajustar seus filtros ou mudar as datas da pesquisa.</p>
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
