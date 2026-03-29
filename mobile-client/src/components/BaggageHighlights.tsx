import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { theme } from "../theme/theme";
import { AppLanguage } from "../types/app";
import { FlightPassengerInfo } from "../types/flights";

type SummaryTone = "positive" | "info" | "warning" | "neutral";

type BaggageHighlightsProps = {
  passengers?: FlightPassengerInfo[];
  language: AppLanguage;
  compact?: boolean;
  showNote?: boolean;
};

type BaggageCopy = {
  checkedTitle: string;
  carryTitle: string;
  checkedMeasure: string;
  carryMeasure: string;
  included: (quantity: number, type: "checked" | "carry") => string;
  none: (type: "checked" | "carry") => string;
  varies: (type: "checked" | "carry") => string;
  compactIncluded: (quantity: number) => string;
  compactNone: string;
  compactVaries: string;
  perTraveler: string;
  nextStep: string;
  lightFare: string;
  unavailable: string;
};

const COPY: Record<AppLanguage, BaggageCopy> = {
  pt: {
    checkedTitle: "Bagagem despachada",
    carryTitle: "Bagagem de mão",
    checkedMeasure: "Até 23 kg por peça",
    carryMeasure: "55 × 35 × 25 cm",
    included: (quantity, type) =>
      type === "checked"
        ? quantity === 1
          ? "1 mala incluída"
          : `${quantity} malas incluídas`
        : quantity === 1
          ? "1 bagagem incluída"
          : `${quantity} bagagens incluídas`,
    none: (type) => (type === "checked" ? "Sem mala incluída" : "Sem bagagem incluída"),
    varies: (type) => (type === "checked" ? "Varia por passageiro" : "Varia por passageiro"),
    compactIncluded: (quantity) => `${quantity} ${quantity === 1 ? "peça" : "peças"}`,
    compactNone: "Não inclusa",
    compactVaries: "Varia",
    perTraveler: "por passageiro",
    nextStep: "Na próxima etapa mostramos a bagagem completa por passageiro e por trecho.",
    lightFare: "Tarifa leve: confirme a bagagem antes de pagar.",
    unavailable: "Veja a bagagem antes de concluir.",
  },
  en: {
    checkedTitle: "Checked baggage",
    carryTitle: "Carry-on baggage",
    checkedMeasure: "Up to 23 kg per piece",
    carryMeasure: "55 × 35 × 25 cm",
    included: (quantity, type) =>
      type === "checked"
        ? quantity === 1
          ? "1 bag included"
          : `${quantity} bags included`
        : quantity === 1
          ? "1 carry-on included"
          : `${quantity} carry-ons included`,
    none: (type) => (type === "checked" ? "No bag included" : "No carry-on included"),
    varies: () => "Varies by traveler",
    compactIncluded: (quantity) => `${quantity} ${quantity === 1 ? "piece" : "pieces"}`,
    compactNone: "Not included",
    compactVaries: "Varies",
    perTraveler: "per traveler",
    nextStep: "On the next screen we show baggage details by traveler and by segment.",
    lightFare: "Light fare: confirm baggage before paying.",
    unavailable: "Check baggage before you continue.",
  },
  es: {
    checkedTitle: "Equipaje facturado",
    carryTitle: "Equipaje de mano",
    checkedMeasure: "Hasta 23 kg por pieza",
    carryMeasure: "55 × 35 × 25 cm",
    included: (quantity, type) =>
      type === "checked"
        ? quantity === 1
          ? "1 maleta incluida"
          : `${quantity} maletas incluidas`
        : quantity === 1
          ? "1 equipaje incluido"
          : `${quantity} equipajes incluidos`,
    none: (type) => (type === "checked" ? "Sin maleta incluida" : "Sin equipaje incluido"),
    varies: () => "Varía por pasajero",
    compactIncluded: (quantity) => `${quantity} ${quantity === 1 ? "pieza" : "piezas"}`,
    compactNone: "No incluida",
    compactVaries: "Varía",
    perTraveler: "por pasajero",
    nextStep: "En la siguiente pantalla mostramos el equipaje completo por pasajero y por tramo.",
    lightFare: "Tarifa ligera: confirme el equipaje antes de pagar.",
    unavailable: "Revise el equipaje antes de continuar.",
  },
};

