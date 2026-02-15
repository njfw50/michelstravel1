import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowLeft, Send, Plus, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { InternalThread, InternalMessage } from "@shared/schema";

export default function Messenger() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads = [], isLoading: threadsLoading } = useQuery<InternalThread[]>({
    queryKey: ["/api/messenger/threads"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<InternalMessage[]>({
    queryKey: ["/api/messenger/threads", selectedThreadId, "messages"],
    queryFn: () => fetch(`/api/messenger/threads/${selectedThreadId}/messages`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedThreadId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const createThread = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/messenger/threads", { subject: newSubject, message: newMessage });
      return res.json();
    },
    onSuccess: (thread: InternalThread) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messenger/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messenger/unread"] });
      setSelectedThreadId(thread.id);
      setShowNewThread(false);
      setNewSubject("");
      setNewMessage("");
    },
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/messenger/threads/${selectedThreadId}/messages`, { content: replyText });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messenger/threads", selectedThreadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messenger/threads"] });
      setReplyText("");
    },
  });

  const selectedThread = threads.find(th => th.id === selectedThreadId);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20">
        <SEO title={t("messenger.title")} />
        <Card className="max-w-md mx-auto p-8 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-bold mb-2">{t("messenger.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("messenger.login_required")}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title={t("messenger.title")} />

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-messenger-title">{t("messenger.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("messenger.subtitle")}</p>
        </div>

        <AnimatePresence mode="wait">
          {showNewThread ? (
            <motion.div
              key="new-thread"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewThread(false)}
                    data-testid="button-back-threads"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="font-semibold">{t("messenger.new_thread")}</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("messenger.subject")}</label>
                    <Input
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder={t("messenger.subject_placeholder")}
                      data-testid="input-new-subject"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("messenger.message")}</label>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t("messenger.message_placeholder")}
                      className="min-h-[100px] resize-none"
                      data-testid="input-new-message"
                    />
                  </div>
                  <Button
                    onClick={() => createThread.mutate()}
                    disabled={!newSubject.trim() || !newMessage.trim() || createThread.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-send-new-thread"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {t("messenger.send")}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : selectedThreadId && selectedThread ? (
            <motion.div
              key={`thread-${selectedThreadId}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedThreadId(null)}
                    data-testid="button-back-to-list"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate" data-testid="text-thread-subject">{selectedThread.subject}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(selectedThread.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant={selectedThread.status === "open" ? "default" : "secondary"}>
                    {selectedThread.status === "open" ? t("messenger.open") : t("messenger.closed")}
                  </Badge>
                </div>

                <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-background">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">...</div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.senderRole === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                          data-testid={`message-${msg.id}`}
                        >
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isUser
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}>
                            <div className="text-[11px] font-medium mb-0.5 opacity-70">
                              {isUser ? t("messenger.you") : t("messenger.admin")}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className={`text-[10px] mt-1 ${isUser ? "text-blue-200" : "text-muted-foreground"}`}>
                              {new Date(msg.createdAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {selectedThread.status === "open" && (
                  <div className="p-3 border-t border-border flex gap-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t("messenger.reply_placeholder")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                          e.preventDefault();
                          sendReply.mutate();
                        }
                      }}
                      data-testid="input-reply"
                    />
                    <Button
                      size="icon"
                      onClick={() => sendReply.mutate()}
                      disabled={!replyText.trim() || sendReply.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-send-reply"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="thread-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4">
                <Button
                  onClick={() => setShowNewThread(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-new-thread"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("messenger.new_thread")}
                </Button>
              </div>

              {threadsLoading ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">...</Card>
              ) : threads.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-semibold mb-1">{t("messenger.no_threads")}</h3>
                  <p className="text-sm text-muted-foreground">{t("messenger.no_threads_desc")}</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <Card
                      key={thread.id}
                      className="p-4 cursor-pointer hover-elevate transition-all"
                      onClick={() => setSelectedThreadId(thread.id)}
                      data-testid={`thread-${thread.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate">{thread.subject}</h3>
                            <Badge variant={thread.status === "open" ? "default" : "secondary"} className="text-[10px]">
                              {thread.status === "open" ? t("messenger.open") : t("messenger.closed")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {thread.lastMessageAt
                              ? new Date(thread.lastMessageAt).toLocaleString()
                              : new Date(thread.createdAt!).toLocaleString()}
                          </p>
                        </div>
                        <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
