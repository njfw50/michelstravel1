import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppShell } from "../components/AppShell";
import { BaggageHighlights } from "../components/BaggageHighlights";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { getFlightOffer } from "../services/flights";
import { useOnboardingStore } from "../store/onboardingStore";
import { theme } from "../theme/theme";
import { FlightOffer, FlightSlice } from "../types/flights";
import { formatFlightPrice, getFlightDateLabel, getFlightRouteLabel } from "../utils/flightPresentation";

function formatTime(value?: string, language: "pt" | "en" | "es" = "pt") {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: language === "en",
  }).format(date);
}

function formatDate(value?: string, language: "pt" | "en" | "es" = "pt") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}

function formatDuration(value?: string) {
  if (!value) return "--";
  return value.replace("PT", "").replace("H", "h ").replace("M", "m").trim() || value;
}

function getSlices(offer: FlightOffer): FlightSlice[] {
  if (offer.slices && offer.slices.length > 0) return offer.slices;

  return [
    {
      duration: offer.duration,
      originCode: offer.originCode || undefined,
      originCity: offer.originCity || undefined,
      destinationCode: offer.destinationCode || undefined,
      destinationCity: offer.destinationCity || undefined,
      segments: [
        {
          departureTime: offer.departureTime,
          arrivalTime: offer.arrivalTime,
          originCode: offer.originCode || undefined,
          originCity: offer.originCity || undefined,
          destinationCode: offer.destinationCode || undefined,
          destinationCity: offer.destinationCity || undefined,
          carrierName: offer.airline,
          flightNumber: offer.flightNumber,
        },
      ],
    },
  ];
}

function getConnectionLabels(slice: FlightSlice, fallbackLabel: string) {
  const segments = slice.segments || [];
  if (segments.length <= 1) return [];

  return segments.slice(0, -1).map((segment) => {
    const city = segment.destinationCity || segment.destinationName;
    const code = segment.destinationCode;
    return city ? `${city}${code ? ` (${code})` : ""}` : (code || fallbackLabel);
  });
}

