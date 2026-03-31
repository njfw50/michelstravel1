import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { theme } from "../theme/theme";

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.card, theme.shadow.card, style]}>
      <View style={styles.topGlow} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing(4),
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
});
