import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { theme } from "../theme/theme";

type CardVariant = "default" | "soft" | "outlined" | "elevated" | "ghost";

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
};

export function Card({ children, style, variant = "default", padding = "md" }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === "default" && styles.variantDefault,
        variant === "soft" && styles.variantSoft,
        variant === "outlined" && styles.variantOutlined,
        variant === "elevated" && styles.variantElevated,
        variant === "ghost" && styles.variantGhost,
        padding === "none" && styles.paddingNone,
        padding === "sm" && styles.paddingSm,
        padding === "md" && styles.paddingMd,
        padding === "lg" && styles.paddingLg,
        style,
      ]}
    >
      <View style={styles.topHighlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 1,
  },
  // Variants
  variantDefault: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    ...theme.shadow.card,
  },
  variantSoft: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outlineSoft,
  },
  variantOutlined: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
  },
  variantElevated: {
    backgroundColor: theme.colors.surface,
    ...theme.shadow.elevated,
  },
  variantGhost: {
    backgroundColor: "transparent",
  },
  // Padding
  paddingNone: { padding: 0 },
  paddingSm: { padding: theme.spacing(3) },
  paddingMd: { padding: theme.spacing(4) },
  paddingLg: { padding: theme.spacing(5) },
});
