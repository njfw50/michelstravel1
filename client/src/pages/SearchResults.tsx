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

function FlightSearchAnimation({ t }: { t: (key: string) => string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < SEARCH_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return Math.min(prev + Math.random() * 3 + 1, 95);
      });
    }, 200);
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-card rounded-md shadow-sm border border-border overflow-hidden p-6 text-center">
      <div className="flex flex-col items-center max-w-md mx-auto py-8">
        <div className="relative mb-8">
          <div className="h-20 w-20 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <motion.div animate={{ x: [0, 40, 0], y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Plane className="h-8 w-8 text-blue-500 -rotate-12" />
            </motion.div>
          </div>
        </div>
        <h3 className="text-lg font-bold mb-4">{t("search_loading.title")}</h3>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6 overflow-hidden">
          <motion.div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="w-full space-y-3">
          {SEARCH_STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isComplete = idx < currentStep;
            const Icon = step.icon;
            return (
              <div key={step.key} className={`flex items-center gap-3 p-2 rounded-md ${isActive ? "bg-blue-50" : ""}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isComplete ? "bg-green-100" : isActive ? "bg-blue-100" : "bg-gray-100"}`}>
                  {isComplete ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-500" : "text-gray-400"}`} />}
                </div>
                <span className={`text-sm ${isComplete ? "text-green-600 line-through" : isActive ? "font-bold" : "text-gray-500"}`}>
                  {t(`search_loading.${step.key}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const searchParams = new URLSearchParams(window.location.search);

  // URL State
  const tripType = searchParams.get("tripType");
  const legsRaw = searchParams.get("legs");
  const isEasyMode = searchParams.get("ui") === "easy";
  const seniorPriority = (searchParams.get("seniorPriority") || "comfort") as SeniorPriority;
  const seniorConnections = (searchParams.get("seniorConnections") || "one") as SeniorConnectionPreference;
  const seniorBags = (searchParams.get("seniorBags") || "flexible") as SeniorBagPreference;
  const seniorTime = (searchParams.get("seniorTime") || "day") as SeniorTimePreference;

  // Memoized Helpers
  const isMultiCity = tripType === "multi-city" && !!legsRaw;
  const isRoundTrip = !!searchParams.get("returnDate");

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
  const { data: flights, isLoading, isFetching, error } = useFlightSearch(params);

  // Component State
  const [showAnimation, setShowAnimation] = useState(true);
  const [selectedOutboundKey, setSelectedOutboundKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(isEasyMode ? "best" : "cheapest");
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());
  const [selectedDepartureTimes, setSelectedDepartureTimes] = useState<Set<DepartureTime>>(new Set());
  const [selectedReturnTimes, setSelectedReturnTimes] = useState<Set<DepartureTime>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showEasyExtraOptions, setShowEasyExtraOptions] = useState(false);

  const priceLocale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const FLIGHTS_PER_PAGE = isEasyMode ? 1 : 10;
  const [visibleOneWayCount, setVisibleOneWayCount] = useState(FLIGHTS_PER_PAGE);
  const [visibleOutboundCount, setVisibleOutboundCount] = useState(FLIGHTS_PER_PAGE);
  const [visibleReturnCount, setVisibleReturnCount] = useState(FLIGHTS_PER_PAGE);

  // Animation Control
  const searchKey = useMemo(() => JSON.stringify(params), [params]);
  useEffect(() => {
    setShowAnimation(true);
    setSelectedOutboundKey(null);
  }, [searchKey]);

  useEffect(() => {
    if (!isLoading && !isFetching && showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isFetching, showAnimation]);

  const isSearching = isLoading || isFetching || showAnimation;

  // Senior Preferences Logic
  const easyPreferences: SeniorPreferences = useMemo(() => ({
    priority: ["comfort", "fastest", "balanced", "cheapest"].includes(seniorPriority) ? seniorPriority : "comfort",
    connections: ["none", "one", "any"].includes(seniorConnections) ? seniorConnections : "one",
    bags: ["checked", "carry", "flexible"].includes(seniorBags) ? seniorBags : "flexible",
    time: ["day", "any"].includes(seniorTime) ? seniorTime : "day",
  }), [seniorPriority, seniorConnections, seniorBags, seniorTime]);

  const easyModeCopy = useMemo(() => ({
    badge: enforceI18n(t("results.senior_badge"), "results.senior_badge"),
    title: enforceI18n(t("results.senior_title"), "results.senior_title"),
    description: enforceI18n(t("results.senior_description").replace("{whatsapp}", AGENCY_WHATSAPP_DISPLAY), "results.senior_description"),
    call: enforceI18n(t("results.senior_call").replace("{whatsapp}", AGENCY_WHATSAPP_DISPLAY), "results.senior_call"),
    assistant: enforceI18n(t("results.senior_assistant"), "results.senior_assistant"),
    back: enforceI18n(t("results.senior_back"), "results.senior_back"),
    summaryTitle: enforceI18n(t("results.senior_summary_title"), "results.senior_summary_title"),
    summaryPriority: enforceI18n(t("results.senior_summary_priority"), "results.senior_summary_priority"),
    summaryConnections: enforceI18n(t("results.senior_summary_connections"), "results.senior_summary_connections"),
    summaryBags: enforceI18n(t("results.senior_summary_bags"), "results.senior_summary_bags"),
    summaryTime: enforceI18n(t("results.senior_summary_time"), "results.senior_summary_time"),
    showMore: enforceI18n(t("results.senior_show_more"), "results.senior_show_more"),
    hideMore: enforceI18n(t("results.senior_hide_more"), "results.senior_hide_more"),
    extraTitle: enforceI18n(t("results.senior_extra_title"), "results.senior_extra_title"),
    fallback: enforceI18n(t("results.senior_fallback"), "results.senior_fallback"),
    priorityComfort: enforceI18n(t("results.senior_priority_comfort"), "results.senior_priority_comfort"),
    priorityFastest: enforceI18n(t("results.senior_priority_fastest"), "results.senior_priority_fastest"),
    priorityBalanced: enforceI18n(t("results.senior_priority_balanced"), "results.senior_priority_balanced"),
    priorityCheapest: enforceI18n(t("results.senior_priority_cheapest"), "results.senior_priority_cheapest"),
    connectionsNone: enforceI18n(t("results.senior_connections_none"), "results.senior_connections_none"),
    connectionsOne: enforceI18n(t("results.senior_connections_one"), "results.senior_connections_one"),
    connectionsAny: enforceI18n(t("results.senior_connections_any"), "results.senior_connections_any"),
    bagsChecked: enforceI18n(t("results.senior_bags_checked"), "results.senior_bags_checked"),
    bagsCarry: enforceI18n(t("results.senior_bags_carry"), "results.senior_bags_carry"),
    bagsFlexible: enforceI18n(t("results.senior_bags_flexible"), "results.senior_bags_flexible"),
    timeDay: enforceI18n(t("results.senior_time_day"), "results.senior_time_day"),
    timeAny: enforceI18n(t("results.senior_time_any"), "results.senior_time_any"),
  }), [t, language]);

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

  // Key Helpers
  const getOutboundKey = useCallback((flight: FlightOffer) => {
    if (!flight.slices?.[0]) return flight.id;
    return flight.slices[0].segments.map((seg) => `${seg.flightNumber}-${seg.departureTime}`).join("|");
  }, []);

  const getReturnKey = useCallback((flight: FlightOffer) => {
    if (!flight.slices?.[1]) return flight.id;
    return flight.slices[1].segments.map((seg) => `${seg.flightNumber}-${seg.departureTime}`).join("|");
  }, []);

  // Filter Logic
  const compareFlights = useCallback((a: FlightOffer, b: FlightOffer) => {
    if (isEasyMode) {
      if (sortBy === "cheapest") return a.price - b.price || parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration);
      if (sortBy === "fastest") return parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration) || a.price - b.price;
      const insightA = getSeniorFlightInsight(a, easyPreferences);
      const insightB = getSeniorFlightInsight(b, easyPreferences);
      const scoreA = easyPreferences.priority === "balanced" || easyPreferences.priority === "cheapest" ? insightA.balancedScore : insightA.comfortScore;
      const scoreB = easyPreferences.priority === "balanced" || easyPreferences.priority === "cheapest" ? insightB.balancedScore : insightB.comfortScore;
      return scoreA - scoreB || a.price - b.price || parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration);
    }
    switch (sortBy) {
      case "cheapest": return a.price - b.price;
      case "fastest": return parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration);
      case "best": return (a.price * 0.6 + parseDurationToMinutes(a.duration) * 0.4) - (b.price * 0.6 + parseDurationToMinutes(b.duration) * 0.4);
      default: return 0;
    }
  }, [isEasyMode, sortBy, easyPreferences]);

  const filteredAndSortedFlights = useMemo(() => {
    if (!flights) return [];
    let filtered = flights.filter((flight) => {
      if (selectedStops.size > 0 && !selectedStops.has(getStopsBucket(flight.stops))) return false;
      if (selectedAirlines.size > 0 && !selectedAirlines.has(flight.airline)) return false;
      if (selectedDepartureTimes.size > 0 && !selectedDepartureTimes.has(getDepartureTimeBucket(flight.departureTime))) return false;
      if (selectedReturnTimes.size > 0 && flight.slices?.[1]?.segments?.[0]) {
        if (!selectedReturnTimes.has(getDepartureTimeBucket(flight.slices[1].segments[0].departureTime))) return false;
      }
      if (priceRange && (flight.price < priceRange[0] || flight.price > priceRange[1])) return false;
      return true;
    });
    return filtered.sort(compareFlights);
  }, [flights, selectedStops, selectedAirlines, selectedDepartureTimes, selectedReturnTimes, priceRange, compareFlights]);

  const offerMatrix = useMemo(() => {
    if (!isRoundTrip || !flights?.length) return null;
    const outboundMap = new Map<string, any>();
    const returnMap = new Map<string, any>();
    const comboMap = new Map<string, FlightOffer>();

    flights.forEach(f => {
      if (!f.slices || f.slices.length < 2) return;
      const obKey = getOutboundKey(f);
      const rtKey = getReturnKey(f);
      const comboKey = `${obKey}::${rtKey}`;

      if (!comboMap.has(comboKey) || f.price < comboMap.get(comboKey)!.price) comboMap.set(comboKey, f);
      if (!outboundMap.has(obKey) || f.price < outboundMap.get(obKey).lowestPrice) {
        outboundMap.set(obKey, { slice: f.slices[0], airline: f.airline, logoUrl: f.logoUrl, lowestPrice: f.price, offer: f });
      }
      if (!returnMap.has(rtKey) || f.price < returnMap.get(rtKey).lowestPrice) {
        returnMap.set(rtKey, { slice: f.slices[1], airline: f.airline, logoUrl: f.logoUrl, lowestPrice: f.price, offer: f });
      }
    });
    return { outboundMap, returnMap, comboMap };
  }, [flights, isRoundTrip, getOutboundKey, getReturnKey]);

  const filteredComboMap = useMemo(() => {
    const map = new Map<string, FlightOffer>();
    if (!isRoundTrip) return map;
    filteredAndSortedFlights.forEach(f => {
      if (!f.slices || f.slices.length < 2) return;
      const key = `${getOutboundKey(f)}::${getReturnKey(f)}`;
      if (!map.has(key) || f.price < map.get(key)!.price) map.set(key, f);
    });
    return map;
  }, [filteredAndSortedFlights, isRoundTrip, getOutboundKey, getReturnKey]);

  const outboundOptionsForDisplay = useMemo(() => {
    if (!offerMatrix) return [];
    const grouped = new Map<string, any>();
    filteredAndSortedFlights.forEach(f => {
      if (!f.slices?.[1]) return;
      const key = getOutboundKey(f);
      if (!grouped.has(key) || compareFlights(f, grouped.get(key).offer) < 0) {
        grouped.set(key, { slice: f.slices[0], airline: f.airline, logoUrl: f.logoUrl, lowestPrice: f.price, offer: f });
      }
    });
    return grouped.size ? Array.from(grouped.entries()).sort(([, a], [, b]) => compareFlights(a.offer, b.offer)) : Array.from(offerMatrix.outboundMap.entries()).sort(([, a], [, b]) => compareFlights(a.offer, b.offer));
  }, [offerMatrix, filteredAndSortedFlights, getOutboundKey, compareFlights]);

  const returnOptionsForSelected = useMemo(() => {
    if (!selectedOutboundKey) return [];
    const results: any[] = [];
    filteredComboMap.forEach((offer, key) => {
      if (key.startsWith(`${selectedOutboundKey}::`)) {
        results.push({ returnKey: getReturnKey(offer), slice: offer.slices![1], airline: offer.airline, logoUrl: offer.logoUrl, offer, price: offer.price });
      }
    });
    return results.sort((a, b) => compareFlights(a.offer, b.offer));
  }, [selectedOutboundKey, filteredComboMap, getReturnKey, compareFlights]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStops.size > 0) count++;
    if (selectedAirlines.size > 0) count++;
    if (selectedDepartureTimes.size > 0) count++;
    if (selectedReturnTimes.size > 0) count++;
    if (priceRange && (priceRange[0] > priceExtents.min || priceRange[1] < priceExtents.max)) count++;
    return count;
  }, [selectedStops, selectedAirlines, selectedDepartureTimes, selectedReturnTimes, priceRange, priceExtents]);

  const toggleSetItem = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedStops(new Set());
    setSelectedAirlines(new Set());
    setSelectedDepartureTimes(new Set());
    setSelectedReturnTimes(new Set());
    setPriceRange(null);
  }, []);

  const formatPrice = (amount: number) => {
    const currency = flights?.[0]?.currency || "USD";
    return new Intl.NumberFormat(priceLocale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const whatsAppHref = useMemo(() => buildWhatsAppHref(buildWhatsAppMessage(language)), [language]);
  const openAssistant = useCallback(() => openChatbotAssistant(), []);

  const showTwoStepFlow = isRoundTrip && offerMatrix !== null;

  // Render Section
  if (isEasyMode) {
    // Senior Mode Rendering
    const easyRecommendations = buildSeniorRecommendations(flights || [], easyPreferences);
    
    // Header for Senior Mode
    const seniorHeader = (
      <div className="p-6 bg-blue-600 rounded-[30px] text-white flex justify-between items-center flex-wrap gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">{easyModeCopy.title}</h1>
          <p className="text-blue-50 text-sm mt-1">{easyModeCopy.description}</p>
        </div>
        <div className="flex gap-2">
           <Button asChild className="rounded-full bg-white text-blue-600 hover:bg-blue-50">
             <a href={whatsAppHref} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />{easyModeCopy.call}</a>
           </Button>
           <Button variant="outline" onClick={openAssistant} className="rounded-full border-white/30 text-white hover:bg-white/10">
             <MessageCircle className="mr-2 h-4 w-4" />{easyModeCopy.assistant}
           </Button>
        </div>
      </div>
    );

    const summaryPanel = (
      <Card className="h-fit p-6 rounded-[30px] shadow-sm border-none bg-white">
        <p className="text-sm font-bold uppercase text-gray-500 mb-4">{easyModeCopy.summaryTitle}</p>
        <div className="space-y-3">
          {[
            { label: easyModeCopy.summaryPriority, value: easyPreferences.priority === "fastest" ? easyModeCopy.priorityFastest : easyPreferences.priority === "balanced" ? easyModeCopy.priorityBalanced : easyPreferences.priority === "cheapest" ? easyModeCopy.priorityCheapest : easyModeCopy.priorityComfort },
            { label: easyModeCopy.summaryConnections, value: easyPreferences.connections === "none" ? easyModeCopy.connectionsNone : easyPreferences.connections === "any" ? easyModeCopy.connectionsAny : easyPreferences.connections === "one" ? easyModeCopy.connectionsOne : easyModeCopy.connectionsAny },
            { label: easyModeCopy.summaryBags, value: easyPreferences.bags === "checked" ? easyModeCopy.bagsChecked : easyPreferences.bags === "carry" ? easyModeCopy.bagsCarry : easyModeCopy.bagsFlexible },
            { label: easyModeCopy.summaryTime, value: easyPreferences.time === "day" ? easyModeCopy.timeDay : easyModeCopy.timeAny },
          ].map(i => (
            <div key={i.label} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{i.label}</p>
              <p className="font-semibold text-gray-900">{i.value}</p>
            </div>
          ))}
        </div>
      </Card>
    );

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <SEO title="Resultados Senior" description="Voos organizados com foco em conforto." path="/search" noindex={true} />
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6">
              {summaryPanel}
              <Button variant="outline" className="w-full rounded-2xl py-6" onClick={() => window.history.back()}>
                {t("results.back_to_search") || "Voltar para Busca"}
              </Button>
            </aside>
            <main className="space-y-6">
              {seniorHeader}

              {isSearching ? <FlightSearchAnimation t={t} /> : (
                <div className="space-y-6">
                  {showTwoStepFlow && !selectedOutboundKey ? (
                    // Senior Two-Step: Step 1 (Outbound)
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-700 px-3 py-1">Passo 1 de 2</Badge>
                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Escolha sua Ida</h2>
                      </div>
                      {outboundOptionsForDisplay.map(([k, o]) => (
                        <Card 
                          key={k} 
                          className="p-6 rounded-[30px] cursor-pointer hover:shadow-xl transition-all border-none bg-white group"
                          onClick={() => setSelectedOutboundKey(k)}
                        >
                          <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                               <div className="h-16 w-16 bg-slate-50 rounded-2xl p-3 flex items-center justify-center border border-slate-100">
                                 <img src={o.logoUrl!} className="h-full w-full object-contain" />
                               </div>
                               <div>
                                 <p className="text-xl font-black text-slate-950 uppercase tracking-tight">{o.airline}</p>
                                 <div className="flex items-center gap-3 mt-1">
                                    <span className="text-2xl font-black text-slate-900">{format(parseISO(o.slice.segments[0].departureTime), "HH:mm")}</span>
                                    <ArrowRight className="h-4 w-4 text-slate-300" />
                                    <span className="text-2xl font-black text-slate-900">{format(parseISO(o.slice.segments[o.slice.segments.length-1].arrivalTime), "HH:mm")}</span>
                                 </div>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preços a partir de</p>
                               <p className="text-3xl font-black text-blue-600">{formatPrice(o.lowestPrice)}</p>
                               <Button className="mt-2 rounded-xl bg-blue-600 text-white font-bold group-hover:bg-blue-700">Explorar de Volta <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </>
                  ) : showTwoStepFlow && selectedOutboundKey ? (
                    // Senior Two-Step: Step 2 (Return)
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-700 px-3 py-1">Passo 2 de 2</Badge>
                          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Escolha sua Volta</h2>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOutboundKey(null)} className="text-blue-600">Mudar Ida</Button>
                      </div>
                      {returnOptionsForSelected.map(r => (
                        <SeniorFlightOptionCard 
                          key={r.returnKey} 
                          flight={r.offer} 
                          kind="balanced" 
                          insight={{ 
                            totalDurationMinutes: 0, 
                            totalStops: r.offer.stops, 
                            longestLayoverMinutes: 0, 
                            hasSensitiveHour: false, 
                            hasCheckedBag: true, 
                            hasCarryOn: true, 
                            reasonLine: "Melhor opção para sua volta combinada" 
                          }} 
                        />
                      ))}
                    </>
                  ) : (
                    // Standard Senior Results
                    <>
                      {easyRecommendations.recommendations.map(r => (
                        <SeniorFlightOptionCard key={`${r.kind}-${r.flight.id}`} flight={r.flight} insight={r.insight} kind={r.kind} />
                      ))}
                      {!isSearching && (
                        <Button variant="ghost" className="w-full" onClick={() => setShowEasyExtraOptions(!showEasyExtraOptions)}>
                          {showEasyExtraOptions ? easyModeCopy.hideMore : easyModeCopy.showMore}
                        </Button>
                      )}
                      {showEasyExtraOptions && easyRecommendations.rankedFlights.slice(0, 6).map(f => (
                        <FlightCard key={f.flight.id} flight={f.flight} simplified />
                      ))}
                    </>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }

  const filterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold"><Filter className="h-4 w-4" /> {t("results.filters") || "Filtros"}</div>
        {activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-blue-600">{t("results.clear_filters") || "Limpar"}</Button>}
      </div>
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{t("results.price_range") || "Preço"}</h4>
          <Slider min={priceExtents.min} max={priceExtents.max} value={priceRange || [priceExtents.min, priceExtents.max]} onValueChange={v => setPriceRange([v[0], v[1]])} />
          <div className="flex justify-between text-[10px] mt-2 text-gray-500 font-mono">
            <span>{formatPrice(priceRange?.[0] || priceExtents.min)}</span>
            <span>{formatPrice(priceRange?.[1] || priceExtents.max)}</span>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{t("results.airlines_filter") || "Companhias"}</h4>
          <div className="space-y-1">
            {uniqueAirlines.map(a => (
              <label key={a} className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors">
                <input type="checkbox" checked={selectedAirlines.has(a)} onChange={() => toggleSetItem(setSelectedAirlines, a)} className="rounded border-gray-300" />
                {a}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Resultados da Pesquisa" path="/search" noindex={true} />
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-4 py-4"><FlightSearchForm defaultValues={defaultValues} /></div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-3 h-fit sticky top-24 bg-white p-6 rounded-2xl border shadow-sm">
            {filterPanel}
          </aside>
          <main className="lg:col-span-9 space-y-6">
            <div className="flex justify-between items-center gap-4">
              <h2 className="text-xl font-bold">{isSearching ? t("results.searching") : t("results.flights_found", { count: filteredAndSortedFlights.length })}</h2>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="text-sm bg-white border rounded-lg px-3 py-2">
                <option value="cheapest">{t("results.sort_cheapest")}</option>
                <option value="fastest">{t("results.sort_fastest")}</option>
                <option value="best">{t("results.sort_best")}</option>
              </select>
            </div>

            {isSearching ? <FlightSearchAnimation t={t} /> : (
              <div className="space-y-4">
                {showTwoStepFlow && !selectedOutboundKey ? outboundOptionsForDisplay.map(([k, o]) => (
                  <Card 
                    key={k} 
                    className="p-5 cursor-pointer border-gray-100 hover:border-blue-400 hover:shadow-md transition-all rounded-2xl bg-white group" 
                    onClick={() => setSelectedOutboundKey(k)}
                  >
                    <div className="flex justify-between items-center gap-4">
                       <div className="flex gap-4 items-center">
                         <div className="h-12 w-12 bg-gray-50 rounded-xl p-2 flex items-center justify-center border border-gray-100">
                           <img src={o.logoUrl!} className="h-full w-full object-contain" />
                         </div>
                         <div>
                           <p className="font-bold text-gray-900">{o.airline}</p>
                           <p className="text-sm font-semibold text-gray-600">
                             {format(parseISO(o.slice.segments[0].departureTime), "HH:mm")} - {format(parseISO(o.slice.segments[o.slice.segments.length-1].arrivalTime), "HH:mm")}
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("flight.from") || "A partir de"}</p>
                         <p className="text-xl font-black text-blue-600 leading-tight">{formatPrice(o.lowestPrice)}</p>
                         <Button size="sm" className="mt-2 rounded-lg bg-blue-600 group-hover:bg-blue-700">Selecionar Ida</Button>
                       </div>
                    </div>
                  </Card>
                )) : showTwoStepFlow && selectedOutboundKey ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                       <p className="text-sm font-bold text-blue-800">Selecione o voo de volta para compor seu pacote</p>
                       <Button variant="ghost" size="sm" onClick={() => setSelectedOutboundKey(null)} className="text-blue-600 h-8">Mudar Ida</Button>
                    </div>
                    {returnOptionsForSelected.map(r => (
                      <FlightCard key={r.returnKey} flight={r.offer} />
                    ))}
                  </div>
                ) : filteredAndSortedFlights.slice(0, visibleOneWayCount).map(f => (
                  <FlightCard key={f.id} flight={f} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