function getRelevantPassengers(passengers: FlightPassengerInfo[]) {
  const nonInfants = passengers.filter((passenger) => passenger.passengerType !== "infant_without_seat");
  return nonInfants.length > 0 ? nonInfants : passengers;
}

function sumBaggage(passenger: FlightPassengerInfo, type: "checked" | "carry_on") {
  return (passenger.baggages || [])
    .filter((baggage) => baggage.type === type)
    .reduce((total, baggage) => total + (baggage.quantity || 0), 0);
}

function getTonePalette(tone: SummaryTone) {
  if (tone === "positive") {
    return {
      borderColor: "#B7E4C7",
      backgroundColor: "#ECFDF3",
      badgeBackground: "#D1FAE5",
      titleColor: "#047857",
      valueColor: "#065F46",
    };
  }

  if (tone === "info") {
    return {
      borderColor: "#BFD7FF",
      backgroundColor: "#EFF6FF",
      badgeBackground: "#DBEAFE",
      titleColor: "#1D4ED8",
      valueColor: "#1E3A8A",
    };
  }

  if (tone === "warning") {
    return {
      borderColor: "#F6D79B",
      backgroundColor: "#FFF8EB",
      badgeBackground: "#FDE7B0",
      titleColor: "#B45309",
      valueColor: "#92400E",
    };
  }

  return {
    borderColor: theme.colors.gray200,
    backgroundColor: "#F8FAFC",
    badgeBackground: "#EEF2F7",
    titleColor: theme.colors.gray600,
    valueColor: theme.colors.gray700,
  };
}

function CheckedBagIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="7" width="14" height="12" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M9 7V5.8C9 4.81 9.81 4 10.8 4h2.4C14.19 4 15 4.81 15 5.8V7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9 11.5h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function CarryOnIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x="6.5" y="8" width="11" height="10" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M9.5 8V6.8C9.5 5.81 10.31 5 11.3 5h1.4C13.69 5 14.5 5.81 14.5 6.8V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9.5 18.2V19M14.5 18.2V19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function buildSummary(passengers: FlightPassengerInfo[], type: "checked" | "carry_on", copy: BaggageCopy) {
  if (passengers.length === 0) {
    return {
      tone: "neutral" as SummaryTone,
      shortValue: "--",
      compactValue: copy.unavailable,
      fullValue: copy.unavailable,
      detail: undefined as string | undefined,
      hasIncludedBaggage: false,
    };
  }

  const quantities = passengers.map((passenger) => sumBaggage(passenger, type));
  const uniqueQuantities = Array.from(new Set(quantities));
  const sameAcrossPassengers = uniqueQuantities.length === 1;
  const commonQuantity = sameAcrossPassengers ? uniqueQuantities[0] || 0 : 0;
  const hasIncludedBaggage = quantities.some((quantity) => quantity > 0);

  if (sameAcrossPassengers && commonQuantity > 0) {
    return {
      tone: (type === "checked" ? "positive" : "info") as SummaryTone,
      shortValue: String(commonQuantity),
      compactValue: copy.compactIncluded(commonQuantity),
      fullValue: copy.included(commonQuantity, type === "checked" ? "checked" : "carry"),
      detail: passengers.length > 1 ? copy.perTraveler : undefined,
      hasIncludedBaggage: true,
    };
  }

  if (!hasIncludedBaggage) {
    return {
      tone: (type === "checked" ? "warning" : "neutral") as SummaryTone,
      shortValue: "0",
      compactValue: copy.compactNone,
      fullValue: copy.none(type === "checked" ? "checked" : "carry"),
      detail: undefined,
      hasIncludedBaggage: false,
    };
  }

  return {
    tone: "warning" as SummaryTone,
    shortValue: copy.varies(type === "checked" ? "checked" : "carry"),
    compactValue: copy.compactVaries,
    fullValue: copy.varies(type === "checked" ? "checked" : "carry"),
    detail: undefined,
    hasIncludedBaggage: true,
  };
}

