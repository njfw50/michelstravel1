import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  LogOut,
  Lock,
  Headphones,
  Video,
  Phone,
  Loader2,
  Settings,
  BarChart3,
  Search,
  Plane,
  Eye,
  EyeOff,
  X,
  Users,
  Calendar,
  ArrowRight,
  MapPin,
  Pencil,
  StickyNote,
  DollarSign,
  Receipt,
  Share2,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

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

const STORAGE_KEY = "michels-admin-token";

function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function setToken(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
}

function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });
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
  status: string;
  createdAt: string;
}

interface LiveSessionActive {
  id: number;
  conversationId: number | null;
  visitorId: string | null;
  language: string | null;
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

interface FlightResult {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  logoUrl?: string | null;
  originCity?: string | null;
  destinationCity?: string | null;
  originCode?: string | null;
  destinationCode?: string | null;
  cabinClass?: string | null;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        onLogin();
      } else if (res.status === 429) {
        setError("Muitas tentativas. Aguarde 15 minutos.");
      } else {
        setError("Senha incorreta");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0074DE] p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-[#0074DE] flex items-center justify-center mb-3">
            <Headphones className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Michels Travel</h1>
          <p className="text-sm text-muted-foreground">Painel de Atendimento</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha de administrador"
              className="pl-10"
              autoFocus
              disabled={loading}
              data-testid="input-admin-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center" data-testid="text-login-error">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={!password.trim() || loading} data-testid="button-admin-login">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}

function LiveSalesPanel({ onLogout }: { onLogout: () => void }) {
  const [requests, setRequests] = useState<LiveSessionRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<LiveSessionActive[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionDetail, setSessionDetail] = useState<LiveSessionDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  const [searchOrigin, setSearchOrigin] = useState("");
  const [searchDestination, setSearchDestination] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchReturnDate, setSearchReturnDate] = useState("");
  const [searchPassengers, setSearchPassengers] = useState("1");
  const [searchCabinClass, setSearchCabinClass] = useState("economy");
  const [tripType, setTripType] = useState<"round_trip" | "one_way">("round_trip");
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

  const fetchLists = useCallback(async () => {
    try {
      const [reqRes, actRes] = await Promise.all([
        authFetch("/api/live-sessions/admin/requests"),
        authFetch("/api/live-sessions/admin/active"),
      ]);
      if (reqRes.status === 401 || actRes.status === 401) {
        clearToken();
        onLogout();
        return;
      }
      if (reqRes.ok) setRequests(await reqRes.json());
      if (actRes.ok) setActiveSessions(await actRes.json());
    } catch {} finally {
      setLoadingList(false);
    }
  }, [onLogout]);

