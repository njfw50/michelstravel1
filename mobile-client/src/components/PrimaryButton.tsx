import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { theme } from "../theme/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "senior" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  icon?: React.ReactNode;
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
  icon,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyle = size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : styles.sizeMd;
  const labelSizeStyle = size === "sm" ? styles.labelSm : size === "lg" ? styles.labelLg : styles.labelMd;

  const inner = loading ? (
    <ActivityIndicator
      size="small"
      color={
        variant === "primary" || variant === "senior" || variant === "danger"
          ? theme.colors.white
          : theme.colors.primary
      }
    />
  ) : (
    <View style={styles.innerRow}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={[styles.labelBase, labelSizeStyle, styles[`labelVariant_${variant}`]]}>{label}</Text>
    </View>
  );

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.84}
        style={[styles.base, fullWidth && styles.fullWidth, isDisabled && styles.disabled, styles.glowBlue, style]}
      >
        <LinearGradient
          colors={[theme.colors.primaryDark, theme.colors.primary, "#4A6AE0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, sizeStyle]}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "senior") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.84}
        style={[styles.base, fullWidth && styles.fullWidth, isDisabled && styles.disabled, styles.glowSenior, style]}
      >
        <LinearGradient
          colors={[theme.colors.seniorDark, theme.colors.senior, "#E8A030"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, sizeStyle]}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.84}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        variant === "secondary" && styles.variantSecondary,
        variant === "outline" && styles.variantOutline,
        variant === "ghost" && styles.variantGhost,
        variant === "danger" && styles.variantDanger,
        sizeStyle,
        style,
      ]}
    >
      {inner}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowBlue: {
    ...theme.shadow.glow,
  },
  glowSenior: {
    ...theme.shadow.seniorGlow,
  },

  // Non-gradient variants
  variantSecondary: {
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  variantOutline: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  variantGhost: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  variantDanger: {
    backgroundColor: theme.colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  // Labels
  labelBase: {
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  labelVariant_primary: { color: theme.colors.white },
  labelVariant_secondary: { color: theme.colors.primaryDark },
  labelVariant_outline: { color: theme.colors.primary },
  labelVariant_ghost: { color: theme.colors.primary },
  labelVariant_senior: { color: theme.colors.white },
  labelVariant_danger: { color: theme.colors.white },

  // Sizes
  sizeSm: { paddingVertical: 10, paddingHorizontal: theme.spacing(4) },
  sizeMd: { paddingVertical: 15, paddingHorizontal: theme.spacing(5) },
  sizeLg: { paddingVertical: 18, paddingHorizontal: theme.spacing(6) },

  labelSm: { fontSize: 13 },
  labelMd: { fontSize: 15 },
  labelLg: { fontSize: 17 },
});
