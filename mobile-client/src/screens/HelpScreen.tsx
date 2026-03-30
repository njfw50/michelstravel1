import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { AGENCY_EMAIL, AGENCY_PHONE_DISPLAY, buildWhatsAppHref } from "../config/contact";
import {
  ChatbotFlightResult,
  ChatbotStatus,
  createChatbotSession,
  getChatbotStatus,
  sendChatbotMessage,
} from "../services/chatbot";
import { useOnboardingStore } from "../store/onboardingStore";
import { theme } from "../theme/theme";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  flights?: ChatbotFlightResult[];
};

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function HelpScreen() {
  const language = useOnboardingStore((state) => state.language);
  const mode = useOnboardingStore((state) => state.mode);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState<ChatbotStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentMode, setAgentMode] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Help",
        title: "Support, chatbot, and real help in one place.",
        subtitle: "Start with Mia and move to WhatsApp whenever you want a person from our team.",
        chatBadge: "Travel assistant",
        chatTitle: "Mia is ready here inside Help",
        chatSubtitle: "Ask about flights, reservations, baggage, payment, or ask Mia to act in agent mode.",
        placeholder: "Write your question here",
        send: "Send",
        openWhatsApp: "Open WhatsApp",
        phone: "Phone",
        email: "Email",
        note: "If needed, our team continues with you after the comparison.",
        agentMode: "Agent mode",
        loading: "Connecting Mia...",
        quickStart: "Quick start",
        quickPrompts: [
          "Find flights from Newark to Orlando on 2026-04-10",
          "I want to check my booking. My reference starts with MT-",
          "I need help choosing the best option before payment",
        ],
        providerBasic: "Basic mode",
        providerCerebras: "Cerebras",
        providerGemini: "Gemini",
        modeHintAi: "Agent mode lets Mia search and handle reservation requests automatically when possible.",
        modeHintBasic: "Basic mode is active. Mia can still guide the customer and use local logic when external AI is unavailable.",
        greeting: "Hi, I’m Mia. Tell me what you need and I’ll help from here.",
        bookingButton: "Talk to Mia about my booking",
      };
    }

    if (language === "es") {
      return {
        badge: "Ayuda",
        title: "Soporte, chatbot y ayuda real en un solo lugar.",
        subtitle: "Empiece con Mia y pase a WhatsApp cuando quiera hablar con una persona de nuestro equipo.",
        chatBadge: "Asistente de viajes",
        chatTitle: "Mia ya está lista dentro de Ayuda",
        chatSubtitle: "Pregunte por vuelos, reservas, equipaje, pago o pídale a Mia actuar en modo agente.",
        placeholder: "Escriba su pregunta aquí",
        send: "Enviar",
        openWhatsApp: "Abrir WhatsApp",
        phone: "Teléfono",
        email: "Correo",
        note: "Si hace falta, el equipo sigue con usted después de la comparación.",
        agentMode: "Modo agente",
        loading: "Conectando a Mia...",
        quickStart: "Inicio rápido",
        quickPrompts: [
          "Buscar vuelos de Newark a Orlando el 2026-04-10",
          "Quiero consultar mi reserva. Mi referencia empieza con MT-",
          "Necesito ayuda para elegir la mejor opción antes del pago",
        ],
        providerBasic: "Modo básico",
        providerCerebras: "Cerebras",
        providerGemini: "Gemini",
        modeHintAi: "El modo agente permite que Mia busque y gestione solicitudes de reserva automáticamente cuando sea posible.",
        modeHintBasic: "El modo básico está activo. Mia todavía puede orientar al cliente y usar lógica local cuando la IA externa no esté disponible.",
        greeting: "Hola, soy Mia. Cuénteme qué necesita y le ayudo desde aquí.",
        bookingButton: "Hablar con Mia sobre mi reserva",
      };
    }

    return {
      badge: "Ajuda",
      title: "Suporte, chatbot e ajuda real no mesmo lugar.",
      subtitle: "Comece com a Mia e vá para o WhatsApp sempre que quiser falar com uma pessoa da equipe.",
      chatBadge: "Assistente de viagem",
      chatTitle: "A Mia já está pronta dentro da Ajuda",
      chatSubtitle: "Pergunte sobre voos, reservas, bagagem, pagamento ou peça para a Mia agir em modo agente.",
      placeholder: "Escreva sua pergunta aqui",
      send: "Enviar",
      openWhatsApp: "Abrir WhatsApp",
      phone: "Telefone",
      email: "E-mail",
      note: "Se precisar, a equipe segue com você depois da comparação.",
      agentMode: "Modo agente",
      loading: "Conectando a Mia...",
      quickStart: "Início rápido",
      quickPrompts: [
        "Buscar voos de Newark para Orlando em 2026-04-10",
        "Quero consultar minha reserva. Minha referência começa com MT-",
        "Preciso de ajuda para escolher a melhor opção antes do pagamento",
      ],
      providerBasic: "Modo básico",
      providerCerebras: "Cerebras",
      providerGemini: "Gemini",
      modeHintAi: "O modo agente permite que a Mia pesquise e trate pedidos de reserva automaticamente quando possível.",
      modeHintBasic: "O modo básico está ativo. A Mia ainda consegue orientar o cliente e usar lógica local quando a IA externa não estiver disponível.",
      greeting: "Olá, eu sou a Mia. Me diga o que você precisa e eu ajudo por aqui.",
      bookingButton: "Falar com a Mia sobre minha reserva",
    };
  }, [language]);

  const providerLabel = useMemo(() => {
    if (status?.provider === "cerebras") return copy.providerCerebras;
    if (status?.provider === "gemini") return copy.providerGemini;
    return copy.providerBasic;
  }, [copy.providerBasic, copy.providerCerebras, copy.providerGemini, status?.provider]);

  useEffect(() => {
    let mounted = true;
    setLoadingStatus(true);
    getChatbotStatus()
      .then((nextStatus) => {
        if (!mounted) return;
        setStatus(nextStatus);
      })
      .catch(() => {
        if (!mounted) return;
        setLoadError(copy.providerBasic);
      })
      .finally(() => {
        if (mounted) {
          setLoadingStatus(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [copy.providerBasic]);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages]);

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const nextSessionId = await createChatbotSession(language);
    setSessionId(nextSessionId);
    setMessages((current) =>
      current.length > 0
        ? current
        : [
            {
              id: "assistant-greeting",
              role: "assistant",
              content: copy.greeting,
            },
          ],
    );
    return nextSessionId;
  };

  const sendMessage = async (override?: string) => {
    const content = (override ?? input).trim();
    if (!content || sending) return;

    setLoadError(null);
    setInput("");
    setSending(true);

    const currentSessionId = await ensureSession();
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content };
    const assistantId = `assistant-${Date.now()}`;

    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", content: "" }]);

    try {
      await sendChatbotMessage({
        sessionId: currentSessionId,
        content,
        language,
        agentMode,
        mode,
        onEvent: (event) => {
          if (event.type === "text") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: `${message.content}${event.content}` }
                  : message,
              ),
            );
            return;
          }

          if (event.type === "flights") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, flights: event.flights }
                  : message,
              ),
            );
            return;
          }

          if (event.type === "error") {
            setLoadError(event.error || "Chatbot error");
          }
        },
      });
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId && !message.content
            ? {
                ...message,
                content:
                  language === "en"
                    ? "I could not complete the request right now. Please try again."
                    : language === "es"
                      ? "No pude completar la solicitud ahora. Inténtelo de nuevo."
                      : "Não consegui concluir o pedido agora. Tente novamente.",
              }
            : message,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const modeHint = agentMode && status?.agentMode !== "basic" ? copy.modeHintAi : copy.modeHintBasic;
  const accentColor = mode === "senior" ? theme.colors.senior : theme.colors.primary;

  return (
    <AppShell mode={mode} badge={copy.badge} title={copy.title} subtitle={copy.subtitle} contentStyle={styles.container} reserveBottomNav>
      <View style={styles.proofRow}>
        <View style={styles.proofCard}>
          <Text style={styles.proofValue}>{providerLabel}</Text>
          <Text style={styles.proofLabel}>{copy.chatSubtitle}</Text>
        </View>
        <View style={styles.proofCard}>
          <Text style={styles.proofValue}>{copy.agentMode}</Text>
          <Text style={styles.proofLabel}>{modeHint}</Text>
        </View>
      </View>

      <Card>
        <View style={styles.headerRow}>
          <View style={styles.chatHeaderCopy}>
            <Text style={[styles.chatBadge, { color: accentColor }]}>{copy.chatBadge}</Text>
            <Text style={styles.chatTitle}>{copy.chatTitle}</Text>
            <Text style={styles.chatSubtitle}>{copy.chatSubtitle}</Text>
          </View>
          <View style={[styles.providerPill, { borderColor: accentColor, backgroundColor: mode === "senior" ? theme.colors.seniorSoft : theme.colors.primarySoft }]}>
            <Text style={[styles.providerText, { color: accentColor }]}>{providerLabel}</Text>
          </View>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>{copy.agentMode}</Text>
            <Text style={styles.toggleSubtitle}>{modeHint}</Text>
          </View>
          <Switch
            value={agentMode}
            onValueChange={setAgentMode}
            trackColor={{ false: theme.colors.gray300, true: accentColor }}
            thumbColor={theme.colors.white}
          />
        </View>

        <View style={styles.quickRow}>
          <Text style={styles.quickTitle}>{copy.quickStart}</Text>
          <View style={styles.quickList}>
            {copy.quickPrompts.map((prompt) => (
              <TouchableOpacity key={prompt} style={styles.quickChip} onPress={() => void sendMessage(prompt)}>
                <Text style={styles.quickChipText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.messagesWrap}>
          {loadingStatus ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={accentColor} />
              <Text style={styles.loadingText}>{copy.loading}</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{copy.greeting}</Text>
                </View>
              ) : (
                messages.map((message) => (
                  <View key={message.id} style={[styles.messageRow, message.role === "user" ? styles.messageRowUser : styles.messageRowAssistant]}>
                    <View
                      style={[
                        styles.messageBubble,
                        message.role === "user"
                          ? [styles.userBubble, { backgroundColor: accentColor }]
                          : styles.assistantBubble,
                      ]}
                    >
                      <Text style={[styles.messageText, message.role === "user" && styles.userMessageText]}>
                        {message.content || (sending && message.role === "assistant" ? "..." : "")}
                      </Text>
                    </View>
                    {message.flights?.map((flight) => (
                      <View key={flight.id} style={styles.flightCard}>
                        <View style={styles.flightRow}>
                          <Text style={styles.flightAirline}>{flight.airline}</Text>
                          <Text style={[styles.flightPrice, { color: accentColor }]}>
                            {flight.currency} {flight.price.toFixed(2)}
                          </Text>
                        </View>
                        <Text style={styles.flightMeta}>
                          {flight.originCode} {formatTime(flight.departureTime)} · {flight.destinationCode} {formatTime(flight.arrivalTime)}
                        </Text>
                        <Text style={styles.flightMeta}>
                          {flight.duration} · {flight.stops === 0 ? (language === "en" ? "Nonstop" : language === "es" ? "Directo" : "Direto") : `${flight.stops}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={copy.placeholder}
          placeholderTextColor={theme.colors.gray500}
          multiline
          style={styles.input}
        />

        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

        <View style={styles.actionsRow}>
          <PrimaryButton label={copy.send} onPress={() => void sendMessage()} loading={sending} style={styles.sendButton} />
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              void sendMessage(
                language === "en"
                  ? "I want to check my booking. My reference starts with MT-"
                  : language === "es"
                    ? "Quiero consultar mi reserva. Mi referencia empieza con MT-"
                    : "Quero consultar minha reserva. Minha referência começa com MT-",
              )
            }
          >
            <Text style={[styles.secondaryButtonText, { color: accentColor }]}>{copy.bookingButton}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <Text style={styles.contactTitle}>{copy.note}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: accentColor }]} onPress={() => Linking.openURL(buildWhatsAppHref(language, "Ajuda móvel", [mode]))}>
          <Text style={styles.buttonText}>{copy.openWhatsApp}</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.contactGrid}>
        <Card>
          <Text style={styles.cardTitle}>{copy.phone}</Text>
          <Text style={styles.contactLine}>{AGENCY_PHONE_DISPLAY}</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>{copy.email}</Text>
          <Text style={styles.contactLine}>{AGENCY_EMAIL}</Text>
        </Card>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing(3) },
  proofRow: {
    flexDirection: "row",
    gap: theme.spacing(2),
  },
  proofCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    ...theme.shadow.subtle,
  },
  proofValue: { fontSize: 15, fontWeight: "800", color: theme.colors.primaryInk },
  proofLabel: { marginTop: 6, fontSize: 12, lineHeight: 18, color: theme.colors.gray600 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing(3),
  },
  chatHeaderCopy: { flex: 1 },
  chatBadge: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chatTitle: {
    marginTop: theme.spacing(2),
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  chatSubtitle: {
    marginTop: theme.spacing(2),
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.gray600,
  },
  providerPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  providerText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  toggleRow: {
    marginTop: theme.spacing(4),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(3),
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing(3),
  },
  toggleCopy: { flex: 1 },
  toggleTitle: { color: theme.colors.gray900, fontSize: 15, fontWeight: "800" },
  toggleSubtitle: { marginTop: 6, color: theme.colors.gray600, fontSize: 13, lineHeight: 18 },
  quickRow: {
    marginTop: theme.spacing(4),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    padding: theme.spacing(3),
  },
  quickTitle: { fontSize: 12, fontWeight: "800", color: theme.colors.gray700, textTransform: "uppercase", letterSpacing: 0.8 },
  quickList: { gap: theme.spacing(2), paddingTop: theme.spacing(2) },
  quickChip: {
    width: "100%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  quickChipText: { color: theme.colors.gray700, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  messagesWrap: {
    marginTop: theme.spacing(4),
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceSoft,
    minHeight: 280,
    maxHeight: 380,
    overflow: "hidden",
  },
  loadingWrap: {
    flex: 1,
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing(3),
  },
  loadingText: { color: theme.colors.gray600, fontSize: 14 },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: theme.spacing(3), gap: theme.spacing(2) },
  emptyState: { paddingVertical: theme.spacing(8), alignItems: "center" },
  emptyText: { textAlign: "center", color: theme.colors.gray600, fontSize: 14, lineHeight: 20 },
  messageRow: { gap: theme.spacing(2) },
  messageRowUser: { alignItems: "flex-end" },
  messageRowAssistant: { alignItems: "flex-start" },
  messageBubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  messageText: { color: theme.colors.gray900, fontSize: 14, lineHeight: 20 },
  userMessageText: { color: theme.colors.white },
  flightCard: {
    width: "88%",
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing(3),
  },
  flightRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing(2) },
  flightAirline: { color: theme.colors.gray900, fontSize: 14, fontWeight: "800", flex: 1 },
  flightPrice: { fontSize: 15, fontWeight: "800" },
  flightMeta: { marginTop: 6, color: theme.colors.gray600, fontSize: 12, lineHeight: 16 },
  input: {
    marginTop: theme.spacing(4),
    minHeight: 92,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.gray900,
    textAlignVertical: "top",
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: { marginTop: theme.spacing(2), color: theme.colors.danger, fontSize: 12, lineHeight: 17 },
  actionsRow: { marginTop: theme.spacing(4), gap: theme.spacing(2) },
  sendButton: { width: "100%" },
  secondaryButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "800" },
  contactTitle: { marginTop: 2, fontSize: 14, color: theme.colors.gray600, lineHeight: 21 },
  button: {
    marginTop: theme.spacing(4),
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: "800" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.gray900 },
  contactLine: { marginTop: 8, color: theme.colors.gray700, fontSize: 15 },
  contactGrid: {
    gap: theme.spacing(3),
  },
});
