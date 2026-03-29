import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "../store/onboardingStore";
import { theme } from "../theme/theme";
import { FlightOffer, FlightSlice } from "../types/flights";
import { formatFlightPrice } from "../utils/flightPresentation";
import { AirlineLogo } from "./AirlineLogo";
import { BaggageHighlights } from "./BaggageHighlights";
import { Card } from "./Card";
import { FareCardNotes } from "./FareCardNotes";

type FlightOfferCardProps = {
  offer: FlightOffer;
  onPress: () => void;
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

  return new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit" }).format(date);
}

function getSlices(offer: FlightOffer): FlightSlice[] {
  if (offer.slices && offer.slices.length > 0) {
    return offer.slices;
  }

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

export function FlightOfferCard({ offer, onPress }: FlightOfferCardProps) {
  const language = useOnboardingStore((state) => state.language);
  const slices = getSlices(offer);
  const copy = language === "en"
    ? {
        fallbackFlight: "Michels Travel offer",
        totalPrice: "Total",
        outbound: "Outbound",
        returnLabel: "Return",
        direct: "Direct",
        stop: "stop",
        stops: "stops",
        connection: "Connection in",
        select: "Choose",
        connectionFallback: "Connection",
      }
    : language === "es"
      ? {
          fallbackFlight: "Oferta Michels Travel",
          totalPrice: "Total",
          outbound: "Ida",
          returnLabel: "Regreso",
          direct: "Directo",
          stop: "escala",
          stops: "escalas",
          connection: "Conexión en",
          select: "Elegir",
          connectionFallback: "Conexión",
        }
      : {
          fallbackFlight: "Oferta Michels Travel",
          totalPrice: "Preço total",
          outbound: "Ida",
          returnLabel: "Volta",
          direct: "Direto",
          stop: "parada",
          stops: "paradas",
          connection: "Conexão em",
          select: "Selecionar",
          connectionFallback: "Conexão",
        };

  return (
    <Card>
      <View style={styles.headerRow}>
        <View style={styles.airlineRow}>
          <View style={styles.logoWrap}>
            <AirlineLogo airline={offer.airline} logoUrl={offer.logoUrl} accentColor={theme.colors.primary} size={30} />
          </View>
          <View style={styles.airlineCopy}>
            <Text style={styles.airline}>{offer.airline}</Text>
            <Text style={styles.flightMeta}>{offer.flightNumber || copy.fallbackFlight}</Text>
          </View>
        </View>

        <View style={styles.priceBlock}>
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
              <View style={styles.sliceHeader}>
                <Text style={styles.sliceLabel}>{index === 0 ? copy.outbound : copy.returnLabel}</Text>
                <Text style={styles.sliceDate}>{formatDate(first?.departureTime, language)}</Text>
              </View>

              <View style={styles.timelineRow}>
                <View style={styles.airportBlock}>
                  <Text style={styles.timeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {formatTime(first?.departureTime, language)}
                  </Text>
                  <Text style={styles.codeText}>{slice.originCode || offer.originCode || "--"}</Text>
                  <Text style={styles.cityText}>{slice.originCity || offer.originCity || slice.originCode || "--"}</Text>
                </View>

                <View style={styles.timelineMiddle}>
                  <Text style={[styles.stopsText, stopsCount === 0 ? styles.stopsDirect : styles.stopsConnection]}>
                    {stopsCount === 0 ? copy.direct : `${stopsCount} ${stopsCount === 1 ? copy.stop : copy.stops}`}
                  </Text>
                  <View style={styles.line} />
                  {connections.length > 0 ? (
                    <Text style={styles.connectionText}>{copy.connection} {connections.join(", ")}</Text>
                  ) : null}
                </View>

                <View style={[styles.airportBlock, styles.airportBlockRight]}>
                  <Text style={styles.timeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {formatTime(last?.arrivalTime, language)}
                  </Text>
                  <Text style={styles.codeText}>{slice.destinationCode || offer.destinationCode || "--"}</Text>
                  <Text style={styles.cityText}>{slice.destinationCity || offer.destinationCity || slice.destinationCode || "--"}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.baggageWrap}>
        <BaggageHighlights passengers={offer.passengers} language={language} compact />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.infoBlock} />
        <TouchableOpacity style={styles.selectButton} onPress={onPress}>
          <Text style={styles.selectText}>{copy.select}</Text>
        </TouchableOpacity>
      </View>

      <FareCardNotes language={language} />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing(2) },
  airlineRow: { flexDirection: "row", flex: 1, gap: theme.spacing(2.5), alignItems: "center" },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  airlineCopy: { flex: 1, gap: 2 },
  airline: { fontSize: 15, fontWeight: "800", color: theme.colors.gray900 },
  flightMeta: { fontSize: 11, color: theme.colors.gray500 },
  priceBlock: { alignItems: "flex-end" },
  priceLabel: { fontSize: 10, color: theme.colors.gray500, textTransform: "uppercase", letterSpacing: 0.6 },
  price: { marginTop: 2, fontSize: 20, fontWeight: "800", color: theme.colors.gray900 },
  sliceList: { marginTop: theme.spacing(3), gap: theme.spacing(2) },
  sliceCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(2.25),
    gap: theme.spacing(1.5),
  },
  sliceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sliceLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  sliceDate: { color: theme.colors.gray500, fontSize: 11, fontWeight: "600" },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing(1.5) },
  airportBlock: { width: 90 },
  airportBlockRight: { alignItems: "flex-end" },
  timeText: { fontSize: 18, lineHeight: 22, fontWeight: "800", color: theme.colors.gray900 },
  codeText: { marginTop: 1, fontSize: 12, fontWeight: "800", color: theme.colors.gray700 },
  cityText: { marginTop: 1, fontSize: 11, color: theme.colors.gray500 },
  timelineMiddle: { flex: 1, alignItems: "center", paddingTop: 4 },
  stopsText: { fontSize: 11, fontWeight: "800" },
  stopsDirect: { color: theme.colors.success },
  stopsConnection: { color: theme.colors.warning },
  line: { marginTop: 8, height: 2, width: "100%", backgroundColor: theme.colors.gray200 },
  connectionText: { marginTop: 6, textAlign: "center", fontSize: 11, lineHeight: 14, fontWeight: "700", color: theme.colors.primary },
  baggageWrap: { marginTop: theme.spacing(2) },
  footerRow: { marginTop: theme.spacing(2), flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: theme.spacing(1.5) },
  infoBlock: { flex: 1 },
  selectButton: {
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing(3.5),
    paddingVertical: 10,
  },
  selectText: { color: theme.colors.white, fontSize: 13, fontWeight: "800" },
});
