import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { adminApiClient } from "@/lib/admin-api-client";
import { AGENCY_PHONE_TEL } from "@/lib/contact";
import type { OwnerDeskAlert, OwnerDeskData, OwnerDeskFollowUp } from "@/types/admin";

async function openExternalLink(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert("Nao foi possivel abrir", "Seu aparelho nao conseguiu abrir esse link agora.");
    return;
  }

  await Linking.openURL(url);
}

function buildWhatsAppUrl(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function SummaryBadge({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <View className="min-w-[46%] flex-1 rounded-[22px] border border-border bg-background px-4 py-4">
      <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted">{title}</Text>
      <Text className="mt-2 text-2xl font-bold text-foreground">{value}</Text>
    </View>
  );
}

function AlertCard({
  item,
  onPress,
}: {
  item: OwnerDeskAlert;
  onPress: (item: OwnerDeskAlert) => void;
}) {
  const tone =
    item.level === "critical"
      ? "border-error/20 bg-error/10"
      : item.level === "attention"
        ? "border-warning/20 bg-warning/10"
        : "border-primary/20 bg-primary/10";

  return (
    <View className={`rounded-[24px] border px-4 py-4 ${tone}`}>
      <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">
        {item.level === "critical" ? "Prioridade maxima" : item.level === "attention" ? "Pede atencao" : "Monitorar"}
      </Text>
      <Text className="mt-3 text-lg font-bold text-foreground">{item.title}</Text>
      <Text className="mt-2 text-sm leading-6 text-muted">{item.summary}</Text>
      <Text className="mt-2 text-xs leading-5 text-muted">
        {(item.customerName || "Cliente") + (item.route ? ` · ${item.route}` : "") + ` · ${item.stageLabel}`}
      </Text>

      <TouchableOpacity
        className="mt-4 rounded-[20px] bg-primary px-4 py-4"
        onPress={() => onPress(item)}
        activeOpacity={0.85}
      >
        <Text className="text-center text-sm font-semibold text-background">{item.actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function FollowUpCard({
  item,
  onPress,
}: {
  item: OwnerDeskFollowUp;
  onPress: (item: OwnerDeskFollowUp) => void;
}) {
  return (
    <View className="rounded-[24px] border border-border bg-background px-4 py-4">
      <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">
        {item.urgency === "overdue" ? "Vencido" : item.urgency === "soon" ? "Agora" : "Planejado"}
      </Text>
      <Text className="mt-3 text-lg font-bold text-foreground">{item.customerName || "Cliente"}</Text>
      <Text className="mt-2 text-sm leading-6 text-muted">{item.reason}</Text>
      <Text className="mt-2 text-xs leading-5 text-muted">{item.route || "Rota em aberto"}</Text>

      <TouchableOpacity
        className="mt-4 rounded-[20px] border border-border bg-surface px-4 py-4"
        onPress={() => onPress(item)}
        activeOpacity={0.85}
      >
        <Text className="text-center text-sm font-semibold text-foreground">{item.actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function AdminHomeScreen() {
  const { isAuthenticated } = useAdminAuth();
  const [data, setData] = useState<OwnerDeskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOwnerDesk = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const response = await adminApiClient.getOwnerDesk();
      setData(response);
    } catch (nextError: any) {
      setError(nextError?.response?.data?.error || nextError?.message || "Nao foi possivel carregar o radar.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadOwnerDesk();
  }, [isAuthenticated, loadOwnerDesk]);

  const runAlertAction = async (item: OwnerDeskAlert | OwnerDeskFollowUp) => {
    const action = "action" in item ? item.action : item.channel;

    if (action === "open-live-desk") {
      const sessionParam = item.liveSessionId ? `?session=${item.liveSessionId}` : "";
      router.push((`/bookings${sessionParam}` as never));
      return;
    }

    if (action === "open-bookings") {
      router.push("/bookings" as never);
      return;
    }

    if (action === "focus-inbox") {
      const threadParam = item.threadId ? `?thread=${item.threadId}` : "";
      router.push((`/messages${threadParam}` as never));
      return;
    }

    if (action === "call") {
      await openExternalLink(`tel:${item.customerPhone || AGENCY_PHONE_TEL}`);
      return;
    }

    if (action === "whatsapp") {
      const whatsappUrl = buildWhatsAppUrl(item.customerPhone);
      if (!whatsappUrl) {
        Alert.alert("Sem WhatsApp", "Esse cliente ainda nao tem telefone valido para abrir no WhatsApp.");
        return;
      }
      await openExternalLink(whatsappUrl);
      return;
    }

    if (action === "email") {
      if (!item.customerEmail) {
        Alert.alert("Sem email", "Esse cliente ainda nao tem email cadastrado.");
        return;
      }
      await openExternalLink(`mailto:${item.customerEmail}`);
      return;
    }
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-lg font-semibold text-foreground">
            Entre no Michels Travel Admin para abrir seu radar.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadOwnerDesk(true)} />}
      >
        <View className="rounded-[28px] border border-border bg-surface px-5 py-5">
          <Text className="text-xs font-semibold uppercase tracking-[1px] text-primary">Michels Travel Admin</Text>
          <Text className="mt-3 text-3xl font-bold text-foreground">Radar do dono</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Veja quem pede resposta agora, quem esta perto de fechar e quem precisa de voce no atendimento.
          </Text>

          {data ? (
            <View className="mt-5 flex-row flex-wrap gap-3">
              <SummaryBadge title="Quentes" value={data.summary.hotCases} />
              <SummaryBadge title="Senior" value={data.summary.seniorCases} />
              <SummaryBadge title="Ao vivo" value={data.summary.liveNow} />
              <SummaryBadge title="Alertas" value={data.summary.alertingNow} />
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <View className="mt-6 items-center rounded-[28px] border border-border bg-surface px-5 py-8">
            <ActivityIndicator size="large" color="#2F63F5" />
            <Text className="mt-4 text-sm text-muted">Montando seu owner desk...</Text>
          </View>
        ) : null}

        {error ? (
          <View className="mt-6 rounded-[24px] border border-error/20 bg-error/10 px-4 py-4">
            <Text className="text-sm leading-6 text-error">{error}</Text>
          </View>
        ) : null}

        {data ? (
          <>
            <View className="mt-6 rounded-[28px] border border-border bg-surface px-5 py-5">
              <Text className="text-lg font-bold text-foreground">Resumo rapido</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">{data.mobileDeck.headline}</Text>
              <View className="mt-4 gap-3">
                <View className="rounded-[22px] bg-background px-4 py-4">
                  <Text className="text-sm leading-6 text-foreground">
                    {data.mobileDeck.criticalCount} alertas criticos e {data.mobileDeck.dueSoonCount} follow-ups proximos.
                  </Text>
                </View>
                <View className="rounded-[22px] bg-background px-4 py-4">
                  <Text className="text-sm leading-6 text-foreground">
                    {data.summary.mobileLinked} clientes ja estao ligados ao app e {data.summary.paymentWatch} estao em observacao de pagamento.
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-bold text-foreground">Alertas prioritarios</Text>
              <View className="mt-4 gap-4">
                {data.alerts.length === 0 ? (
                  <View className="rounded-[24px] border border-border bg-surface px-4 py-4">
                    <Text className="text-sm leading-6 text-muted">Sem alertas fortes agora.</Text>
                  </View>
                ) : (
                  data.alerts.slice(0, 4).map((item) => (
                    <AlertCard key={item.id} item={item} onPress={(next) => void runAlertAction(next)} />
                  ))
                )}
              </View>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-bold text-foreground">Fila de follow-up</Text>
              <View className="mt-4 gap-4">
                {data.followUps.length === 0 ? (
                  <View className="rounded-[24px] border border-border bg-surface px-4 py-4">
                    <Text className="text-sm leading-6 text-muted">Sem follow-up pendente agora.</Text>
                  </View>
                ) : (
                  data.followUps.slice(0, 4).map((item) => (
                    <FollowUpCard key={item.id} item={item} onPress={(next) => void runAlertAction(next)} />
                  ))
                )}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
