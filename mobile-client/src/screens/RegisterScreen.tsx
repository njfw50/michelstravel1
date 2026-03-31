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
    backgroundColor: theme.colors.white,
  },
  ambientTop: {
    position: "absolute",
    top: -120,
    left: -20,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(48,71,166,0.08)",
  },
  ambientBottom: {
    position: "absolute",
    bottom: -90,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(217,137,27,0.07)",
  },
  container: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 18,
  },
  heroCard: {
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    gap: 12,
    ...theme.shadow.card,
  },
  logoFrame: {
    width: 118,
    height: 118,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 102,
    height: 102,
    borderRadius: 24,
  },
  badge: {
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
  title: {
    textAlign: "center",
    color: theme.colors.gray900,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "800",
  },
  subtitle: {
    textAlign: "center",
    color: theme.colors.gray600,
    fontSize: 14,
    lineHeight: 22,
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
  spacedLabel: {
    marginTop: 14,
  },
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
  primaryText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
  },
  secondaryText: {
    color: theme.colors.primaryDark,
    fontSize: 15,
    fontWeight: "800",
  },
});
