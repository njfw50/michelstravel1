import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

const logo = require("../assets/logo.png");

type BrandHeaderProps = {
  badge?: string;
  title?: string;
  subtitle?: string;
};

export function BrandHeader({ badge, title, subtitle }: BrandHeaderProps) {
  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      {(badge || title || subtitle) ? (
        <View style={styles.copy}>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 14 },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: theme.colors.white,
  },
  copy: { flex: 1, gap: 4 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#EDF3FF",
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  title: { fontSize: 19, fontWeight: "800", color: theme.colors.gray900 },
  subtitle: { fontSize: 13, color: theme.colors.gray500, lineHeight: 19 },
});
