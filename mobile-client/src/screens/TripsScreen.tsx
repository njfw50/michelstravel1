import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { lookupBooking } from "../services/bookings";
import { buildBiometricKeyAlias, ensureBiometricSupport, recreateBiometricKey, removeBiometricKey } from "../services/biometricAuth";
import { clearBiometricEnrollment, saveBiometricEnrollment } from "../services/biometricStorage";
import { registerBiometricKey, revokeBiometricKey } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSessionStore } from "../store/sessionStore";
import { theme } from "../theme/theme";

export function TripsScreen() {
  const language = useOnboardingStore((state) => state.language);
  const mode = useOnboardingStore((state) => state.mode);
  const accessMode = useSessionStore((state) => state.accessMode);
  const rememberedGuestReservation = useSessionStore((state) => state.guestReservation);
  const rememberGuestReservation = useSessionStore((state) => state.rememberGuestReservation);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const device = useAuthStore((state) => state.device);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const updateDevice = useAuthStore((state) => state.updateDevice);
  const [referenceCode, setReferenceCode] = useState(rememberedGuestReservation?.referenceCode ?? "");
  const [contactEmail, setContactEmail] = useState(rememberedGuestReservation?.contactEmail ?? "");
  const [booking, setBooking] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: mode === "senior" ? "Senior trips" : "My trips",
        title: accessMode === "guest" ? "Official access to your reservation" : "My trips",
        subtitle: accessMode === "guest"
          ? "Use the same booking code and email from your purchase to open your reservation securely."
          : "Your reservations will stay organized here with the same commercial source used on the website.",
        referenceLabel: "Reservation code",
        emailLabel: "Booking email",
        deviceLabel: "Device",
        cta: "Open reservation",
        secureNote: "For your security, we confirm the booking code together with the contact email.",
        empty: "No reservation loaded yet.",
        notFound: "Reservation not found. Check the code and email used at booking.",
        route: "Route",
        status: "Status",
        total: "Total",
        securityValue: "Protected access",
        securityLabel: "Code and contact email required",
        sourceValue: "Same source",
        sourceLabel: "Reservation data comes from the main Michels Travel system",
        statusPending: "Pending",
        statusConfirmed: "Confirmed",
        accountTitle: "Protected account access",
        accountSubtitle: "Your app access is protected by password, secure session cookie, and biometric access when enabled on this device.",
        biometricTitle: "Biometric access",
        biometricEnabled: "Face ID or fingerprint can sign you in securely on this device.",
        biometricDisabled: "Enable biometrics on this device to avoid typing your password every time.",
        biometricUnavailable: "Strong biometrics are not available on this device.",
        biometricError: "We could not update biometric access right now.",
      };
    }

    if (language === "es") {
      return {
        badge: mode === "senior" ? "Viajes senior" : "Mis viajes",
        title: accessMode === "guest" ? "Acceso oficial a su reserva" : "Mis viajes",
        subtitle: accessMode === "guest"
          ? "Use el mismo código y correo de la compra para abrir su reserva con seguridad."
          : "Sus reservas quedan organizadas aquí con la misma fuente comercial usada en el sitio.",
        referenceLabel: "Código de reserva",
        emailLabel: "Correo de la reserva",
        deviceLabel: "Dispositivo",
        cta: "Abrir reserva",
        secureNote: "Por su seguridad, confirmamos el código de la reserva junto con el correo de contacto.",
        empty: "Todavía no hay una reserva cargada.",
        notFound: "Reserva no encontrada. Verifique el código y el correo usados en la compra.",
        route: "Ruta",
        status: "Estado",
        total: "Total",
        securityValue: "Acceso protegido",
        securityLabel: "Se requiere código y correo de contacto",
        sourceValue: "Misma fuente",
        sourceLabel: "Los datos de la reserva vienen del sistema principal de Michels Travel",
        statusPending: "Pendiente",
        statusConfirmed: "Confirmada",
        accountTitle: "Acceso protegido de la cuenta",
        accountSubtitle: "Su acceso en la app queda protegido por contraseña, cookie segura de sesión y biometría cuando esté activada en este dispositivo.",
        biometricTitle: "Acceso biométrico",
        biometricEnabled: "Face ID o huella pueden iniciar su sesión con seguridad en este dispositivo.",
        biometricDisabled: "Active la biometría en este dispositivo para no escribir la contraseña cada vez.",
        biometricUnavailable: "La biometría fuerte no está disponible en este dispositivo.",
        biometricError: "No fue posible actualizar el acceso biométrico ahora.",
      };
    }

    return {
      badge: mode === "senior" ? "Viagens sênior" : "Minhas viagens",
      title: accessMode === "guest" ? "Acesso oficial à sua reserva" : "Minhas viagens",
      subtitle: accessMode === "guest"
        ? "Use o mesmo código e e-mail da compra para abrir sua reserva com segurança."
        : "Suas reservas ficam organizadas aqui com a mesma fonte comercial usada no site.",
      referenceLabel: "Código da reserva",
      emailLabel: "E-mail da reserva",
      deviceLabel: "Dispositivo",
      cta: "Abrir reserva",
      secureNote: "Para sua segurança, confirmamos o código da reserva junto com o e-mail de contato.",
      empty: "Nenhuma reserva carregada ainda.",
      notFound: "Reserva não encontrada. Verifique o código e o e-mail usados na compra.",
      route: "Rota",
      status: "Status",
      total: "Total",
      securityValue: "Acesso protegido",
      securityLabel: "Código e e-mail de contato são obrigatórios",
      sourceValue: "Mesma fonte",
      sourceLabel: "Os dados da reserva vêm do sistema principal da Michels Travel",
      statusPending: "Pendente",
      statusConfirmed: "Confirmada",
      accountTitle: "Acesso protegido da conta",
      accountSubtitle: "Seu acesso no app fica protegido por senha, cookie seguro de sessão e biometria quando ativada neste aparelho.",
      biometricTitle: "Acesso por biometria",
      biometricEnabled: "Face ID ou digital podem entrar com segurança neste aparelho.",
      biometricDisabled: "Ative a biometria neste aparelho para não digitar a senha sempre.",
      biometricUnavailable: "A biometria forte não está disponível neste aparelho.",
      biometricError: "Não foi possível atualizar o acesso por biometria agora.",
    };
  }, [accessMode, language, mode]);

  const extractRoute = (value: any) => {
    const firstSlice = value?.flightData?.slices?.[0];
    if (firstSlice?.originCity && firstSlice?.destinationCity) {
      return `${firstSlice.originCity} -> ${firstSlice.destinationCity}`;
    }

    const origin = value?.flightData?.originCity || value?.flightData?.originCode || value?.flightData?.origin || "--";
    const destination = value?.flightData?.destinationCity || value?.flightData?.destinationCode || value?.flightData?.destination || "--";
    return `${origin} -> ${destination}`;
  };

  const handleGuestLookup = async () => {
    const normalizedReference = referenceCode.trim().toUpperCase();
    const normalizedEmail = contactEmail.trim().toLowerCase();

    if (!normalizedReference || !normalizedEmail) {
      setError(copy.notFound);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await lookupBooking(normalizedReference, normalizedEmail);
      setBooking(response);
      rememberGuestReservation({
        referenceCode: normalizedReference,
        contactEmail: normalizedEmail,
        bookingId: response?.id,
      });
    } catch (lookupError: any) {
      setBooking(null);
      setError(lookupError?.response?.data?.error || copy.notFound);
    } finally {
      setLoading(false);
    }
  };

  const bookingStatus = String(booking?.status || "pending").toLowerCase();
  const statusLabel = bookingStatus === "confirmed" ? copy.statusConfirmed : copy.statusPending;

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!user?.email || !profile || !device?.id) {
      Alert.alert(copy.biometricTitle, copy.biometricError);
      return;
    }

    setBiometricBusy(true);

    try {
      if (enabled) {
        await ensureBiometricSupport();
        const keyAlias = device.biometricKeyAlias || buildBiometricKeyAlias(device.id);
        const publicKey = await recreateBiometricKey(keyAlias);
        const response = await registerBiometricKey({ publicKey, keyAlias, keyType: "rsa2048" });
        updateProfile(response.profile);
        updateDevice(response.device);
        await saveBiometricEnrollment({
          userId: user.id,
          deviceId: response.device.id,
          email: user.email,
          firstName: user.firstName,
          keyAlias,
          enabled: true,
        });
        return;
      }

      const keyAlias = device.biometricKeyAlias || buildBiometricKeyAlias(device.id);
      const response = await revokeBiometricKey();
      updateProfile(response.profile);
      updateDevice(response.device);
      await removeBiometricKey(keyAlias);
      await clearBiometricEnrollment();
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : copy.biometricError;
      Alert.alert(copy.biometricTitle, message || copy.biometricUnavailable);
    } finally {
      setBiometricBusy(false);
    }
  };

  return (
    <AppShell mode={mode} badge={copy.badge} title={copy.title} subtitle={copy.subtitle} contentStyle={styles.container} reserveBottomNav>
      <View style={styles.proofRow}>
        <View style={styles.proofCard}>
          <Text style={styles.proofValue}>{copy.securityValue}</Text>
          <Text style={styles.proofLabel}>{copy.securityLabel}</Text>
        </View>
        <View style={styles.proofCard}>
          <Text style={styles.proofValue}>{copy.sourceValue}</Text>
          <Text style={styles.proofLabel}>{copy.sourceLabel}</Text>
        </View>
      </View>

      {accessMode === "guest" ? (
        <>
          <Card>
            <Text style={styles.cardTitle}>{copy.title}</Text>
            <Text style={styles.cardSubtitle}>{copy.secureNote}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{copy.referenceLabel}</Text>
              <TextInput
                value={referenceCode}
                onChangeText={setReferenceCode}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="MT-ABC123"
                placeholderTextColor={theme.colors.gray500}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{copy.emailLabel}</Text>
              <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="voce@email.com"
                placeholderTextColor={theme.colors.gray500}
                style={styles.input}
              />
            </View>

            <PrimaryButton label={copy.cta} onPress={handleGuestLookup} disabled={loading} style={styles.cta} />
            {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.primary} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Card>

          <Card>
            {booking ? (
              <>
                <View style={styles.resultHeader}>
                  <View style={styles.resultHeaderCopy}>
                    <Text style={styles.referenceTitle}>{booking.referenceCode || referenceCode}</Text>
                    <Text style={styles.resultSubtitle}>{copy.subtitle}</Text>
                  </View>
                  <View style={[styles.statusPill, bookingStatus === "confirmed" ? styles.statusPillConfirmed : styles.statusPillPending]}>
                    <Text style={[styles.statusPillText, bookingStatus === "confirmed" ? styles.statusPillTextConfirmed : styles.statusPillTextPending]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <View style={styles.metaCard}>
                    <Text style={styles.metaLabel}>{copy.route}</Text>
                    <Text style={styles.metaValue}>{extractRoute(booking)}</Text>
                  </View>
                  <View style={styles.metaCard}>
                    <Text style={styles.metaLabel}>{copy.status}</Text>
                    <Text style={styles.metaValue}>{statusLabel}</Text>
                  </View>
                  <View style={styles.metaCardWide}>
                    <Text style={styles.metaLabel}>{copy.total}</Text>
                    <Text style={styles.totalValue}>{booking.currency || "USD"} {booking.totalPrice}</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>{copy.empty}</Text>
                <Text style={styles.resultSubtitle}>{copy.subtitle}</Text>
              </>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card>
            <Text style={styles.cardTitle}>{copy.accountTitle}</Text>
            <Text style={styles.resultSubtitle}>{copy.accountSubtitle}</Text>

            <View style={styles.metaGrid}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{copy.emailLabel}</Text>
                <Text style={styles.metaValue}>{user?.email || "--"}</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{copy.deviceLabel}</Text>
                <Text style={styles.metaValue}>{device?.id ? device.id.slice(0, 8).toUpperCase() : "--"}</Text>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>{copy.biometricTitle}</Text>
                <Text style={styles.toggleSubtitle}>{profile?.biometricEnabled ? copy.biometricEnabled : copy.biometricDisabled}</Text>
              </View>
              {biometricBusy ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <Switch
                  value={Boolean(profile?.biometricEnabled)}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: theme.colors.gray300, true: theme.colors.primary }}
                  thumbColor={theme.colors.white}
                />
              )}
            </View>
          </Card>
        </>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing(3) },
  proofRow: {
    flexDirection: "row",
    gap: theme.spacing(2),
  },
  proofCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    ...theme.shadow.subtle,
  },
  proofValue: { fontSize: 15, fontWeight: "800", color: theme.colors.primaryInk },
  proofLabel: { marginTop: 6, fontSize: 12, lineHeight: 18, color: theme.colors.gray600 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: theme.colors.gray900 },
  cardSubtitle: { marginTop: 10, fontSize: 14, color: theme.colors.gray600, lineHeight: 21 },
  fieldGroup: { marginTop: theme.spacing(4) },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 22,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(4),
    backgroundColor: theme.colors.surfaceMuted,
    fontSize: 16,
    color: theme.colors.gray900,
  },
  cta: { marginTop: theme.spacing(4) },
  loader: { marginTop: theme.spacing(3) },
  error: { marginTop: theme.spacing(3), color: theme.colors.danger, fontSize: 13, fontWeight: "600" },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing(3),
  },
  resultHeaderCopy: { flex: 1 },
  referenceTitle: { fontSize: 22, fontWeight: "800", color: theme.colors.gray900 },
  resultSubtitle: { marginTop: 8, fontSize: 14, color: theme.colors.gray600, lineHeight: 21 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  statusPillPending: {
    backgroundColor: "#FFF6E6",
    borderColor: "#F7D797",
  },
  statusPillConfirmed: {
    backgroundColor: "#ECFDF3",
    borderColor: "#B8E8CB",
  },
  statusPillText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  statusPillTextPending: { color: theme.colors.warning },
  statusPillTextConfirmed: { color: theme.colors.success },
  metaGrid: {
    marginTop: theme.spacing(4),
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(2),
  },
  metaCard: {
    minWidth: "47%",
    flexGrow: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  metaCardWide: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaValue: { marginTop: 8, fontSize: 15, fontWeight: "700", color: theme.colors.gray900, lineHeight: 22 },
  totalValue: { marginTop: 8, fontSize: 20, fontWeight: "800", color: theme.colors.primaryInk },
  toggleRow: {
    marginTop: theme.spacing(4),
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(3),
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  toggleCopy: { flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.gray900 },
  toggleSubtitle: { marginTop: 6, fontSize: 12, lineHeight: 18, color: theme.colors.gray600 },
});
