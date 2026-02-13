import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useLocation } from "wouter";

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

export default function AdminLiveChat() {
  const [, setLocation] = useLocation();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/admin/chatbot/conversations"],
    refetchInterval: 5000,
  });

  const { data: selectedMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/admin/chatbot/conversations", selectedConvId, "messages"],
    enabled: !!selectedConvId,
    refetchInterval: 3000,
    queryFn: async () => {
      const res = await fetch(`/api/admin/chatbot/conversations/${selectedConvId}/messages`);
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

  const renderConversationItem = (conv: Conversation) => (
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
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
            Escalado
          </Badge>
        )}
        {conv.resolved && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
            Resolvido
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate">{getLastMessage(conv)}</p>
      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
        <Clock className="h-2.5 w-2.5" />
        {formatDate(conv.createdAt)}
        <span className="ml-auto">{conv.messages.length} msgs</span>
      </div>
    </button>
  );

  return (
    <div className="h-full flex flex-col" data-testid="admin-live-chat">
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setLocation("/admin")}
          data-testid="button-back-admin"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Atendimento ao Vivo</h1>
          <p className="text-xs text-muted-foreground">
            Responda aos clientes que pediram atendimento humano
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {escalatedConvs.length > 0 && (
            <Badge variant="destructive" data-testid="badge-escalated-count">
              {escalatedConvs.length} pendente{escalatedConvs.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-80 border-r flex flex-col min-h-0">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Conversas</span>
              <Button
                size="icon"
                variant="ghost"
                className="ml-auto h-7 w-7"
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

        <div className="flex-1 flex flex-col min-h-0">
          {!selectedConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">Selecione uma conversa</p>
              <p className="text-xs mt-1">As conversas escaladas aparecem no topo</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 p-3 border-b">
                <div>
                  <p className="text-sm font-medium">
                    Conversa #{selectedConvId}
                    {selectedConv?.visitorId && (
                      <span className="text-muted-foreground font-normal ml-2">
                        ({selectedConv.visitorId})
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Idioma: {selectedConv?.language || "pt"} | Criada: {selectedConv ? formatDate(selectedConv.createdAt) : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConv?.escalated && !selectedConv?.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveConv.mutate(selectedConvId)}
                      disabled={resolveConv.isPending}
                      data-testid="button-resolve-conversation"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    <div className="max-w-[70%]">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
