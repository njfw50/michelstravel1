import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { theme } from "../theme/theme";
import { AppLanguage } from "../types/app";

type FareCardNotesProps = {
  language: AppLanguage;
};

type Copy = {
  personalTitle: string;
  personalIncluded: string;
  personalMeasure: string;
  fareNotice: string;
};

const COPY: Record<AppLanguage, Copy> = {
  pt: {
    personalTitle: "Mochila ou item pessoal",
    personalIncluded: "Sempre incluída",
    personalMeasure: "45 × 35 × 20 cm",
    fareNotice: "Todas as tarifas estão sujeitas a alterações de preço e disponibilidade até a emissão.",
  },
  en: {
    personalTitle: "Backpack or personal item",
    personalIncluded: "Always included",
    personalMeasure: "45 × 35 × 20 cm",
    fareNotice: "All fares remain subject to price changes and availability until ticket issuance.",
  },
  es: {
    personalTitle: "Mochila o artículo personal",
    personalIncluded: "Siempre incluida",
    personalMeasure: "45 × 35 × 20 cm",
    fareNotice: "Todas las tarifas están sujetas a cambios de precio y disponibilidad hasta la emisión.",
  },
};

function PersonalItemIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x="6.5" y="6" width="11" height="13" rx="3" stroke={theme.colors.gray600} strokeWidth="1.7" />
      <Path d="M9.2 8.2V6.8C9.2 5.81 10.01 5 11 5h2c.99 0 1.8.81 1.8 1.8v1.4" stroke={theme.colors.gray600} strokeWidth="1.7" strokeLinecap="round" />
      <Path d="M10 11.4h4" stroke={theme.colors.gray600} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function FareCardNotes({ language }: FareCardNotesProps) {
  const copy = COPY[language];

  return (
    <View style={styles.wrap}>
      <View style={styles.personalRow}>
        <View style={styles.personalIcon}>
          <PersonalItemIcon />
        </View>
        <View style={styles.personalCopy}>
          <Text style={styles.personalTitle}>{copy.personalTitle}</Text>
          <Text style={styles.personalMeta}>
            {copy.personalIncluded} · {copy.personalMeasure}
          </Text>
        </View>
      </View>
      <Text style={styles.notice}>{copy.fareNotice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    gap: theme.spacing(1.25),
  },
  personalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
  },
  personalIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  personalCopy: {
    flex: 1,
    gap: 1,
  },
  personalTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.gray700,
  },
  personalMeta: {
    fontSize: 9,
    lineHeight: 12,
    color: theme.colors.gray500,
    fontWeight: "600",
  },
  notice: {
    fontSize: 9,
    lineHeight: 12,
    color: theme.colors.gray500,
  },
});
