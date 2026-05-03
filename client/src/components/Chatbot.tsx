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
  id: number;
  role: "user" | "assistant" | "admin";
  content: string;
  createdAt?: string;
  flights?: FlightResult[];
}

interface ChatbotStatus {
  provider: "gemini" | "cerebras" | "none";
  available: boolean;
  agentMode: "ai" | "basic";
  label: string;
}

export function Chatbot() {
  const { t, language } = useI18n();
  const [location, navigate] = useLocation();
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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
                role: "admin",
                content: m.content,
                createdAt: m.createdAt,
              }));
              setChatMessages(prev => [...prev, ...mapped]);
              setLastAdminMsgId(newMsgs[newMsgs.length - 1].id);
            }
          }
        } catch { }
      };
      pollIntervalRef.current = setInterval(poll, 3000);
      return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
    }
  }, [escalated, sessionId, isOpen, lastAdminMsgId]);

  const createSession = useCallback(async () => {
    try {
      let visitorId = localStorage.getItem("michels-chatbot-visitor") || Math.random().toString(36).substring(2, 12);
      localStorage.setItem("michels-chatbot-visitor", visitorId);

      const res = await fetch("/api/chatbot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, language: language || "pt" }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch { return null; }
  }, [language]);

  const requestContext = useMemo(() => buildLiveSessionRequestContext(location, window.location.search), [location]);
  const isSeniorContext = isSeniorServiceMode(requestContext.serviceMode);

  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setShowPulse(false);
    if (sessionId) return sessionId;
    const id = await createSession();
    if (id && chatMessages.length === 0) {
      setChatMessages([{ id: -1, role: "assistant", content: getGreeting() }]);
    }
    return id;
  }, [chatMessages.length, createSession, sessionId]);


  const getGreeting = () => {
    return t("chatbot.greeting");
  };

  const sendMessage = useCallback(async (overrideContent?: string) => {
    const messageContent = (overrideContent ?? input).trim();
    if (!messageContent || isStreaming) return;

    let currentSessionId = sessionId || await createSession();
    if (!currentSessionId) return;

    setChatMessages(prev => [...prev, { id: Date.now(), role: "user", content: messageContent }]);
    setInput("");
    setIsStreaming(true);

    const assistantMsgId = Date.now() + 1;
    setChatMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

    try {
      const res = await fetch(agentMode ? "/api/chatbot/agent-message" : "/api/chatbot/message", {
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
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
      }
    } catch (error) {
      setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: t("chatbot.error_message") } : m));
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, sessionId, createSession, agentMode, requestContext.serviceMode]);

  useEffect(() => {
    const handleOpenExternal = (e: any) => {
      handleOpen();
      if (e.detail?.message) {
        sendMessage(e.detail.message);
      }
    };
    window.addEventListener("open-chatbot", handleOpenExternal);
    return () => window.removeEventListener("open-chatbot", handleOpenExternal);
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
            className="fixed bottom-20 md:bottom-24 right-2 md:right-8 z-[100] w-[380px] max-w-[calc(100vw-1rem)]"
          >
            <div className="flex flex-col h-[600px] max-h-[80vh] md:max-h-[80vh] bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 bg-slate-900/50 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-lg" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Mia &bull; Midnight</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{t("chatbot.status_online")}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-10 w-10 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" title={t("chatbot.close")}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg", 
                      msg.role === "user" ? "bg-blue-600 text-white" : "bg-slate-900 border border-white/10 text-blue-400"
                    )}>
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className="max-w-[85%] space-y-3">
                      <div className={cn("rounded-2xl px-4 py-3 text-sm font-bold leading-relaxed shadow-xl", 
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
                <div ref={messagesEndRef} />
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-slate-900/30 border-t border-white/5 space-y-4">
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

                 <div className="relative">
                    <Input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={t("chatbot.placeholder")}
                      className="h-14 bg-white/5 border-white/10 rounded-2xl pl-5 pr-14 text-white placeholder:text-slate-700 focus:border-blue-500/50 transition-all font-bold"
                    />
                    <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim() || isStreaming} className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl transition-all">
                       {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                 </div>
                 
                 <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{t("chatbot.secure_badge")}</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

	      <button
	        onClick={handleOpen}
	        className={cn("fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[95] h-14 w-14 md:h-16 md:w-16 rounded-[20px] md:rounded-[24px] flex items-center justify-center shadow-2xl transition-all group active:scale-95", 
	          isOpen ? "bg-slate-900 border border-white/10 text-white rotate-90" : "bg-blue-600 text-white hover:scale-110"
	        )}
	      >
        {isOpen ? <X className="h-7 w-7" /> : (
          <div className="relative">
            <MessageCircle className="h-8 w-8 group-hover:scale-110 transition-transform" />
            {showPulse && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500 shadow-md" />
              </span>
            )}
          </div>
        )}
      </button>
    </>
  );
}
