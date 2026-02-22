import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Clock, ArrowRight, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface BoardFlight {
  id: string;
  airline: string;
  logoUrl: string | null;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  cabinClass: string;
}

interface BoardRoute {
  origin: string;
  destination: string;
  departureDate: string;
}

const POPULAR_ROUTES: BoardRoute[] = [
  { origin: "JFK", destination: "LHR", departureDate: "" },
  { origin: "EWR", destination: "LIS", departureDate: "" },
  { origin: "MIA", destination: "GRU", departureDate: "" },
  { origin: "LAX", destination: "NRT", departureDate: "" },
  { origin: "JFK", destination: "CDG", departureDate: "" },
  { origin: "EWR", destination: "FCO", departureDate: "" },
  { origin: "MIA", destination: "CUN", departureDate: "" },
  { origin: "JFK", destination: "BCN", departureDate: "" },
  { origin: "LAX", destination: "DXB", departureDate: "" },
  { origin: "ORD", destination: "LHR", departureDate: "" },
];

function getNextWeekDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] || "0";
  const m = match[2] || "0";
  return `${h}h${m.padStart(2, "0")}`;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "--:--";
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function FlightBoard() {
  const { t } = useI18n();
  const [_, setLocation] = useLocation();
  const [showAll, setShowAll] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const departureDate = getNextWeekDate();

  const { data: flights, isLoading, refetch, isFetching } = useQuery<BoardFlight[]>({
    queryKey: ["/api/flight-board", departureDate],
    queryFn: async () => {
      const res = await fetch(`/api/flight-board?date=${departureDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch board flights");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 15,
  });

  const displayFlights = showAll ? flights : flights?.slice(0, 8);
  const hasMore = (flights?.length || 0) > 8;

  return (
    <section className="py-24 md:py-32 section-white" data-testid="section-flight-board">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-[0.2em]">LIVE</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-gray-900 mb-2" data-testid="text-board-title">
              {t("home.board.title")}
            </h2>
            <p className="text-gray-500">{t("home.board.subtitle")}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-gray-900 tracking-wider" data-testid="text-board-clock">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
              <div className="text-[11px] text-gray-400 font-mono">{currentTime.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} {Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()}</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-gray-400"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh-board"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden border border-gray-200 bg-white rounded-2xl shadow-[0_4px_32px_-8px_hsl(213_90%_50%/0.10)]">
          <div className="grid grid-cols-[160px_80px_1fr_100px_100px_120px_80px] gap-0 px-5 py-3.5 border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] hidden md:grid items-center">
            <div>{t("home.board.col_flight")}</div>
            <div>{t("home.board.col_time")}</div>
            <div className="pl-4">{t("home.board.col_route")}</div>
            <div className="text-center">{t("home.board.col_duration")}</div>
            <div className="text-center">{t("home.board.col_stops")}</div>
            <div className="text-right">{t("home.board.col_price")}</div>
            <div></div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="font-mono text-sm">{t("home.board.loading")}</span>
              </div>
            </div>
          ) : !flights || flights.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Plane className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">{t("home.board.no_flights")}</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="sync">
              {displayFlights?.map((flight, i) => (
                <motion.div
                  key={flight.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-1 md:grid-cols-[160px_80px_1fr_100px_100px_120px_80px] gap-2 md:gap-0 px-5 py-3.5 border-b border-gray-100 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer group items-center"
                  onClick={() => setLocation(`/book/${flight.id}?adults=1&children=0&infants=0`)}
                  data-testid={`board-row-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                      {flight.logoUrl ? (
                        <img src={flight.logoUrl} alt={flight.airline} className="h-5 w-5 object-contain" />
                      ) : (
                        <Plane className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 font-mono" data-testid={`text-flight-number-${i}`}>{flight.flightNumber}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-[120px]">{flight.airline}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="font-mono text-lg font-bold text-blue-600" data-testid={`text-board-departure-${i}`}>
                      {formatTime(flight.departureTime)}
                    </div>
                  </div>

                  <div className="flex items-center pl-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-center flex-shrink-0">
                        <div className="text-sm font-bold text-gray-900 font-mono">{flight.origin}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[80px]">{flight.originCity}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-1 min-w-0 px-2">
                        <div className="h-px bg-gray-200 flex-1" />
                        <Plane className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <div className="h-px bg-gray-200 flex-1" />
                      </div>
                      <div className="text-center flex-shrink-0">
                        <div className="text-sm font-bold text-gray-900 font-mono">{flight.destination}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[80px]">{flight.destinationCity}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono">{formatDuration(flight.duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <Badge variant="secondary" className={`text-[10px] px-2.5 py-0.5 ${flight.stops === 0 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                      {flight.stops === 0 ? t("flight.direct") : `${flight.stops} ${flight.stops === 1 ? t("flight.stop") : t("flight.stops")}`}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingDown className="h-3 w-3 text-emerald-500" />
                        <span className="text-lg font-bold text-gray-900 font-mono" data-testid={`text-board-price-${i}`}>
                          {flight.currency === "USD" ? "$" : flight.currency === "EUR" ? "\u20AC" : flight.currency === "GBP" ? "\u00A3" : flight.currency === "BRL" ? "R$" : flight.currency}
                          {flight.price.toFixed(0)}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400">{t("home.board.per_person")}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <Button
                      size="sm"
                      className="rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/book/${flight.id}?adults=1&children=0&infants=0`);
                      }}
                      data-testid={`button-book-board-${i}`}
                    >
                      {t("home.board.book")}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {hasMore && (
            <div className="flex justify-center py-4 border-t border-gray-100">
              <Button
                variant="ghost"
                className="text-blue-600 text-sm gap-2"
                onClick={() => setShowAll(!showAll)}
                data-testid="button-toggle-board"
              >
                {showAll ? (
                  <>
                    {t("home.board.show_less")} <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t("home.board.show_more")} ({(flights?.length || 0) - 8} {t("home.board.more_flights")}) <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
          <TrendingDown className="h-3 w-3" />
          <span>{t("home.board.disclaimer")}</span>
        </div>
      </div>
    </section>
  );
}
