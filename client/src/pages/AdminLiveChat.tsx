import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  ArrowLeft,
  MessageSquare,
  User,
  Bot,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Lock,
  Loader2,
  Headphones,
  Video,
  Plane,
  Eye,
  X,
  Calendar,
  MapPin,
  Pencil,
  StickyNote,
  Receipt,
  Share2,
  Search,
  Plus,
  Trash2,
  Users,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import type { FlightOffer } from "@shared/schema";
import { buildSeniorRecommendations, type SeniorRecommendationKind } from "@/lib/senior-flight";
import {
  buildSeniorAgentTips,
  buildSeniorQuickReplies,
  buildSeniorSessionSummary,
  buildSharedFlightGuidance,
  formatLiveSessionEntryPoint,
  getLiveSessionTheme,
  getSeniorPreferencesFromContext,
  getSeniorRecommendationLabel,
  isSeniorServiceMode,
  type LiveSessionContextSnapshot,
} from "@/lib/live-session-context";

interface PlaceResult {
  id: string;
  name: string;
  iataCode: string;
  cityName: string;
  countryName: string;
  type: string;
}

function AdminLocationInput({
  value,
  onChange,
  placeholder,
  testId,
}: {
  value: string;
  onChange: (iata: string) => void;
  placeholder: string;
  testId: string;
}) {
  const [query, setQuery] = useState("");
  const [displayText, setDisplayText] = useState(value);
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectedRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2 && !selectedRef.current) {
      setLoading(true);
      fetch(`/api/places/search?query=${encodeURIComponent(debouncedQuery)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }
    selectedRef.current = false;
  }, [debouncedQuery]);

  useEffect(() => {
    if (value === "" && displayText !== "") {
      setDisplayText("");
      setQuery("");
    }
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (place: PlaceResult) => {
    const text = `${place.cityName || place.name} (${place.iataCode})`;
    selectedRef.current = true;
    setQuery(text);
    setDisplayText(text);
    onChange(place.iataCode);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={displayText || query}
          onChange={(e) => {
            setDisplayText("");
            setQuery(e.target.value);
            if (e.target.value === "") {
              onChange("");
              setOpen(false);
            }
          }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="pl-7 text-sm h-9"
          data-testid={testId}
        />
        {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {results.map((place) => (
            <button
              type="button"
              key={place.id}
              onClick={() => handleSelect(place)}
              data-testid={`place-option-${place.iataCode}`}
              className="w-full text-left px-3 py-2 hover-elevate flex items-center gap-2 text-sm"
            >
              <div className="flex-shrink-0">
                {place.type === "airport" ? (
                  <Plane className="h-3.5 w-3.5 text-[#0074DE]" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-[#0074DE]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">{place.name}</span>
                <span className="text-[#0074DE] font-bold ml-1">({place.iataCode})</span>
                <span className="text-xs text-muted-foreground ml-1">
                  {place.cityName ? `${place.cityName}, ` : ""}{place.countryName}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  visitorId: string | null;
  language: string | null;
  escalated: boolean;
  escalatedAt: string | null;
  resolved: boolean;
  createdAt: string;
  messages: Message[];
}

interface LiveSessionRequest {
  id: number;
  conversationId: number | null;
  visitorId: string | null;
  language: string | null;
  serviceMode?: string | null;
  entryPoint?: string | null;
  contextSnapshot?: LiveSessionContextSnapshot | null;
  status: string;
  createdAt: string;
}

interface LiveSessionActive {
  id: number;
  conversationId: number | null;
  visitorId: string | null;
  language: string | null;
  serviceMode?: string | null;
  entryPoint?: string | null;
  contextSnapshot?: LiveSessionContextSnapshot | null;
  status: string;
  createdAt: string;
}

interface LiveMessage {
  id: number;
  sessionId: number;
  role: string;
  content: string;
  createdAt: string;
}

interface LiveSessionDetail {
  session: {
    id: number;
    visitorId: string | null;
    language: string | null;
    serviceMode?: string | null;
    entryPoint?: string | null;
    contextSnapshot?: LiveSessionContextSnapshot | null;
    status: string;
    referenceCode?: string | null;
    createdAt?: string;
  };
  id: number;
  status: string;
  visitorId: string | null;
  messages: LiveMessage[];
  blocks: LiveBlock[];
}

interface LiveBlock {
  id: number;
  sessionId: number;
  blockType: string;
  payload: unknown;
  shared: boolean;
  sortOrder: number;
}

type FlightResult = FlightOffer;

function adminFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
    },
  });
}

interface SearchLeg {
  origin: string;
  destination: string;
  date: string;
}

function LiveSalesPanel() {
  const [requests, setRequests] = useState<LiveSessionRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<LiveSessionActive[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionDetail, setSessionDetail] = useState<LiveSessionDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [sessionsPanelOpen, setSessionsPanelOpen] = useState(true);

  const [tripType, setTripType] = useState<"round_trip" | "one_way" | "multi_city">("round_trip");
  const [searchOrigin, setSearchOrigin] = useState("");
  const [searchDestination, setSearchDestination] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchReturnDate, setSearchReturnDate] = useState("");
  const [searchPassengers, setSearchPassengers] = useState("1");
  const [searchCabinClass, setSearchCabinClass] = useState("economy");
  const [multiCityLegs, setMultiCityLegs] = useState<SearchLeg[]>([
    { origin: "", destination: "", date: "" },
    { origin: "", destination: "", date: "" },
  ]);
  const [searchingFlights, setSearchingFlights] = useState(false);
  const [flightResults, setFlightResults] = useState<FlightResult[]>([]);

  const [sharedBlockMap, setSharedBlockMap] = useState<Record<string, number>>({});
  const [togglingFlight, setTogglingFlight] = useState<string | null>(null);

  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [editingPrice, setEditingPrice] = useState<string | null>(null);

  const [noteText, setNoteText] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  const [sendingPricingSummary, setSendingPricingSummary] = useState(false);

  const [liveMessage, setLiveMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const liveMsgEndRef = useRef<HTMLDivElement>(null);
  const prefilledSessionRef = useRef<number | null>(null);

  const selectedSession = sessionDetail?.session;
  const sessionMode = selectedSession?.serviceMode || "standard";
  const sessionContext = (selectedSession?.contextSnapshot || null) as LiveSessionContextSnapshot | null;
  const isSeniorLead = isSeniorServiceMode(sessionMode);
  const sessionTheme = getLiveSessionTheme(sessionMode);
  const seniorPreferences = useMemo(
    () => getSeniorPreferencesFromContext(sessionContext),
    [sessionContext],
  );
  const sessionSummaryItems = useMemo(
    () => buildSeniorSessionSummary(sessionContext),
    [sessionContext],
  );
  const seniorAgentTips = useMemo(
    () => (isSeniorLead ? buildSeniorAgentTips(sessionContext) : []),
    [isSeniorLead, sessionContext],
  );
  const seniorQuickReplies = useMemo(
    () => (isSeniorLead ? buildSeniorQuickReplies(sessionContext) : []),
    [isSeniorLead, sessionContext],
  );
  const seniorFlightRanking = useMemo(
    () => (isSeniorLead ? buildSeniorRecommendations(flightResults, seniorPreferences) : null),
    [flightResults, isSeniorLead, seniorPreferences],
  );
  const orderedFlightResults = useMemo(
    () => (seniorFlightRanking ? seniorFlightRanking.rankedFlights.map((item) => item.flight) : flightResults),
    [flightResults, seniorFlightRanking],
  );
  const recommendationMap = useMemo(() => {
    const next = new Map<string, { kind: SeniorRecommendationKind; reasonLine: string }>();
    seniorFlightRanking?.recommendations.forEach((item) => {
      next.set(item.flight.id, { kind: item.kind, reasonLine: item.insight.reasonLine });
    });
    return next;
  }, [seniorFlightRanking]);

  const updateMultiLeg = (index: number, field: keyof SearchLeg, value: string) => {
    setMultiCityLegs((prev) => prev.map((leg, i) => i === index ? { ...leg, [field]: value } : leg));
  };

  const addMultiLeg = () => {
    if (multiCityLegs.length < 5) {
      setMultiCityLegs((prev) => [...prev, { origin: "", destination: "", date: "" }]);
    }
  };

  const removeMultiLeg = (index: number) => {
    if (multiCityLegs.length > 2) {
      setMultiCityLegs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const fetchLists = useCallback(async () => {
    try {
      const [reqRes, actRes] = await Promise.all([
        adminFetch("/api/live-sessions/admin/requests"),
        adminFetch("/api/live-sessions/admin/active"),
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      if (actRes.ok) setActiveSessions(await actRes.json());
    } catch {} finally {
      setLoadingList(false);
    }
  }, []);

  const fetchSessionDetail = useCallback(async () => {
    if (!selectedSessionId) return;
    try {
      const res = await adminFetch(`/api/live-sessions/admin/${selectedSessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSessionDetail(data);
        const blockMap: Record<string, number> = {};
        if (data.blocks) {
          for (const block of data.blocks) {
            if (block.shared && block.blockType === "search_results") {
              const payload = block.payload as { flights?: FlightResult[] };
              if (payload?.flights?.[0]?.id) {
                blockMap[payload.flights[0].id] = block.id;
              }
            }
          }
        }
        setSharedBlockMap(blockMap);
      }
    } catch {}
  }, [selectedSessionId]);

  useEffect(() => {
    fetchLists();
    const interval = setInterval(fetchLists, 5000);
    return () => clearInterval(interval);
  }, [fetchLists]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetail();
      const interval = setInterval(fetchSessionDetail, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSessionId, fetchSessionDetail]);

  useEffect(() => {
    if (!selectedSessionId || prefilledSessionRef.current === selectedSessionId || !sessionContext) {
      return;
    }

    if (sessionContext.tripType === "multi-city") {
      setTripType("multi_city");
    } else if (sessionContext.tripType === "one-way") {
      setTripType("one_way");
    } else {
      setTripType("round_trip");
    }

    if (sessionContext.origin) setSearchOrigin(sessionContext.origin);
    if (sessionContext.destination) setSearchDestination(sessionContext.destination);
    if (sessionContext.date) setSearchDate(sessionContext.date);
    if (sessionContext.returnDate) setSearchReturnDate(sessionContext.returnDate);
    if (sessionContext.passengers) setSearchPassengers(sessionContext.passengers);
    if (sessionContext.cabinClass) setSearchCabinClass(sessionContext.cabinClass);

    prefilledSessionRef.current = selectedSessionId;
  }, [selectedSessionId, sessionContext]);

  useEffect(() => {
    liveMsgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionDetail?.messages]);

  const handleAcceptSession = async (id: number) => {
    try {
      const res = await adminFetch(`/api/live-sessions/admin/${id}/accept`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchLists();
        setSelectedSessionId(id);
      }
    } catch {}
  };

  const handleSearchFlights = async () => {
    if (tripType === "multi_city") {
      const validLegs = multiCityLegs.filter((l) => l.origin && l.destination && l.date);
      if (validLegs.length < 2) return;
      setSearchingFlights(true);
      setFlightResults([]);
      try {
        const params = new URLSearchParams({
          passengers: searchPassengers,
          cabinClass: searchCabinClass,
          tripType: "multi-city",
          legs: JSON.stringify(validLegs.map((l) => ({
            origin: l.origin,
            destination: l.destination,
            date: l.date,
          }))),
        });
        let res = await adminFetch(`/api/live-sessions/admin/search-flights?${params}`);
        if (res.status === 401) {
          res = await fetch(`/api/flights/search?${params}`, { credentials: "include" });
        }
        if (res.ok) {
          const data = await res.json();
          setFlightResults(Array.isArray(data) ? data : data.flights || []);
        } else {
          console.error("Flight search failed:", res.status, await res.text().catch(() => ""));
        }
      } catch (err) { console.error("Flight search error:", err); } finally {
        setSearchingFlights(false);
      }
    } else {
      if (!searchOrigin.trim() || !searchDestination.trim() || !searchDate) return;
      setSearchingFlights(true);
      setFlightResults([]);
      try {
        const params = new URLSearchParams({
          origin: searchOrigin.trim(),
          destination: searchDestination.trim(),
          date: searchDate,
          passengers: searchPassengers,
          cabinClass: searchCabinClass,
          tripType: tripType === "round_trip" ? "round-trip" : "one-way",
        });
        if (tripType === "round_trip" && searchReturnDate) {
          params.set("returnDate", searchReturnDate);
        }
        let res = await adminFetch(`/api/live-sessions/admin/search-flights?${params}`);
        if (res.status === 401) {
          res = await fetch(`/api/flights/search?${params}`, { credentials: "include" });
        }
        if (res.ok) {
          const data = await res.json();
          setFlightResults(Array.isArray(data) ? data : data.flights || []);
        } else {
          console.error("Flight search failed:", res.status, await res.text().catch(() => ""));
        }
      } catch (err) { console.error("Flight search error:", err); } finally {
        setSearchingFlights(false);
      }
    }
  };

  const getFlightPrice = (flight: FlightResult): number => {
    const custom = customPrices[flight.id];
    if (custom && !isNaN(parseFloat(custom))) return parseFloat(custom);
    return flight.price;
  };

  const getSearchParams = () => {
    if (tripType === "multi_city") {
      return { tripType: "multi-city", legs: multiCityLegs.filter((l) => l.origin && l.destination && l.date) };
    }
    const params: Record<string, string> = { origin: searchOrigin, destination: searchDestination, date: searchDate };
    if (tripType === "round_trip" && searchReturnDate) {
      params.returnDate = searchReturnDate;
    }
    return params;
  };

  const getFlightLabel = (f: FlightResult): string => {
    const orig = f.originCode || f.originCity || searchOrigin;
    const dest = f.destinationCode || f.destinationCity || searchDestination;
    return `${f.airline} ${f.flightNumber} (${orig} → ${dest})`;
  };

  const handleToggleShare = async (flight: FlightResult) => {
    if (!selectedSessionId || togglingFlight) return;
    setTogglingFlight(flight.id);
    const existingBlockId = sharedBlockMap[flight.id];
    try {
      if (existingBlockId) {
        const res = await adminFetch(`/api/live-sessions/admin/blocks/${existingBlockId}`, {
          method: "PATCH",
          body: JSON.stringify({ shared: false }),
        });
        if (res.ok) {
          setSharedBlockMap((prev) => {
            const next = { ...prev };
            delete next[flight.id];
            return next;
          });
          await fetchSessionDetail();
        }
      } else {
        const clientPrice = getFlightPrice(flight);
        const flightForClient = { ...flight, price: clientPrice };
        const guidance = buildSharedFlightGuidance(flightForClient, sessionMode, sessionContext);
        const res = await adminFetch(`/api/live-sessions/admin/${selectedSessionId}/blocks`, {
          method: "POST",
          body: JSON.stringify({
            blockType: "search_results",
            payload: {
              flights: [flightForClient],
              searchParams: getSearchParams(),
              guidance,
            },
            shared: true,
          }),
        });
        if (res.ok) {
          const block = await res.json();
          setSharedBlockMap((prev) => ({ ...prev, [flight.id]: block.id }));
          await fetchSessionDetail();
        }
      }
    } catch {} finally {
      setTogglingFlight(null);
    }
  };

  const handleUpdateSharedPrice = async (flight: FlightResult) => {
    const blockId = sharedBlockMap[flight.id];
    if (!blockId) return;
    const clientPrice = getFlightPrice(flight);
    const flightForClient = { ...flight, price: clientPrice };
    const guidance = buildSharedFlightGuidance(flightForClient, sessionMode, sessionContext);
    try {
      await adminFetch(`/api/live-sessions/admin/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify({
          payload: {
            flights: [flightForClient],
            searchParams: getSearchParams(),
            guidance,
          },
        }),
      });
      await fetchSessionDetail();
    } catch {}
  };

  const handleSendNote = async () => {
    if (!noteText.trim() || !selectedSessionId || sendingNote) return;
    setSendingNote(true);
    try {
      await adminFetch(`/api/live-sessions/admin/${selectedSessionId}/blocks`, {
        method: "POST",
        body: JSON.stringify({
          blockType: "custom_note",
          payload: { text: noteText.trim() },
          shared: true,
        }),
      });
      setNoteText("");
      await fetchSessionDetail();
    } catch {} finally {
      setSendingNote(false);
    }
  };

  const handleSendPricingSummary = async () => {
    if (!selectedSessionId || sendingPricingSummary) return;
    setSendingPricingSummary(true);
    const sharedFlightIds = Object.keys(sharedBlockMap);
    const sharedFlightsList = flightResults.filter((f) => sharedFlightIds.includes(f.id));
    const items = sharedFlightsList.map((f) => ({
      label: getFlightLabel(f),
      value: getFlightPrice(f),
      currency: f.currency,
    }));
    const total = items.reduce((sum, i) => sum + i.value, 0);
    const currency = sharedFlightsList[0]?.currency || "USD";
    try {
      await adminFetch(`/api/live-sessions/admin/${selectedSessionId}/blocks`, {
        method: "POST",
        body: JSON.stringify({
          blockType: "pricing",
          payload: {
            items: items.map((i) => ({ label: i.label, value: `${i.currency} ${i.value.toFixed(2)}` })),
            totalAmount: total.toFixed(2),
            currency,
          },
          shared: true,
        }),
      });
      await fetchSessionDetail();
    } catch {} finally {
      setSendingPricingSummary(false);
    }
  };

  const handleSendLiveMessage = async () => {
    if (!liveMessage.trim() || !selectedSessionId || sendingMessage) return;
    setSendingMessage(true);
    try {
      await adminFetch(`/api/live-sessions/admin/${selectedSessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: liveMessage.trim() }),
      });
      setLiveMessage("");
      await fetchSessionDetail();
    } catch {} finally {
      setSendingMessage(false);
    }
  };

  const handleUseQuickReply = (message: string) => {
    setLiveMessage(message);
  };

  const handleCloseSession = async () => {
    if (!selectedSessionId) return;
    try {
      await adminFetch(`/api/live-sessions/admin/${selectedSessionId}/close`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSelectedSessionId(null);
      setSessionDetail(null);
      setFlightResults([]);
      setSharedBlockMap({});
      setCustomPrices({});
      setChatOpen(false);
      prefilledSessionRef.current = null;
      await fetchLists();
    } catch {}
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const sharedCount = Object.keys(sharedBlockMap).length;
  const sharedTotal = flightResults
    .filter((f) => sharedBlockMap[f.id])
    .reduce((sum, f) => sum + getFlightPrice(f), 0);
  const sharedCurrency = flightResults.find((f) => sharedBlockMap[f.id])?.currency || "USD";
  const unreadCount = chatOpen ? 0 : (sessionDetail?.messages?.length || 0);
  const totalSessions = requests.length + activeSessions.length;

  const canSearchMultiCity = tripType === "multi_city" && multiCityLegs.filter((l) => l.origin && l.destination && l.date).length >= 2;
  const canSearchStandard = tripType !== "multi_city" && searchOrigin && searchDestination && searchDate;

  return (
    <div className="flex h-full min-h-0">
      {sessionsPanelOpen && (
        <div className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-muted/30">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Sessões
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSessionsPanelOpen(false)}
              data-testid="button-close-sessions-panel"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingList ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : totalSessions === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Plane className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-[11px]">Sem sessões ativas</p>
              </div>
            ) : (
              <>
                {requests.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[10px] font-semibold uppercase text-destructive px-1 py-0.5 mb-1">
                      Pendentes ({requests.length})
                    </p>
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-2 rounded-md border mb-1 ${isSeniorServiceMode(req.serviceMode) ? "bg-amber-50 border-amber-200" : "bg-destructive/5 border-destructive/20"}`}
                        data-testid={`session-request-${req.id}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-medium text-foreground truncate">
                            #{req.id}
                          </span>
                          <div className="flex items-center gap-1">
                            {isSeniorServiceMode(req.serviceMode) && (
                              <Badge className="text-[9px] px-1 py-0 bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100">
                                Senior
                              </Badge>
                            )}
                            <Badge variant="destructive" className="text-[9px] px-1 py-0">Novo</Badge>
                          </div>
                        </div>
                        <div className="text-[9px] text-muted-foreground mb-1">
                          {formatLiveSessionEntryPoint(req.entryPoint)}{req.language ? ` - ${req.language.toUpperCase()}` : ""}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] text-muted-foreground truncate">
                            {req.visitorId || "Visitante"}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptSession(req.id)}
                            className="h-6 text-[10px] px-2"
                            data-testid={`button-accept-session-${req.id}`}
                          >
                            Aceitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeSessions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground px-1 py-0.5 mb-1">
                      Ativas ({activeSessions.length})
                    </p>
                    {activeSessions.map((session) => (
                      (() => {
                        const rowTheme = getLiveSessionTheme(session.serviceMode);
                        const seniorRow = isSeniorServiceMode(session.serviceMode);
                        return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`w-full text-left p-2 rounded-md mb-1 ${
                          selectedSessionId === session.id
                            ? rowTheme.activeRowClass
                            : "hover-elevate"
                        }`}
                        data-testid={`session-active-${session.id}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-medium text-foreground truncate flex items-center gap-1">
                            <Plane className="h-3 w-3 flex-shrink-0" />
                            #{session.id}
                          </span>
                          {selectedSessionId === session.id && (
                            <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mb-1">
                          {seniorRow && (
                            <Badge className="text-[9px] px-1 py-0 bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100">
                              Senior
                            </Badge>
                          )}
                          <span className={`text-[9px] ${seniorRow ? "text-amber-700" : "text-muted-foreground"}`}>
                            {formatLiveSessionEntryPoint(session.entryPoint)}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground truncate block">
                          {session.visitorId || "Visitante"}
                        </span>
                      </button>
                        );
                      })()
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {selectedSessionId && (
            <div className="border-t border-border p-2 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground">Sessão #{selectedSessionId}</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleCloseSession}
                  className="h-6 text-[10px] px-2"
                  data-testid="button-close-session"
                >
                  <X className="h-3 w-3 mr-0.5" /> Encerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className={`flex items-center gap-2 px-3 py-2 flex-shrink-0 ${selectedSessionId ? sessionTheme.headerClass : "border-b border-border bg-[#0074DE] text-white"}`}>
          {!sessionsPanelOpen && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSessionsPanelOpen(true)}
              className={selectedSessionId && isSeniorLead ? "text-amber-950 hover:bg-amber-100/70 flex-shrink-0" : "text-white no-default-hover-elevate flex-shrink-0"}
              data-testid="button-open-sessions-panel"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
          <Plane className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            {isSeniorLead ? "Workspace Senior" : "Workspace de Vendas"}
          </span>
          <div className="flex-1" />
          {!sessionsPanelOpen && totalSessions > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] cursor-pointer"
              onClick={() => setSessionsPanelOpen(true)}
            >
              {totalSessions} sessão(ões)
            </Badge>
          )}
          {selectedSessionId && (
            <div className="flex items-center gap-2">
              {isSeniorLead && (
                <Badge className="text-[10px] bg-white text-amber-900 border-amber-200 hover:bg-white">
                  Senior
                </Badge>
              )}
              <Badge variant="secondary" className={selectedSessionId && isSeniorLead ? "text-[10px] bg-amber-100 text-amber-900 border-amber-200" : "text-[10px] bg-white/20 text-white border-white/30"}>
                Sessao #{selectedSessionId}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 border-b space-y-2">
            {selectedSessionId && selectedSession && (
              <div className={`rounded-2xl p-4 ${sessionTheme.softPanelClass}`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={sessionTheme.badgeClass}>
                        {isSeniorLead ? "Lead senior" : "Lead padrao"}
                      </Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {formatLiveSessionEntryPoint(selectedSession.entryPoint)}
                      </Badge>
                      {selectedSession.language && (
                        <Badge variant="outline" className="text-[11px]">
                          {selectedSession.language.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <h2 className="mt-3 text-base font-bold">
                      {isSeniorLead
                        ? "Este contato pede menos ruido e mais orientacao humana."
                        : "Use este workspace para buscar, compartilhar e fechar a venda."}
                    </h2>
                    {sessionSummaryItems.length > 0 && (
                      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                        {sessionSummaryItems.map((item) => (
                          <div key={item.label} className="rounded-xl border border-white/70 bg-white/70 px-3 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isSeniorLead && seniorAgentTips.length > 0 && (
                    <div className="lg:max-w-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Como conduzir</p>
                      <div className="mt-3 space-y-2">
                        {seniorAgentTips.map((tip) => (
                          <div key={tip} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={tripType} onValueChange={(v) => setTripType(v as "round_trip" | "one_way" | "multi_city")}>
                <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-trip-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_trip">Ida e Volta</SelectItem>
                  <SelectItem value="one_way">Somente Ida</SelectItem>
                  <SelectItem value="multi_city">Multi-cidades</SelectItem>
                </SelectContent>
              </Select>
              <Select value={searchPassengers} onValueChange={setSearchPassengers}>
                <SelectTrigger className="w-[80px] h-8 text-xs" data-testid="select-passengers">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} pax</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={searchCabinClass} onValueChange={setSearchCabinClass}>
                <SelectTrigger className="w-[110px] h-8 text-xs" data-testid="select-cabin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium_economy">Premium</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tripType === "multi_city" ? (
              <div className="space-y-2">
                {multiCityLegs.map((leg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium w-4 flex-shrink-0">{i + 1}.</span>
                    <div className="flex-1 grid grid-cols-3 gap-1.5">
                      <AdminLocationInput
                        value={leg.origin}
                        onChange={(v) => updateMultiLeg(i, "origin", v)}
                        placeholder="Origem"
                        testId={`input-multi-origin-${i}`}
                      />
                      <AdminLocationInput
                        value={leg.destination}
                        onChange={(v) => updateMultiLeg(i, "destination", v)}
                        placeholder="Destino"
                        testId={`input-multi-dest-${i}`}
                      />
                      <div className="relative">
                        <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          type="date"
                          value={leg.date}
                          onChange={(e) => updateMultiLeg(i, "date", e.target.value)}
                          className="pl-7 text-xs h-9"
                          data-testid={`input-multi-date-${i}`}
                        />
                      </div>
                    </div>
                    {multiCityLegs.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMultiLeg(i)}
                        data-testid={`button-remove-leg-${i}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {multiCityLegs.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMultiLeg}
                    className="w-full text-xs"
                    data-testid="button-add-leg"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar trecho
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <AdminLocationInput value={searchOrigin} onChange={setSearchOrigin} placeholder="Origem" testId="input-search-origin" />
                  <AdminLocationInput value={searchDestination} onChange={setSearchDestination} placeholder="Destino" testId="input-search-destination" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="pl-7 text-sm h-9"
                      data-testid="input-search-date"
                    />
                  </div>
                  {tripType === "round_trip" && (
                    <div className="relative">
                      <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="date"
                        value={searchReturnDate}
                        onChange={(e) => setSearchReturnDate(e.target.value)}
                        className="pl-7 text-sm h-9"
                        data-testid="input-search-return-date"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <Button
              onClick={handleSearchFlights}
              disabled={(!canSearchStandard && !canSearchMultiCity) || searchingFlights}
              className="w-full"
              data-testid="button-search-flights"
            >
              {searchingFlights ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Buscar Voos
            </Button>
          </div>

          {searchingFlights && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#0074DE]" />
            </div>
          )}

          {!searchingFlights && flightResults.length > 0 && (
            <div className="p-2 space-y-1">
              {isSeniorLead && seniorFlightRanking && (
                <div className={`rounded-xl px-3 py-3 mb-2 ${sessionTheme.guidanceCardClass}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Leitura senior do buscador</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Resultados ordenados por conforto, conexao e clareza antes do preco puro.
                      </p>
                    </div>
                    {seniorFlightRanking.fallbackApplied && (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100">
                        Sem voo estrito, mostrando melhor aproximacao
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {sharedCount > 0 && selectedSessionId && (
                <div className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md mb-2 ${isSeniorLead ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 dark:bg-emerald-950/30"}`}>
                  <span className={`text-xs font-medium ${isSeniorLead ? "text-amber-800" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {sharedCount} compartilhado(s) - {sharedCurrency} {sharedTotal.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendPricingSummary}
                    disabled={sendingPricingSummary}
                    className="h-7 text-xs"
                    data-testid="button-send-pricing"
                  >
                    {sendingPricingSummary ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Receipt className="h-3 w-3 mr-1" />}
                    {isSeniorLead ? "Enviar resumo simples" : "Enviar Resumo"}
                  </Button>
                </div>
              )}
              {orderedFlightResults.map((flight) => {
                const isShared = !!sharedBlockMap[flight.id];
                const customPrice = customPrices[flight.id];
                const hasCustomPrice = customPrice && !isNaN(parseFloat(customPrice)) && parseFloat(customPrice) !== flight.price;
                const recommendation = recommendationMap.get(flight.id);
                return (
                  <div
                    key={flight.id}
                    className={`p-2.5 rounded-md border text-sm ${
                      isShared
                        ? isSeniorLead
                          ? "border-amber-300 bg-amber-50/70"
                          : "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-border"
                    }`}
                    data-testid={`flight-result-${flight.id}`}
                  >
                    {recommendation && (
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100">
                          {getSeniorRecommendationLabel(recommendation.kind)}
                        </Badge>
                        <span className="text-[11px] text-slate-600">{recommendation.reasonLine}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {flight.logoUrl && (
                          <img src={flight.logoUrl} alt="" className="h-4 w-4 rounded-sm flex-shrink-0" />
                        )}
                        <span className="font-medium text-foreground truncate">{flight.airline}</span>
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">{flight.flightNumber}</Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isShared && hasCustomPrice && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleUpdateSharedPrice(flight)}
                            data-testid={`button-update-price-${flight.id}`}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        {selectedSessionId && (
                          <Button
                            size="icon"
                            variant={isShared ? "default" : "ghost"}
                            onClick={() => handleToggleShare(flight)}
                            disabled={togglingFlight === flight.id}
                            className={isShared && isSeniorLead ? "bg-amber-600 hover:bg-amber-700 text-white" : undefined}
                            data-testid={`button-share-${flight.id}`}
                          >
                            {togglingFlight === flight.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isShared ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <Share2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{formatTime(flight.departureTime)}</span>
                      <span className="text-[10px]">→</span>
                      <span>{formatTime(flight.arrivalTime)}</span>
                      <span className="text-[10px]">({flight.duration})</span>
                      {flight.stops === 0 ? (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">Direto</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{flight.stops} parada(s)</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {flight.currency} {flight.price.toFixed(2)}
                      </span>
                      {editingPrice === flight.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={customPrices[flight.id] || ""}
                            onChange={(e) => setCustomPrices((prev) => ({ ...prev, [flight.id]: e.target.value }))}
                            className="w-20 h-6 text-xs"
                            placeholder="Novo"
                            data-testid={`input-custom-price-${flight.id}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingPrice(null)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingPrice(flight.id)}
                          className="flex items-center gap-0.5 text-xs text-[#0074DE] hover:underline"
                          data-testid={`button-edit-price-${flight.id}`}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                          {hasCustomPrice && (
                            <span className="font-medium">{flight.currency} {parseFloat(customPrice).toFixed(2)}</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!searchingFlights && flightResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Busque voos acima</p>
              <p className="text-xs mt-1">Resultados aparecem aqui</p>
            </div>
          )}
        </div>

        {selectedSessionId && (
          <div className="flex-shrink-0 border-t border-border">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2">
                <StickyNote className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendNote();
                    }
                  }}
                  placeholder={isSeniorLead ? "Nota simples para o cliente (ex: Esta opcao tem menos cansaco e 1 conexao)" : "Nota para o cliente (ex: Inclui 1 mala de 23kg)"}
                  disabled={sendingNote}
                  className="flex-1 h-8 text-sm"
                  data-testid="input-admin-note"
                />
                <Button
                  size="icon"
                  onClick={handleSendNote}
                  disabled={!noteText.trim() || sendingNote}
                  data-testid="button-send-note"
                >
                  {sendingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 hover-elevate"
              data-testid="button-toggle-chat"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase text-muted-foreground">Chat da Sessão</span>
                {!chatOpen && unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{unreadCount}</Badge>
                )}
              </div>
              {chatOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>

            {chatOpen && (
              <div className="border-t border-border">
                <div className="max-h-36 overflow-y-auto p-2 space-y-1.5">
                  {(!sessionDetail?.messages || sessionDetail.messages.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-2">Sem mensagens</p>
                  )}
                  {sessionDetail?.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-1.5 ${msg.role === "client" ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <div
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                          msg.role === "client"
                            ? sessionTheme.userAvatarClass
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {msg.role === "client" ? (
                          <User className="h-2.5 w-2.5" />
                        ) : (
                          <UserCheck className="h-2.5 w-2.5" />
                        )}
                      </div>
                      <div className="max-w-[80%]">
                        <div
                          className={`rounded-xl px-2.5 py-1.5 text-xs ${
                            msg.role === "client"
                              ? `${sessionTheme.guidanceCardClass} text-foreground rounded-bl-sm`
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-foreground rounded-br-sm border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5 px-1">
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={liveMsgEndRef} />
                </div>
                <div className="p-2 pt-0">
                  {seniorQuickReplies.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {seniorQuickReplies.map((replyText) => (
                        <button
                          key={replyText}
                          type="button"
                          onClick={() => handleUseQuickReply(replyText)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${sessionTheme.chipClass}`}
                        >
                          {replyText}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      value={liveMessage}
                      onChange={(e) => setLiveMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendLiveMessage();
                        }
                      }}
                      placeholder={isSeniorLead ? "Mensagem calma e passo a passo..." : "Mensagem..."}
                      disabled={sendingMessage}
                      className="flex-1 h-8 text-sm"
                      data-testid="input-live-message"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendLiveMessage}
                      disabled={!liveMessage.trim() || sendingMessage}
                      data-testid="button-send-live-message"
                    >
                      {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLiveChat() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"chat" | "vendas">("chat");
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const qc = useQueryClient();

  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
        credentials: "include",
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["/api/admin/check"] });
      } else if (res.status === 429) {
        setLoginError("Muitas tentativas. Aguarde 15 minutos.");
      } else {
        setLoginError("Senha incorreta");
      }
    } catch {
      setLoginError("Erro de conexão");
    } finally {
      setLoginLoading(false);
    }
  };

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/admin/chatbot/conversations"],
    refetchInterval: 5000,
    enabled: !!adminCheck?.isAdmin,
  });

  const { data: selectedMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/admin/chatbot/conversations", selectedConvId, "messages"],
    enabled: !!selectedConvId && !!adminCheck?.isAdmin,
    refetchInterval: 3000,
    queryFn: async () => {
      const res = await fetch(`/api/admin/chatbot/conversations/${selectedConvId}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const sendReply = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", "/api/admin/chatbot/reply", {
        conversationId: selectedConvId,
        content,
      });
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/conversations", selectedConvId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/conversations"] });
    },
  });

  const resolveConv = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/chatbot/escalations/${id}/resolve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/conversations"] });
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedMessages, scrollToBottom]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const escalatedConvs = conversations.filter((c) => c.escalated && !c.resolved);
  const resolvedConvs = conversations.filter((c) => c.resolved);
  const otherConvs = conversations.filter((c) => !c.escalated && !c.resolved);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const getLastMessage = (conv: Conversation) => {
    if (conv.messages.length === 0) return "Sem mensagens";
    const last = conv.messages[conv.messages.length - 1];
    return last.content.substring(0, 60) + (last.content.length > 60 ? "..." : "");
  };

  const handleSendReply = () => {
    if (!reply.trim() || !selectedConvId) return;
    sendReply.mutate(reply.trim());
  };

  const handleSelectConv = (id: number) => {
    setSelectedConvId(id);
  };

  const handleBackToList = () => {
    setSelectedConvId(null);
  };

  const renderConversationItem = (conv: Conversation) => {
    const hasUnread = conv.escalated && !conv.resolved;
    const lastMsg = conv.messages[conv.messages.length - 1];
    const isFromUser = lastMsg?.role === "user";

    return (
      <button
        key={conv.id}
        onClick={() => handleSelectConv(conv.id)}
        className={`w-full text-left p-3 rounded-md transition-colors ${
          selectedConvId === conv.id
            ? "bg-[#0074DE]/10 border border-[#0074DE]/30"
            : "hover-elevate"
        }`}
        data-testid={`conv-item-${conv.id}`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-foreground truncate">
            #{conv.id} - {conv.visitorId || "Visitante"}
          </span>
          {conv.escalated && !conv.resolved && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              Escalado
            </Badge>
          )}
          {conv.resolved && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
              Resolvido
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{getLastMessage(conv)}</p>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          {formatDate(conv.createdAt)}
          {isFromUser && hasUnread && (
            <span className="ml-auto bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold">!</span>
          )}
          {!hasUnread && <span className="ml-auto">{conv.messages.length} msgs</span>}
        </div>
      </button>
    );
  };

  const conversationList = (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Conversas do Chatbot</span>
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/conversations"] })}
            data-testid="button-refresh-conversations"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
            <span>Nenhuma conversa</span>
          </div>
        ) : (
          <>
            {escalatedConvs.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-destructive px-2 py-1">
                  Aguardando Resposta ({escalatedConvs.length})
                </p>
                {escalatedConvs.map(renderConversationItem)}
              </div>
            )}
            {otherConvs.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">
                  Ativas ({otherConvs.length})
                </p>
                {otherConvs.map(renderConversationItem)}
              </div>
            )}
            {resolvedConvs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">
                  Resolvidas ({resolvedConvs.length})
                </p>
                {resolvedConvs.map(renderConversationItem)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const chatView = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-2 p-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleBackToList}
            className="flex-shrink-0"
            data-testid="button-back-to-list"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              #{selectedConvId}
              {selectedConv?.visitorId && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({selectedConv.visitorId})
                </span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {selectedConv?.language || "pt"} | {selectedConv ? formatDate(selectedConv.createdAt) : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedConv?.escalated && !selectedConv?.resolved && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resolveConv.mutate(selectedConvId!)}
              disabled={resolveConv.isPending}
              data-testid="button-resolve-conversation"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Resolver</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
        {selectedMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                msg.role === "user"
                  ? "bg-[#0074DE] text-white"
                  : msg.role === "admin"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5" />
              ) : msg.role === "admin" ? (
                <UserCheck className="h-3.5 w-3.5" />
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="max-w-[80%] md:max-w-[70%]">
              <div
                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#0074DE] text-white rounded-br-md"
                    : msg.role === "admin"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-foreground rounded-bl-md border border-emerald-200 dark:border-emerald-800"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
                data-testid={`admin-msg-${msg.id}`}
              >
                {msg.role === "admin" && (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                    Agente
                  </span>
                )}
                {msg.content.replace(/\[ESCALATE\]/gi, "").replace(/\[AGENT:.*?\]/g, "").trim()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                {formatDate(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <Input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
            placeholder="Digite sua resposta..."
            disabled={sendReply.isPending}
            className="flex-1"
            data-testid="input-admin-reply"
          />
          <Button
            size="icon"
            onClick={handleSendReply}
            disabled={!reply.trim() || sendReply.isPending}
            data-testid="button-admin-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#0074DE]" />
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0074DE] p-4">
        <Card className="w-full max-w-sm p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-[#0074DE] flex items-center justify-center mb-3">
              <Headphones className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Atendimento ao Vivo</h1>
            <p className="text-sm text-muted-foreground">Faça login para acessar</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Senha de administrador"
                className="pl-10"
                autoFocus
                disabled={loginLoading}
                data-testid="input-livechat-admin-password"
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive text-center" data-testid="text-livechat-login-error">{loginError}</p>
            )}
            <Button type="submit" className="w-full" disabled={!loginPassword.trim() || loginLoading} data-testid="button-livechat-admin-login">
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const chatTabContent = (
    <>
      {!selectedConvId ? (
        <div className="flex-1 flex flex-col min-h-0">
          {conversationList}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {chatView}
        </div>
      )}
    </>
  );

  return (
    <div className="h-full flex flex-col" data-testid="admin-live-chat">
      <div className="flex flex-col border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/admin")}
            data-testid="button-back-admin"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-foreground">Atendimento ao Vivo</h1>
            <p className="text-xs text-muted-foreground">
              Gerencie conversas e sessões de vendas
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {escalatedConvs.length > 0 && (
              <Badge variant="destructive" data-testid="badge-escalated-count">
                {escalatedConvs.length} pendente{escalatedConvs.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex px-4 pb-2 gap-1">
          <button
            onClick={() => { setActiveTab("chat"); setSelectedConvId(null); }}
            className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-[#0074DE] text-white"
                : "bg-muted text-muted-foreground hover-elevate"
            }`}
            data-testid="tab-chat"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </button>
          <button
            onClick={() => { setActiveTab("vendas"); setSelectedConvId(null); }}
            className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "vendas"
                ? "bg-[#0074DE] text-white"
                : "bg-muted text-muted-foreground hover-elevate"
            }`}
            data-testid="tab-vendas"
          >
            <Plane className="h-3.5 w-3.5" />
            Vendas ao Vivo
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "vendas" ? (
          <LiveSalesPanel />
        ) : (
          chatTabContent
        )}
      </div>
    </div>
  );
}
