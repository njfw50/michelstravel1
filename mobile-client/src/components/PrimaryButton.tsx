import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { theme } from "../theme/theme";

type PrimaryButtonProps = TouchableOpacityProps & {
  label: string;
  loading?: boolean;
};

export function PrimaryButton({ label, loading = false, disabled, style, ...props }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity style={[styles.button, isDisabled && styles.buttonDisabled, style]} disabled={isDisabled} activeOpacity={0.92} {...props}>
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary, "#4063D7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.label}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    overflow: "hidden",
    ...theme.shadow.floating,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  gradient: {
    minHeight: 54,
    borderRadius: 18,
    paddingVertical: theme.spacing(3.25),
    paddingHorizontal: theme.spacing(4),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
