import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registerCustomerAccount } from "../services/auth";
import { clearBiometricEnrollment, saveBiometricEnrollment } from "../services/biometricStorage";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSessionStore } from "../store/sessionStore";
import { theme } from "../theme/theme";

const logo = require("../assets/logo.png");

export function RegisterScreen({ navigation }: { navigation: any }) {
  const language = useOnboardingStore((state) => state.language);
  const setMode = useOnboardingStore((state) => state.setMode);
  const setLanguage = useOnboardingStore((state) => state.setLanguage);
  const setAccessMode = useSessionStore((state) => state.setAccessMode);
  const clearGuestReservation = useSessionStore((state) => state.clearGuestReservation);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "New account",
        title: "Create your Michels Travel access",
        subtitle: "Your account keeps reservations, saved passengers, and your next bookings organized in one place.",
        firstName: "First name",
        lastName: "Last name",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm password",
        submit: "Create account",
        back: "Back to sign in",
        invalidFields: "Fill in the required fields before continuing.",
        shortPassword: "Use a password with at least 6 characters.",
        mismatch: "Passwords do not match.",
        genericError: "We could not create your account right now.",
      };
    }

    if (language === "es") {
      return {
        badge: "Nueva cuenta",
        title: "Cree su acceso Michels Travel",
        subtitle: "Su cuenta organiza reservas, pasajeros guardados y próximas compras en un solo lugar.",
        firstName: "Nombre",
        lastName: "Apellido",
        email: "Correo",
        password: "Contraseña",
        confirmPassword: "Confirmar contraseña",
        submit: "Crear cuenta",
        back: "Volver a entrar",
        invalidFields: "Complete los campos obligatorios antes de continuar.",
        shortPassword: "Use una contraseña con al menos 6 caracteres.",
        mismatch: "Las contraseñas no coinciden.",
        genericError: "No fue posible crear su cuenta ahora.",
      };
    }

    return {
      badge: "Nova conta",
      title: "Crie seu acesso Michels Travel",
      subtitle: "Sua conta organiza reservas, passageiros salvos e próximas compras em um só lugar.",
      firstName: "Nome",
      lastName: "Sobrenome",
      email: "E-mail",
      password: "Senha",
      confirmPassword: "Confirmar senha",
      submit: "Criar conta",
      back: "Voltar para entrar",
      invalidFields: "Preencha os campos obrigatórios antes de continuar.",
      shortPassword: "Use uma senha com pelo menos 6 caracteres.",
      mismatch: "As senhas não conferem.",
      genericError: "Não foi possível criar sua conta agora.",
    };
  }, [language]);

  const handleRegister = async () => {
    if (!firstName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert(copy.submit, copy.invalidFields);
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert(copy.submit, copy.shortPassword);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(copy.submit, copy.mismatch);
      return;
    }

    setSubmitting(true);

    try {
      const auth = await registerCustomerAccount({
        firstName,
        lastName,
        email,
        password,
        appVariant: "standard",
      });

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
      } else {
        await clearBiometricEnrollment();
      }

      navigation.replace(nextMode === "senior" ? "SeniorMain" : "RegularMain");
    } catch (error) {
      Alert.alert(copy.submit, error instanceof Error ? error.message : copy.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.logoFrame}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.badge}>{copy.badge}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>{copy.firstName}</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder={copy.firstName}
            placeholderTextColor={theme.colors.gray500}
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={[styles.label, styles.spacedLabel]}>{copy.lastName}</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder={copy.lastName}
            placeholderTextColor={theme.colors.gray500}
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={[styles.label, styles.spacedLabel]}>{copy.email}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            placeholderTextColor={theme.colors.gray500}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={[styles.label, styles.spacedLabel]}>{copy.password}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.gray500}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={[styles.label, styles.spacedLabel]}>{copy.confirmPassword}</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.gray500}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} activeOpacity={0.92} disabled={submitting}>
            {submitting ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.primaryText}>{copy.submit}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} activeOpacity={0.92}>
            <Text style={styles.secondaryText}>{copy.back}</Text>
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
  headerCard: {
    borderRadius: theme.radius.xxl,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    gap: 10,
    ...theme.shadow.elevated,
    overflow: "hidden",
  },
  badge: {
    alignSelf: "flex-start",
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
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.gray900,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.gray600,
    lineHeight: 21,
    fontWeight: "500",
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
  modeCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(4),
    gap: 8,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  modeSubtitle: {
    fontSize: 13,
    color: theme.colors.gray600,
    lineHeight: 19,
  },
  modeGrid: {
    gap: theme.spacing(2),
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.gray700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  langGrid: {
    flexDirection: "row",
    gap: theme.spacing(2),
  },
  langChip: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingVertical: 11,
    alignItems: "center",
  },
  langText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.gray700,
  },
});
