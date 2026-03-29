import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SvgUri } from "react-native-svg";
import { theme } from "../theme/theme";

type AirlineLogoProps = {
  airline: string;
  logoUrl?: string | null;
  accentColor: string;
  size?: number;
};

function isSvgUrl(value?: string | null) {
  if (!value) return false;
  return value.toLowerCase().includes(".svg");
}

export function AirlineLogo({ airline, logoUrl, accentColor, size = 32 }: AirlineLogoProps) {
  const fallback = airline.slice(0, 1).toUpperCase();

  return (
    <View style={styles.wrap}>
      {logoUrl ? (
        isSvgUrl(logoUrl) ? (
          <SvgUri uri={logoUrl} width={size} height={size} />
        ) : (
          <Image source={{ uri: logoUrl }} style={{ width: size, height: size }} resizeMode="contain" />
        )
      ) : (
        <Text style={[styles.fallback, { color: accentColor }]}>{fallback}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    fontSize: 18,
    fontWeight: "800",
  },
});
