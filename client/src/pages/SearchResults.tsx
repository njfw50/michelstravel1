import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { FlightCard } from "@/components/FlightCard";
import { useFlightSearch } from "@/hooks/use-flights";
import { Loader2, Filter, AlertCircle, Plane, X, Sun, Sunrise, Sunset, Moon, Globe, BarChart3, Armchair, Sparkles, CheckCircle2, Clock, ArrowRight, PhoneCall, HeartHandshake, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AGENCY_PHONE_DISPLAY, AGENCY_PHONE_TEL } from "@/lib/contact";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { FlightOffer, FlightSlice } from "@shared/schema";

type SortOption = "cheapest" | "fastest" | "best";
type DepartureTime = "morning" | "afternoon" | "evening" | "night";

function parseDurationToMinutes(duration: string): number {
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  return hours * 60 + minutes;
}

function formatDurationUtil(duration: string): string {
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
  { key: "step1", icon: Globe, duration: 2500 },
  { key: "step2", icon: BarChart3, duration: 2500 },
  { key: "step3", icon: Armchair, duration: 2500 },
  { key: "step4", icon: Sparkles, duration: 2500 },
  { key: "step5", icon: CheckCircle2, duration: 2500 },
];

function FlightSearchAnimation({ t }: { t: (key: string) => string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < SEARCH_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        const increment = Math.random() * 3 + 1;
        return Math.min(prev + increment, 95);
      });
    }, 200);
    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="bg-white dark:bg-card rounded-md shadow-sm border border-border overflow-hidden" data-testid="search-loading-animation">
      <div className="relative px-6 py-12 md:py-16">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="h-20 w-20 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <motion.div
                animate={{ x: [0, 60, 0], y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="h-8 w-8 text-blue-500 dark:text-blue-400 -rotate-12" />
              </motion.div>
            </div>
            <motion.div
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2" data-testid="text-search-loading-title">
            {t("search_loading.title")}
          </h3>

          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="w-full space-y-3 mb-6">
            {SEARCH_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isComplete || isActive ? 1 : 0.3, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                    isActive ? "bg-blue-50 dark:bg-blue-950/50" : ""
                  }`}
                  data-testid={`search-step-${step.key}`}
                >
                  <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                    isComplete
                      ? "bg-green-100 dark:bg-green-900/50"
                      : isActive
                      ? "bg-blue-100 dark:bg-blue-900/50"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : isActive ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                        <Loader2 className="h-4 w-4 text-blue-500" />
                      </motion.div>
                    ) : (
                      <StepIcon className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isComplete ? "text-green-600 dark:text-green-400 line-through" : isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}>
                    {t(`search_loading.${step.key}`)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800/50 rounded-md px-4 py-2">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>{t("search_loading.tip")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchResults() {
  const [location] = useLocation();
  const { t, language } = useI18n();
  const searchParams = new URLSearchParams(window.location.search);
  const tripType = searchParams.get('tripType');
  const legsRaw = searchParams.get('legs');
  const isEasyMode = searchParams.get("ui") === "easy";
  const easyModeCopy = language === "en"
    ? {
        badge: "Senior support active",
        title: "Review the flights calmly, or call and finish by phone.",
        description: `If comparing options feels difficult, keep going online or call ${AGENCY_PHONE_DISPLAY} now and our team can continue with you.`,
        call: `Call ${AGENCY_PHONE_DISPLAY}`,
        assistant: "Open chat",
        back: "Back to Senior Support",
      }
    : language === "es"
      ? {
          badge: "Atencion senior activa",
          title: "Revise los vuelos con calma, o llame y cierre por telefono.",
          description: `Si comparar opciones parece dificil, siga en el sitio o llame ahora al ${AGENCY_PHONE_DISPLAY} y nuestro equipo continua con usted.`,
          call: `Llamar al ${AGENCY_PHONE_DISPLAY}`,
          assistant: "Abrir chat",
          back: "Volver a Atencion Senior",
        }
      : {
          badge: "Atendimento senior ativo",
          title: "Revise os voos com calma, ou ligue e feche por telefone.",
          description: `Se comparar opcoes parecer dificil, siga no site ou ligue agora para ${AGENCY_PHONE_DISPLAY} e nossa equipe continua com voce.`,
          call: `Ligar para ${AGENCY_PHONE_DISPLAY}`,
          assistant: "Abrir chat",
          back: "Voltar ao Atendimento Senior",
        };

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
    tripType: 'multi-city',
    legs: legsRaw || undefined,
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

  const { data: flights, isLoading, isFetching, error } = useFlightSearch(params);

  const searchKey = `${params.origin}-${params.destination}-${params.date}-${(params as any).returnDate || ''}-${params.passengers}-${params.adults}-${params.children}-${params.infants}-${params.cabinClass}-${(params as any).tripType || ''}-${(params as any).legs || ''}`;
  const [showAnimation, setShowAnimation] = useState(true);
  const [lastSearchKey, setLastSearchKey] = useState(searchKey);

  useEffect(() => {
    if (searchKey !== lastSearchKey) {
      setShowAnimation(true);
      setLastSearchKey(searchKey);
    }
  }, [searchKey, lastSearchKey]);

  useEffect(() => {
    if (!isLoading && !isFetching && showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isFetching, showAnimation]);

  const isSearching = (isLoading || isFetching) || showAnimation;
  const openAssistant = () => {
    const chatButton = document.querySelector('[data-testid="button-chatbot-toggle"]') as HTMLButtonElement | null;
    chatButton?.click();
  };

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
  const [selectedReturnTimes, setSelectedReturnTimes] = useState<Set<DepartureTime>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [selectedOutboundKey, setSelectedOutboundKey] = useState<string | null>(null);

  const FLIGHTS_PER_PAGE = 10;
  const [visibleOneWayCount, setVisibleOneWayCount] = useState(FLIGHTS_PER_PAGE);
  const [visibleOutboundCount, setVisibleOutboundCount] = useState(FLIGHTS_PER_PAGE);
  const [visibleReturnCount, setVisibleReturnCount] = useState(FLIGHTS_PER_PAGE);

  const isRoundTrip = !!(params as any).returnDate;

  const getOutboundKey = useCallback((flight: FlightOffer) => {
    if (!flight.slices || flight.slices.length < 2) return flight.id;
    const s = flight.slices[0];
    return s.segments.map(seg => `${seg.flightNumber}-${seg.departureTime}`).join("|");
  }, []);

  const getReturnKey = useCallback((flight: FlightOffer) => {
    if (!flight.slices || flight.slices.length < 2) return flight.id;
    const s = flight.slices[1];
    return s.segments.map(seg => `${seg.flightNumber}-${seg.departureTime}`).join("|");
  }, []);

  useEffect(() => {
    if (searchKey !== lastSearchKey) {
      setSelectedOutboundKey(null);
      setVisibleOneWayCount(FLIGHTS_PER_PAGE);
      setVisibleOutboundCount(FLIGHTS_PER_PAGE);
      setVisibleReturnCount(FLIGHTS_PER_PAGE);
    }
  }, [searchKey, lastSearchKey]);

  useEffect(() => {
    setVisibleReturnCount(FLIGHTS_PER_PAGE);
  }, [selectedOutboundKey]);

  useEffect(() => {
    setVisibleOneWayCount(FLIGHTS_PER_PAGE);
    setVisibleOutboundCount(FLIGHTS_PER_PAGE);
    setVisibleReturnCount(FLIGHTS_PER_PAGE);
  }, [sortBy, selectedStops, selectedAirlines, selectedDepartureTimes, selectedReturnTimes, priceRange]);

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
    if (selectedReturnTimes.size > 0) count++;
    if (priceRange && (priceRange[0] > priceExtents.min || priceRange[1] < priceExtents.max)) count++;
    return count;
  }, [selectedStops, selectedAirlines, selectedDepartureTimes, selectedReturnTimes, priceRange, priceExtents]);

  const clearFilters = useCallback(() => {
    setSelectedStops(new Set());
    setSelectedAirlines(new Set());
    setSelectedDepartureTimes(new Set());
    setSelectedReturnTimes(new Set());
    setPriceRange(null);
    setVisibleOneWayCount(FLIGHTS_PER_PAGE);
    setVisibleOutboundCount(FLIGHTS_PER_PAGE);
    setVisibleReturnCount(FLIGHTS_PER_PAGE);
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

      if (selectedReturnTimes.size > 0) {
        // Check return flight time for round trips
        if (flight.slices && flight.slices.length > 1) {
          const returnSlice = flight.slices[1];
          const returnDepartureTime = returnSlice.segments?.[0]?.departureTime;
          if (returnDepartureTime) {
            const bucket = getDepartureTimeBucket(returnDepartureTime);
            if (!selectedReturnTimes.has(bucket)) return false;
          }
        }
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
  }, [flights, selectedStops, selectedAirlines, selectedDepartureTimes, selectedReturnTimes, priceRange, sortBy]);

  const offerMatrix = useMemo(() => {
    if (!isRoundTrip || !flights || flights.length === 0) return null;
    const roundTripOffers = flights.filter(f => f.slices && f.slices.length >= 2);
    if (roundTripOffers.length === 0) return null;

    const outboundMap = new Map<string, { slice: FlightSlice; airline: string; logoUrl?: string | null; lowestPrice: number }>();
    const returnMap = new Map<string, { slice: FlightSlice; airline: string; logoUrl?: string | null; lowestPrice: number }>();
    const comboMap = new Map<string, FlightOffer>();

    for (const flight of roundTripOffers) {
      const obKey = getOutboundKey(flight);
      const rtKey = getReturnKey(flight);
      const comboKey = `${obKey}::${rtKey}`;

      const existingCombo = comboMap.get(comboKey);
      if (!existingCombo || flight.price < existingCombo.price) {
        comboMap.set(comboKey, flight);
      }

      const existingOb = outboundMap.get(obKey);
      if (!existingOb) {
        outboundMap.set(obKey, { slice: flight.slices![0], airline: flight.airline, logoUrl: flight.logoUrl, lowestPrice: flight.price });
      } else if (flight.price < existingOb.lowestPrice) {
        existingOb.lowestPrice = flight.price;
      }

      const existingRt = returnMap.get(rtKey);
      if (!existingRt) {
        returnMap.set(rtKey, { slice: flight.slices![1], airline: flight.airline, logoUrl: flight.logoUrl, lowestPrice: flight.price });
      } else if (flight.price < existingRt.lowestPrice) {
        existingRt.lowestPrice = flight.price;
      }
    }

    return { outboundMap, returnMap, comboMap };
  }, [flights, isRoundTrip, getOutboundKey, getReturnKey]);

  const filteredOutboundKeys = useMemo(() => {
    if (!offerMatrix || !filteredAndSortedFlights) return new Set<string>();
    const keys = new Set<string>();
    for (const flight of filteredAndSortedFlights) {
      if (flight.slices && flight.slices.length >= 2) {
        keys.add(getOutboundKey(flight));
      }
    }
    return keys;
  }, [offerMatrix, filteredAndSortedFlights, getOutboundKey]);

  const filteredComboMap = useMemo(() => {
    if (!isRoundTrip || !filteredAndSortedFlights) return new Map<string, FlightOffer>();
    const map = new Map<string, FlightOffer>();
    for (const flight of filteredAndSortedFlights) {
      if (!flight.slices || flight.slices.length < 2) continue;
      const obKey = getOutboundKey(flight);
      const rtKey = getReturnKey(flight);
      const comboKey = `${obKey}::${rtKey}`;
      const existing = map.get(comboKey);
      if (!existing || flight.price < existing.price) {
        map.set(comboKey, flight);
      }
    }
    return map;
  }, [filteredAndSortedFlights, isRoundTrip, getOutboundKey, getReturnKey]);

  const returnOptionsForSelected = useMemo(() => {
    if (!selectedOutboundKey || !offerMatrix) return [];
    const { returnMap } = offerMatrix;
    const results: { returnKey: string; slice: FlightSlice; airline: string; logoUrl?: string | null; offer: FlightOffer | null; price: number | null }[] = [];

    for (const [rtKey, rtData] of Array.from(returnMap.entries())) {
      const comboKey = `${selectedOutboundKey}::${rtKey}`;
      const matchingOffer = filteredComboMap.get(comboKey) || null;
      results.push({
        returnKey: rtKey,
        slice: rtData.slice,
        airline: rtData.airline,
        logoUrl: rtData.logoUrl,
        offer: matchingOffer,
        price: matchingOffer ? matchingOffer.price : null,
      });
    }

    const available = results.filter(r => r.offer !== null);
    const unavailable = results.filter(r => r.offer === null);

    available.sort((a, b) => {
      switch (sortBy) {
        case "cheapest": return (a.price || 0) - (b.price || 0);
        case "fastest": return parseDurationToMinutes(a.slice.duration) - parseDurationToMinutes(b.slice.duration);
        case "best": {
          const sa = (a.price || 0) * 0.6 + parseDurationToMinutes(a.slice.duration) * 0.4;
          const sb = (b.price || 0) * 0.6 + parseDurationToMinutes(b.slice.duration) * 0.4;
          return sa - sb;
        }
        default: return 0;
      }
    });

    return [...available, ...unavailable];
  }, [selectedOutboundKey, offerMatrix, filteredComboMap, sortBy]);

  const showTwoStepFlow = isRoundTrip && offerMatrix !== null;

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
        <h4 className="text-sm font-semibold mb-3 text-gray-700">{t("results.departure_time") || "Outbound Time"}</h4>
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

      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-700">{t("results.return_time") || "Return Time"}</h4>
        <div className="space-y-2.5">
          {departureTimeOptions.map(opt => {
            const Icon = opt.icon;
            return (
              <label
                key={opt.key}
                className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                data-testid={`filter-return-${opt.key}`}
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-500/30 h-4 w-4"
                  checked={selectedReturnTimes.has(opt.key)}
                  onChange={() => toggleSetItem(setSelectedReturnTimes, opt.key)}
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
           <FlightSearchForm defaultValues={defaultValues} extraSearchParams={isEasyMode ? { ui: "easy" } : undefined} />
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 max-w-6xl">
        {isEasyMode && (
          <div className="mb-6 rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.98)_55%,rgba(219,234,254,0.96))] p-5 md:p-6 shadow-[0_20px_80px_-44px_rgba(37,99,235,0.45)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  <HeartHandshake className="h-4 w-4" />
                  {easyModeCopy.badge}
                </span>
                <h2 className="mt-4 text-2xl md:text-3xl font-display font-extrabold text-slate-950">
                  {easyModeCopy.title}
                </h2>
                <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-600">
                  {easyModeCopy.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-easy-mode-call-results">
                  <a href={`tel:${AGENCY_PHONE_TEL}`}>
                    <PhoneCall className="mr-2 h-4 w-4" />
                    {easyModeCopy.call}
                  </a>
                </Button>
                <Button variant="outline" onClick={openAssistant} className="rounded-full border-slate-300 bg-white text-slate-800" data-testid="button-easy-mode-chat-results">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {easyModeCopy.assistant}
                </Button>
                <Link href="/senior">
                  <Button variant="ghost" className="rounded-full text-blue-700 hover:bg-blue-50" data-testid="button-easy-mode-back-results">
                    {easyModeCopy.back}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

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
                  {isSearching
                    ? t("results.searching") || "Searching..."
                    : showTwoStepFlow && !selectedOutboundKey && offerMatrix
                      ? `${filteredOutboundKeys.size > 0 ? filteredOutboundKeys.size : offerMatrix.outboundMap.size} ${t("results.outbound_flights") || "voos de ida"}`
                      : showTwoStepFlow && selectedOutboundKey
                        ? `${returnOptionsForSelected.filter(r => r.offer).length} ${t("results.return_flights") || "opcoes de volta"}`
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

            {isSearching && (
              <FlightSearchAnimation t={t} />
            )}

            {error && !isSearching && (
              <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-200 text-red-600">
                <AlertCircle className="h-10 w-10 mb-4" />
                <p className="font-medium">{t("results.error") || "Failed to load flights."}</p>
              </div>
            )}

            {!isSearching && !error && flights?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plane className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t("results.no_flights") || "No flights found"}</h3>
                <p className="text-gray-500">{t("results.no_flights_desc") || "Try adjusting your search."}</p>
              </div>
            )}

            {!isSearching && !error && flights && flights.length > 0 && filteredAndSortedFlights.length === 0 && (
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

            {!isSearching && showTwoStepFlow && offerMatrix && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-2" data-testid="step-progress-bar">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${selectedOutboundKey ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"}`}>
                        {selectedOutboundKey ? <CheckCircle2 className="h-4.5 w-4.5" /> : "1"}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold uppercase ${selectedOutboundKey ? "text-emerald-600" : "text-blue-600"}`}>
                          {t("results.outbound") || "Ida"}
                        </p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {flights?.[0]?.originCity || params.origin} → {flights?.[0]?.destinationCity || params.destination}
                        </p>
                        {params.date && (
                          <p className="text-xs text-gray-500">{format(parseISO(params.date), "dd MMM yyyy")}</p>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center px-2">
                      <div className={`w-12 h-0.5 transition-colors ${selectedOutboundKey ? "bg-emerald-400" : "bg-gray-200"}`} />
                      <ArrowRight className={`h-4 w-4 mx-1 ${selectedOutboundKey ? "text-emerald-400" : "text-gray-300"}`} />
                      <div className={`w-12 h-0.5 ${selectedOutboundKey ? "bg-blue-400" : "bg-gray-200"}`} />
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${selectedOutboundKey ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                        2
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold uppercase ${selectedOutboundKey ? "text-blue-600" : "text-gray-400"}`}>
                          {t("results.return") || "Volta"}
                        </p>
                        <p className={`text-sm font-bold truncate ${selectedOutboundKey ? "text-gray-900" : "text-gray-400"}`}>
                          {flights?.[0]?.destinationCity || params.destination} → {flights?.[0]?.originCity || params.origin}
                        </p>
                        {(params as any).returnDate && (
                          <p className={`text-xs ${selectedOutboundKey ? "text-gray-500" : "text-gray-300"}`}>{format(parseISO((params as any).returnDate), "dd MMM yyyy")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!selectedOutboundKey && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="outbound-step"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2"
                    >
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-2 flex items-center gap-3" data-testid="step-indicator-outbound">
                        <Plane className="h-5 w-5 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{t("results.select_outbound") || "Selecione o voo de ida"}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {flights?.[0]?.originCity || params.origin} → {flights?.[0]?.destinationCity || params.destination} · {filteredOutboundKeys.size > 0 ? filteredOutboundKeys.size : offerMatrix.outboundMap.size} {t("results.options") || "opções"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {(() => {
                          const allOutbound = Array.from(offerMatrix.outboundMap.entries())
                            .filter(([key]) => filteredOutboundKeys.size === 0 || filteredOutboundKeys.has(key))
                            .sort(([,a], [,b]) => a.lowestPrice - b.lowestPrice);
                          const visibleOutbound = allOutbound.slice(0, visibleOutboundCount);
                          return (<>
                        {visibleOutbound.map(([key, group]) => {
                            const slice = group.slice;
                            const firstSeg = slice.segments[0];
                            const lastSeg = slice.segments[slice.segments.length - 1];
                            const stopsCount = slice.segments.length - 1;
                            const sliceDuration = slice.duration.startsWith("P") ? formatDurationUtil(slice.duration) : slice.duration;
                            const currency = filteredAndSortedFlights[0]?.currency || "USD";
                            const depDate = format(parseISO(firstSeg.departureTime), "dd MMM");
                            const arrDate = format(parseISO(lastSeg.arrivalTime), "dd MMM");
                            const isDiffDay = depDate !== arrDate;

                            return (
                              <Card
                                key={key}
                                className="p-0 overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white rounded-2xl group"
                                onClick={() => setSelectedOutboundKey(key)}
                                data-testid={`outbound-option-${key}`}
                              >
                                <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                  <div className="md:col-span-3 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                                      {group.logoUrl ? (
                                        <img src={group.logoUrl} alt={group.airline} className="w-full h-full object-contain" />
                                      ) : (
                                        <Plane className="text-gray-400 h-5 w-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900 text-sm">{group.airline}</p>
                                      <p className="text-xs text-gray-500">{firstSeg.flightNumber}</p>
                                    </div>
                                  </div>

                                  <div className="md:col-span-5 flex items-center justify-between gap-2">
                                    <div className="text-center min-w-[60px]">
                                      <div className="text-xl font-bold text-gray-900">{format(parseISO(firstSeg.departureTime), "HH:mm")}</div>
                                      <div className="text-xs text-gray-500 font-medium">{slice.originCity || slice.originCode}</div>
                                      <div className="text-[10px] text-gray-400">{depDate}</div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center px-3">
                                      <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {sliceDuration}
                                      </div>
                                      <div className="w-full h-[2px] bg-gray-200 relative">
                                        <Plane className="h-3 w-3 text-blue-500 rotate-90 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                                      </div>
                                      <div className={`text-[10px] font-medium mt-1 ${stopsCount === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                        {stopsCount === 0 ? (t("flight.direct") || "Direto") : `${stopsCount} ${stopsCount > 1 ? (t("flight.stops") || "paradas") : (t("flight.stop") || "parada")}`}
                                      </div>
                                    </div>
                                    <div className="text-center min-w-[60px]">
                                      <div className="text-xl font-bold text-gray-900">
                                        {format(parseISO(lastSeg.arrivalTime), "HH:mm")}
                                        {isDiffDay && <sup className="text-[10px] text-red-500 ml-0.5">+1</sup>}
                                      </div>
                                      <div className="text-xs text-gray-500 font-medium">{slice.destinationCity || slice.destinationCode}</div>
                                      <div className="text-[10px] text-gray-400">{arrDate}</div>
                                    </div>
                                  </div>

                                  <div className="md:col-span-4 flex items-center justify-end gap-3">
                                    <div className="text-right">
                                      <p className="text-[10px] text-gray-400 uppercase">{t("results.from") || "a partir de"}</p>
                                      <p className="text-xl font-bold text-gray-900">
                                        {new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(group.lowestPrice)}
                                      </p>
                                      <p className="text-[10px] text-gray-400">{t("results.round_trip_total") || "ida + volta"}</p>
                                    </div>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg group-hover:shadow-md transition-all" data-testid={`button-select-outbound-${key}`}>
                                      {t("flight.select") || "Selecionar"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}

                        {allOutbound.length > visibleOutboundCount && (
                          <div className="flex flex-col items-center gap-2 pt-2" data-testid="outbound-pagination">
                            <p className="text-xs text-gray-500">
                              {t("results.showing") || "Mostrando"} {Math.min(visibleOutboundCount, allOutbound.length)} {t("results.of") || "de"} {allOutbound.length} {t("results.outbound_flights") || "voos de ida"}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVisibleOutboundCount(prev => prev + FLIGHTS_PER_PAGE)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                              data-testid="button-show-more-outbound"
                            >
                              <Plane className="h-3.5 w-3.5 mr-2" />
                              {t("results.show_more") || "Mostrar mais voos"} ({Math.min(FLIGHTS_PER_PAGE, allOutbound.length - visibleOutboundCount)})
                            </Button>
                          </div>
                        )}
                        </>);
                        })()}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {selectedOutboundKey && offerMatrix?.outboundMap.get(selectedOutboundKey) && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="return-step"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3"
                    >
                      {(() => {
                        const obData = offerMatrix!.outboundMap.get(selectedOutboundKey)!;
                        const s = obData.slice;
                        const firstSeg = s.segments[0];
                        const lastSeg = s.segments[s.segments.length - 1];
                        const stopsCount = s.segments.length - 1;
                        const sliceDuration = s.duration.startsWith("P") ? formatDurationUtil(s.duration) : s.duration;
                        return (
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-1" data-testid="selected-outbound-summary">
                            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">{t("results.outbound_selected") || "Voo de ida selecionado"}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOutboundKey(null)}
                                data-testid="button-change-outbound"
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs"
                              >
                                {t("results.change_outbound") || "Alterar voo de ida"}
                              </Button>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="h-10 w-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                                {obData.logoUrl ? (
                                  <img src={obData.logoUrl} alt={obData.airline} className="w-full h-full object-contain" />
                                ) : (
                                  <Plane className="text-gray-400 h-5 w-5" />
                                )}
                              </div>
                              <div className="flex items-center gap-4 flex-1 flex-wrap">
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">{obData.airline}</p>
                                  <p className="text-xs text-gray-500">{firstSeg.flightNumber}</p>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="text-center">
                                    <span className="font-bold text-gray-900">{format(parseISO(firstSeg.departureTime), "HH:mm")}</span>
                                    <span className="text-xs text-gray-500 ml-1">{s.originCity || s.originCode}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <div className="w-6 h-px bg-gray-300" />
                                    <span className="text-[10px]">{sliceDuration}</span>
                                    <div className="w-6 h-px bg-gray-300" />
                                  </div>
                                  <div className="text-center">
                                    <span className="font-bold text-gray-900">{format(parseISO(lastSeg.arrivalTime), "HH:mm")}</span>
                                    <span className="text-xs text-gray-500 ml-1">{s.destinationCity || s.destinationCode}</span>
                                  </div>
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stopsCount === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                    {stopsCount === 0 ? (t("flight.direct") || "Direto") : `${stopsCount} ${t("flight.stop") || "parada"}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3" data-testid="step-indicator-return">
                        <Plane className="h-5 w-5 text-blue-600 shrink-0 -scale-x-100" />
                        <div>
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{t("results.select_return") || "Agora selecione o voo de volta"}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {flights?.[0]?.destinationCity || params.destination} → {flights?.[0]?.originCity || params.origin} · {returnOptionsForSelected.filter(r => r.offer).length} {t("results.available") || "disponíveis"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {returnOptionsForSelected.slice(0, visibleReturnCount).map((rt) => {
                            const returnSlice = rt.slice;
                            const firstSeg = returnSlice.segments[0];
                            const lastSeg = returnSlice.segments[returnSlice.segments.length - 1];
                            const stopsCount = returnSlice.segments.length - 1;
                            const sliceDuration = returnSlice.duration.startsWith("P") ? formatDurationUtil(returnSlice.duration) : returnSlice.duration;
                            const isAvailable = rt.offer !== null;
                            const bookUrl = isAvailable ? `/book/${rt.offer!.id}?${searchParams.toString()}` : "";
                            const depDate = format(parseISO(firstSeg.departureTime), "dd MMM");
                            const arrDate = format(parseISO(lastSeg.arrivalTime), "dd MMM");
                            const isDiffDay = depDate !== arrDate;

                            return (
                              <Card
                                key={rt.returnKey}
                                className={`p-0 overflow-hidden border transition-all bg-white rounded-2xl ${isAvailable ? "border-gray-200 hover:border-blue-400 hover:shadow-md group" : "border-gray-100 opacity-40 pointer-events-none"}`}
                                data-testid={`return-option-${rt.returnKey}`}
                              >
                                <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                  <div className="md:col-span-3 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                                      {rt.logoUrl ? (
                                        <img src={rt.logoUrl} alt={rt.airline} className="w-full h-full object-contain" />
                                      ) : (
                                        <Plane className="text-gray-400 h-5 w-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900 text-sm">{rt.airline}</p>
                                      <p className="text-xs text-gray-500">{firstSeg.flightNumber}</p>
                                    </div>
                                  </div>

                                  <div className="md:col-span-5 flex items-center justify-between gap-2">
                                    <div className="text-center min-w-[60px]">
                                      <div className="text-xl font-bold text-gray-900">{format(parseISO(firstSeg.departureTime), "HH:mm")}</div>
                                      <div className="text-xs text-gray-500 font-medium">{returnSlice.originCity || returnSlice.originCode}</div>
                                      <div className="text-[10px] text-gray-400">{depDate}</div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center px-3">
                                      <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {sliceDuration}
                                      </div>
                                      <div className="w-full h-[2px] bg-gray-200 relative">
                                        <Plane className="h-3 w-3 text-blue-500 rotate-90 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                                      </div>
                                      <div className={`text-[10px] font-medium mt-1 ${stopsCount === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                        {stopsCount === 0 ? (t("flight.direct") || "Direto") : `${stopsCount} ${stopsCount > 1 ? (t("flight.stops") || "paradas") : (t("flight.stop") || "parada")}`}
                                      </div>
                                    </div>
                                    <div className="text-center min-w-[60px]">
                                      <div className="text-xl font-bold text-gray-900">
                                        {format(parseISO(lastSeg.arrivalTime), "HH:mm")}
                                        {isDiffDay && <sup className="text-[10px] text-red-500 ml-0.5">+1</sup>}
                                      </div>
                                      <div className="text-xs text-gray-500 font-medium">{returnSlice.destinationCity || returnSlice.destinationCode}</div>
                                      <div className="text-[10px] text-gray-400">{arrDate}</div>
                                    </div>
                                  </div>

                                  <div className="md:col-span-4 flex items-center justify-end gap-3">
                                    {isAvailable ? (
                                      <>
                                        <div className="text-right">
                                          <p className="text-[10px] text-gray-400 uppercase">{t("flight.total_price") || "Preço total"}</p>
                                          <p className="text-2xl font-bold text-gray-900">
                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: rt.offer!.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(rt.price!)}
                                          </p>
                                          <p className="text-[10px] text-gray-400">{t("results.round_trip_total") || "ida + volta"}</p>
                                        </div>
                                        <Link href={bookUrl}>
                                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg group-hover:shadow-md transition-all" data-testid={`button-select-return-${rt.returnKey}`}>
                                            {t("flight.book") || "Reservar"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                          </Button>
                                        </Link>
                                      </>
                                    ) : (
                                      <div className="text-right">
                                        <p className="text-xs text-gray-400">{t("results.unavailable_combo") || "Combinação indisponível"}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                      </div>

                      {returnOptionsForSelected.length > visibleReturnCount && (
                        <div className="flex flex-col items-center gap-2 pt-2" data-testid="return-pagination">
                          <p className="text-xs text-gray-500">
                            {t("results.showing") || "Mostrando"} {Math.min(visibleReturnCount, returnOptionsForSelected.length)} {t("results.of") || "de"} {returnOptionsForSelected.length} {t("results.return_flights") || "voos de volta"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVisibleReturnCount(prev => prev + FLIGHTS_PER_PAGE)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                            data-testid="button-show-more-returns"
                          >
                            <Plane className="h-3.5 w-3.5 mr-2" />
                            {t("results.show_more") || "Mostrar mais voos"} ({Math.min(FLIGHTS_PER_PAGE, returnOptionsForSelected.length - visibleReturnCount)})
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}

            {!isSearching && !showTwoStepFlow && filteredAndSortedFlights.length > 0 && (
              <div className="space-y-4">
                {filteredAndSortedFlights.slice(0, visibleOneWayCount).map((flight) => (
                  <FlightCard key={flight.id} flight={flight} />
                ))}
                {filteredAndSortedFlights.length > visibleOneWayCount && (
                  <div className="flex flex-col items-center gap-2 pt-2" data-testid="oneway-pagination">
                    <p className="text-xs text-gray-500">
                      {t("results.showing") || "Mostrando"} {Math.min(visibleOneWayCount, filteredAndSortedFlights.length)} {t("results.of") || "de"} {filteredAndSortedFlights.length} {t("results.flights") || "voos"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVisibleOneWayCount(prev => prev + FLIGHTS_PER_PAGE)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                      data-testid="button-show-more-flights"
                    >
                      <Plane className="h-3.5 w-3.5 mr-2" />
                      {t("results.show_more") || "Mostrar mais voos"} ({Math.min(FLIGHTS_PER_PAGE, filteredAndSortedFlights.length - visibleOneWayCount)})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
