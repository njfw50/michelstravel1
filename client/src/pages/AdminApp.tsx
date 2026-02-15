import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  LogOut,
  Lock,
  Headphones,
  Video,
  Phone,
  Loader2,
  Settings,
  BarChart3,
} from "lucide-react";

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

function ChatApp({ onLogout }: { onLogout: () => void }) {
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

  const conversationList = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 p-3 border-b bg-[#0074DE] text-white">
        <Headphones className="h-5 w-5" />
        <span className="text-sm font-semibold flex-1">Atendimento</span>
        {escalatedConvs.length > 0 && (
          <Badge variant="destructive" className="text-[10px]" data-testid="badge-pending-count">
            {escalatedConvs.length}
          </Badge>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="text-white no-default-hover-elevate"
          onClick={fetchConversations}
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
    </div>
  );

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
  return conversationList;
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
