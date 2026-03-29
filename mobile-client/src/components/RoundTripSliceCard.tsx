import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { JourneyMode } from "../types/app";
import { FlightPassengerInfo, FlightSlice } from "../types/flights";
import { formatFlightPrice } from "../utils/flightPresentation";
import { AirlineLogo } from "./AirlineLogo";
import { BaggageHighlights } from "./BaggageHighlights";
import { Card } from "./Card";
import { FareCardNotes } from "./FareCardNotes";
import { theme } from "../theme/theme";

type RoundTripSliceCardProps = {
  mode: JourneyMode;
  language: "pt" | "en" | "es";
  badge: string;
  airline: string;
  logoUrl?: string | null;
  slice: FlightSlice;
  passengers?: FlightPassengerInfo[];
  price: number;
  currency: string;
  priceLabel: string;
  actionLabel?: string;
  helperText?: string;
  selectedLabel?: string;
  selected?: boolean;
  onPress?: () => void;
};

function formatTime(value: string | undefined, language: "pt" | "en" | "es") {
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

function formatDate(value: string | undefined, language: "pt" | "en" | "es") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatDuration(value: string | undefined) {
  if (!value) return "--";
  return value.replace("PT", "").replace("H", "h ").replace("M", "m").trim() || value;
}

function getConnectionLabels(slice: FlightSlice, fallbackLabel: string) {
  const segments = slice.segments || [];
  if (segments.length <= 1) return [];

  return segments.slice(0, -1).map((segment) => {
    const city = segment.destinationCity || segment.destinationName;
    const code = segment.destinationCode;
    return city ? `${city}${code ? ` (${code})` : ""}` : code || fallbackLabel;
  });
}

export function RoundTripSliceCard({
  mode,
  language,
  badge,
  airline,
  logoUrl,
  slice,
  passengers,
  price,
  currency,
  priceLabel,
  actionLabel,
  helperText,
  selectedLabel,
  selected = false,
  onPress,
}: RoundTripSliceCardProps) {
  const accent = mode === "senior" ? theme.colors.senior : theme.colors.primary;
  const accentSoft = mode === "senior" ? theme.colors.seniorSoft : theme.colors.primarySoft;
  const selectedCardStyle = selected
    ? {
        backgroundColor: "#F3F8FF",
        borderColor: "#BDD4FF",
      }
    : undefined;
  const segments = slice.segments || [];
  const first = segments[0];
  const last = segments[segments.length - 1];
  const stopsCount = Math.max(segments.length - 1, 0);
  const connections = getConnectionLabels(slice, language === "en" ? "Connection" : language === "es" ? "Conexión" : "Conexão");
  const stopsLabel =
    language === "en"
      ? stopsCount === 0
        ? "Direct"
        : `${stopsCount} ${stopsCount === 1 ? "stop" : "stops"}`
      : language === "es"
        ? stopsCount === 0
          ? "Directo"
          : `${stopsCount} ${stopsCount === 1 ? "escala" : "escalas"}`
        : stopsCount === 0
          ? "Direto"
          : `${stopsCount} ${stopsCount === 1 ? "parada" : "paradas"}`;

  return (
    <Card style={selectedCardStyle}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.badge, { backgroundColor: selected ? theme.colors.primarySoft : accentSoft }]}>
            <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
          </View>
          {selectedLabel ? (
            <View style={styles.selectedWrap}>
              <Text style={[styles.selectedText, { color: theme.colors.primary }]}>{selectedLabel}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.priceLabel}>{priceLabel}</Text>
          <Text style={styles.price}>{formatFlightPrice(price, currency)}</Text>
        </View>
      </View>

      <View style={styles.brandRow}>
        <View style={styles.logoWrap}>
          <AirlineLogo airline={airline} logoUrl={logoUrl} accentColor={accent} size={34} />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.airline}>{airline}</Text>
          <Text style={styles.dateText}>{formatDate(first?.departureTime, language)}</Text>
        </View>
      </View>

      <View style={styles.timelineRow}>
        <View style={styles.airportBlock}>
          <Text style={styles.timeText}>{formatTime(first?.departureTime, language)}</Text>
          <Text style={styles.codeText}>{slice.originCode || "--"}</Text>
          <Text style={styles.cityText}>{slice.originCity || slice.originCode || "--"}</Text>
        </View>

        <View style={styles.timelineMiddle}>
          <Text style={[styles.stopsText, { color: stopsCount === 0 ? theme.colors.success : theme.colors.warning }]}>
            {stopsLabel}
          </Text>
          <View style={styles.line} />
          <Text style={styles.durationText}>{formatDuration(slice.duration)}</Text>
          {connections.length > 0 ? (
            <Text style={styles.connectionText} numberOfLines={2}>
              {connections.join(", ")}
            </Text>
          ) : null}
        </View>

        <View style={[styles.airportBlock, styles.airportBlockRight]}>
          <Text style={styles.timeText}>{formatTime(last?.arrivalTime, language)}</Text>
          <Text style={styles.codeText}>{slice.destinationCode || "--"}</Text>
          <Text style={styles.cityText}>{slice.destinationCity || slice.destinationCode || "--"}</Text>
        </View>
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <View style={styles.baggageWrap}>
        <BaggageHighlights passengers={passengers} language={language} compact />
      </View>

      {onPress && actionLabel ? (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: accent }]} onPress={onPress}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}

      <FareCardNotes language={language} />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing(2) },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: theme.spacing(2), flexWrap: "wrap", flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  selectedWrap: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: "#BDD4FF",
  },
  selectedText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  priceWrap: { alignItems: "flex-end" },
  priceLabel: { fontSize: 10, fontWeight: "700", color: theme.colors.gray500, textTransform: "uppercase", letterSpacing: 0.6 },
  price: { marginTop: 2, fontSize: 20, fontWeight: "800", color: theme.colors.gray900 },
  brandRow: { marginTop: theme.spacing(3), flexDirection: "row", gap: theme.spacing(2.5), alignItems: "center" },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  brandCopy: { flex: 1 },
  airline: { fontSize: 15, fontWeight: "800", color: theme.colors.gray900 },
  dateText: { marginTop: 2, fontSize: 12, color: theme.colors.gray500 },
  timelineRow: { marginTop: theme.spacing(3), flexDirection: "row", alignItems: "flex-start", gap: theme.spacing(2) },
  airportBlock: { width: 84 },
  airportBlockRight: { alignItems: "flex-end" },
  timeText: { fontSize: 19, fontWeight: "800", color: theme.colors.gray900 },
  codeText: { marginTop: 2, fontSize: 12, fontWeight: "800", color: theme.colors.gray700 },
  cityText: { marginTop: 2, fontSize: 11, color: theme.colors.gray500 },
  timelineMiddle: { flex: 1, alignItems: "center", paddingTop: 4 },
  stopsText: { fontSize: 11, fontWeight: "800" },
  line: { marginTop: 8, width: "100%", height: 2, backgroundColor: theme.colors.gray200 },
  durationText: { marginTop: 8, fontSize: 11, fontWeight: "700", color: theme.colors.gray600 },
  connectionText: { marginTop: 6, textAlign: "center", fontSize: 11, lineHeight: 15, color: theme.colors.primaryInk },
  helperText: { marginTop: theme.spacing(3), fontSize: 12, lineHeight: 18, color: theme.colors.gray600 },
  baggageWrap: { marginTop: theme.spacing(2) },
  actionButton: {
    marginTop: theme.spacing(3),
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: { fontSize: 13, fontWeight: "800", color: theme.colors.white },
});
