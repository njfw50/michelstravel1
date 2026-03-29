import React, { useMemo, useState } from "react";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "../store/onboardingStore";
import { theme } from "../theme/theme";
import { AppLanguage } from "../types/app";

const logo = require("../assets/logo.png");

const languages: { value: AppLanguage; label: string; nativeLabel: string }[] = [
  { value: "pt", label: "Portuguese", nativeLabel: "Português" },
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "es", label: "Spanish", nativeLabel: "Español" },
];

export function LanguageSelectScreen({ navigation }: { navigation: any }) {
  const storedLanguage = useOnboardingStore((state) => state.language);
  const setLanguage = useOnboardingStore((state) => state.setLanguage);
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(storedLanguage);

  const copy = useMemo(() => {
    if (selectedLanguage === "en") {
      return {
        badge: "Welcome",
        title: "Choose your language to begin your travel experience.",
        subtitle: "From the next screen on, every step follows the language you choose here.",
        button: "Continue",
      };
    }

    if (selectedLanguage === "es") {
      return {
        badge: "Bienvenido",
        title: "Elija su idioma para comenzar su experiencia de viaje.",
        subtitle: "Desde la siguiente pantalla, cada paso seguirá el idioma elegido aquí.",
        button: "Continuar",
      };
    }

    return {
      badge: "Bem-vindo",
      title: "Escolha seu idioma para iniciar sua experiência de viagem.",
      subtitle: "Da próxima tela em diante, cada etapa seguirá o idioma escolhido aqui.",
      button: "Continuar",
    };
  }, [selectedLanguage]);

  const handleContinue = () => {
    setLanguage(selectedLanguage);
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.logoFrame}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.badge}>{copy.badge}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.list}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.value}
              style={[styles.languageCard, selectedLanguage === language.value && styles.languageCardActive]}
              onPress={() => setSelectedLanguage(language.value)}
            >
              <View>
                <Text style={[styles.languageName, selectedLanguage === language.value && styles.languageNameActive]}>
                  {language.nativeLabel}
                </Text>
                <Text style={styles.languageMeta}>{language.label}</Text>
              </View>
              <View style={[styles.radio, selectedLanguage === language.value && styles.radioActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{copy.button}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  ambientTop: {
    position: "absolute",
    top: -130,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(48,71,166,0.08)",
  },
  ambientBottom: {
    position: "absolute",
    bottom: -100,
    left: -50,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(217,137,27,0.06)",
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(6),
    justifyContent: "space-between",
    gap: theme.spacing(4),
  },
  heroCard: {
    borderRadius: 34,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingHorizontal: theme.spacing(5),
    paddingVertical: theme.spacing(6),
    alignItems: "center",
    ...theme.shadow.floating,
  },
  logoFrame: {
    width: 116,
    height: 116,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 88, height: 88, borderRadius: 24 },
  badge: {
    marginTop: theme.spacing(4),
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
  list: { gap: theme.spacing(3) },
  languageCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.shadow.card,
  },
  languageCardActive: {
    borderColor: "#BFD1FF",
    backgroundColor: theme.colors.primaryMist,
  },
  languageName: { color: theme.colors.gray900, fontSize: 18, fontWeight: "800" },
  languageNameActive: { color: theme.colors.primaryDark },
  languageMeta: { marginTop: 4, color: theme.colors.gray500, fontSize: 13 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.gray300,
    backgroundColor: theme.colors.white,
  },
  radioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  button: {
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 17,
    alignItems: "center",
    ...theme.shadow.floating,
  },
  buttonText: { color: theme.colors.white, fontSize: 16, fontWeight: "800" },
});
