import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme/theme";

export function AppStatusScreen({ route }: { route: any }) {
  const language = route.params?.language || "pt";
  const environment = route.params?.environment === "production" ? "production" : "test";

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        title: "App temporarily unavailable",
        subtitle: `The mobile app is currently disabled in ${environment} mode. Please use the website or contact support until this channel is reopened.`,
        footer: "Michels Travel · Official support available on the website",
      };
    }

    if (language === "es") {
      return {
        title: "App temporalmente no disponible",
        subtitle: `La app móvil está desactivada en modo ${environment === "production" ? "producción" : "prueba"}. Utilice el sitio web o contacte al soporte hasta que este canal sea reactivado.`,
        footer: "Michels Travel · Soporte oficial disponible en el sitio web",
      };
    }

    return {
      title: "Aplicativo temporariamente indisponível",
      subtitle: `O app mobile está desativado no modo ${environment === "production" ? "produção" : "teste"}. Use o site ou fale com o suporte até este canal ser reaberto.`,
      footer: "Michels Travel · Suporte oficial disponível no site",
    };
  }, [environment, language]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.badge}>{environment === "production" ? "PRODUCTION" : "TEST"}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <Text style={styles.footer}>{copy.footer}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
    paddingHorizontal: theme.spacing(4),
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(5),
    gap: theme.spacing(2),
    ...theme.shadow.card,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceSoft,
    color: theme.colors.gray600,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.gray600,
  },
  footer: {
    marginTop: theme.spacing(4),
    textAlign: "center",
    fontSize: 12,
    color: theme.colors.gray500,
  },
});
