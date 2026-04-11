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
  Mic,
  PanelLeft,
  PanelLeftClose,
  ArrowRight,
  Square,
  Circle,
} from "lucide-react";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import type { FlightOffer } from "@shared/schema";
import {
  buildSeniorRecommendations,
  type SeniorPreferences,
  type SeniorRecommendationKind,
} from "@/lib/senior-flight";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";

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
  label,
}: {
  value: string;
  onChange: (iata: string) => void;
  placeholder: string;
  testId: string;
  label?: string;
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
    <div className="relative space-y-1.5" ref={wrapperRef}>
      {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
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
          className="pl-7 text-sm h-9 glass bg-white/5 border-white/10 text-white focus:border-primary/50"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          data-testid={testId}
        />
        {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[999] max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((place) => (
            <button
              type="button"
              key={place.id}
              onClick={() => handleSelect(place)}
              data-testid={`place-option-${place.iataCode}`}
              className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                {place.type === "airport" ? (
                  <Plane className="h-4 w-4 text-blue-400" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate">{place.cityName || place.name}</span>
                  <span className="text-blue-400 font-black text-xs">({place.iataCode})</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">
                  {place.name} • {place.countryName}
                </p>
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

const defaultSeniorPreferences: SeniorPreferences = {
  priority: "comfort",
  connections: "one",
  bags: "checked",
  time: "day",
};

const seniorPriorityLabels: Record<SeniorPreferences["priority"], string> = {
  comfort: "Menos cansaco",
  fastest: "Menos tempo total",
  balanced: "Equilibrio",
  cheapest: "Menor preco",
};

const seniorConnectionLabels: Record<SeniorPreferences["connections"], string> = {
  none: "Sem conexao",
  one: "No maximo 1 conexao",
  any: "Pode comparar tudo",
};

const seniorBagLabels: Record<SeniorPreferences["bags"], string> = {
  checked: "Com mala despachada",
  carry: "Com bagagem de mao",
  flexible: "Bagagem flexivel",
};

const seniorTimeLabels: Record<SeniorPreferences["time"], string> = {
  day: "Evitar madrugada",
  any: "Qualquer horario",
};

function getTripTypeLabel(tripType: "round_trip" | "one_way" | "multi_city") {
  if (tripType === "one_way") return "Somente ida";
  if (tripType === "multi_city") return "Multi-cidades";
  return "Ida e volta";
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
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [searchCabinClass, setSearchCabinClass] = useState("economy");
  const [workspaceModeOverride, setWorkspaceModeOverride] = useState<"standard" | "senior">("standard");
  const [manualSeniorPreferences, setManualSeniorPreferences] = useState<SeniorPreferences>(defaultSeniorPreferences);
  const [multiCityLegs, setMultiCityLegs] = useState<SearchLeg[]>([
    { origin: "", destination: "", date: "" },
    { origin: "", destination: "", date: "" },
  ]);
  const [searchingFlights, setSearchingFlights] = useState(false);
  const [flightResults, setFlightResults] = useState<FlightResult[]>([]);
  const [filterNonStop, setFilterNonStop] = useState(false);

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
  const { t } = useI18n();

  // Media States
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  const startVideoCall = () => {
    setVideoModalOpen(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        // Em um cenário real, faríamos upload aqui. Para o MVP, simularemos o envio.
        console.log("Audio extraído:", audioBlob);
        handleSendLiveMessage(`[Audio Message] ${t("admin.live_chat.voice_message")}`);
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setAudioChunks([]);
    }
  };

  const selectedSession = sessionDetail?.session;
  const effectiveServiceMode = selectedSession?.serviceMode === "senior" ? "senior" : selectedSession?.serviceMode === "standard" ? "standard" : workspaceModeOverride;
  const sessionContext = (selectedSession?.contextSnapshot || null) as LiveSessionContextSnapshot | null;
  const isSeniorLead = isSeniorServiceMode(effectiveServiceMode);
  const sessionTheme = getLiveSessionTheme(effectiveServiceMode);
  const seniorPreferences = useMemo(
    () => (selectedSession ? getSeniorPreferencesFromContext(sessionContext) : manualSeniorPreferences),
    [manualSeniorPreferences, selectedSession, sessionContext],
  );
  const sessionSummaryItems = useMemo(
    () => {
      if (selectedSession) {
        return buildSeniorSessionSummary(sessionContext);
      }

      if (!isSeniorLead) {
        return [];
      }

      const routeValue = tripType === "multi_city"
        ? `${multiCityLegs.filter((leg) => leg.origin && leg.destination).length || 0} trechos montados`
        : searchOrigin && searchDestination
          ? `${searchOrigin} -> ${searchDestination}`
          : "Defina origem e destino";

      return [
        { label: "Viagem", value: getTripTypeLabel(tripType) },
        { label: "Rota", value: routeValue },
        { label: "Prioridade", value: seniorPriorityLabels[seniorPreferences.priority] },
        { label: "Filtro senior", value: seniorConnectionLabels[seniorPreferences.connections] },
      ];
    },
    [isSeniorLead, multiCityLegs, searchDestination, searchOrigin, selectedSession, seniorPreferences.connections, seniorPreferences.priority, sessionContext, tripType],
  );
  const seniorAgentTips = useMemo(
    () => {
      if (!isSeniorLead) return [];
      if (selectedSession) return buildSeniorAgentTips(sessionContext);

      return [
        "Comece recomendando 3 opcoes: a mais calma, a mais rapida e a mais economica dentro do perfil.",
        "Explique conexao, tempo de espera e bagagem antes de falar em tarifa e regras finas.",
        "Evite jogar muitos filtros na frente. Primeiro oriente, depois abra os detalhes.",
      ];
    },
    [isSeniorLead, selectedSession, sessionContext],
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
  const showSeniorWorkspacePreview = isSeniorLead && !selectedSessionId;

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
    if (typeof window === "undefined") return;
    const requestedSession = Number.parseInt(new URLSearchParams(window.location.search).get("session") || "", 10);
    if (!Number.isFinite(requestedSession) || requestedSession <= 0) return;
    setSelectedSessionId(requestedSession);
  }, []);

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
          passengers: (adults + children + infants).toString(),
          adults: adults.toString(),
          children: children.toString(),
          infants: infants.toString(),
          cabinClass: searchCabinClass,
          tripType: "multi-city",
          legs: JSON.stringify(validLegs.map((l) => ({
            origin: l.origin,
            destination: l.destination,
            date: l.date,
          }))),
          nonStop: filterNonStop.toString(),
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
          passengers: (adults + children + infants).toString(),
          adults: adults.toString(),
          children: children.toString(),
          infants: infants.toString(),
          cabinClass: searchCabinClass,
          tripType: tripType === "round_trip" ? "round-trip" : "one-way",
          nonStop: filterNonStop.toString(),
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
        const guidance = buildSharedFlightGuidance(flightForClient, effectiveServiceMode, sessionContext);
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
    const guidance = buildSharedFlightGuidance(flightForClient, effectiveServiceMode, sessionContext);
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

  const [sendingVoicePrompt, setSendingVoicePrompt] = useState(false);
  const handleSpeakThroughMia = async () => {
    if (!liveMessage.trim() || !selectedSessionId || sendingVoicePrompt) return;
    setSendingVoicePrompt(true);
    try {
      await adminFetch(`/api/live-sessions/admin/${selectedSessionId}/blocks`, {
        method: "POST",
        body: JSON.stringify({
          blockType: "voice_prompt",
          payload: { text: liveMessage.trim() },
          shared: true,
        }),
      });
      // Também logar no chat para registro
      await adminFetch(`/api/live-sessions/admin/${selectedSessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: `[Mia Speak] ${liveMessage.trim()}` }),
      });
      setLiveMessage("");
      await fetchSessionDetail();
    } catch (err) {
      console.error("Falha ao enviar comando de voz:", err);
    } finally {
      setSendingVoicePrompt(false);
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
    <div className="site-admin-shell h-full min-h-0 bg-slate-950 overflow-hidden">
      <div className="flex h-full min-h-0 relative z-10 gap-4">
        {sessionsPanelOpen && (
          <div className="w-64 flex-shrink-0 flex flex-col glass rounded-3xl overflow-hidden border-white/5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-display">
                <Users className="h-3.5 w-3.5" /> {t("admin.live_chat.sessions")}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSessionsPanelOpen(false)}
                className="hover:bg-white/10 text-white/70"
                data-testid="button-close-sessions-panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingList ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sincronizando...</span>
                </div>
              ) : (
                <>
                  {requests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase text-coral-500/80 px-2 py-1 tracking-tighter mb-1">
                        {t("admin.live_chat.requests")} ({requests.length})
                      </p>
                      {requests.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleAcceptSession(s.id)}
                          className="w-full text-left p-3 rounded-2xl mb-1 transition-all bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-emerald-400">{t("admin.live_chat.new_service")}</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          <p className="text-[10px] text-emerald-200/70 font-medium">#{s.id} - {s.serviceMode === 'senior' ? 'SÊNIOR' : 'STANDARD'}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeSessions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500 px-2 py-1 tracking-widest mb-1">
                        {t("admin.live_chat.active_sessions")} ({activeSessions.length})
                      </p>
                      {activeSessions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSessionId(s.id)}
                          className={`w-full text-left p-3 rounded-2xl mb-1 transition-all border ${
                            selectedSessionId === s.id
                              ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/10"
                              : "glass bg-white/5 border-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-xs font-bold ${selectedSessionId === s.id ? 'text-white' : 'text-slate-300'}`}>
                              #{s.id} - {s.visitorId || "Visitante"}
                            </span>
                            <Badge variant="outline" className={`text-[9px] border-white/10 ${s.serviceMode === 'senior' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-blue-500/20 text-blue-400'}`}>
                              {s.serviceMode === 'senior' ? 'SÊNIOR' : 'STD'}
                            </Badge>
                          </div>
                          <p className="text-[9px] text-slate-500 font-medium">{formatDate(s.createdAt)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 glass rounded-3xl border-white/5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-4 p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Plane className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold font-display uppercase tracking-widest text-white">
                  {selectedSessionId ? `Missão #${selectedSessionId}` : "Espaço de Vendas"}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                    {effectiveServiceMode === "senior" ? "CONCIERGE SÊNIOR ATIVO" : "TERMINAL DE VENDAS"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedSessionId && (
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl gap-2 hover:bg-white/10 text-white"
                    onClick={startVideoCall}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs font-bold">{t("admin.live_chat.video_call")}</span>
                  </Button>
                  
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  
                  {isRecording ? (
                    <div className="flex items-center gap-2 px-2">
                      <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{t("admin.live_chat.recording_label")}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-red-500/20 text-red-500" onClick={stopRecording}>
                        <Square className="h-3 w-3 fill-current" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={cancelRecording}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-xl gap-2 hover:bg-white/10 text-white"
                      onClick={startRecording}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs font-bold">{t("admin.live_chat.audio")}</span>
                    </Button>
                  )}
                </div>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSessionsPanelOpen(!sessionsPanelOpen)}
                className="hover:bg-white/10"
                data-testid="button-toggle-sessions"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className={`p-4 ${isSeniorLead ? "space-y-6" : "space-y-4"}`}>
              <div className="glass-dark p-6 rounded-3xl border-white/5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("admin.live_chat.fare_search")}</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
                  {[
                    { id: "one_way", label: "Somente Ida" },
                    { id: "round_trip", label: "Ida e Volta" },
                    { id: "multi_city", label: "Multi-Cidades" },
                  ].map((type) => (
                    <Button
                      key={type.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => setTripType(type.id as any)}
                      className={`h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                        tripType === type.id ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>

                {tripType === "multi_city" ? (
                  <div className="space-y-4">
                    {multiCityLegs.map((leg, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 relative">
                        <AdminLocationInput
                          label={`${idx + 1}º Trecho: Origem`}
                          value={leg.origin}
                          onChange={(v) => updateMultiLeg(idx, "origin", v)}
                          placeholder="Origem"
                          testId={`multi-origin-${idx}`}
                        />
                        <AdminLocationInput
                          label="Destino"
                          value={leg.destination}
                          onChange={(v) => updateMultiLeg(idx, "destination", v)}
                          placeholder="Destino"
                          testId={`multi-dest-${idx}`}
                        />
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                          <Input
                            type="date"
                            value={leg.date}
                            onChange={(e) => updateMultiLeg(idx, "date", e.target.value)}
                            className="glass bg-white/5 border-white/10 h-10 rounded-xl"
                          />
                        </div>
                        {multiCityLegs.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                            onClick={() => removeMultiLeg(idx)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addMultiLeg}
                      disabled={multiCityLegs.length >= 5}
                      className="h-10 rounded-xl border-dashed border-white/20 hover:border-primary/50 text-slate-400 hover:text-white w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Trecho
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AdminLocationInput
                      label={t("admin.live_chat.origin")}
                      value={searchOrigin}
                      onChange={setSearchOrigin}
                      placeholder={t("admin.field_placeholder_airport")}
                      testId="admin-search-origin"
                    />
                    <AdminLocationInput
                      label={t("admin.live_chat.destination")}
                      value={searchDestination}
                      onChange={setSearchDestination}
                      placeholder={t("admin.field_placeholder_airport")}
                      testId="admin-search-destination"
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                        {tripType === "round_trip" ? "Data Ida" : t("admin.live_chat.departure_date")}
                      </label>
                      <Input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="glass bg-white/5 border-white/10 h-10 rounded-xl"
                      />
                    </div>
                    {tripType === "round_trip" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Data Volta</label>
                        <Input
                          type="date"
                          value={searchReturnDate}
                          onChange={(e) => setSearchReturnDate(e.target.value)}
                          className="glass bg-white/5 border-white/10 h-10 rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-end gap-6 pt-4 border-t border-white/5 mt-4">
                  <div className="flex gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Adultos</label>
                      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setAdults(Math.max(1, adults - 1))}>-</Button>
                        <span className="w-4 text-center text-xs font-bold">{adults}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setAdults(adults + 1)}>+</Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Crianças</label>
                      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setChildren(Math.max(0, children - 1))}>-</Button>
                        <span className="w-4 text-center text-xs font-bold">{children}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setChildren(children + 1)}>+</Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Bebês</label>
                      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setInfants(Math.max(0, infants - 1))}>-</Button>
                        <span className="w-4 text-center text-xs font-bold">{infants}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setInfants(infants + 1)}>+</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 min-w-[140px]">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Classe</label>
                    <Select value={searchCabinClass} onValueChange={setSearchCabinClass}>
                      <SelectTrigger className="glass bg-white/5 border-white/10 h-9 rounded-xl text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dark border-white/10 rounded-2xl">
                        <SelectItem value="economy">ECONÔMICA</SelectItem>
                        <SelectItem value="premium_economy">PREMIUM ECONOMY</SelectItem>
                        <SelectItem value="business">EXECUTIVA</SelectItem>
                        <SelectItem value="first">PRIMEIRA CLASSE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <button 
                      onClick={() => setFilterNonStop(!filterNonStop)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${filterNonStop ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
                    >
                      <div className={`h-3 w-3 rounded-full border-2 border-current flex items-center justify-center`}>
                        {filterNonStop && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Apenas Direto</span>
                    </button>
                  </div>

                  <div className="flex-1 min-w-[120px]">
                    <Button
                      className="w-full h-10 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      onClick={handleSearchFlights}
                      disabled={searchingFlights || (tripType === 'multi_city' ? !canSearchMultiCity : !canSearchStandard)}
                    >
                      {searchingFlights ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                      Pesquisar Agora
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {searchingFlights ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Plane className="h-12 w-12 text-slate-600 animate-bounce mb-4" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando Melhores Ofertas...</p>
                  </div>
                ) : flightResults.length > 0 ? (
                  <div className="space-y-4">
                     {orderedFlightResults.map((flight) => {
                       const isShared = (sessionDetail?.sharedFlights || []).some(sf => sf.id === flight.id);
                       const recommendation = recommendationMap.get(flight.id);
                       const currentPrice = getFlightPrice(flight);
                       
                       return (
                         <div 
                           key={flight.id} 
                           className={`glass hover:border-primary/50 transition-all p-5 rounded-3xl border-white/10 group relative overflow-hidden ${isShared ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                         >
                            {recommendation && (
                              <div className="absolute top-0 right-12 px-3 py-1 bg-amber-500 text-black text-[9px] font-black uppercase tracking-tighter rounded-bl-xl shadow-xl z-20">
                                {getSeniorRecommendationLabel(recommendation.kind)}
                              </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 glass-dark rounded-xl flex items-center justify-center border border-white/10">
                                  {flight.logoUrl ? (
                                    <img src={flight.logoUrl} alt="" className="h-6 w-6 object-contain" />
                                  ) : (
                                    <Plane className="h-5 w-5 text-white/40" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white leading-none mb-1">{flight.airline}</h4>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{flight.flightNumber}</p>
                                    <span className="text-[10px] text-primary font-bold">|</span>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{flight.cabinClass || "ECONÔMICA"}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`rounded-xl px-4 h-9 font-bold transition-all ${isShared ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass-dark text-slate-400 hover:text-white'}`}
                                  onClick={() => handleToggleShare(flight)}
                                  disabled={togglingFlight === flight.id}
                                >
                                  {togglingFlight === flight.id ? <Loader2 className="h-3 w-3 animate-spin" /> : isShared ? "COMPARTILHADO" : "COMPARTILHAR"}
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mb-4">
                               <div className="col-span-3 text-center md:text-left">
                                 <p className="text-xl font-bold text-white font-display leading-none">{formatTime(flight.departureTime)}</p>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{flight.originCode}</p>
                               </div>
                               
                               <div className="col-span-4 flex flex-col items-center gap-1.5">
                                 <div className="w-full h-px bg-white/10 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-3 flex items-center gap-2">
                                      <Plane className="h-3.5 w-3.5 text-primary rotate-90" />
                                      {flight.stops > 0 && (
                                        <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/30 h-4 px-1.5">
                                          {flight.stops} {flight.stops === 1 ? 'PARADA' : 'PARADAS'}
                                        </Badge>
                                      )}
                                    </div>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{flight.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}</p>
                               </div>

                               <div className="col-span-3 text-center md:text-right">
                                 <p className="text-xl font-bold text-white font-display leading-none">{formatTime(flight.arrivalTime)}</p>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{flight.destinationCode}</p>
                               </div>

                               <div className="col-span-2 flex flex-col items-end">
                                  {editingPrice === flight.id ? (
                                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-primary/50 shadow-lg shadow-primary/10">
                                      <span className="text-[10px] font-bold text-slate-500 px-1">$</span>
                                      <Input 
                                        autoFocus
                                        value={customPrices[flight.id] ?? flight.price}
                                        onChange={(e) => setCustomPrices(prev => ({ ...prev, [flight.id]: e.target.value }))}
                                        onBlur={() => { setEditingPrice(null); handleUpdateSharedPrice(flight); }}
                                        onKeyDown={(e) => e.key === "Enter" && setEditingPrice(null)}
                                        className="h-7 w-20 border-0 bg-transparent text-xs font-black text-emerald-400 p-0 focus-visible:ring-0"
                                      />
                                    </div>
                                  ) : (
                                    <div 
                                      className="text-right cursor-pointer group/price hover:bg-white/5 p-1 rounded-lg transition-colors"
                                      onClick={() => setEditingPrice(flight.id)}
                                    >
                                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">PREÇO VENDA</p>
                                      <p className="text-2xl font-bold text-emerald-400 font-display leading-none group-hover/price:text-white transition-colors">
                                        {flight.currency} {currentPrice.toFixed(2)}
                                      </p>
                                      <p className="text-[9px] text-slate-600 font-bold flex items-center justify-end gap-1 mt-1 opacity-0 group-hover/price:opacity-100 transition-opacity">
                                        <Pencil className="h-2 w-2" /> EDITAR
                                      </p>
                                    </div>
                                  )}
                               </div>
                            </div>

                            {recommendation && (
                              <div className="mt-4 p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                <p className="text-[10px] font-medium text-amber-200/80 leading-relaxed italic">
                                  "{recommendation.reasonLine}"
                                </p>
                              </div>
                            )}

                            {flight.slices && flight.slices.length > 0 && (
                               <details className="mt-4 group/details">
                                 <summary className="list-none flex items-center gap-2 text-[10px] font-black text-slate-500 cursor-pointer hover:text-white transition-colors uppercase tracking-widest">
                                   <div className="h-4 w-4 rounded-full border border-white/10 flex items-center justify-center transition-transform group-open/details:rotate-180">
                                      <ChevronDown className="h-2.5 w-2.5" />
                                   </div>
                                   VER DETALHES DO ITINERÁRIO
                                 </summary>
                                 <div className="pt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                   {flight.slices.map((slice, sIdx) => (
                                     <div key={sIdx} className="space-y-3 pl-4 border-l border-white/10">
                                       <p className="text-[9px] font-black text-primary uppercase tracking-widest">{sIdx === 0 ? 'TRECHO IDA' : 'TRECHO VOLTA'}</p>
                                       {slice.segments.map((seg, segIdx) => (
                                         <div key={segIdx} className="flex gap-4">
                                            <div className="flex flex-col items-center gap-1">
                                               <div className="h-2 w-2 rounded-full bg-slate-700" />
                                               <div className="flex-1 w-px bg-slate-800 border-dashed border-l" />
                                               <div className="h-2 w-2 rounded-full bg-slate-700" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                              <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-white">{seg.originCode} <ArrowRight className="h-2 w-2 inline mx-1" /> {seg.destinationCode}</p>
                                                <p className="text-[10px] font-medium text-slate-500">{formatTime(seg.departureTime)} - {formatTime(seg.arrivalTime)}</p>
                                              </div>
                                              <p className="text-[10px] text-slate-500 font-medium">
                                                {seg.carrierName} • {seg.flightNumber} • {seg.aircraftType || 'Aeronave não info.'}
                                              </p>
                                            </div>
                                         </div>
                                       ))}
                                     </div>
                                   ))}
                                 </div>
                               </details>
                            )}
                         </div>
                       );
                     })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl border-dashed border-white/10">
                    <Search className="h-10 w-10 text-slate-700 mb-4 opacity-30" />
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{t("admin.live_chat.no_flights_searched")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedSessionId && (
            <div className="glass-dark border-t border-white/10 p-4">
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                   <div className="flex-1 relative">
                     <StickyNote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                     <Input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder={t("admin.live_chat.add_note_placeholder")}
                        className="glass bg-white/5 border-white/10 pl-10 h-10 rounded-xl text-xs font-medium"
                     />
                   </div>
                   <Button 
                    className="h-10 rounded-xl font-bold px-6 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                    onClick={handleSendNote}
                    disabled={!noteText.trim() || sendingNote}
                   >
                     {sendingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                   </Button>
                 </div>

                 <Button
                  onClick={() => setChatOpen(!chatOpen)}
                  variant="ghost"
                  className="w-full glass bg-white/5 border-white/10 hover:bg-white/10 h-10 rounded-xl justify-between px-4"
                 >
                   <div className="flex items-center gap-2">
                     <MessageSquare className="h-4 w-4 text-slate-400" />
                     <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("admin.live_chat.chat_channel")}</span>
                     {chatOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                   </div>
                 </Button>

                 {chatOpen && (
                    <div className="glass-dark rounded-2xl p-4 border border-white/5 h-64 flex flex-col">
                       <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                         {sessionDetail?.messages?.map((msg) => (
                           <div key={msg.id} className={`flex ${msg.role === 'client' ? 'justify-start' : 'justify-end'}`}>
                              <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] leading-relaxed ${msg.role === 'client' ? 'bg-white/10 text-white rounded-bl-sm' : 'bg-primary/20 text-white border border-primary/30 rounded-br-sm'}`}>
                                {msg.content}
                              </div>
                           </div>
                         ))}
                         <div ref={liveMsgEndRef} />
                       </div>
                       <div className="flex items-center gap-2">
                          <Input 
                            value={liveMessage}
                            onChange={(e) => setLiveMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendLiveMessage()}
                            placeholder={t("admin.live_chat.your_message_placeholder")}
                            className="glass bg-white/10 border-white/10 h-9 rounded-xl text-xs"
                          />
                          <Button size="icon" className="h-9 w-9 rounded-xl bg-primary" onClick={handleSendLiveMessage}>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] bg-slate-950 border-white/10 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/10 bg-black/40">
            <DialogTitle className="text-white font-display uppercase tracking-widest flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {t("admin.live_chat.secure_consultation_room")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-0 bg-black">
            <iframe
              src={`https://meet.jit.si/MichelsTravel_Session_${selectedSessionId || 'General'}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminLiveChat() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"chat" | "vendas">("chat");
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollEnabledRef = useRef(true);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const qc = useQueryClient();

  const { t } = useI18n();
  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const requestedSession = new URLSearchParams(window.location.search).get("session");
    if (requestedSession) {
      setActiveTab("vendas");
    }
  }, []);

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
      qc.invalidateQueries({ queryKey: ["/api/admin/chatbot/conversations", selectedConvId, "messages"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/chatbot/conversations"] });
    },
  });

  const resolveConv = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/chatbot/escalations/${id}/resolve`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/chatbot/conversations"] });
    },
  });

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedMessages, scrollToBottom]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const escalatedConvs = conversations.filter((c) => c.escalated && !c.resolved);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm glass p-6 border-white/10">
          <div className="flex flex-col items-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-3 border border-primary/30">
              <Headphones className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-white font-display uppercase tracking-widest">{t("admin.live_chat.title")}</h1>
            <p className="text-xs text-slate-400 font-medium">{t("admin.security_auth")}</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t("admin.login_password_placeholder")}
                className="pl-10 glass bg-white/5 border-white/10 text-white"
                autoFocus
                disabled={loginLoading}
              />
            </div>
            {loginError && (
              <p className="text-sm text-coral-500 text-center font-bold tracking-tight">{loginError}</p>
            )}
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" disabled={!loginPassword.trim() || loginLoading}>
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("admin.login_button")}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden p-4 gap-4">
      <div className="glass border-white/10 rounded-3xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/admin")}
            className="hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold font-display uppercase tracking-widest leading-none mb-1">{t("admin.live_chat.title")}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              {t("admin.live_chat.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => { setActiveTab("chat"); setSelectedConvId(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest flex items-center gap-2 ${
              activeTab === "chat"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-500 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </button>
          <button
            onClick={() => { setActiveTab("vendas"); setSelectedConvId(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest flex items-center gap-2 ${
              activeTab === "vendas"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-500 hover:text-white hover:bg-white/5"
            }`}
          >
            <Plane className="h-3.5 w-3.5" />
            Vendas
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === "vendas" ? (
          <LiveSalesPanel />
        ) : (
          <div className="h-full flex gap-4">
            <div className={`glass border-white/10 rounded-3xl overflow-hidden flex flex-col ${selectedConvId ? "w-80" : "flex-1"}`}>
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Conversas Ativas</span>
                {escalatedConvs.length > 0 && (
                  <Badge className="bg-coral-500 text-white border-0 font-black animate-pulse">
                    {escalatedConvs.length} ALERTA(S)
                  </Badge>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {isLoading ? (
                   <div className="py-20 flex flex-col items-center justify-center opacity-30">
                     <Loader2 className="h-8 w-8 animate-spin" />
                   </div>
                ) : conversations.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center opacity-30">
                    <MessageSquare className="h-10 w-10 mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhuma conversa encontrada</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border ${
                        selectedConvId === conv.id
                          ? "bg-primary/20 border-primary/40"
                          : "hover:bg-white/5 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white truncate">#{conv.id} - {conv.visitorId || "Visitante"}</span>
                        {conv.escalated && !conv.resolved && (
                          <div className="h-1.5 w-1.5 rounded-full bg-coral-500 shadow-[0_0_8px_rgba(255,107,107,0.8)]" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate mb-1">
                        {conv.messages[conv.messages.length - 1]?.content || "Iniciando..."}
                      </p>
                      <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                        {formatDate(conv.createdAt)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedConvId && (
              <div className="flex-1 glass border-white/10 rounded-3xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">#{selectedConvId} - Chat em Tempo Real</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Seguro e Criptografado</p>
                  </div>
                  {selectedConv?.escalated && !selectedConv?.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveConv.mutate(selectedConvId)}
                      disabled={resolveConv.isPending}
                      className="rounded-xl border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 h-8"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                      Marcar Resolvido
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={messagesContainerRef}>
                  {selectedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[70%] p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "glass bg-white/5 text-slate-200 rounded-bl-sm border-white/10"
                          : "bg-primary text-white rounded-br-sm shadow-xl shadow-primary/10"
                      }`}>
                        {msg.content}
                        <div className={`text-[9px] mt-2 font-bold opacity-40 uppercase tracking-tighter`}>
                          {formatDate(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <Input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply.mutate(reply.trim());
                        }
                      }}
                      placeholder={t("admin.live_chat.reply_placeholder")}
                      className="glass bg-white/5 border-white/10 h-11 rounded-2xl text-white px-4"
                      disabled={sendReply.isPending}
                    />
                    <Button
                      size="icon"
                      onClick={() => sendReply.mutate(reply.trim())}
                      disabled={!reply.trim() || sendReply.isPending}
                      className="h-11 w-11 rounded-2xl bg-primary shadow-lg shadow-primary/20"
                    >
                      <Send className="h-4 w-4" />
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
