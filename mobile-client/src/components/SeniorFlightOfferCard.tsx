import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme/theme";
import { AppLanguage } from "../types/app";
import { FlightOffer, FlightSlice } from "../types/flights";
import { formatFlightPrice } from "../utils/flightPresentation";
import { SeniorFlightInsight, SeniorRecommendationKind } from "../utils/seniorRecommendations";
import { AirlineLogo } from "./AirlineLogo";
import { BaggageHighlights } from "./BaggageHighlights";
import { Card } from "./Card";
import { FareCardNotes } from "./FareCardNotes";

type SeniorFlightOfferCardProps = {
  offer: FlightOffer;
  insight: SeniorFlightInsight;
  kind: SeniorRecommendationKind;
  language: AppLanguage;
  onPress: () => void;
};

function formatTime(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function getKindCopy(kind: SeniorRecommendationKind, language: AppLanguage) {
  if (language === "en") {
    return kind === "fastest" ? "Shortest total time" : kind === "balanced" ? "Best balance" : "Calmest option";
  }

  if (language === "es") {
    return kind === "fastest" ? "Menor tiempo total" : kind === "balanced" ? "Mejor equilibrio" : "Opción más tranquila";
  }

  return kind === "fastest" ? "Menor tempo total" : kind === "balanced" ? "Melhor equilíbrio" : "Mais calmo para viajar";
}

function buildReasonLine(insight: SeniorFlightInsight, language: AppLanguage) {
  const parts: string[] = [];

  if (language === "en") {
    parts.push(insight.totalStops === 0 ? "direct option" : insight.totalStops === 1 ? "1 connection" : `${insight.totalStops} connections`);
    if (insight.totalStops > 0) parts.push(`longest wait ${formatMinutes(insight.longestLayoverMinutes)}`);
    if (insight.hasCheckedBag) parts.push("checked baggage included");
    else if (insight.hasCarryOn) parts.push("carry-on included");
    else parts.push("lighter fare");
    if (!insight.hasSensitiveHour) parts.push("more comfortable schedule");
    return parts.join(" · ");
  }

  if (language === "es") {
    parts.push(insight.totalStops === 0 ? "opción directa" : insight.totalStops === 1 ? "1 conexión" : `${insight.totalStops} conexiones`);
    if (insight.totalStops > 0) parts.push(`espera mayor ${formatMinutes(insight.longestLayoverMinutes)}`);
    if (insight.hasCheckedBag) parts.push("equipaje despachado incluido");
    else if (insight.hasCarryOn) parts.push("equipaje de mano incluido");
    else parts.push("tarifa más ligera");
    if (!insight.hasSensitiveHour) parts.push("horario más cómodo");
    return parts.join(" · ");
  }

  parts.push(insight.totalStops === 0 ? "opção direta" : insight.totalStops === 1 ? "1 conexão" : `${insight.totalStops} conexões`);
  if (insight.totalStops > 0) parts.push(`maior espera ${formatMinutes(insight.longestLayoverMinutes)}`);
  if (insight.hasCheckedBag) parts.push("mala despachada incluída");
  else if (insight.hasCarryOn) parts.push("bagagem de mão incluída");
  else parts.push("tarifa mais leve");
  if (!insight.hasSensitiveHour) parts.push("horário mais confortável");
  return parts.join(" · ");
}

export function SeniorFlightOfferCard({ offer, insight, kind, language, onPress }: SeniorFlightOfferCardProps) {
  const slices = getSlices(offer);
  const kindLabel = getKindCopy(kind, language);
  const copy = language === "en"
    ? {
        totalPrice: "Total",
        outbound: "Outbound",
        returnLabel: "Return",
        direct: "Direct",
        connection: "connection",
        connections: "connections",
        noConnection: "No connection",
        connectionIn: "Connection in",
        totalTime: "Total time",
        baggage: "Baggage",
        checked: "Checked",
        cabin: "Cabin",
        light: "Light",
        reasonTitle: "Why this can work well for you",
        select: "Choose this flight",
        connectionFallback: "Connection",
      }
    : language === "es"
      ? {
          totalPrice: "Total",
          outbound: "Ida",
          returnLabel: "Regreso",
          direct: "Directo",
          connection: "conexión",
          connections: "conexiones",
          noConnection: "Sin conexión",
          connectionIn: "Conexión en",
          totalTime: "Tiempo total",
          baggage: "Equipaje",
          checked: "Despachado",
          cabin: "Cabina",
          light: "Ligero",
          reasonTitle: "Por qué puede ser una buena opción para usted",
          select: "Elegir este vuelo",
          connectionFallback: "Conexión",
        }
      : {
          totalPrice: "Preço total",
          outbound: "Ida",
          returnLabel: "Volta",
          direct: "Direto",
          connection: "conexão",
          connections: "conexões",
          noConnection: "Sem conexão",
          connectionIn: "Conexão em",
          totalTime: "Tempo total",
          baggage: "Bagagem",
          checked: "Despachada",
          cabin: "Cabine",
          light: "Leve",
          reasonTitle: "Por que esta pode ser uma boa opção para você",
          select: "Escolher este voo",
          connectionFallback: "Conexão",
        };

  return (
    <Card>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{kindLabel}</Text>
          </View>
          <View style={styles.airlineRow}>
            <View style={styles.logoWrap}>
              <AirlineLogo airline={offer.airline} logoUrl={offer.logoUrl} accentColor={theme.colors.senior} size={38} />
            </View>
            <View>
              <Text style={styles.airline}>{offer.airline}</Text>
              <Text style={styles.subline}>{offer.originCode || "--"}{" -> "}{offer.destinationCode || "--"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceWrap}>
          <Text style={styles.priceLabel}>{copy.totalPrice}</Text>
          <Text style={styles.price}>{formatFlightPrice(offer.price, offer.currency)}</Text>
        </View>
      </View>

      <View style={styles.sliceList}>
        {slices.map((slice, index) => {
          const segments = slice.segments || [];
          const first = segments[0];
          const last = segments[segments.length - 1];
          const connections = getConnectionLabels(slice, copy.connectionFallback);
          const stopsCount = Math.max(segments.length - 1, 0);

          return (
            <View key={`${offer.id}-${index}`} style={styles.sliceCard}>
              <Text style={styles.sliceLabel}>{index === 0 ? copy.outbound : copy.returnLabel}</Text>
              <View style={styles.timelineRow}>
                <View style={styles.airportBlock}>
                  <Text style={styles.timeText}>{formatTime(first?.departureTime)}</Text>
                  <Text style={styles.codeText}>{slice.originCode || offer.originCode || "--"}</Text>
                  <Text style={styles.cityText}>{slice.originCity || offer.originCity || slice.originCode || "--"}</Text>
                </View>
                <View style={styles.timelineMiddle}>
                  <Text style={[styles.stopsText, stopsCount === 0 ? styles.stopsDirect : styles.stopsConnection]}>
                    {stopsCount === 0 ? copy.noConnection : `${stopsCount} ${stopsCount === 1 ? copy.connection : copy.connections}`}
                  </Text>
                  <View style={styles.line} />
                  {connections.length > 0 ? <Text style={styles.connectionText}>{copy.connectionIn} {connections.join(", ")}</Text> : null}
                </View>
                <View style={[styles.airportBlock, styles.airportBlockRight]}>
                  <Text style={styles.timeText}>{formatTime(last?.arrivalTime)}</Text>
                  <Text style={styles.codeText}>{slice.destinationCode || offer.destinationCode || "--"}</Text>
                  <Text style={styles.cityText}>{slice.destinationCity || offer.destinationCity || slice.destinationCode || "--"}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{copy.totalTime}</Text>
          <Text style={styles.metricValue}>{formatMinutes(insight.totalDurationMinutes)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{language === "en" ? "Connections" : language === "es" ? "Conexiones" : "Conexões"}</Text>
          <Text style={styles.metricValue}>{insight.totalStops === 0 ? copy.direct : `${insight.totalStops}`}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{copy.baggage}</Text>
          <Text style={styles.metricValue}>{insight.hasCheckedBag ? copy.checked : insight.hasCarryOn ? copy.cabin : copy.light}</Text>
        </View>
      </View>

      <View style={styles.reasonCard}>
        <Text style={styles.reasonTitle}>{copy.reasonTitle}</Text>
        <Text style={styles.reasonText}>{buildReasonLine(insight, language)}</Text>
      </View>

      <View style={styles.baggageWrap}>
        <BaggageHighlights passengers={offer.passengers} language={language} compact />
      </View>

      <TouchableOpacity style={styles.selectButton} onPress={onPress}>
        <Text style={styles.selectText}>{copy.select}</Text>
      </TouchableOpacity>

      <FareCardNotes language={language} />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing(3) },
  brandRow: { flex: 1, gap: theme.spacing(3) },
  badgeWrap: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: theme.colors.seniorSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: { color: theme.colors.seniorDark, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  airlineRow: { flexDirection: "row", gap: theme.spacing(3), alignItems: "center" },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  airline: { fontSize: 18, fontWeight: "800", color: theme.colors.gray900 },
  subline: { marginTop: 3, fontSize: 13, color: theme.colors.gray500 },
  priceWrap: { alignItems: "flex-end" },
  priceLabel: { fontSize: 11, color: theme.colors.gray500, textTransform: "uppercase", letterSpacing: 0.8 },
  price: { marginTop: 4, fontSize: 24, fontWeight: "800", color: theme.colors.gray900 },
  sliceList: { marginTop: theme.spacing(4), gap: theme.spacing(3) },
  sliceCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: "#F8FAFC",
    padding: theme.spacing(3),
    gap: theme.spacing(2),
  },
  sliceLabel: { color: theme.colors.primary, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing(2) },
  airportBlock: { width: 78 },
  airportBlockRight: { alignItems: "flex-end" },
  timeText: { fontSize: 24, fontWeight: "800", color: theme.colors.gray900 },
  codeText: { marginTop: 2, fontSize: 13, fontWeight: "800", color: theme.colors.gray700 },
  cityText: { marginTop: 2, fontSize: 12, color: theme.colors.gray500 },
  timelineMiddle: { flex: 1, alignItems: "center", paddingTop: 8 },
  stopsText: { fontSize: 12, fontWeight: "800" },
  stopsDirect: { color: theme.colors.success },
  stopsConnection: { color: theme.colors.warning },
  line: { marginTop: 12, height: 2, width: "100%", backgroundColor: theme.colors.gray200 },
  connectionText: { marginTop: 10, textAlign: "center", fontSize: 12, fontWeight: "700", color: theme.colors.seniorDark },
  metricsRow: { marginTop: theme.spacing(4), flexDirection: "row", gap: theme.spacing(2) },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  metricLabel: { color: theme.colors.gray500, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  metricValue: { marginTop: 6, color: theme.colors.gray900, fontSize: 15, fontWeight: "800" },
  reasonCard: {
    marginTop: theme.spacing(4),
    borderRadius: 20,
    backgroundColor: theme.colors.seniorMist,
    borderWidth: 1,
    borderColor: "#F2D39C",
    padding: theme.spacing(3),
  },
  reasonTitle: { color: theme.colors.seniorDark, fontSize: 13, fontWeight: "800" },
  reasonText: { marginTop: 6, color: theme.colors.gray700, fontSize: 13, lineHeight: 20 },
  baggageWrap: { marginTop: theme.spacing(2) },
  selectButton: {
    marginTop: theme.spacing(4),
    borderRadius: 18,
    backgroundColor: theme.colors.senior,
    paddingVertical: 15,
    alignItems: "center",
  },
  selectText: { color: theme.colors.white, fontSize: 15, fontWeight: "800" },
});
