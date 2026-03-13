import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Loader2, User, Bot, AlertTriangle, Headphones, Plane, ToggleLeft, ToggleRight, Clock, ArrowRight, UserCheck, Video, MonitorPlay } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

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
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "admin";
  content: string;
  createdAt?: string;
  flights?: FlightResult[];
}

interface ChatbotStatus {
  provider: "openai" | "gemini" | "none";
  available: boolean;
  agentMode: "ai" | "basic";
  label: string;
  primaryModel: string | null;
  fallbackModel: string | null;
  agentModel: string | null;
}

export function Chatbot() {
  const { t, language } = useI18n();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [requestingLive, setRequestingLive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [status, setStatus] = useState<ChatbotStatus | null>(null);
  const [showPulse, setShowPulse] = useState(true);
  const [lastAdminMsgId, setLastAdminMsgId] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/chatbot/status");
      if (!res.ok) return;
      const data = (await res.json()) as ChatbotStatus;
      setStatus(data);
    } catch {
      // keep widget usable even if status check fails
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (escalated && sessionId && isOpen) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/chatbot/poll/${sessionId}?afterId=${lastAdminMsgId}`);
          if (res.ok) {
            const newMsgs = await res.json();
            if (newMsgs.length > 0) {
              const mapped: ChatMessage[] = newMsgs.map((m: any) => ({
                id: m.id,
                role: "admin" as const,
                content: m.content,
                createdAt: m.createdAt,
              }));
              setChatMessages(prev => [...prev, ...mapped]);
              setLastAdminMsgId(newMsgs[newMsgs.length - 1].id);
            }
          }
        } catch {
          // silently retry on next interval
        }
      };

      pollIntervalRef.current = setInterval(poll, 3000);
      poll();
      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [escalated, sessionId, isOpen, lastAdminMsgId]);

  const createSession = async () => {
    try {
      let visitorId = localStorage.getItem("michels-chatbot-visitor");
      if (!visitorId) {
        visitorId = Math.random().toString(36).substring(2, 12);
        localStorage.setItem("michels-chatbot-visitor", visitorId);
      }

      const res = await fetch("/api/chatbot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, language: language || "pt" }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.error("Failed to create chat session:", error);
      return null;
    }
  };

  const handleRequestLiveSession = async () => {
    setRequestingLive(true);
    try {
      let visitorId = localStorage.getItem("michels-chatbot-visitor");
      if (!visitorId) {
        visitorId = Math.random().toString(36).substring(2, 12);
        localStorage.setItem("michels-chatbot-visitor", visitorId);
      }
      const res = await fetch("/api/live-sessions/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          language: language || "pt",
          conversationId: sessionId,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setIsOpen(false);
        navigate(`/live/${data.id}?token=${encodeURIComponent(data.accessToken)}`);
      }
    } catch (error) {
      console.error("Failed to request live session:", error);
    } finally {
      setRequestingLive(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setShowPulse(false);
    if (!status) {
      void loadStatus();
    }
    if (!sessionId) {
      const id = await createSession();
      if (id && chatMessages.length === 0) {
        const greeting = getGreeting();
        setChatMessages([{
          id: -1,
          role: "assistant",
          content: greeting,
        }]);
      }
    }
  };

  const getGreeting = () => {
    if (language === "en") {
      return "Hi! I'm Mia, your travel assistant at Michels Travel. How can I help you today? I can assist with flight searches, bookings, baggage questions, and more!";
    } else if (language === "es") {
      return "\u00a1Hola! Soy Mia, tu asistente de viajes en Michels Travel. \u00bfEn qu\u00e9 puedo ayudarte hoy? Puedo asistirte con b\u00fasqueda de vuelos, reservas, preguntas sobre equipaje y mucho m\u00e1s.";
    }
    return "Ol\u00e1! Eu sou a Mia, sua assistente de viagens na Michels Travel. Como posso te ajudar hoje? Posso ajudar com busca de voos, reservas, d\u00favidas sobre bagagem e muito mais!";
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSession();
      if (!currentSessionId) return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantMsg: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
    };
    setChatMessages(prev => [...prev, assistantMsg]);

    const endpoint = agentMode ? "/api/chatbot/agent-message" : "/api/chatbot/message";

    try {
      await new Promise<void>((resolve, reject) => {
        let fullContent = "";
        let collectedFlights: FlightResult[] = [];
        let lastProcessed = 0;

        const processSSELine = (line: string) => {
          if (!line.startsWith("data: ")) return;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) return;
          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "flights" && event.flights) {
              collectedFlights = event.flights;
              setChatMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], flights: collectedFlights };
                }
                return updated;
              });
            }

            if (event.content) {
              fullContent += event.content;
              setChatMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: fullContent, flights: collectedFlights.length > 0 ? collectedFlights : updated[lastIdx].flights };
                }
                return updated;
              });
            }
            if (event.done) {
              if (event.escalated) {
                setEscalated(true);
              }
            }
          } catch (e) {
            // skip unparseable lines
          }
        };

        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onprogress = () => {
          const newData = xhr.responseText.substring(lastProcessed);
          lastProcessed = xhr.responseText.length;
          const lines = newData.split("\n");
          for (const line of lines) {
            if (line.trim()) processSSELine(line.trim());
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const remaining = xhr.responseText.substring(lastProcessed);
            if (remaining.trim()) {
              const lines = remaining.split("\n");
              for (const line of lines) {
                if (line.trim()) processSSELine(line.trim());
              }
            }
            if (!fullContent) {
              const allLines = xhr.responseText.split("\n");
              for (const line of allLines) {
                if (line.trim()) processSSELine(line.trim());
              }
            }
            resolve();
          } else {
            reject(new Error(`Server error: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));
        xhr.timeout = 60000;

        xhr.send(JSON.stringify({ sessionId: currentSessionId, content: userMessage.content }));
      });

    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant" && !updated[lastIdx].content) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: t("chatbot.error"),
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAgentMode = async () => {
    if (escalated || isStreaming) return;

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSession();
      if (!currentSessionId) return;
    }

    setEscalated(true);

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      role: "assistant",
      content: t("chatbot.agent_mode_confirm"),
    }]);

    try {
      await fetch("/api/chatbot/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: currentSessionId }),
      });
    } catch (error) {
      console.error("Escalation error:", error);
    }
  };

  const formatContent = (content: string) => {
    return content.replace(/\[ESCALATE\]/gi, "").replace(/\[AGENT:.*?\]/g, "").trim();
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency,
      }).format(price);
    } catch {
      return `${currency} ${price.toFixed(2)}`;
    }
  };

  const providerLabel =
    status?.provider === "gemini"
      ? "Gemini"
      : status?.provider === "openai"
        ? "OpenAI"
        : language === "pt"
          ? "Modo básico"
          : language === "es"
            ? "Modo básico"
            : "Basic mode";

  const basicModeHint =
    language === "pt"
      ? "Modo básico ativo: para busca automática, envie origem, destino e data. Ex: GRU para MCO em 2026-06-15."
      : language === "es"
        ? "Modo básico activo: para búsqueda automática, envía origen, destino y fecha. Ej: GRU a MCO el 2026-06-15."
        : "Basic mode is active: for automatic search, send origin, destination, and date. Example: GRU to MCO on 2026-06-15.";

  const renderFlightCard = (flight: FlightResult) => (
    <div
      key={flight.id}
      className="rounded-lg border border-border/60 bg-background p-2.5 mb-1.5"
      data-testid={`chatbot-flight-card-${flight.id}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {flight.logoUrl && (
            <img src={flight.logoUrl} alt={flight.airline} className="h-4 w-4 rounded" />
          )}
          <span className="text-xs font-medium text-foreground">{flight.airline}</span>
        </div>
        <span className="text-xs font-bold text-[#0074DE]">
          {formatPrice(flight.price, flight.currency)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
        <span className="font-medium text-foreground">{formatTime(flight.departureTime)}</span>
        <span>{flight.originCode}</span>
        <ArrowRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{formatTime(flight.arrivalTime)}</span>
        <span>{flight.destinationCode}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {flight.duration}
          </span>
          <span>
            {flight.stops === 0
              ? (language === "pt" ? "Direto" : language === "es" ? "Directo" : "Nonstop")
              : `${flight.stops} ${flight.stops === 1 ? "stop" : "stops"}`
            }
          </span>
        </div>
        <a
          href={`/book/${flight.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-[#0074DE] px-2 py-1 text-[10px] font-medium text-white transition-opacity hover:opacity-90"
          data-testid={`button-book-flight-${flight.id}`}
        >
          <Plane className="h-2.5 w-2.5" />
          {language === "pt" ? "Reservar" : language === "es" ? "Reservar" : "Book"}
        </a>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)]"
          >
            <Card className="flex flex-col overflow-hidden shadow-xl border border-border/50">
              <div className="flex items-center justify-between gap-2 bg-[#0074DE] px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">Mia</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] leading-tight opacity-80">{t("chatbot.subtitle")}</p>
                      <Badge className="bg-white/15 text-white border-white/15 hover:bg-white/15">
                        {providerLabel}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-white no-default-hover-elevate"
                  data-testid="button-chatbot-close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {escalated && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{t("chatbot.escalated_notice")}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3" style={{ height: "360px", maxHeight: "50vh" }}>
                <div className="flex flex-col gap-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id}>
                      <div
                        className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                          msg.role === "user" 
                            ? "bg-[#0074DE] text-white" 
                            : msg.role === "admin"
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {msg.role === "user" ? <User className="h-3 w-3" /> : msg.role === "admin" ? <UserCheck className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-[#0074DE] text-white rounded-br-md"
                              : msg.role === "admin"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-foreground rounded-bl-md border border-emerald-200 dark:border-emerald-800"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                          data-testid={`chatbot-message-${msg.role}`}
                        >
                          {msg.role === "admin" && (
                            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                              {language === "pt" ? "Agente Humano" : language === "es" ? "Agente Humano" : "Human Agent"}
                            </div>
                          )}
                          {msg.role === "assistant" && msg.content === "" && isStreaming && !msg.flights ? (
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          ) : (
                            formatContent(msg.content)
                          )}
                        </div>
                      </div>
                      {msg.flights && msg.flights.length > 0 && (
                        <div className="mt-2 ml-8" data-testid="chatbot-flight-results">
                          {msg.flights.map(renderFlightCard)}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t p-3">
                {agentMode && status?.agentMode === "basic" && (
                  <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                    {basicModeHint}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button
                    onClick={() => setAgentMode(!agentMode)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors"
                    disabled={isStreaming}
                    data-testid="button-chatbot-agent-toggle"
                  >
                    {agentMode ? (
                      <ToggleRight className="h-4 w-4 text-[#0074DE]" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                    <span className={agentMode ? "text-[#0074DE] font-medium" : ""}>
                      {t("chatbot.agent_mode")}
                    </span>
                  </button>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={handleRequestLiveSession}
                      disabled={requestingLive}
                      className="flex items-center gap-1 text-[11px] text-[#0074DE] hover:text-[#005bb5] font-medium transition-colors"
                      data-testid="button-chatbot-live-session"
                    >
                      {requestingLive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorPlay className="h-3.5 w-3.5" />}
                      <span>{language === "pt" ? "Atendimento ao Vivo" : language === "es" ? "Atención en Vivo" : "Live Help"}</span>
                    </button>
                    {!escalated && (
                      <button
                        onClick={handleAgentMode}
                        disabled={isStreaming}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-chatbot-human-agent"
                      >
                        <Headphones className="h-3.5 w-3.5" />
                        <span>{t("chatbot.talk_to_human")}</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={agentMode ? t("chatbot.agent_placeholder") : t("chatbot.placeholder")}
                    disabled={isStreaming}
                    className="flex-1 text-sm"
                    data-testid="input-chatbot-message"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!input.trim() || isStreaming}
                    data-testid="button-chatbot-send"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                  {t("chatbot.powered_by")} • {providerLabel}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="fixed bottom-4 right-4 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[#0074DE] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        data-testid="button-chatbot-toggle"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {showPulse && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500" />
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
