import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
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

  const progress = Math.max(0, Math.min(1, (5 - secondsLeft) / 5));

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />
      <View style={styles.bgBlob3} />
      <View style={styles.logoWrap}>
        <View style={styles.logoOuter}>
          <View style={styles.logoInner}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>
        </View>
        <Text style={styles.brandName}>Michels Travel</Text>
        <Text style={styles.brandTagline}>Agency · Sua viagem começa aqui</Text>
      </View>
      <View style={styles.loadingWrap}>
        <View style={styles.loadingBar}>
          <View style={[styles.loadingFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={styles.loadingText}>Preparando sua experiência</Text>
        {secondsLeft > 0 && (
          <Text style={styles.countdownText}>Entrando em {secondsLeft}s</Text>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Copyright © Michels Travel</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.gray950,
  },
  bgBlob1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(44,68,176,0.18)",
  },
  bgBlob2: {
    position: "absolute",
    bottom: -100,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(212,130,14,0.12)",
  },
  bgBlob3: {
    position: "absolute",
    top: "40%",
    right: "10%",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(44,68,176,0.08)",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.elevated,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 22,
  },
  brandName: {
    marginTop: 20,
    color: theme.colors.white,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  brandTagline: {
    marginTop: 6,
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  loadingWrap: {
    marginTop: 48,
    alignItems: "center",
    gap: 12,
  },
  loadingBar: {
    width: 180,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  loadingFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.3,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 0.4,
  },
});
