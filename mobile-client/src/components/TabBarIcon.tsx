import React from "react";
import { StyleSheet, View } from "react-native";

import { theme } from "../theme/theme";

type TabIconVariant = "search" | "catalog" | "trips" | "help" | "senior";

type TabBarIconProps = {
  variant: TabIconVariant;
  color: string;
  focused: boolean;
  accentBackground: string;
};

function SearchGlyph({ color }: { color: string }) {
  return (
    <View style={styles.searchWrap}>
      <View style={[styles.searchCircle, { borderColor: color }]} />
      <View style={[styles.searchHandle, { backgroundColor: color }]} />
    </View>
  );
}

function CatalogGlyph({ color }: { color: string }) {
  return (
    <View style={styles.gridWrap}>
      {[0, 1, 2, 3].map((cell) => (
        <View key={cell} style={[styles.gridCell, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

function TripsGlyph({ color }: { color: string }) {
  return (
    <View style={styles.briefcaseWrap}>
      <View style={[styles.briefcaseHandle, { borderColor: color }]} />
      <View style={[styles.briefcaseBody, { borderColor: color }]}>
        <View style={[styles.briefcaseLatch, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function HelpGlyph({ color }: { color: string }) {
  return (
    <View style={styles.helpWrap}>
      <View style={[styles.helpBubble, { borderColor: color }]}>
        <View style={[styles.helpDot, { backgroundColor: color }]} />
        <View style={[styles.helpStem, { backgroundColor: color }]} />
      </View>
      <View style={[styles.helpTail, { borderTopColor: color }]} />
    </View>
  );
}

function SeniorGlyph({ color }: { color: string }) {
  return (
    <View style={styles.seniorWrap}>
      <View style={[styles.seniorCore, { backgroundColor: color }]} />
      <View style={[styles.seniorBeamVertical, { backgroundColor: color }]} />
      <View style={[styles.seniorBeamHorizontal, { backgroundColor: color }]} />
      <View style={[styles.seniorBeamDiagonalOne, { backgroundColor: color }]} />
      <View style={[styles.seniorBeamDiagonalTwo, { backgroundColor: color }]} />
    </View>
  );
}

export function TabBarIcon({ variant, color, focused, accentBackground }: TabBarIconProps) {
  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: focused ? accentBackground : theme.colors.white,
          borderColor: focused ? accentBackground : "transparent",
        },
      ]}
    >
      {variant === "search" && <SearchGlyph color={color} />}
      {variant === "catalog" && <CatalogGlyph color={color} />}
      {variant === "trips" && <TripsGlyph color={color} />}
      {variant === "help" && <HelpGlyph color={color} />}
      {variant === "senior" && <SeniorGlyph color={color} />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  searchWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchCircle: {
    width: 11,
    height: 11,
    borderWidth: 1.8,
    borderRadius: 999,
    position: "absolute",
    top: 1,
    left: 1,
  },
  searchHandle: {
    width: 7,
    height: 2,
    borderRadius: 999,
    position: "absolute",
    right: 0,
    bottom: 2,
    transform: [{ rotate: "45deg" }],
  },
  gridWrap: {
    width: 16,
    height: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  gridCell: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  briefcaseWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
  },
  briefcaseHandle: {
    width: 8,
    height: 4,
    borderTopWidth: 1.6,
    borderLeftWidth: 1.6,
    borderRightWidth: 1.6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  briefcaseBody: {
    width: 16,
    height: 11,
    borderWidth: 1.6,
    borderRadius: 4,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  briefcaseLatch: {
    width: 5,
    height: 1.8,
    borderRadius: 999,
  },
  helpWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  helpBubble: {
    width: 14,
    height: 14,
    borderWidth: 1.6,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  helpDot: {
    width: 2.6,
    height: 2.6,
    borderRadius: 999,
    marginBottom: 2,
  },
  helpStem: {
    width: 2.4,
    height: 4.6,
    borderRadius: 999,
  },
  helpTail: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderRightWidth: 3,
    borderRightColor: "transparent",
    position: "absolute",
    right: 2,
    bottom: 1,
    transform: [{ rotate: "28deg" }],
  },
  seniorWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  seniorCore: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  seniorBeamVertical: {
    position: "absolute",
    width: 2,
    height: 16,
    borderRadius: 999,
  },
  seniorBeamHorizontal: {
    position: "absolute",
    width: 16,
    height: 2,
    borderRadius: 999,
  },
  seniorBeamDiagonalOne: {
    position: "absolute",
    width: 2,
    height: 16,
    borderRadius: 999,
    transform: [{ rotate: "45deg" }],
  },
  seniorBeamDiagonalTwo: {
    position: "absolute",
    width: 2,
    height: 16,
    borderRadius: 999,
    transform: [{ rotate: "-45deg" }],
  },
});
