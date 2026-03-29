import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMobileAppConfig } from "../services/appConfig";
import { refreshCustomerSession } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSessionStore } from "../store/sessionStore";
import { theme } from "../theme/theme";

const logo = require("../assets/logo.png");

export function SplashScreen({ navigation }: { navigation: any }) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLanguage = useOnboardingStore((state) => state.setLanguage);
  const setMode = useOnboardingStore((state) => state.setMode);
  const setAccessMode = useSessionStore((state) => state.setAccessMode);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    const timeout = setTimeout(async () => {
      try {
        const config = await getMobileAppConfig();
        if (!config.appEnabled) {
          navigation.replace("AppStatus", {
            environment: config.environment,
            language: "pt",
          });
          return;
        }
      } catch {
        // If config fails, do not hard-block the app start.
      }

      try {
        const auth = await refreshCustomerSession();
        const nextMode = auth.profile.experienceMode === "senior" ? "senior" : "regular";
        setAuthenticated(auth);
        setLanguage(auth.profile.preferredLanguage || "pt");
        setMode(nextMode);
        setAccessMode("account");
        navigation.replace(nextMode === "senior" ? "SeniorMain" : "RegularMain");
        return;
      } catch {
        clearAuth();
      }

      navigation.replace("LanguageSelect");
    }, 5200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [clearAuth, navigation, setAccessMode, setAuthenticated, setLanguage, setMode]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Preparando sua experiência Michels Travel</Text>
        <Text style={styles.countdownText}>Entrando em {secondsLeft}s</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Copyright © Michels Travel</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  loadingWrap: {
    position: "absolute",
    bottom: 92,
    alignItems: "center",
    gap: 6,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.gray500,
    letterSpacing: 0.3,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.gray700,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.gray500,
    letterSpacing: 0.4,
  },
});