export function BaggageHighlights({
  passengers,
  language,
  compact = false,
  showNote,
}: BaggageHighlightsProps) {
  const copy = COPY[language];
  const relevantPassengers = useMemo(() => getRelevantPassengers(passengers || []), [passengers]);
  const checkedSummary = useMemo(() => buildSummary(relevantPassengers, "checked", copy), [copy, relevantPassengers]);
  const carrySummary = useMemo(() => buildSummary(relevantPassengers, "carry_on", copy), [copy, relevantPassengers]);

  const shouldShowLightFareNote =
    !checkedSummary.hasIncludedBaggage && !carrySummary.hasIncludedBaggage && relevantPassengers.length > 0;

  const noteVisible = showNote ?? !compact;

  const summaries = [
    {
      key: "checked",
      title: copy.checkedTitle,
      measure: copy.checkedMeasure,
      icon: CheckedBagIcon,
      ...checkedSummary,
    },
    {
      key: "carry",
      title: copy.carryTitle,
      measure: copy.carryMeasure,
      icon: CarryOnIcon,
      ...carrySummary,
    },
  ];

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.row, compact && styles.rowCompact]}>
        {summaries.map((summary) => {
          const palette = getTonePalette(summary.tone);
          const Icon = summary.icon;
          return (
            <View
              key={summary.key}
              style={[
                styles.pill,
                compact ? styles.pillCompact : styles.pillFull,
                {
                  borderColor: palette.borderColor,
                  backgroundColor: palette.backgroundColor,
                },
              ]}
            >
              <View style={styles.titleRow}>
                <View style={[styles.iconWrap, { backgroundColor: palette.badgeBackground }]}>
                  <Icon color={palette.titleColor} />
                </View>
                <Text style={[styles.pillTitle, { color: palette.titleColor }]} numberOfLines={2}>
                  {summary.title}
                </Text>
              </View>
              <View style={styles.valueWrap}>
                <Text
                  style={[compact ? styles.valueCompact : styles.valueFull, { color: palette.valueColor }]}
                  numberOfLines={compact ? 1 : 2}
                >
                  {compact ? summary.compactValue : summary.fullValue}
                </Text>
                <Text style={styles.measureText}>{summary.measure}</Text>
                {!compact && summary.detail ? <Text style={styles.detailText}>{summary.detail}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      {noteVisible ? (
        <View style={styles.noteRow}>
          <View style={styles.noteDot}>
            <Text style={styles.noteDotText}>i</Text>
          </View>
          <Text style={styles.noteText}>{shouldShowLightFareNote ? copy.lightFare : copy.nextStep}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing(1.5),
  },
  containerCompact: {
    gap: theme.spacing(1),
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
  },
  rowCompact: {
    gap: theme.spacing(1),
  },
  pill: {
    borderWidth: 1,
    borderRadius: 14,
    gap: theme.spacing(1),
  },
  pillCompact: {
    minWidth: "48%",
    flex: 1,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  pillFull: {
    minWidth: "48%",
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pillTitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
    flex: 1,
  },
  valueWrap: {
    gap: 2,
  },
  valueCompact: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
  },
  valueFull: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  detailText: {
    marginTop: 1,
    fontSize: 9,
    color: theme.colors.gray500,
    fontWeight: "600",
  },
  measureText: {
    fontSize: 9,
    lineHeight: 11,
    color: theme.colors.gray500,
    fontWeight: "600",
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing(1.25),
  },
  noteDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  noteDotText: {
    color: theme.colors.gray600,
    fontSize: 9,
    fontWeight: "800",
  },
  noteText: {
    flex: 1,
    color: theme.colors.gray600,
    fontSize: 10,
    lineHeight: 13,
  },
});
