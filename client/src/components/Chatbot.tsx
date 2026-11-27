import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Loader2, User, Bot, AlertTriangle, Headphones, Plane, ToggleLeft, ToggleRight, Clock, ArrowRight, UserCheck, MonitorPlay, ShieldCheck, Lock, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { buildLiveSessionRequestContext, getLiveSessionTheme, isSeniorServiceMode } from "@/lib/live-session-context";
import { emitChatbotBookingPrefill } from "@/lib/chatbot";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useMiaVoice } from "@/hooks/use-mia-voice";
import { useMiaRealtime } from "@/hooks/use-mia-realtime";

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
  originCode?: string;
  destinationCode?: string;
  originCity?: string | null;
  destinationCity?: string | null;
  originName?: string;
  destinationName?: string;
}

interface ChatMessage {
  id: number | string;
  role: "user" | "assistant" | "admin";
  content: string;
  createdAt?: string;
  flights?: FlightResult[];
}

interface ChatbotStatus {
  provider: string;
  available: boolean;
  agentMode: "ai" | "basic";
  label: string;
}

export function Chatbot() {
  const { t, language } = useI18n();
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [requestingLive, setRequestingLive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const sendingRef = useRef(false);
  const sessionPromiseRef = useRef<Promise<string | null> | null>(null);
  const locale = language === "en" ? "en" : language === "es" ? "es" : "pt";
  const copy = {
    pt: { subtitle: "Concierge de viagens", ready: "IA disponível", basic: "Atendimento básico", checking: "Verificando conexão", flight: "Buscar voos", plan: "Planejar viagem", bags: "Bagagens", flightPrompt: "Quero pesquisar voos. Pergunte os dados necessários.", planPrompt: "Ajude-me a planejar uma viagem. Pergunte sobre destino, datas e orçamento.", bagsPrompt: "Preciso de ajuda com bagagem e regras da companhia aérea.", suggestions: "Como posso ajudar?", disclaimer: "A Mia é uma IA. Confirme preços e condições antes de reservar." },
    en: { subtitle: "Travel concierge", ready: "AI available", basic: "Basic assistance", checking: "Checking connection", flight: "Find flights", plan: "Plan a trip", bags: "Baggage", flightPrompt: "I want to search flights. Ask for the necessary details.", planPrompt: "Help me plan a trip. Ask about destination, dates and budget.", bagsPrompt: "I need help with baggage and airline rules.", suggestions: "How can I help?", disclaimer: "Mia is AI. Confirm prices and conditions before booking." },
    es: { subtitle: "Concierge de viajes", ready: "IA disponible", basic: "Asistencia básica", checking: "Comprobando conexión", flight: "Buscar vuelos", plan: "Planear viaje", bags: "Equipaje", flightPrompt: "Quiero buscar vuelos. Pregunta los datos necesarios.", planPrompt: "Ayúdame a planear un viaje. Pregunta por destino, fechas y presupuesto.", bagsPrompt: "Necesito ayuda con equipaje y normas de la aerolínea.", suggestions: "¿Cómo puedo ayudar?", disclaimer: "Mia es IA. Confirma precios y condiciones antes de reservar." },
  }[locale];
  const voiceCopy = {
    pt: { mic: "Ditar mensagem", stopMic: "Parar microfone", listen: "Ouvir resposta", stopAudio: "Parar áudio", note: "A voz é processada pelo navegador ou pelo serviço de voz dele. Não dite dados sensíveis. Revise o texto antes de enviar.", error: "Voz indisponível. Continue por texto." },
    en: { mic: "Dictate message", stopMic: "Stop microphone", listen: "Read response aloud", stopAudio: "Stop audio", note: "Voice is processed by your browser or its speech service. Avoid sensitive information. Review the text before sending.", error: "Voice unavailable. Continue by text." },
    es: { mic: "Dictar mensaje", stopMic: "Detener micrófono", listen: "Escuchar respuesta", stopAudio: "Detener audio", note: "El navegador o su servicio de voz procesa el audio. No dictes datos sensibles. Revisa el texto antes de enviarlo.", error: "Voz no disponible. Continúa por texto." },
  }[locale];
  const voice = useMiaVoice(locale === "pt" ? "pt-BR" : locale === "es" ? "es-US" : "en-US", isOpen, text => {
    setInput(previous => [previous.trim(), text].filter(Boolean).join(" "));
  });
  const realtime = useMiaRealtime(isOpen, locale);
  const realtimeActive = realtime.status === "connecting" || realtime.status === "connected";
  const liveCopy = {
    pt: { start: "Conversar ao vivo (piloto)", stop: "Encerrar voz", mute: "Silenciar", unmute: "Ativar microfone", connecting: "Conectando...", connected: "Voz IA conectada", error: "Voz indisponível. Continue pelo texto.", notice: "Ao iniciar, você autoriza o envio de áudio à OpenAI. Não compartilhe dados sensíveis. A voz oferece orientação geral; use o texto para consultar ofertas." },
    en: { start: "Live conversation (pilot)", stop: "End voice", mute: "Mute", unmute: "Unmute", connecting: "Connecting...", connected: "AI voice connected", error: "Voice unavailable. Continue by text.", notice: "Starting sends audio to OpenAI. Do not share sensitive data. Voice provides general guidance; use text for live offers." },
    es: { start: "Conversación en vivo (piloto)", stop: "Finalizar voz", mute: "Silenciar", unmute: "Activar micrófono", connecting: "Conectando...", connected: "Voz IA conectada", error: "Voz no disponible. Continúa por texto.", notice: "Al iniciar, autorizas enviar audio a OpenAI. No compartas datos sensibles. La voz ofrece orientación general; usa el texto para ofertas." },
  }[locale];
  const lastAssistant = [...chatMessages].reverse().find(message => message.role === "assistant" && message.id !== -1 && message.content.trim());
  const [status, setStatus] = useState<ChatbotStatus | null>(null);
  const [showPulse, setShowPulse] = useState(true);
  const [pastHero, setPastHero] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/chatbot/status");
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);
    } catch { }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Rodada 3 (26/nov, re-QA item 5): o gatilho de 300px só limpava o
  // topo — a bolha fixa cobre controles em QUALQUER posição de rolagem
  // (Origem, datas, RESERVE AGORA, cartões, rodapé). No celular, na
  // home ela só aparece depois do widget de busca (herói ~1110px no
  // QA: gatilho 1100px); nas demais páginas, após 300px. No desktop
  // aparece sempre. Com o chat aberto a bolha (X) nunca some. E o
  // usuário pode recolhê-la para um ponto "?" de 24px (na sessão).
  const [miaCollapsed, setMiaCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("mt-mia-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const collapseMia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMiaCollapsed(true);
    try {
      sessionStorage.setItem("mt-mia-collapsed", "1");
    } catch {
      /* armazenamento indisponível — some só nesta página */
    }
  };
  const restoreMia = () => {
    setMiaCollapsed(false);
    try {
      sessionStorage.removeItem("mt-mia-collapsed");
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    const onScroll = () => {
      const isMobile = window.innerWidth < 768;
      const isHome = window.location.pathname === "/";
      const threshold = !isMobile ? 0 : isHome ? 1100 : 300;
      setPastHero(!isMobile || window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!escalated || !sessionId || !isOpen) return;
    const controller = new AbortController();
    let busy = false;
    const poll = async () => {
      if (busy || controller.signal.aborted) return;
      busy = true;
      try {
        // Message IDs are random UUIDs, not chronological numeric cursors.
        const res = await fetch(`/api/chatbot/poll/${encodeURIComponent(sessionId)}`, { signal: controller.signal });
        if (!res.ok || controller.signal.aborted) return;
        const rows: unknown = await res.json();
        if (!Array.isArray(rows) || controller.signal.aborted) return;
        const mapped: ChatMessage[] = rows
          .filter(m => typeof m?.id === "string" && typeof m.content === "string")
          .map(m => ({ id: m.id, role: "admin", content: m.content, createdAt: m.createdAt }));
        setChatMessages(prev => {
          const seen = new Set(prev.map(m => m.id));
          return [...prev, ...mapped.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          })];
        });
      } catch { /* retry on next interval */ }
      finally { busy = false; }
    };
    void poll();
    const timer = setInterval(poll, 3000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [escalated, sessionId, isOpen]);

  const createSession = useCallback(async (): Promise<string | null> => {
    if (sessionPromiseRef.current) return sessionPromiseRef.current;
    const pending = (async () => {
    try {
      let visitorId = localStorage.getItem("michels-chatbot-visitor") || Math.random().toString(36).substring(2, 12);
      localStorage.setItem("michels-chatbot-visitor", visitorId);

      const res = await fetch("/api/chatbot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, language: language || "pt" }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (typeof data.sessionId !== "string" || !data.sessionId.trim()) return null;
      setSessionId(data.sessionId);
      return data.sessionId as string;
    } catch { return null; }
    })();
    sessionPromiseRef.current = pending;
    const id = await pending;
    if (!id) sessionPromiseRef.current = null;
    return id;
  }, [language]);

  const requestContext = useMemo(() => buildLiveSessionRequestContext(location, window.location.search), [location]);
  const isSeniorContext = isSeniorServiceMode(requestContext.serviceMode);

  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setShowPulse(false);
    if (sessionId) return sessionId;
    const id = await createSession();
    if (id && chatMessages.length === 0) {
      setChatMessages(prev => prev.length ? prev : [{ id: -1, role: "assistant", content: getGreeting() }]);
    }
    return id;
  }, [chatMessages.length, createSession, sessionId]);


  const getGreeting = () => {
    return t("chatbot.greeting");
  };

  const sendMessage = useCallback(async (overrideContent?: string, useAgent?: boolean) => {
    const messageContent = (overrideContent ?? input).trim();
    if (!messageContent || sendingRef.current) return;
    sendingRef.current = true;
    realtime.stop();
    voice.stopListening();
    voice.stopSpeaking();
    const currentSessionId = sessionId || await createSession();
    if (!currentSessionId) {
      sendingRef.current = false;
      setChatMessages(prev => [...prev, { id: Date.now(), role: "assistant", content: t("chatbot.error_message") }]);
      return;
    }

    setChatMessages(prev => [...prev, { id: Date.now(), role: "user", content: messageContent }]);
    setInput("");
    setIsStreaming(true);

    const assistantMsgId = Date.now() + 1;
    setChatMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

    try {
      const res = await fetch((useAgent ?? agentMode) ? "/api/chatbot/agent-message" : "/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          content: messageContent,
          context: {
            pathname: window.location.pathname,
            search: window.location.search,
            serviceMode: requestContext.serviceMode,
          },
        })
      });

      if (!res.ok) throw new Error("Failed");
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      let fullContent = "";
      let collectedFlights: FlightResult[] = [];

      const decoder = new TextDecoder();
      let pending = "";
      let completed = false;
      while (true) {
        const { done, value } = await reader.read();
        pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
        const lines = pending.split("\n");
        pending = done ? "" : (lines.pop() ?? "");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.error) continue;
            if (event.done) completed = true;
            if (event.type === "action" && event.action?.type === "prefill_booking_form") {
              emitChatbotBookingPrefill(event.action.payload);
            }
            if (event.type === "flights") {
              collectedFlights = event.flights;
            }
            if (event.content) {
              fullContent += event.content;
            }
            setChatMessages(prev => {
              const next = [...prev];
              const idx = next.findIndex(m => m.id === assistantMsgId);
              if (idx !== -1) {
                next[idx] = { ...next[idx], content: fullContent, flights: collectedFlights.length > 0 ? collectedFlights : next[idx].flights };
              }
              return next;
            });
            if (event.done && event.escalated) setEscalated(true);
          } catch { }
        }
        if (done) break;
      }
      if (!completed) throw new Error("Incomplete response");
      if (!fullContent && collectedFlights.length === 0) {
        setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: t("chatbot.error_message") } : m));
      }
    } catch (error) {
      setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: m.content ? m.content + "\n\n" + t("chatbot.error_message") : t("chatbot.error_message") } : m));
    } finally {
      sendingRef.current = false;
      setIsStreaming(false);
    }
  }, [input, sessionId, createSession, agentMode, requestContext.serviceMode, t, voice.stopListening, voice.stopSpeaking, realtime.stop]);

  useEffect(() => {
    const handleOpenExternal = (e: any) => {
      void handleOpen();
      if (typeof e.detail?.message === "string") {
        if (e.type === "open-chatbot" || e.detail.autoSend === true) void sendMessage(e.detail.message);
        else setInput(e.detail.message);
      }
    };
    window.addEventListener("open-chatbot", handleOpenExternal);
    window.addEventListener("michels:open-chatbot", handleOpenExternal);
    return () => {
      window.removeEventListener("open-chatbot", handleOpenExternal);
      window.removeEventListener("michels:open-chatbot", handleOpenExternal);
    };
  }, [handleOpen, sendMessage]);

  const handleRequestLiveSession = async () => {
    setRequestingLive(true);
    try {
      const visitorId = localStorage.getItem("michels-chatbot-visitor");
      const res = await fetch("/api/live-sessions/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, language: language || "pt", conversationId: sessionId, ...requestContext }),
      });
      const data = await res.json();
      if (data.id) {
        setIsOpen(false);
        navigate(`/live/${data.id}?token=${encodeURIComponent(data.accessToken)}`);
      }
    } catch { } finally { setRequestingLive(false); }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language || "pt", { style: "currency", currency }).format(price);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            role="region" aria-label="Mia — travel concierge"
            className="fixed bottom-28 md:bottom-24 right-2 md:right-8 z-[100] w-[440px] max-w-[calc(100vw-1rem)]"
          >
            <div className="flex flex-col h-[680px] max-h-[min(76dvh,calc(100dvh-8rem))] bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 shadow-lg" style={{ backgroundColor: status?.available ? "#34d399" : "#94a3b8" }} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">MIA 2027</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{copy.subtitle} · {status ? (status.available ? copy.ready : copy.basic) : copy.checking}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-10 w-10 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" title={t("chatbot.close")}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-5 space-y-5 scrollbar-hide">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg", 
                      msg.role === "user" ? "bg-blue-600 text-white" : "bg-slate-900 border border-white/10 text-blue-400"
                    )}>
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className="max-w-[85%] space-y-3">
                      <div className={cn("rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words shadow-xl", 
                        msg.role === "user" 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-white/5 border border-white/5 text-slate-200 rounded-tl-none backdrop-blur-md"
                      )}>
                        {msg.content === "" && isStreaming ? (
                          <div className="flex gap-1 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      
                      {msg.flights && msg.flights.length > 0 && (
                        <div className="space-y-3 pt-1">
                          {msg.flights.map(flight => (
                            <div key={flight.id} className="rounded-2xl bg-slate-900/60 border border-white/5 p-4 space-y-3 shadow-2xl">
                               <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                     {flight.logoUrl && <img src={flight.logoUrl} className="h-4 w-4 rounded-sm grayscale" />}
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{flight.airline}</span>
                                  </div>
                                  <span className="text-xs font-black text-blue-400">{formatPrice(flight.price, flight.currency)}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <span className="text-sm font-black text-white">{flight.originCode}</span>
                                  <ArrowRight className="h-3 w-3 text-slate-600" />
                                  <span className="text-sm font-black text-white">{flight.destinationCode}</span>
                               </div>
                               <Button size="sm" onClick={() => navigate(`/book/${flight.id}`)} className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[9px] tracking-[0.2em] shadow-xl">
                                  {t("chatbot.book_now")} <Plane className="ml-2 h-3.5 w-3.5" />
                               </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatMessages.length <= 1 && !isStreaming && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">{copy.suggestions}</p>
                    {[[copy.flight, copy.flightPrompt, true], [copy.plan, copy.planPrompt, false], [copy.bags, copy.bagsPrompt, false]].map(([label, prompt, flight]) => (
                      <button key={String(label)} type="button" onClick={() => { if (flight) setAgentMode(true); void sendMessage(String(prompt), Boolean(flight)); }} className="w-full flex items-center justify-between rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
                        {String(label)} <ArrowRight className="h-4 w-4 text-cyan-300" />
                      </button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Action Bar */}
              <div className="p-3 md:p-4 bg-slate-900/60 border-t border-white/10 space-y-3">
                 <div className="flex items-center gap-3">
                    <button onClick={handleRequestLiveSession} disabled={requestingLive} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest shadow-xl">
                       {requestingLive ? <Loader2 className="h-4 w-4 animate-spin" /> : <MonitorPlay className="h-4 w-4" />}
                       {t("chatbot.talk_to_agent")}
                    </button>
                    <button onClick={() => setAgentMode(!agentMode)} className={cn("flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest shadow-xl", 
                      agentMode ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/5 bg-white/5 text-slate-500 hover:text-white"
                    )}>
                       {agentMode ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                       {t("chatbot.smart_agent")}
                    </button>
                 </div>

                 {realtime.available && (
                   <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 space-y-2">
                     <p className="text-[10px] text-slate-200">{liveCopy.notice}</p>
                     <div className="flex gap-2">
                       <button type="button" disabled={isStreaming} onClick={() => { if (realtimeActive) realtime.stop(); else { voice.stopListening(); voice.stopSpeaking(); void realtime.start(); } }} className="flex-1 min-h-10 rounded-lg bg-blue-600 text-white text-xs font-semibold px-2">
                         {realtimeActive ? liveCopy.stop : liveCopy.start}
                       </button>
                       {realtime.status === "connected" && <button type="button" aria-pressed={realtime.muted} onClick={realtime.toggleMute} className="rounded-lg border border-cyan-400/30 text-white text-xs px-3">{realtime.muted ? liveCopy.unmute : liveCopy.mute}</button>}
                     </div>
                     <p role="status" className="text-xs text-cyan-200">{realtime.status === "connecting" ? liveCopy.connecting : realtime.status === "connected" ? liveCopy.connected : realtime.status === "error" ? liveCopy.error : ""}</p>
                   </div>
                 )}
                 {!realtimeActive && (voice.canDictate || voice.canSpeak) && (
                   <div className="space-y-1">
                     <div className="flex gap-2">
                       {voice.canDictate && <button type="button" disabled={isStreaming} aria-pressed={voice.listening} onClick={voice.dictate} className={cn("flex-1 min-h-10 rounded-xl border px-2 flex items-center justify-center gap-2 text-xs text-white disabled:opacity-40", voice.listening ? "border-rose-400 bg-rose-600/20" : "border-cyan-400/30 bg-cyan-500/10")}>
                         {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {voice.listening ? voiceCopy.stopMic : voiceCopy.mic}
                       </button>}
                       {voice.canSpeak && <button type="button" disabled={!lastAssistant || isStreaming} aria-pressed={voice.speaking} onClick={() => voice.speaking ? voice.stopSpeaking() : lastAssistant && voice.speak(lastAssistant.content.replace(/^\[ESCALATE\]\s*/, ""))} className="flex-1 min-h-10 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2 flex items-center justify-center gap-2 text-xs text-white disabled:opacity-40">
                         {voice.speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} {voice.speaking ? voiceCopy.stopAudio : voiceCopy.listen}
                       </button>}
                     </div>
                     <p className="text-[10px] leading-snug text-slate-300">{voiceCopy.note}</p>
                     {voice.error && <p role="status" className="text-xs text-amber-300">{voiceCopy.error}</p>}
                   </div>
                 )}
                 <div className="relative">
                    <Input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && sendMessage()}
                      placeholder={t("chatbot.placeholder")}
                      className="h-14 bg-white/5 border-white/10 rounded-2xl pl-5 pr-14 text-white placeholder:text-slate-700 focus:border-blue-500/50 transition-all font-bold"
                    />
                    <Button size="icon" aria-label={t("chatbot.placeholder")} onClick={() => sendMessage()} disabled={!input.trim() || isStreaming} className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl transition-all">
                       {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                 </div>
                 
                 <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{copy.disclaimer}</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {miaCollapsed && !isOpen ? (
        <button
          onClick={restoreMia}
          aria-label="Abrir assistente Mia"
          className={cn(
            "fixed bottom-24 right-4 z-[95] flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-extrabold text-white shadow-2xl transition-all hover:scale-110 md:bottom-6 md:right-6",
            !pastHero ? "mt-fab-hidden-mobile" : "",
          )}
        >
          ?
        </button>
      ) : (
        <button
          onClick={() => isOpen ? setIsOpen(false) : void handleOpen()}
          aria-label={isOpen ? t("chatbot.close") : "Mia"}
          className={cn(
            "fixed bottom-24 right-4 z-[95] flex h-11 w-11 items-center justify-center rounded-[16px] shadow-2xl transition-all group active:scale-95 md:bottom-6 md:right-6 md:h-16 md:w-16 md:rounded-[24px]",
            isOpen ? "bg-slate-900 border border-white/10 text-white rotate-90" : "bg-blue-600 text-white hover:scale-110",
            !pastHero && !isOpen ? "mt-fab-hidden-mobile" : "",
          )}
        >
          {isOpen ? <X className="h-7 w-7" /> : (
            <div className="relative">
              <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110 md:h-8 md:w-8" />
              {showPulse && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500 shadow-md" />
                </span>
              )}
            </div>
          )}
          {!isOpen && (
            <span
              onClick={collapseMia}
              aria-label="Recolher assistente"
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-slate-900 text-[10px] font-extrabold leading-none text-white shadow-lg"
            >
              ×
            </span>
          )}
        </button>
      )}
    </>
  );
}
