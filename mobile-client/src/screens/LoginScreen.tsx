import React, { useMemo, useState } from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSessionStore } from "../store/sessionStore";
import { theme } from "../theme/theme";

const logo = require("../assets/logo.png");

export function LoginScreen({ navigation }: { navigation: any }) {
  const language = useOnboardingStore((state) => state.language);
  const setMode = useOnboardingStore((state) => state.setMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setAccessMode = useSessionStore((state) => state.setAccessMode);
  const clearGuestReservation = useSessionStore((state) => state.clearGuestReservation);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Official access",
        subhead: "Access your account to manage trips, follow reservations, and keep your next booking within reach.",
        trust: "Protected access, clear service terms, and support when you need it.",
        email: "Email",
        emailPlaceholder: "you@email.com",
        password: "Password",
        enter: "Sign in",
        guest: "Continue as guest",
        legal: "By continuing, you agree to our Terms of Service and Privacy Policy.",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
        forgot: "Forgot password",
        create: "Create account",
      };
    }

    if (language === "es") {
      return {
        badge: "Acceso oficial",
        subhead: "Acceda a su cuenta para gestionar viajes, seguir reservas y dejar su próxima compra siempre a mano.",
        trust: "Acceso protegido, condiciones claras y apoyo humano cuando haga falta.",
        email: "Correo",
        emailPlaceholder: "usted@email.com",
        password: "Contraseña",
        enter: "Entrar",
        guest: "Continuar como invitado",
        legal: "Al continuar, usted acepta nuestros Términos de Servicio y Política de Privacidad.",
        terms: "Términos de Servicio",
        privacy: "Política de Privacidad",
        forgot: "Olvidé mi contraseña",
        create: "Crear cuenta",
      };
    }

    return {
      badge: "Acesso oficial",
      subhead: "Acesse sua conta para acompanhar viagens, gerenciar reservas e manter sua próxima compra sempre à mão.",
      trust: "Acesso protegido, condições claras e suporte humano quando necessário.",
      email: "E-mail",
      emailPlaceholder: "você@email.com",
      password: "Senha",
      enter: "Entrar",
      guest: "Continuar como convidado",
      legal: "Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.",
      terms: "Termos de Uso",
      privacy: "Política de Privacidade",
      forgot: "Esqueci a senha",
      create: "Criar conta",
    };
  }, [language]);

  const handleLogin = () => {
    setMode("regular");
    setAccessMode("account");
    clearGuestReservation();
    navigation.replace("RegularMain");
  };

  const handleGuest = () => {
    setMode("regular");
    setAccessMode("guest");
    navigation.replace("RegularMain");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.brandCard}>
          <View style={styles.logoFrame}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.badge}>{copy.badge}</Text>
            <Text style={styles.subhead}>{copy.subhead}</Text>
            <View style={styles.trustPill}>
              <Text style={styles.trustPillText}>{copy.trust}</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>{copy.email}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={copy.emailPlaceholder}
            placeholderTextColor={theme.colors.gray500}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            style={styles.input}
          />

          <Text style={[styles.label, styles.spacedLabel]}>{copy.password}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.gray500}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            style={styles.input}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.92}>
            <Text style={styles.primaryText}>{copy.enter}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGuest} activeOpacity={0.92}>
            <Text style={styles.secondaryText}>{copy.guest}</Text>
          </TouchableOpacity>

          <View style={styles.legalBlock}>
            <Text style={styles.legalText}>{copy.legal}</Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity accessibilityRole="link" onPress={() => navigation.navigate("Terms")}>
                <Text style={styles.legalLink}>{copy.terms}</Text>
              </TouchableOpacity>
              <Text style={styles.legalDivider}>•</Text>
              <TouchableOpacity accessibilityRole="link" onPress={() => navigation.navigate("Privacy")}>
                <Text style={styles.legalLink}>{copy.privacy}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footerLinks}>
          <View style={styles.footerLinkChip}>
            <Text style={styles.link}>{copy.forgot}</Text>
          </View>
          <View style={styles.footerLinkChip}>
            <Text style={styles.link}>{copy.create}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  ambientTop: {
    position: "absolute",
    top: -120,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(48,71,166,0.08)",
  },
  ambientBottom: {
    position: "absolute",
    bottom: -80,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(217,137,27,0.07)",
  },
  container: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 18,
  },
  brandCard: {
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    gap: 16,
    ...theme.shadow.card,
  },
  logoFrame: {
    width: 142,
    height: 142,
    borderRadius: 34,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  logo: {
    width: 126,
    height: 126,
    borderRadius: 28,
  },
  copyBlock: {
    gap: 10,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  subhead: {
    fontSize: 16,
    color: theme.colors.gray700,
    lineHeight: 24,
    fontWeight: "600",
  },
  trustPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  trustPillText: {
    color: theme.colors.gray700,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    gap: 6,
    ...theme.shadow.card,
  },
  label: {
    color: theme.colors.gray700,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  spacedLabel: { marginTop: 16 },
  input: {
    marginTop: 6,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: theme.colors.surfaceSoft,
    color: theme.colors.gray900,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    ...theme.shadow.floating,
  },
  primaryText: { color: theme.colors.white, fontSize: 16, fontWeight: "800" },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
  },
  secondaryText: { color: theme.colors.primaryDark, fontSize: 15, fontWeight: "800" },
  legalBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    gap: 10,
  },
  legalText: {
    color: theme.colors.gray500,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  legalLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  legalDivider: {
    color: theme.colors.gray500,
    fontSize: 12,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  footerLinkChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    minHeight: 44,
  },
  link: { color: theme.colors.gray600, fontSize: 13, fontWeight: "800" },
});
