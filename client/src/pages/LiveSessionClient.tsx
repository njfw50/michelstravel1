import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Clock,
  ArrowRight,
  Plane,
  Video,
  Luggage,
  StickyNote,
  DollarSign,
  Info,
  Headphones,
  CheckCircle2,
  User,
  UserCheck,
} from "lucide-react";
import type { FlightOffer, FlightSlice, LiveSessionBlock, LiveSessionMessage } from "@shared/schema";

interface SessionData {
  session: {
    id: number;
    status: string;
    visitorId: string | null;
    language: string | null;
    whatsappLink: string | null;
    createdAt: string;
    closedAt: string | null;
  };
  blocks: LiveSessionBlock[];
  messages: LiveSessionMessage[];
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

function formatDuration(dur: string) {
  const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const h = match[1] || "0";
    const m = match[2] || "0";
    return `${h}h ${m}m`;
  }
  return dur;
}

function FlightResultCard({ flight, index }: { flight: FlightOffer; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-3 mb-2" data-testid={`card-flight-${flight.id}`}>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            {flight.logoUrl && (
              <img src={flight.logoUrl} alt={flight.airline} className="h-5 w-5 rounded" />
            )}
            <span className="text-sm font-medium text-foreground">{flight.airline}</span>
            <span className="text-xs text-muted-foreground">{flight.flightNumber}</span>
          </div>
          <span className="text-sm font-bold text-[#0074DE]">
            {formatPrice(flight.price, flight.currency)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm mb-2 flex-wrap">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-foreground">{formatTime(flight.departureTime)}</span>
            <span className="text-[11px] text-muted-foreground">{flight.originCode}</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">{formatDuration(flight.duration)}</span>
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
            <span className="text-[11px] text-muted-foreground">{flight.destinationCode}</span>
          </div>
        </div>

        {(flight.originCity || flight.destinationCity) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
            {flight.originCity && <span>{flight.originCity}</span>}
            {flight.originCity && flight.destinationCity && <ArrowRight className="h-3 w-3" />}
            {flight.destinationCity && <span>{flight.destinationCity}</span>}
            {flight.cabinClass && (
              <Badge variant="secondary" className="ml-auto text-[10px]">{flight.cabinClass}</Badge>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function OfferDetailBlock({ payload }: { payload: any }) {
  const offer = payload as FlightOffer;
  return (
    <Card className="p-4" data-testid="block-offer-detail">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Info className="h-4 w-4 text-[#0074DE]" />
        <span className="text-sm font-semibold text-foreground">Detalhes do Voo</span>
      </div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {offer.logoUrl && <img src={offer.logoUrl} alt={offer.airline} className="h-5 w-5 rounded" />}
        <span className="text-sm font-medium">{offer.airline}</span>
        <span className="text-xs text-muted-foreground">{offer.flightNumber}</span>
        <span className="ml-auto text-sm font-bold text-[#0074DE]">{formatPrice(offer.price, offer.currency)}</span>
      </div>
      {offer.slices && offer.slices.length > 0 && (
        <div className="space-y-3 mt-3">
          {offer.slices.map((slice: FlightSlice, si: number) => (
            <div key={si} className="border-t border-border pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
                <span className="font-medium text-foreground">{slice.originCode}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium text-foreground">{slice.destinationCode}</span>
                <span className="ml-auto">{formatDuration(slice.duration)}</span>
              </div>
              {slice.segments.map((seg, sgi) => (
                <div key={sgi} className="ml-2 text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{seg.carrierName || seg.carrierCode} {seg.flightNumber}</span>
                  <span className="mx-1">|</span>
                  <span>{formatTime(seg.departureTime)} {seg.originCode}</span>
                  <ArrowRight className="inline h-2.5 w-2.5 mx-1" />
                  <span>{formatTime(seg.arrivalTime)} {seg.destinationCode}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PricingBlock({ payload }: { payload: any }) {
  const items: { label: string; value: string | number }[] = Array.isArray(payload)
    ? payload
    : (payload?.items || []);
  const single = !Array.isArray(payload) && typeof payload === "object" ? payload : null;

  return (
    <Card className="p-4" data-testid="block-pricing">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <DollarSign className="h-4 w-4 text-[#0074DE]" />
        <span className="text-sm font-semibold text-foreground">Resumo de Preços</span>
      </div>
      {items.length > 0 && (
        <div className="space-y-1 text-sm">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="text-muted-foreground truncate flex-1">{item.label}</span>
              <span className="text-foreground font-medium flex-shrink-0">{item.value}</span>
            </div>
          ))}
        </div>
      )}
      {single && single.totalAmount && (
        <div className="flex justify-between gap-2 font-bold border-t border-border pt-2 mt-2">
          <span className="text-foreground">Total</span>
          <span className="text-[#0074DE]">{single.currency || ""} {single.totalAmount}</span>
        </div>
      )}
      {single && !single.totalAmount && single.baseAmount && (
        <div className="space-y-1 text-sm">
          {single.baseAmount && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Tarifa base</span>
              <span className="text-foreground">{single.currency || ""} {single.baseAmount}</span>
            </div>
          )}
          {single.taxAmount && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Taxas</span>
              <span className="text-foreground">{single.currency || ""} {single.taxAmount}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function BaggageBlock({ payload }: { payload: any }) {
  const options: any[] = Array.isArray(payload) ? payload : payload?.options || [];

  return (
    <Card className="p-4" data-testid="block-baggage">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Luggage className="h-4 w-4 text-[#0074DE]" />
        <span className="text-sm font-semibold text-foreground">Bagagem</span>
      </div>
      {options.length > 0 ? (
        <div className="space-y-2">
          {options.map((opt: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-medium text-foreground">{opt.type || opt.name || `Opção ${i + 1}`}</span>
                {opt.quantity != null && (
                  <span className="text-xs text-muted-foreground ml-1">x{opt.quantity}</span>
                )}
              </div>
              {opt.price != null && (
                <span className="text-foreground font-medium">
                  {typeof opt.price === "number" ? formatPrice(opt.price, opt.currency || "BRL") : opt.price}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {typeof payload === "string" ? payload : "Informação de bagagem disponível."}
        </p>
      )}
    </Card>
  );
}

function CustomNoteBlock({ payload }: { payload: any }) {
  const text = typeof payload === "string" ? payload : payload?.text || payload?.note || JSON.stringify(payload);
  return (
    <Card className="p-4" data-testid="block-custom-note">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <StickyNote className="h-4 w-4 text-[#0074DE]" />
        <span className="text-sm font-semibold text-foreground">Nota do Agente</span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
    </Card>
  );
}

function SharedBlockRenderer({ block, index }: { block: LiveSessionBlock; index: number }) {
  const payload = typeof block.payload === "string" ? JSON.parse(block.payload as string) : block.payload;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="mb-3"
    >
      {block.blockType === "search_results" && (() => {
        const flights: FlightOffer[] = Array.isArray(payload)
          ? payload
          : (payload?.flights || []);
        return (
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Plane className="h-4 w-4 text-[#0074DE]" />
              <span className="text-sm font-semibold text-foreground">Opção de Voo</span>
            </div>
            {flights.map((flight: FlightOffer, fi: number) => (
              <FlightResultCard key={flight.id || fi} flight={flight} index={fi} />
            ))}
          </div>
        );
      })()}
      {block.blockType === "offer_detail" && <OfferDetailBlock payload={payload} />}
      {block.blockType === "pricing" && <PricingBlock payload={payload} />}
      {block.blockType === "baggage" && <BaggageBlock payload={payload} />}
      {block.blockType === "custom_note" && <CustomNoteBlock payload={payload} />}
    </motion.div>
  );
}

export default function LiveSessionClient() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const accessToken = new URLSearchParams(window.location.search).get("token") || "";
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId || !accessToken) return;
    try {
      const res = await fetch(`/api/live-sessions/${sessionId}?token=${encodeURIComponent(accessToken)}`);
      if (!res.ok) {
        setError("Sessão não encontrada ou acesso negado");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Erro ao carregar sessão");
    } finally {
      setLoading(false);
    }
  }, [sessionId, accessToken]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  useEffect(() => {
    if (!sessionId || !accessToken) return;
    const evtSource = new EventSource(`/api/live-sessions/${sessionId}/stream?token=${encodeURIComponent(accessToken)}`);
    evtSource.addEventListener("update", () => {
      fetchSession();
    });
    evtSource.addEventListener("message", () => {
      fetchSession();
    });
    evtSource.onerror = () => {
      evtSource.close();
    };
    return () => evtSource.close();
  }, [sessionId, accessToken, fetchSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const handleSend = async () => {
    if (!chatInput.trim() || sending || !sessionId) return;
    setSending(true);
    try {
      await fetch(`/api/live-sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatInput.trim(), role: "client", token: accessToken }),
      });
      setChatInput("");
      await fetchSession();
    } catch {
    } finally {
      setSending(false);
    }
  };

  const header = (
    <div className="bg-[#0074DE] text-white px-4 py-3 flex items-center justify-between gap-2 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Headphones className="h-5 w-5" />
        <div>
          <p className="text-sm font-semibold leading-tight">Michels Travel</p>
          <p className="text-[11px] leading-tight opacity-80">Atendimento ao vivo</p>
        </div>
      </div>
      <a
        href="https://wa.me/18623501161"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="button-whatsapp-video"
      >
        <Button size="icon" variant="ghost" className="text-white no-default-hover-elevate">
          <Video className="h-4 w-4" />
        </Button>
      </a>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {header}
        <div className="flex-1 flex items-center justify-center" data-testid="status-loading">
          <Loader2 className="h-8 w-8 animate-spin text-[#0074DE]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {header}
        <div className="flex-1 flex items-center justify-center p-4" data-testid="status-error">
          <p className="text-sm text-muted-foreground">{error || "Sessão não encontrada"}</p>
        </div>
      </div>
    );
  }

  if (data.session.status === "requested") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4" data-testid="status-waiting">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="h-16 w-16 rounded-full bg-[#0074DE]/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#0074DE]" />
            </div>
            <p className="text-lg font-semibold text-foreground">Aguardando atendente...</p>
            <p className="text-sm text-muted-foreground text-center">
              Um agente estará com você em breve. Por favor, aguarde.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (data.session.status === "closed") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4" data-testid="status-closed">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-foreground">Atendimento encerrado</p>
            <p className="text-sm text-muted-foreground text-center">
              Obrigado por usar a Michels Travel. Esperamos vê-lo novamente!
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  const sharedBlocks = data.blocks
    .filter((b) => b.shared)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="live-session-active">
      {header}

      <div className="flex-1 flex flex-col min-h-0">
        {sharedBlocks.length > 0 && (
          <div className="flex-shrink-0 overflow-y-auto p-4 border-b border-border" style={{ maxHeight: "50vh" }}>
            <AnimatePresence>
              {sharedBlocks.map((block, i) => (
                <SharedBlockRenderer key={block.id} block={block} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-2" data-testid="chat-messages">
            {data.messages.length === 0 && (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                Envie uma mensagem para iniciar a conversa
              </div>
            )}
            {data.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === "client" ? "flex-row-reverse" : "flex-row"}`}
                data-testid={`chat-message-${msg.role}-${msg.id}`}
              >
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === "client"
                      ? "bg-[#0074DE] text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {msg.role === "client" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "client"
                        ? "bg-[#0074DE] text-white rounded-br-md"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-foreground rounded-bl-md border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    {msg.role === "admin" && (
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                        Agente
                      </span>
                    )}
                    {msg.content}
                  </div>
                  {msg.createdAt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {formatTime(msg.createdAt.toString())}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-3 pb-safe" data-testid="chat-input-area">
            <div className="flex items-center gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!chatInput.trim() || sending}
                data-testid="button-send-message"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