export function TripDetailScreen({ navigation, route }: { navigation: any; route: any }) {
  const language = useOnboardingStore((state) => state.language);
  const [offer, setOffer] = useState<FlightOffer | null>(route.params.initialOffer ?? null);
  const [loading, setLoading] = useState(!route.params.initialOffer);
  const [error, setError] = useState("");
  const mode = route.params.mode;

  const copy = useMemo(() => {
    if (language === "en") {
      if (mode === "senior") {
        return {
          badge: "Senior support",
          title: "Review this option with peace of mind",
          subtitle: "Before continuing, confirm what is included, where the connections happen, and the fare rules for this trip.",
          fareTitle: "What this fare includes",
          conditionTitle: "Travel rules before payment",
          cta: "Continue",
          loading: "Updating flight details...",
          errorTitle: "We could not load the details",
          retry: "Try again",
          price: "Price",
          cabin: "Cabin",
          support: "Support",
          documents: "Identity documents",
          documentsRequired: "required",
          documentsMayBeRequested: "may be requested by the airline",
          section: "Segment",
          connectionIn: "Connection in",
          directSegment: "Direct segment",
          changeBeforeDeparture: "Changes before departure",
          refundBeforeDeparture: "Refund before departure",
          allowed: "allowed",
          notAllowed: "not allowed",
          connectionFallback: "Connection",
          fareReminder: "Prices and availability may change until ticketing is completed.",
          supportValue: "Human guidance available",
        };
      }

      return {
        badge: "Flight details",
        title: "Review your selected flight",
        subtitle: "Before moving on, confirm what is included, where the connections happen, and the fare rules for this option.",
        fareTitle: "What this fare includes",
        conditionTitle: "Travel rules before payment",
        cta: "Continue",
        loading: "Updating flight details...",
        errorTitle: "We could not load the details",
        retry: "Try again",
        price: "Price",
        cabin: "Cabin",
        support: "Support",
        documents: "Identity documents",
        documentsRequired: "required",
        documentsMayBeRequested: "may be requested by the airline",
        section: "Segment",
        connectionIn: "Connection in",
        directSegment: "Direct segment",
        changeBeforeDeparture: "Changes before departure",
        refundBeforeDeparture: "Refund before departure",
        allowed: "allowed",
        notAllowed: "not allowed",
        connectionFallback: "Connection",
        fareReminder: "Prices and availability may change until ticketing is completed.",
        supportValue: "Human guidance available",
      };
    }

    if (language === "es") {
      if (mode === "senior") {
        return {
          badge: "Atención senior",
          title: "Revise esta opción con tranquilidad",
          subtitle: "Antes de seguir, confirme qué incluye la tarifa, dónde ocurren las conexiones y cuáles son las condiciones del viaje.",
          fareTitle: "Lo que incluye esta tarifa",
          conditionTitle: "Reglas del viaje antes del pago",
          cta: "Continuar",
          loading: "Actualizando los detalles del vuelo...",
          errorTitle: "No pudimos cargar los detalles",
          retry: "Intentar de nuevo",
          price: "Precio",
          cabin: "Cabina",
          support: "Soporte",
          documents: "Documentos de identidad",
          documentsRequired: "obligatorios",
          documentsMayBeRequested: "pueden ser solicitados por la aerolínea",
          section: "Tramo",
          connectionIn: "Conexión en",
          directSegment: "Tramo directo",
          changeBeforeDeparture: "Cambio antes de la salida",
          refundBeforeDeparture: "Reembolso antes de la salida",
          allowed: "permitido",
          notAllowed: "no permitido",
          connectionFallback: "Conexión",
          fareReminder: "Los precios y la disponibilidad pueden cambiar hasta la emisión del boleto.",
          supportValue: "Ayuda humana disponible",
        };
      }

      return {
        badge: "Detalles del vuelo",
        title: "Revise el vuelo seleccionado",
        subtitle: "Antes de continuar, confirme qué incluye la tarifa, dónde ocurren las conexiones y cuáles son las condiciones del viaje.",
        fareTitle: "Lo que incluye esta tarifa",
        conditionTitle: "Reglas del viaje antes del pago",
        cta: "Continuar",
        loading: "Actualizando los detalles del vuelo...",
        errorTitle: "No pudimos cargar los detalles",
        retry: "Intentar de nuevo",
        price: "Precio",
        cabin: "Cabina",
        support: "Soporte",
        documents: "Documentos de identidad",
        documentsRequired: "obligatorios",
        documentsMayBeRequested: "pueden ser solicitados por la aerolínea",
        section: "Tramo",
        connectionIn: "Conexión en",
        directSegment: "Tramo directo",
        changeBeforeDeparture: "Cambio antes de la salida",
        refundBeforeDeparture: "Reembolso antes de la salida",
        allowed: "permitido",
        notAllowed: "no permitido",
        connectionFallback: "Conexión",
        fareReminder: "Los precios y la disponibilidad pueden cambiar hasta la emisión del boleto.",
        supportValue: "Ayuda humana disponible",
      };
    }

    if (mode === "senior") {
      return {
        badge: "Atendimento sênior",
        title: "Revise esta opção com tranquilidade",
        subtitle: "Antes de seguir, confirme o que a tarifa inclui, onde acontecem as conexões e quais são as condições desta viagem.",
        fareTitle: "O que esta tarifa inclui",
        conditionTitle: "Regras da viagem antes do pagamento",
        cta: "Continuar",
        loading: "Atualizando os detalhes do voo...",
        errorTitle: "Não foi possível carregar os detalhes",
        retry: "Tentar novamente",
        price: "Preço",
        cabin: "Cabine",
        support: "Suporte",
        documents: "Documentos de identidade",
        documentsRequired: "obrigatórios",
        documentsMayBeRequested: "podem ser solicitados pela companhia",
        section: "Trecho",
        connectionIn: "Conexão em",
        directSegment: "Trecho direto",
        changeBeforeDeparture: "Alteração antes da partida",
        refundBeforeDeparture: "Reembolso antes da partida",
        allowed: "disponível",
        notAllowed: "indisponível",
        connectionFallback: "Conexão",
        fareReminder: "Preços e disponibilidade podem mudar até a emissão da passagem.",
        supportValue: "Ajuda humana disponível",
      };
    }

    return {
      badge: "Detalhes do voo",
      title: "Revise o voo selecionado",
      subtitle: "Antes de continuar, confirme o que a tarifa inclui, onde acontecem as conexões e quais são as condições desta viagem.",
      fareTitle: "O que esta tarifa inclui",
      conditionTitle: "Regras da viagem antes do pagamento",
      cta: "Continuar",
      loading: "Atualizando os detalhes do voo...",
      errorTitle: "Não foi possível carregar os detalhes",
      retry: "Tentar novamente",
      price: "Preço",
      cabin: "Cabine",
      support: "Suporte",
      documents: "Documentos de identidade",
      documentsRequired: "obrigatórios",
      documentsMayBeRequested: "podem ser solicitados pela companhia",
      section: "Trecho",
      connectionIn: "Conexão em",
      directSegment: "Trecho direto",
      changeBeforeDeparture: "Alteração antes da partida",
      refundBeforeDeparture: "Reembolso antes da partida",
      allowed: "disponível",
      notAllowed: "indisponível",
      connectionFallback: "Conexão",
      fareReminder: "Preços e disponibilidade podem mudar até a emissão da passagem.",
      supportValue: "Ajuda humana disponível",
    };
  }, [language, mode]);

  const loadOffer = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getFlightOffer(route.params.offerId);
      setOffer(response);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || "Não foi possível carregar os detalhes do voo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!route.params.initialOffer) {
      loadOffer();
    }
  }, [route.params.initialOffer, route.params.offerId]);

  const slices = useMemo(() => (offer ? getSlices(offer) : []), [offer]);

  return (
    <AppShell mode={mode} badge={copy.badge} title={copy.title} subtitle={copy.subtitle} contentStyle={styles.container}>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>{copy.loading}</Text>
        </View>
      ) : null}

      {error ? (
        <Card>
          <Text style={styles.errorTitle}>{copy.errorTitle}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton label={copy.retry} onPress={loadOffer} style={styles.retryButton} />
        </Card>
      ) : null}

      {offer ? (
        <>
          <Card>
            <Text style={styles.heroRoute}>{getFlightRouteLabel(offer)}</Text>
            <Text style={styles.heroMeta}>{getFlightDateLabel(offer)}</Text>
            <View style={styles.priceRow}>
              <View style={styles.overviewCard}>
                <Text style={styles.smallLabel}>{copy.price}</Text>
                <Text style={styles.price}>{formatFlightPrice(offer.price, offer.currency)}</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.smallLabel}>{copy.cabin}</Text>
                <Text style={styles.value}>{offer.cabinClass || "economy"}</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.smallLabel}>{copy.support}</Text>
                <Text style={styles.value}>{copy.supportValue}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>{copy.fareTitle}</Text>
            <BaggageHighlights passengers={offer.passengers} language={language} />
            <Text style={[styles.value, styles.spacedValue]}>
              {copy.documents} {offer.passengerIdentityDocumentsRequired ? copy.documentsRequired : copy.documentsMayBeRequested}.
            </Text>
          </Card>

          {slices.map((slice, index) => {
            const segments = slice.segments || [];
            const first = segments[0];
            const last = segments[segments.length - 1];
            const connections = getConnectionLabels(slice, copy.connectionFallback);
            const isMultiSlice = slices.length > 1;
            const sectionLabel = isMultiSlice ? `${copy.section} ${index + 1}` : copy.section;
            const routeLabel = `${slice.originCode || offer.originCode || "--"} → ${slice.destinationCode || offer.destinationCode || "--"}`;

            return (
              <Card key={`${offer.id}-${index}`}>
                <View style={styles.sliceHeader}>
                  <View style={styles.sliceHeaderCopy}>
                    <Text style={styles.sectionTitle}>{sectionLabel}</Text>
                    <Text style={styles.sliceRoute}>{routeLabel}</Text>
                  </View>
                  <View style={styles.sliceHeaderMeta}>
                    <Text style={styles.sliceDate}>{formatDate(first?.departureTime, language)}</Text>
                    <Text style={styles.sliceDuration}>{formatDuration(slice.duration || offer.duration)}</Text>
                  </View>
                </View>

                <View style={styles.segmentPanel}>
                  <View style={styles.segmentTimeline}>
                  <View style={styles.segmentBlock}>
                    <Text style={styles.segmentTime}>{formatTime(first?.departureTime, language)}</Text>
                    <Text style={styles.segmentCode}>{slice.originCode || offer.originCode || "--"}</Text>
                    <Text style={styles.segmentCity}>{slice.originCity || offer.originCity || slice.originCode || "--"}</Text>
                  </View>
                  <View style={styles.segmentMiddle}>
                    <View style={styles.segmentLine} />
                    {connections.length > 0 ? <Text style={styles.segmentConnection}>{copy.connectionIn} {connections.join(", ")}</Text> : <Text style={styles.segmentConnection}>{copy.directSegment}</Text>}
                  </View>
                  <View style={[styles.segmentBlock, styles.segmentBlockRight]}>
                    <Text style={styles.segmentTime}>{formatTime(last?.arrivalTime, language)}</Text>
                    <Text style={styles.segmentCode}>{slice.destinationCode || offer.destinationCode || "--"}</Text>
                    <Text style={styles.segmentCity}>{slice.destinationCity || offer.destinationCity || slice.destinationCode || "--"}</Text>
                  </View>
                </View>
                </View>

                <View style={styles.segmentList}>
                  {segments.map((segment, segmentIndex) => (
                    <View key={`${segment.segmentId || segmentIndex}`} style={styles.segmentRow}>
                      <View style={styles.segmentRowTop}>
                        <Text style={styles.segmentTitle}>
                          {(segment.originCode || "--")}{" → "}{(segment.destinationCode || "--")}
                        </Text>
                        <Text style={styles.segmentFlight}>
                          {segment.carrierName || offer.airline} · {segment.flightNumber || offer.flightNumber || "--"}
                        </Text>
                      </View>
                      <Text style={styles.segmentMeta}>
                        {formatTime(segment.departureTime, language)}{" → "}{formatTime(segment.arrivalTime, language)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}

          <Card>
            <Text style={styles.sectionTitle}>{copy.conditionTitle}</Text>
            <Text style={styles.value}>
              {copy.changeBeforeDeparture}: {offer.conditions?.changeBeforeDeparture?.allowed ? copy.allowed : copy.notAllowed}.
            </Text>
            <Text style={[styles.value, styles.spacedValue]}>
              {copy.refundBeforeDeparture}: {offer.conditions?.refundBeforeDeparture?.allowed ? copy.allowed : copy.notAllowed}.
            </Text>
            <Text style={styles.fareReminder}>{copy.fareReminder}</Text>
          </Card>

          <PrimaryButton
            label={copy.cta}
            onPress={() =>
              navigation.navigate("BookingForm", {
                offer,
                mode,
                search: route.params.search,
                preferences: route.params.preferences,
              })
            }
          />
        </>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing(3) },
  loadingState: { flexDirection: "row", alignItems: "center", gap: theme.spacing(3) },
  loadingText: { color: theme.colors.gray700, fontSize: 14 },
  errorTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.gray900 },
  errorText: { marginTop: theme.spacing(2), color: theme.colors.gray600, fontSize: 14, lineHeight: 21 },
  retryButton: { marginTop: theme.spacing(4) },
  heroRoute: { fontSize: 24, fontWeight: "800", color: theme.colors.gray900 },
  heroMeta: { marginTop: 8, fontSize: 14, color: theme.colors.gray600, lineHeight: 21 },
  priceRow: { marginTop: theme.spacing(4), flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2) },
  overviewCard: {
    minWidth: "30%",
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  smallLabel: { fontSize: 11, color: theme.colors.gray500, textTransform: "uppercase", letterSpacing: 0.8 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: theme.colors.gray900 },
  sliceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing(2) },
  sliceHeaderCopy: { flex: 1 },
  sliceHeaderMeta: { alignItems: "flex-end", gap: 4 },
  sliceRoute: { marginTop: 4, fontSize: 13, color: theme.colors.gray600, fontWeight: "600" },
  sliceDate: { fontSize: 12, color: theme.colors.gray500, fontWeight: "700" },
  sliceDuration: { fontSize: 12, color: theme.colors.primary, fontWeight: "800" },
  value: { fontSize: 14, color: theme.colors.gray900, marginTop: 6, lineHeight: 21 },
  spacedValue: { marginTop: 10 },
  price: { fontSize: 24, fontWeight: "800", color: theme.colors.gray900, marginTop: 4 },
  segmentPanel: {
    marginTop: theme.spacing(3),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  segmentTimeline: { flexDirection: "row", gap: theme.spacing(2), alignItems: "flex-start" },
  segmentBlock: { width: 82 },
  segmentBlockRight: { alignItems: "flex-end" },
  segmentTime: { fontSize: 24, fontWeight: "800", color: theme.colors.gray900 },
  segmentCode: { marginTop: 2, fontSize: 13, fontWeight: "800", color: theme.colors.gray700 },
  segmentCity: { marginTop: 2, fontSize: 12, color: theme.colors.gray500 },
  segmentMiddle: { flex: 1, alignItems: "center", paddingTop: 10 },
  segmentLine: { height: 2, width: "100%", backgroundColor: theme.colors.gray200 },
  segmentConnection: { marginTop: 10, textAlign: "center", fontSize: 12, fontWeight: "700", color: theme.colors.primary },
  segmentList: { marginTop: theme.spacing(4), gap: theme.spacing(2) },
  segmentRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  segmentRowTop: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing(2), alignItems: "flex-start" },
  segmentTitle: { color: theme.colors.gray900, fontSize: 14, fontWeight: "700" },
  segmentFlight: { flexShrink: 1, textAlign: "right", color: theme.colors.gray600, fontSize: 12, fontWeight: "700" },
  segmentMeta: { marginTop: 6, color: theme.colors.gray600, fontSize: 13, fontWeight: "600" },
  fareReminder: {
    marginTop: theme.spacing(3),
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.gray500,
  },
});
