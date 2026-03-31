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
  card: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  cardTopAccent: {
    height: 3,
    backgroundColor: theme.colors.primary,
  },
  cardBody: {
    padding: theme.spacing(4),
    gap: theme.spacing(3),
  },
  sliceWrap: {
    gap: theme.spacing(2),
  },
  sliceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  sliceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.primarySoft,
  },
  sliceBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sliceDivider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outlineSoft,
  },
  flightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  airlineLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outlineSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  flightDetails: {
    flex: 1,
    gap: 4,
  },
  airlineName: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.gray600,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
  },
  timeBlock: {
    alignItems: "center",
    minWidth: 52,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.gray900,
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.gray500,
    fontWeight: "600",
    marginTop: 2,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.gray700,
    letterSpacing: 0.3,
  },
  routeCenter: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.gray500,
  },
  routeLine: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  routeDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.gray300,
  },
  routeLineBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: theme.colors.gray200,
  },
  stopsText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.gray500,
  },
  connectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: 2,
  },
  connectionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.warningSoft,
    borderWidth: 1,
    borderColor: "rgba(232,156,0,0.15)",
  },
  connectionText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.warning,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: theme.spacing(3),
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineSoft,
    gap: theme.spacing(2),
  },
  priceBlock: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.gray900,
    letterSpacing: -0.5,
  },
  priceSub: {
    fontSize: 11,
    color: theme.colors.gray500,
    fontWeight: "600",
  },
  ctaButton: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.glow,
  },
  ctaText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  baggageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
  },
  fareNotesWrap: {
    marginTop: theme.spacing(1),
  },
});