  const fetchSessionDetail = useCallback(async () => {
    if (!selectedSessionId) return;
    try {
      const res = await authFetch(`/api/live-sessions/admin/${selectedSessionId}`);
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
    liveMsgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionDetail?.messages]);

  const handleAcceptSession = async (id: number) => {
    try {
      const res = await authFetch(`/api/live-sessions/admin/${id}/accept`, {
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
      const res = await authFetch(`/api/live-sessions/admin/search-flights?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFlightResults(Array.isArray(data) ? data : data.flights || []);
      }
    } catch {} finally {
      setSearchingFlights(false);
    }
  };

  const getFlightPrice = (flight: FlightResult): number => {
    const custom = customPrices[flight.id];
    if (custom && !isNaN(parseFloat(custom))) return parseFloat(custom);
    return flight.price;
  };

  const handleToggleShare = async (flight: FlightResult) => {
    if (!selectedSessionId || togglingFlight) return;
    setTogglingFlight(flight.id);
    const existingBlockId = sharedBlockMap[flight.id];

    try {
      if (existingBlockId) {
        const res = await authFetch(`/api/live-sessions/admin/blocks/${existingBlockId}`, {
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
        const res = await authFetch(`/api/live-sessions/admin/${selectedSessionId}/blocks`, {
          method: "POST",
          body: JSON.stringify({
            blockType: "search_results",
            payload: {
              flights: [flightForClient],
              searchParams: {
                origin: searchOrigin,
                destination: searchDestination,
                date: searchDate,
              },
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
    try {
      await authFetch(`/api/live-sessions/admin/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify({
          payload: {
            flights: [flightForClient],
            searchParams: { origin: searchOrigin, destination: searchDestination, date: searchDate },
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
      await authFetch(`/api/live-sessions/admin/${selectedSessionId}/blocks`, {
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
      label: `${f.airline} ${f.flightNumber} (${f.originCode || searchOrigin} → ${f.destinationCode || searchDestination})`,
      value: getFlightPrice(f),
      currency: f.currency,
    }));
    const total = items.reduce((sum, i) => sum + i.value, 0);
    const currency = sharedFlightsList[0]?.currency || "USD";
    try {
      await authFetch(`/api/live-sessions/admin/${selectedSessionId}/blocks`, {
        method: "POST",
        body: JSON.stringify({
          blockType: "pricing",
          payload: {
            items: items.map((i) => ({
              label: i.label,
              value: `${i.currency} ${i.value.toFixed(2)}`,
            })),
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
      await authFetch(`/api/live-sessions/admin/${selectedSessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: liveMessage.trim() }),
      });
      setLiveMessage("");
      await fetchSessionDetail();
    } catch {} finally {
      setSendingMessage(false);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSessionId) return;
    try {
      await authFetch(`/api/live-sessions/admin/${selectedSessionId}/close`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSelectedSessionId(null);
      setSessionDetail(null);
      setFlightResults([]);
      setSharedBlockMap({});
      setCustomPrices({});
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

  if (selectedSessionId) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-[#0074DE] text-white flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setSelectedSessionId(null);
              setSessionDetail(null);
              setFlightResults([]);
              setSharedBlockMap({});
              setChatOpen(false);
              setCustomPrices({});
            }}
            className="text-white no-default-hover-elevate flex-shrink-0"
            data-testid="button-back-sales-list"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Sessão #{selectedSessionId}
            </p>
            <p className="text-[10px] opacity-80">
              {sessionDetail?.visitorId || "Visitante"}
            </p>
          </div>
          <a href="https://wa.me/18623501161" target="_blank" rel="noopener noreferrer">
            <Button size="icon" variant="ghost" className="text-white no-default-hover-elevate flex-shrink-0" data-testid="button-whatsapp-sales">
              <Video className="h-4 w-4" />
            </Button>
          </a>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCloseSession}
            className="text-white no-default-hover-elevate flex-shrink-0"
            data-testid="button-close-session"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 border-b space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <Search className="h-3 w-3" /> Buscar Voos
              </p>
              <div className="flex gap-1 ml-auto">
                <Button
                  size="sm"
                  variant={tripType === "round_trip" ? "default" : "outline"}
                  onClick={() => setTripType("round_trip")}
                  className={tripType === "round_trip" ? "bg-[#0074DE] text-[11px] h-7" : "text-[11px] h-7"}
                  data-testid="button-trip-roundtrip"
                >
                  Ida e Volta
                </Button>
                <Button
                  size="sm"
                  variant={tripType === "one_way" ? "default" : "outline"}
                  onClick={() => setTripType("one_way")}
                  className={tripType === "one_way" ? "bg-[#0074DE] text-[11px] h-7" : "text-[11px] h-7"}
                  data-testid="button-trip-oneway"
                >
                  Só Ida
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <AdminLocationInput
                value={searchOrigin}
                onChange={setSearchOrigin}
                placeholder="De onde? (cidade ou aeroporto)"
                testId="input-search-origin"
              />
              <AdminLocationInput
                value={searchDestination}
                onChange={setSearchDestination}
                placeholder="Para onde? (cidade ou aeroporto)"
                testId="input-search-destination"
              />
            </div>

            <div className={`grid gap-2 ${tripType === "round_trip" ? "grid-cols-2" : "grid-cols-1"}`}>
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
                    placeholder="Volta"
                    data-testid="input-search-return-date"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Users className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  max="9"
                  value={searchPassengers}
                  onChange={(e) => setSearchPassengers(e.target.value)}
                  className="pl-7 text-sm h-9"
                  data-testid="input-search-passengers"
                />
              </div>
              <Select value={searchCabinClass} onValueChange={setSearchCabinClass}>
                <SelectTrigger data-testid="select-cabin-class" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Econ.</SelectItem>
                  <SelectItem value="premium_economy">Premium</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">Primeira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleSearchFlights}
              disabled={searchingFlights || !searchOrigin.trim() || !searchDestination.trim() || !searchDate}
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
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#0074DE]" />
                <p className="text-sm text-muted-foreground">Buscando voos...</p>
              </div>
            </div>
          )}

          {!searchingFlights && flightResults.length > 0 && (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                  <Plane className="h-3 w-3" /> {flightResults.length} voo(s) encontrado(s)
                </p>
                {sharedCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {sharedCount} compartilhado(s)
                  </Badge>
                )}
              </div>
              {flightResults.map((flight) => {
                const isShared = !!sharedBlockMap[flight.id];
                const isToggling = togglingFlight === flight.id;
                const isEditing = editingPrice === flight.id;
                const customPrice = customPrices[flight.id];
                const displayPrice = getFlightPrice(flight);
                const hasCustomPrice = customPrice && !isNaN(parseFloat(customPrice)) && parseFloat(customPrice) !== flight.price;
                return (
                  <Card key={flight.id} className={`p-3 ${isShared ? "border-[#0074DE] border-2" : ""}`} data-testid={`card-flight-${flight.id}`}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {flight.logoUrl && (
                        <img src={flight.logoUrl} alt={flight.airline} className="h-5 w-5 rounded" />
                      )}
                      <span className="text-sm font-semibold text-foreground">{flight.airline}</span>
                      <Badge variant="secondary" className="text-[10px]">{flight.flightNumber}</Badge>
                      {flight.stops > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {flight.stops} parada{flight.stops > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm mb-1.5">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-foreground">{formatTime(flight.departureTime)}</span>
                        <span className="text-[10px] text-muted-foreground">{flight.originCode}</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground">{flight.duration}</span>
                        <div className="w-full flex items-center gap-1">
                          <div className="flex-1 border-t border-dashed border-muted-foreground/40" />
                          <Plane className="h-3 w-3 text-[#0074DE]" />
                          <div className="flex-1 border-t border-dashed border-muted-foreground/40" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {flight.stops === 0 ? "Direto" : `${flight.stops} parada${flight.stops > 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-foreground">{formatTime(flight.arrivalTime)}</span>
                        <span className="text-[10px] text-muted-foreground">{flight.destinationCode}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground line-through">
                            {flight.currency} {flight.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          {hasCustomPrice && (
                            <span className="text-xs font-bold text-emerald-600">
                              {flight.currency} {displayPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {!hasCustomPrice && (
                            <span className="text-sm font-bold text-[#0074DE]">
                              {flight.currency} {flight.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPrice(isEditing ? null : flight.id)}
                          className="text-[11px] h-7"
                          data-testid={`button-edit-price-${flight.id}`}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          {isEditing ? "Fechar" : "Ajustar preço"}
                        </Button>
                      </div>

                      {isEditing && (
                        <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customPrices[flight.id] || ""}
                            onChange={(e) => setCustomPrices((prev) => ({ ...prev, [flight.id]: e.target.value }))}
                            placeholder={flight.price.toFixed(2)}
                            className="h-8 text-sm flex-1"
                            data-testid={`input-custom-price-${flight.id}`}
                          />
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{flight.currency}</span>
                          {isShared && hasCustomPrice && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateSharedPrice(flight)}
                              className="text-[10px] h-7 flex-shrink-0"
                              data-testid={`button-update-price-${flight.id}`}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Atualizar
                            </Button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {flight.cabinClass && <span>{flight.cabinClass}</span>}
                        </div>
                        <Button
                          size="sm"
                          variant={isShared ? "default" : "outline"}
                          onClick={() => handleToggleShare(flight)}
                          disabled={isToggling}
                          className={isShared ? "bg-[#0074DE]" : ""}
                          data-testid={`button-toggle-share-${flight.id}`}
                        >
                          {isToggling ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : isShared ? (
                            <Eye className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          {isShared ? "Visível" : "Compartilhar"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {sharedCount > 0 && (
                <Card className="p-3 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" data-testid="card-shared-summary">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                      Resumo ({sharedCount} voo{sharedCount > 1 ? "s" : ""})
                    </span>
                    <span className="ml-auto text-base font-bold text-emerald-600">
                      {sharedCurrency} {sharedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendPricingSummary}
                    disabled={sendingPricingSummary}
                    className="w-full text-[11px]"
                    data-testid="button-send-pricing-summary"
                  >
                    {sendingPricingSummary ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    Enviar resumo de preços pro cliente
                  </Button>
                </Card>
              )}
            </div>
          )}

          {!searchingFlights && flightResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Plane className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">Busque voos para compartilhar com o cliente</p>
            </div>
          )}

          <div className="p-3 border-t border-border space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <StickyNote className="h-3 w-3" /> Nota para o cliente
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendNote();
                  }
                }}
                placeholder="Ex: Inclui 1 mala de 23kg..."
                disabled={sendingNote || !selectedSessionId}
                className="flex-1 h-8 text-sm"
                data-testid="input-admin-note"
              />
              <Button
                size="icon"
                onClick={handleSendNote}
                disabled={!noteText.trim() || sendingNote || !selectedSessionId}
                data-testid="button-send-note"
              >
                {sendingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-border bg-background">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 hover-elevate"
            data-testid="button-toggle-chat"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase text-muted-foreground">Chat</span>
              {!chatOpen && unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">{unreadCount}</Badge>
              )}
            </div>
            {chatOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
          </button>

          {chatOpen && (
            <div className="border-t border-border">
              <div className="max-h-40 overflow-y-auto p-2 space-y-1.5">
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
                          ? "bg-[#0074DE] text-white"
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
                            ? "bg-muted text-foreground rounded-bl-sm"
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
                    placeholder="Mensagem..."
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
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      {loadingList ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 && activeSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Plane className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm">Nenhuma sessão de vendas</p>
          <p className="text-xs mt-1">Sessões ao vivo aparecem aqui</p>
        </div>
      ) : (
        <>
          {requests.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase text-destructive px-2 py-1">
                Solicitações ({requests.length})
              </p>
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="w-full p-3 rounded-md bg-destructive/5 border border-destructive/20 mb-1"
                  data-testid={`session-request-${req.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      #{req.id} - {req.visitorId || "Visitante"}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">Pendente</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {formatDate(req.createdAt)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptSession(req.id)}
                      data-testid={`button-accept-session-${req.id}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Aceitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeSessions.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">
                Ativas ({activeSessions.length})
              </p>
              {activeSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className="w-full text-left p-3 rounded-md hover-elevate mb-1"
                  data-testid={`session-active-${session.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      <Plane className="h-3.5 w-3.5 inline mr-1" />
                      #{session.id} - {session.visitorId || "Visitante"}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Ativa</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {formatDate(session.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChatApp({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"chat" | "vendas">("chat");
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/chatbot/conversations");
      if (res.status === 401) {
        clearToken();
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [onLogout]);

  const fetchMessages = useCallback(async () => {
    if (!selectedConvId) return;
    try {
      const res = await authFetch(`/api/admin/chatbot/conversations/${selectedConvId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMessages(data);
      }
    } catch {}
  }, [selectedConvId]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConvId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const escalatedConvs = conversations.filter((c) => c.escalated && !c.resolved);
  const otherConvs = conversations.filter((c) => !c.escalated && !c.resolved);
  const resolvedConvs = conversations.filter((c) => c.resolved);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const getLastMessage = (conv: Conversation) => {
    if (conv.messages.length === 0) return "Sem mensagens";
    const last = conv.messages[conv.messages.length - 1];
    return last.content.substring(0, 50) + (last.content.length > 50 ? "..." : "");
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedConvId || sending) return;
    setSending(true);
    try {
      await authFetch("/api/admin/chatbot/reply", {
        method: "POST",
        body: JSON.stringify({ conversationId: selectedConvId, content: reply.trim() }),
      });
      setReply("");
      await fetchMessages();
      await fetchConversations();
    } catch {} finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedConvId) return;
    try {
      await authFetch(`/api/admin/chatbot/escalations/${selectedConvId}/resolve`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await fetchConversations();
    } catch {}
  };

  const renderConversationItem = (conv: Conversation) => {
    const lastMsg = conv.messages[conv.messages.length - 1];
    const isFromUser = lastMsg?.role === "user";
    const hasUnread = conv.escalated && !conv.resolved;

    return (
      <button
        key={conv.id}
        onClick={() => setSelectedConvId(conv.id)}
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
              !
            </Badge>
          )}
          {conv.resolved && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
              <CheckCircle2 className="h-2.5 w-2.5" />
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
          {!hasUnread && <span className="ml-auto">{conv.messages.length}</span>}
        </div>
      </button>
    );
  };

  const chatView = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 p-3 border-b bg-[#0074DE] text-white">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSelectedConvId(null)}
          className="text-white no-default-hover-elevate flex-shrink-0"
          data-testid="button-back-to-list"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            #{selectedConvId} {selectedConv?.visitorId ? `(${selectedConv.visitorId})` : ""}
          </p>
          <p className="text-[10px] opacity-80">
            {selectedConv?.language || "pt"} | {selectedConv ? formatDate(selectedConv.createdAt) : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href="https://wa.me/18623501161"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="button-whatsapp-call"
          >
            <Button size="icon" variant="ghost" className="text-white no-default-hover-elevate">
              <Video className="h-4 w-4" />
            </Button>
          </a>
          {selectedConv?.escalated && !selectedConv?.resolved && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleResolve}
              className="text-white no-default-hover-elevate"
              data-testid="button-resolve"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
            <div className="max-w-[80%]">
              <div
                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#0074DE] text-white rounded-br-md"
                    : msg.role === "admin"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-foreground rounded-bl-md border border-emerald-200 dark:border-emerald-800"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "admin" && (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                    Você
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

      <div className="border-t p-3 pb-safe">
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
            placeholder="Responder..."
            disabled={sending}
            className="flex-1"
            data-testid="input-reply"
          />
          <Button
            size="icon"
            onClick={handleSendReply}
            disabled={!reply.trim() || sending}
            data-testid="button-send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  if (selectedConvId) return chatView;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col border-b bg-[#0074DE] text-white">
        <div className="flex items-center gap-2 p-3">
          <Headphones className="h-5 w-5" />
          <span className="text-sm font-semibold flex-1">Atendimento</span>
          {activeTab === "chat" && escalatedConvs.length > 0 && (
            <Badge variant="destructive" className="text-[10px]" data-testid="badge-pending-count">
              {escalatedConvs.length}
            </Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="text-white no-default-hover-elevate"
            onClick={activeTab === "chat" ? fetchConversations : undefined}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-white no-default-hover-elevate"
            onClick={() => { clearToken(); onLogout(); }}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex px-3 pb-2 gap-1">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              activeTab === "chat"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white/80"
            }`}
            data-testid="tab-chat"
          >
            <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("vendas")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              activeTab === "vendas"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white/80"
            }`}
            data-testid="tab-vendas"
          >
            <Plane className="h-3.5 w-3.5 inline mr-1" />
            Vendas
          </button>
        </div>
      </div>

      {activeTab === "vendas" ? (
        <LiveSalesPanel onLogout={onLogout} />
      ) : (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Nenhuma conversa</p>
              <p className="text-xs mt-1">As novas conversas aparecem aqui</p>
            </div>
          ) : (
            <>
              {escalatedConvs.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-semibold uppercase text-destructive px-2 py-1">
                    Aguardando ({escalatedConvs.length})
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
      )}
    </div>
  );
}

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthenticated(false);
      return;
    }
    fetch("/api/admin-app/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          clearToken();
          setAuthenticated(false);
        }
      })
      .catch(() => {
        setAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0074DE]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatApp onLogout={() => setAuthenticated(false)} />
    </div>
  );
}
