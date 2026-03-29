import React, { useMemo } from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { theme } from "../theme/theme";
import { JourneyMode } from "../types/app";
import { useOnboardingStore } from "../store/onboardingStore";

const logo = require("../assets/logo.png");

export function OnboardingScreen({ navigation }: { navigation: any }) {
  const language = useOnboardingStore((state) => state.language);
  const setMode = useOnboardingStore((state) => state.setMode);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        eyebrow: "Michels Travel mobile",
        title: "Choose the travel experience that fits this trip best.",
        subtitle: "Continue with the regular journey for faster decisions or the senior journey for calmer guidance and more comfort.",
        proof: "Special offers, close support, and a booking path designed to make every step feel simpler.",
        regularTitle: "Regular booking",
        regularSubtitle: "Fast search, clear comparison, and an agile booking journey.",
        regularBullets: ["Offers for your route in one view", "Direct comparison for quicker decisions", "Trips, support, and inspiration in one place"],
        regularCta: "Enter regular",
        seniorTitle: "Senior support",
        seniorSubtitle: "Calmer rhythm, more comfortable reading, and visible human support.",
        seniorBullets: ["One calm decision on each screen", "More comfort to read and compare", "Flight suggestions focused on comfort, convenience, and baggage"],
        seniorCta: "Enter senior",
        footer: "Michels Travel by your side from search to boarding.",
      };
    }

    if (language === "es") {
      return {
        eyebrow: "Michels Travel mobile",
        title: "Elija la experiencia de viaje ideal para este momento.",
        subtitle: "Siga por la experiencia regular para decidir más rápido o por la experiencia senior para avanzar con más calma y orientación.",
        proof: "Ofertas especiales, acompañamiento cercano y una compra pensada para que cada paso sea más simple.",
        regularTitle: "Reserva regular",
        regularSubtitle: "Búsqueda ágil, comparación clara y una compra más directa.",
        regularBullets: ["Ofertas para su ruta en una sola vista", "Comparación directa para decidir más rápido", "Viajes, ayuda e inspiración en un solo lugar"],
        regularCta: "Entrar regular",
        seniorTitle: "Atención senior",
        seniorSubtitle: "Ritmo más tranquilo, lectura más cómoda y apoyo humano visible.",
        seniorBullets: ["Una decisión tranquila por pantalla", "Más claridad para comparar sin prisa", "Sugerencias enfocadas en confort, conexiones y equipaje"],
        seniorCta: "Entrar senior",
        footer: "Michels Travel a su lado desde la búsqueda hasta el embarque.",
      };
    }

    return {
      eyebrow: "Michels Travel mobile",
      title: "Escolha a experiência de viagem ideal para este momento.",
      subtitle: "Siga pela experiência regular para decidir mais rápido ou pela experiência sênior para viajar com mais calma e orientação.",
      proof: "Ofertas especiais, atendimento próximo e uma jornada pensada para deixar sua compra mais simples do início ao embarque.",
      regularTitle: "Reserva regular",
      regularSubtitle: "Busca ágil, comparação clara e uma compra mais direta.",
      regularBullets: ["Ofertas para sua rota em uma só tela", "Comparação direta para decidir com segurança", "Viagens, ajuda e inspiração em um só lugar"],
      regularCta: "Entrar regular",
      seniorTitle: "Atendimento sênior",
      seniorSubtitle: "Ritmo mais tranquilo, leitura mais confortável e apoio humano visível.",
      seniorBullets: ["Uma decisão tranquila por tela", "Mais clareza para comparar sem pressa", "Sugestões focadas em conforto, conexões e bagagem"],
      seniorCta: "Entrar sênior",
      footer: "Michels Travel ao seu lado da busca ao embarque.",
    };
  }, [language]);

  const openMode = (mode: JourneyMode) => {
    setMode(mode);
    navigation.replace(mode === "senior" ? "SeniorMain" : "RegularMain");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowBlue} />
          <View style={styles.heroGlowGold} />

          <View style={styles.logoFrameOuter}>
            <View style={styles.logoFrameInner}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
          </View>

          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>

          <View style={styles.proofCard}>
            <Text style={styles.proofText}>{copy.proof}</Text>
          </View>
        </View>

        <View style={styles.modeGrid}>
          <LinearGradient colors={[theme.colors.navy, theme.colors.primaryDark, "#4062D9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modeCard}>
            <Text style={styles.modeOverline}>Regular</Text>
            <Text style={styles.modeTitleLight}>{copy.regularTitle}</Text>
            <Text style={styles.modeSubtitleLight}>{copy.regularSubtitle}</Text>
            <View style={styles.modeBullets}>
              {copy.regularBullets.map((item) => (
                <Text key={item} style={styles.modeBulletLight}>- {item}</Text>
              ))}
            </View>
            <TouchableOpacity style={styles.modeButtonLight} onPress={() => openMode("regular")}>
              <Text style={styles.modeButtonLightText}>{copy.regularCta}</Text>
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient colors={["#7B4510", theme.colors.seniorDark, theme.colors.senior, "#EFB24A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modeCard}>
            <Text style={styles.modeOverline}>Senior</Text>
            <Text style={styles.modeTitleLight}>{copy.seniorTitle}</Text>
            <Text style={styles.modeSubtitleLight}>{copy.seniorSubtitle}</Text>
            <View style={styles.modeBullets}>
              {copy.seniorBullets.map((item) => (
                <Text key={item} style={styles.modeBulletLight}>- {item}</Text>
              ))}
            </View>
            <TouchableOpacity style={styles.modeButtonWarm} onPress={() => openMode("senior")}>
              <Text style={styles.modeButtonWarmText}>{copy.seniorCta}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.footerText}>{copy.footer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(6),
    gap: theme.spacing(3),
  },
  heroCard: {
    overflow: "hidden",
    borderRadius: 34,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingHorizontal: theme.spacing(5),
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
    alignItems: "center",
    ...theme.shadow.floating,
  },
  heroGlowBlue: {
    position: "absolute",
    top: -36,
    right: -18,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(48,71,166,0.10)",
  },
  heroGlowGold: {
    position: "absolute",
    bottom: -48,
    left: -16,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(217,137,27,0.12)",
  },
  logoFrameOuter: {
    width: 132,
    height: 132,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFrameInner: {
    width: 112,
    height: 112,
    borderRadius: 30,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  logo: { width: 92, height: 92, borderRadius: 24 },
  eyebrow: {
    marginTop: theme.spacing(4),
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    marginTop: theme.spacing(4),
    textAlign: "center",
    color: theme.colors.gray900,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  subtitle: {
    marginTop: theme.spacing(3),
    textAlign: "center",
    color: theme.colors.gray600,
    fontSize: 14,
    lineHeight: 22,
  },
  proofCard: {
    marginTop: theme.spacing(4),
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
  },
  proofText: {
    color: theme.colors.gray700,
    textAlign: "center",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
  },
  modeGrid: { gap: theme.spacing(3) },
  modeCard: {
    borderRadius: 32,
    paddingHorizontal: theme.spacing(5),
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    ...theme.shadow.floating,
  },
  modeOverline: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modeTitleLight: {
    marginTop: theme.spacing(4),
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  modeSubtitleLight: {
    marginTop: theme.spacing(2),
    color: "rgba(255,255,255,0.82)",
    fontSize: 13.5,
    lineHeight: 21,
  },
  modeBullets: { marginTop: theme.spacing(4), gap: theme.spacing(2) },
  modeBulletLight: { color: theme.colors.white, fontSize: 12.5, lineHeight: 19, fontWeight: "600" },
  modeButtonLight: {
    marginTop: theme.spacing(4),
    borderRadius: 18,
    backgroundColor: theme.colors.white,
    paddingVertical: 15,
    alignItems: "center",
  },
  modeButtonLightText: { color: theme.colors.primaryDark, fontSize: 15, fontWeight: "800" },
  modeButtonWarm: {
    marginTop: theme.spacing(4),
    borderRadius: 18,
    backgroundColor: "rgba(255,250,241,0.96)",
    paddingVertical: 15,
    alignItems: "center",
  },
  modeButtonWarmText: { color: theme.colors.seniorDark, fontSize: 15, fontWeight: "800" },
  footerText: {
    color: theme.colors.gray500,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: theme.spacing(4),
  },
});
