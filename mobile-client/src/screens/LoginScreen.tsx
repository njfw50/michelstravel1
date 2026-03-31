import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { signBiometricChallenge } from "../services/biometricAuth";
import { clearBiometricEnrollment, getBiometricEnrollment, saveBiometricEnrollment } from "../services/biometricStorage";
import { loginCustomerAccount, requestBiometricChallenge, verifyBiometricLogin } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSessionStore } from "../store/sessionStore";
import { theme } from "../theme/theme";

const logo = require("../assets/logo.png");

export function LoginScreen({ navigation }: { navigation: any }) {
  const language = useOnboardingStore((state) => state.language);
  const setMode = useOnboardingStore((state) => state.setMode);
  const setLanguage = useOnboardingStore((state) => state.setLanguage);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const setAccessMode = useSessionStore((state) => state.setAccessMode);
  const clearGuestReservation = useSessionStore((state) => state.clearGuestReservation);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const clearAuth = useAuthStore((state) => state.clearAuth);

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
        forgotMessage: "Password recovery is not connected in the app yet. Use the website or support for now.",
        invalidFields: "Enter a valid email and password to continue.",
        authError: "We could not sign you in right now.",
        biometric: "Sign in with biometrics",
        biometricPromptTitle: "Confirm your identity",
        biometricPromptSubtitle: "Use Face ID or fingerprint to continue securely",
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
        forgotMessage: "La recuperación de contraseña aún no está conectada en la app. Use el sitio web o soporte por ahora.",
        invalidFields: "Ingrese un correo y contraseña válidos para continuar.",
        authError: "No fue posible iniciar su sesión ahora.",
        biometric: "Entrar con biometría",
        biometricPromptTitle: "Confirme su identidad",
        biometricPromptSubtitle: "Use Face ID o huella para continuar con seguridad",
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
      forgotMessage: "A recuperação de senha ainda não está conectada no app. Use o site ou o suporte por enquanto.",
      invalidFields: "Informe um e-mail e uma senha válidos para continuar.",
      authError: "Não foi possível entrar na sua conta agora.",
      biometric: "Entrar com biometria",
      biometricPromptTitle: "Confirme sua identidade",
      biometricPromptSubtitle: "Use Face ID ou digital para continuar com segurança",
    };
  }, [language]);

  useEffect(() => {
    let mounted = true;

    getBiometricEnrollment()
      .then((enrollment) => {
        if (!mounted || !enrollment?.enabled) {
          return;
        }

        setBiometricReady(true);
        setBiometricLabel(enrollment.firstName || enrollment.email);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setBiometricReady(false);
        setBiometricLabel(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const applyAuthenticatedState = async (auth: Awaited<ReturnType<typeof loginCustomerAccount>>) => {
    const nextMode = auth.profile.experienceMode === "senior" ? "senior" : "regular";

    setAuthenticated(auth);
    setLanguage(auth.profile.preferredLanguage || language);
    setMode(nextMode);
    setAccessMode("account");
    clearGuestReservation();

    if (auth.profile.biometricEnabled && auth.device.biometricReady && auth.device.biometricKeyAlias && auth.user.email) {
      await saveBiometricEnrollment({
        userId: auth.user.id,
        deviceId: auth.device.id,
        email: auth.user.email,
        firstName: auth.user.firstName,
        keyAlias: auth.device.biometricKeyAlias,
        enabled: true,
      });
      setBiometricReady(true);
      setBiometricLabel(auth.user.firstName || auth.user.email);
    } else {
      await clearBiometricEnrollment();
      setBiometricReady(false);
      setBiometricLabel(null);
    }

    navigation.replace(nextMode === "senior" ? "SeniorMain" : "RegularMain");
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      Alert.alert(copy.enter, copy.invalidFields);
      return;
    }

    setSubmitting(true);

    try {
      const auth = await loginCustomerAccount({
        email: normalizedEmail,
        password: password.trim(),
        appVariant: "standard",
      });
      await applyAuthenticatedState(auth);
    } catch (error) {
      Alert.alert(copy.enter, error instanceof Error ? error.message : copy.authError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setSubmitting(true);

    try {
      const enrollment = await getBiometricEnrollment();
      if (!enrollment?.enabled) {
        throw new Error(copy.authError);
      }

      const challenge = await requestBiometricChallenge(enrollment.deviceId);
      const signature = await signBiometricChallenge(
        enrollment.keyAlias,
        challenge.challenge,
        copy.biometricPromptTitle,
        copy.biometricPromptSubtitle,
      );

      const auth = await verifyBiometricLogin({
        challengeId: challenge.challengeId,
        challenge: challenge.challenge,
        deviceId: enrollment.deviceId,
        signature,
      });

      await applyAuthenticatedState(auth);
    } catch (error) {
      Alert.alert(copy.biometric, error instanceof Error ? error.message : copy.authError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(copy.forgot, copy.forgotMessage);
  };

  const handleCreateAccount = () => {
    navigation.navigate("Register");
  };

  const handleGuest = () => {
    clearAuth();
    setMode("regular");
    setAccessMode("guest");
    clearGuestReservation();
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

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.92} disabled={submitting}>
            {submitting ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.primaryText}>{copy.enter}</Text>}
          </TouchableOpacity>
          {biometricReady ? (
            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin} activeOpacity={0.92} disabled={submitting}>
              <Text style={styles.biometricText}>{biometricLabel ? `${copy.biometric} · ${biometricLabel}` : copy.biometric}</Text>
            </TouchableOpacity>
          ) : null}

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
          <TouchableOpacity style={styles.footerLinkChip} activeOpacity={0.92} onPress={handleForgotPassword}>
            <Text style={styles.link}>{copy.forgot}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLinkChip} activeOpacity={0.92} onPress={handleCreateAccount}>
            <Text style={styles.link}>{copy.create}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.gray50,
  },
  ambientTop: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryGlow,
  },
  ambientBottom: {
    position: "absolute",
    bottom: -80,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: theme.colors.seniorGlow,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 16,
  },
  brandCard: {
    borderRadius: theme.radius.xxl,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    gap: 18,
    ...theme.shadow.elevated,
    overflow: "hidden",
  },
  brandCardHero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
  },
  logoFrame: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    ...theme.shadow.xs,
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 24,
  },
  copyBlock: {
    gap: 10,
    alignItems: "center",
  },
  badge: {
    alignSelf: "center",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subhead: {
    fontSize: 15,
    color: theme.colors.gray600,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  trustPill: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.successSoft,
    borderWidth: 1,
    borderColor: "rgba(12,158,82,0.15)",
  },
  trustPillText: {
    color: theme.colors.success,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xxl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    gap: 4,
    ...theme.shadow.card,
  },
  label: {
    color: theme.colors.gray600,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 4,
  },
  spacedLabel: { marginTop: 14 },
  input: {
    marginTop: 6,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surfaceSoft,
    color: theme.colors.gray900,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    fontSize: 15,
    fontWeight: "500",
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 15,
    alignItems: "center",
    ...theme.shadow.glow,
  },
  primaryText: { color: theme.colors.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  biometricButton: {
    marginTop: 10,
    borderRadius: theme.radius.lg,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMist,
  },
  biometricText: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  secondaryButton: {
    marginTop: 10,
    borderRadius: theme.radius.lg,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
  },
  secondaryText: { color: theme.colors.primaryDark, fontSize: 15, fontWeight: "700" },
  legalBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray150,
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
    color: theme.colors.gray400,
    fontSize: 12,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  footerLinkChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    minHeight: 46,
    ...theme.shadow.xs,
  },
  link: { color: theme.colors.gray600, fontSize: 13, fontWeight: "700" },
});
