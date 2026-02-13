import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Loader2, User, Bot, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export function Chatbot() {
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const createSession = async () => {
    try {
      let visitorId = localStorage.getItem("michels-chatbot-visitor");
      if (!visitorId) {
        visitorId = crypto.randomUUID().slice(0, 10);
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

  const handleOpen = async () => {
    setIsOpen(true);
    setShowPulse(false);
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
      return "¡Hola! Soy Mia, tu asistente de viajes en Michels Travel. ¿En qué puedo ayudarte hoy? Puedo asistirte con búsqueda de vuelos, reservas, preguntas sobre equipaje y mucho más.";
    }
    return "Olá! Eu sou a Mia, sua assistente de viagens na Michels Travel. Como posso te ajudar hoje? Posso ajudar com busca de voos, reservas, dúvidas sobre bagagem e muito mais!";
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

    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: currentSessionId, content: userMessage.content }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.content) {
              fullContent += event.content;
              setChatMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
                }
                return updated;
              });
            }
            if (event.done) {
              if (event.escalated) {
                setEscalated(true);
              }
            }
          } catch {}
        }
      }
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

  const formatContent = (content: string) => {
    return content.replace(/\[ESCALATE\]/gi, "").trim();
  };

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
                    <p className="text-[11px] leading-tight opacity-80">{t("chatbot.subtitle")}</p>
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
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                        msg.role === "user" 
                          ? "bg-[#0074DE] text-white" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {msg.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#0074DE] text-white rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                        data-testid={`chatbot-message-${msg.role}`}
                      >
                        {msg.role === "assistant" && msg.content === "" && isStreaming ? (
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
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t p-3">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("chatbot.placeholder")}
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
                  {t("chatbot.powered_by")}
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
