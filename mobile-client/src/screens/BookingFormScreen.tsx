import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import { Asset, launchCamera, launchImageLibrary } from "react-native-image-picker";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { PrimaryButton } from "../components/PrimaryButton";
import { createBooking, verifyBookingPayment } from "../services/bookings";
import { analyzeDocumentScan, DocumentScannerCandidate } from "../services/documentScanner";
import { ensureStripeReady } from "../services/payments";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSessionStore } from "../store/sessionStore";
import { theme } from "../theme/theme";
import { JourneyMode } from "../types/app";
import { FlightOffer, FlightSearchRequest } from "../types/flights";


type PassengerType = "adult" | "child" | "infant_without_seat";
type Gender = "m" | "f" | "";
type Title = "mr" | "mrs" | "ms";
type DocumentType = "passport" | "id_card" | "drivers_license";
type ScanSource = "camera" | "library";

type PassengerDraft = {
  type: PassengerType;
  title: Title;
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: Gender;
  email: string;
  phoneNumber: string;
  documentType: DocumentType;
  documentNumber: string;
  documentExpiryDate: string;
  documentIssuingCountry: string;
  nationality: string;
  scannerStatus?: string;
  scannerWarnings?: string[];
};

type ScanPrompt = {
  index: number;
  source: ScanSource;
};

function parseCount(value?: string, fallback = 0) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildPassengers(search?: FlightSearchRequest) {
  const adults = parseCount(search?.adults, search?.passengers ? Number.parseInt(search.passengers, 10) || 1 : 1);
  const children = parseCount(search?.children, 0);
  const infants = parseCount(search?.infants, 0);
  const passengers: PassengerDraft[] = [];

  const createPassenger = (type: PassengerType): PassengerDraft => ({
    type,
    title: "mr",
    givenName: "",
    familyName: "",
    bornOn: "",
    gender: "",
    email: "",
    phoneNumber: "",
    documentType: "passport",
    documentNumber: "",
    documentExpiryDate: "",
    documentIssuingCountry: "",
    nationality: "",
    scannerStatus: "",
    scannerWarnings: [],
  });

  for (let index = 0; index < adults; index += 1) passengers.push(createPassenger("adult"));
  for (let index = 0; index < children; index += 1) passengers.push(createPassenger("child"));
  for (let index = 0; index < infants; index += 1) passengers.push(createPassenger("infant_without_seat"));

  return passengers.length > 0 ? passengers : [createPassenger("adult")];
}

function formatFlightSummary(offer: FlightOffer, language: "pt" | "en" | "es") {
  const route = `${offer.originCode || "--"} → ${offer.destinationCode || "--"}`;
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const departure = offer.departureTime
    ? new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit", year: "numeric" }).format(new Date(offer.departureTime))
    : "";
  return `${route}${departure ? ` · ${departure}` : ""}`;
}

function normalizeDocumentType(value?: string | null): DocumentType {
  if (value === "id_card" || value === "national_id") return "id_card";
  if (value === "drivers_license") return "drivers_license";
  return "passport";
}

function normalizeText(value?: string | null) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeName(value?: string | null) {
  const cleaned = normalizeText(value);
  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .split(/([\s'-]+)/)
    .map((part) => {
      if (/^[\s'-]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function normalizeCountryCode(value?: string | null) {
  const cleaned = String(value || "").replace(/[^a-z]/gi, "").toUpperCase();
  if (!cleaned) return "";
  if (cleaned.length === 2 || cleaned.length === 3) return cleaned;
  return cleaned.slice(0, 3);
}

function normalizeDocumentNumber(value?: string | null) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

function normalizeGender(value?: string | null): Gender {
  if (!value) return "";
  const normalized = value.toLowerCase();
  if (normalized === "m" || normalized === "male" || normalized === "masculino") return "m";
  if (normalized === "f" || normalized === "female" || normalized === "feminino") return "f";
  return "";
}

function inferTitleFromGender(gender: Gender, currentTitle: Title): Title {
  if (gender === "m") return "mr";
  if (gender === "f") {
    return currentTitle === "mrs" ? "mrs" : "ms";
  }
  return currentTitle;
}

function normalizeIsoDate(value?: string | null) {
  const cleaned = normalizeText(value);
  if (!cleaned) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  const digitGroups = cleaned.match(/\d+/g);
  if (!digitGroups) return "";

  if (digitGroups.length === 1) {
    const digits = digitGroups[0];
    if (/^\d{8}$/.test(digits)) {
      const firstChunk = Number.parseInt(digits.slice(0, 4), 10);
      if (firstChunk >= 1900 && firstChunk <= 2100) {
        return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
      }
    }
  }

  if (digitGroups.length < 3) return "";

  const [first, second, third] = digitGroups;
  if (first.length === 4) {
    return `${first.padStart(4, "0")}-${second.padStart(2, "0")}-${third.padStart(2, "0")}`;
  }

  if (third.length === 4) {
    const firstNumber = Number.parseInt(first, 10);
    const secondNumber = Number.parseInt(second, 10);
    const monthFirst = firstNumber <= 12 && secondNumber > 12;
    const day = monthFirst ? second : first;
    const month = monthFirst ? first : second;
    return `${third.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

async function assetToDataUrl(asset?: Asset) {
  if (!asset) return null;

  const mimeType = asset.type || "image/jpeg";
  if (asset.base64) {
    return `data:${mimeType};base64,${asset.base64}`;
  }

  if (!asset.uri) return null;

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  return await new Promise<string | null>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(blob);
  });
}

export function BookingFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const offer = route.params.offer as FlightOffer;
  const search = route.params.search as FlightSearchRequest | undefined;
  const mode = route.params.mode as JourneyMode;
  const localeLanguage = useOnboardingStore((state) => state.language);
  const user = useAuthStore((state) => state.user);
  const accessMode = useSessionStore((state) => state.accessMode);
  const rememberGuestReservation = useSessionStore((state) => state.rememberGuestReservation);
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [passengers, setPassengers] = useState<PassengerDraft[]>(() => buildPassengers(search));
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  const [scanPrompt, setScanPrompt] = useState<ScanPrompt | null>(null);

  const copy = useMemo(() => {
    if (localeLanguage === "en") {
      return {
        badge: "Reservation form",
        title: "Complete traveler details",
        subtitle: "Review the flight and complete each traveler exactly as it appears on the document.",
        contactTitle: "Booking contact",
        summaryTitle: "Selected flight",
        passengersTitle: "Travelers",
        passenger: "Traveler",
        adult: "Adult",
        child: "Child",
        infant: "Infant",
        titleLabel: "Title",
        firstName: "First name",
        lastName: "Last name",
        birthDate: "Birth date",
        gender: "Gender",
        email: "Email",
        phone: "Phone",
        documentType: "Document type",
        documentNumber: "Document number",
        documentExpiryDate: "Document expiry",
        nationality: "Nationality",
        issuingCountry: "Issuing country",
        documentGuideTitle: "Choose the document to scan",
        documentGuideCamera: "The camera opens next. Select the document type so the scan uses the correct reading logic.",
        documentGuideLibrary: "Select the document type before sending the image to scan.",
        documentPassport: "Passport",
        documentPassportHint: "Use the photo page",
        documentIdCard: "Identity card",
        documentIdCardHint: "Use the front side first",
        documentLicense: "Driver's license",
        documentLicenseHint: "Use the front side first",
        cancel: "Cancel",
        useCamera: "Scan with camera",
        useLibrary: "Upload document",
        scannerBusy: "Reading document...",
        scannerReady: "Document read and fields updated.",
        scannerUnavailable: "Document scanner is not available right now.",
        scannerNoImage: "No image was provided for scanning.",
        scannerCameraImageMissing: "The camera did not return a readable image.",
        continue: "Continue",
        missingContact: "Enter the booking email and phone before continuing.",
        missingPassenger: "Complete all required traveler fields before continuing.",
        totalTravelers: "Travelers",
        totalFare: "Selected fare",
        cameraPermission: "Camera permission is required to scan the document.",
        paymentPreparing: "Preparing secure payment...",
        paymentSetupFailed: "We could not prepare the payment right now.",
        paymentCancelled: "Payment was not completed. You can reopen your reservation and try again.",
        paymentFailed: "The payment could not be completed right now.",
        paymentSuccessTitle: "Reservation confirmed",
        paymentSuccessBody: "Your payment was approved and your reservation is now available in My Trips.",
        paymentPendingBody: "Your payment is being confirmed. The reservation is already in My Trips for follow-up.",
      };
    }

    if (localeLanguage === "es") {
      return {
        badge: "Formulario de reserva",
        title: "Complete los datos de los pasajeros",
        subtitle: "Revise el vuelo y complete cada pasajero exactamente como aparece en el documento.",
        contactTitle: "Contacto de la reserva",
        summaryTitle: "Vuelo seleccionado",
        passengersTitle: "Pasajeros",
        passenger: "Pasajero",
        adult: "Adulto",
        child: "Niño",
        infant: "Bebé",
        titleLabel: "Tratamiento",
        firstName: "Nombre",
        lastName: "Apellido",
        birthDate: "Fecha de nacimiento",
        gender: "Género",
        email: "Correo electrónico",
        phone: "Teléfono",
        documentType: "Tipo de documento",
        documentNumber: "Número de documento",
        documentExpiryDate: "Vencimiento del documento",
        nationality: "Nacionalidad",
        issuingCountry: "País emisor",
        documentGuideTitle: "Elija el documento para escanear",
        documentGuideCamera: "La cámara se abrirá ahora. Seleccione el tipo de documento para que la lectura use el formato correcto.",
        documentGuideLibrary: "Seleccione el tipo de documento antes de enviar la imagen para escanear.",
        documentPassport: "Pasaporte",
        documentPassportHint: "Use la página con foto",
        documentIdCard: "Documento de identidad",
        documentIdCardHint: "Use primero el frente",
        documentLicense: "Licencia de conducir",
        documentLicenseHint: "Use primero el frente",
        cancel: "Cancelar",
        useCamera: "Escanear con cámara",
        useLibrary: "Subir documento",
        scannerBusy: "Leyendo documento...",
        scannerReady: "Documento leído y campos actualizados.",
        scannerUnavailable: "El escáner de documentos no está disponible ahora.",
        scannerNoImage: "No se recibió ninguna imagen para escanear.",
        scannerCameraImageMissing: "La cámara no devolvió una imagen válida.",
        continue: "Continuar",
        missingContact: "Complete el correo y el teléfono de contacto antes de continuar.",
        missingPassenger: "Complete todos los campos obligatorios de los pasajeros antes de continuar.",
        totalTravelers: "Pasajeros",
        totalFare: "Tarifa elegida",
        cameraPermission: "Se necesita permiso de cámara para escanear el documento.",
        paymentPreparing: "Preparando el pago seguro...",
        paymentSetupFailed: "No fue posible preparar el pago ahora.",
        paymentCancelled: "El pago no se completó. Puede reabrir su reserva e intentarlo otra vez.",
        paymentFailed: "No fue posible concluir el pago ahora.",
        paymentSuccessTitle: "Reserva confirmada",
        paymentSuccessBody: "Su pago fue aprobado y su reserva ya está disponible en Mis viajes.",
        paymentPendingBody: "Su pago está siendo confirmado. La reserva ya está disponible en Mis viajes para seguimiento.",
      };
    }

    return {
      badge: "Formulário de reserva",
      title: "Complete os dados dos passageiros",
      subtitle: "Revise o voo e preencha cada passageiro exatamente como aparece no documento.",
      contactTitle: "Contato da reserva",
      summaryTitle: "Voo selecionado",
      passengersTitle: "Passageiros",
      passenger: "Passageiro",
      adult: "Adulto",
      child: "Criança",
      infant: "Bebê",
      titleLabel: "Tratamento",
      firstName: "Nome",
      lastName: "Sobrenome",
      birthDate: "Data de nascimento",
      gender: "Gênero",
      email: "E-mail",
      phone: "Telefone",
      documentType: "Tipo de documento",
      documentNumber: "Número do documento",
      documentExpiryDate: "Validade do documento",
      nationality: "Nacionalidade",
      issuingCountry: "País emissor",
      documentGuideTitle: "Escolha o documento para escanear",
      documentGuideCamera: "A câmera abre em seguida. Selecione o tipo de documento para a leitura usar a lógica correta.",
      documentGuideLibrary: "Selecione o tipo de documento antes de enviar a imagem para leitura.",
      documentPassport: "Passaporte",
      documentPassportHint: "Use a página com foto",
      documentIdCard: "Documento de identidade",
      documentIdCardHint: "Use primeiro a frente",
      documentLicense: "Carteira de motorista",
      documentLicenseHint: "Use primeiro a frente",
      cancel: "Cancelar",
      useCamera: "Escanear com câmera",
      useLibrary: "Enviar documento",
      scannerBusy: "Lendo documento...",
      scannerReady: "Documento lido e campos atualizados.",
      scannerUnavailable: "O scanner de documentos não está disponível agora.",
      scannerNoImage: "Nenhuma imagem foi enviada para leitura.",
      scannerCameraImageMissing: "A câmera não retornou uma imagem válida.",
      continue: "Continuar",
      missingContact: "Preencha o e-mail e o telefone de contato antes de continuar.",
      missingPassenger: "Complete todos os campos obrigatórios dos passageiros antes de continuar.",
      totalTravelers: "Passageiros",
      totalFare: "Tarifa escolhida",
      cameraPermission: "É necessário permitir a câmera para escanear o documento.",
      paymentPreparing: "Preparando o pagamento seguro...",
      paymentSetupFailed: "Não foi possível preparar o pagamento agora.",
      paymentCancelled: "O pagamento não foi concluído. Você pode reabrir a reserva e tentar novamente.",
      paymentFailed: "Não foi possível concluir o pagamento agora.",
      paymentSuccessTitle: "Reserva confirmada",
      paymentSuccessBody: "Seu pagamento foi aprovado e sua reserva já está disponível em Minhas viagens.",
      paymentPendingBody: "Seu pagamento está em confirmação. A reserva já está disponível em Minhas viagens para acompanhamento.",
    };
  }, [localeLanguage]);

  const passengerLabel = (type: PassengerType) => {
    if (type === "child") return copy.child;
    if (type === "infant_without_seat") return copy.infant;
    return copy.adult;
  };

  const accentColor = mode === "senior" ? theme.colors.senior : theme.colors.primary;
  const accentSoft = mode === "senior" ? theme.colors.seniorSoft : theme.colors.primarySoft;
  const scanPromptOptions = [
    { value: "passport" as const, label: copy.documentPassport, hint: copy.documentPassportHint },
    { value: "id_card" as const, label: copy.documentIdCard, hint: copy.documentIdCardHint },
    { value: "drivers_license" as const, label: copy.documentLicense, hint: copy.documentLicenseHint },
  ];

  const updatePassenger = (index: number, field: keyof PassengerDraft, value: string) => {
    setPassengers((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger,
      ),
    );
    setFormError("");
    setStatusMessage("");
  };

  const applyScannerCandidate = (index: number, candidate: DocumentScannerCandidate, warnings?: string[]) => {
    const normalizedGender = normalizeGender(candidate?.gender);
    const normalizedGivenName = normalizeName(candidate?.givenName);
    const normalizedFamilyName = normalizeName(candidate?.familyName);
    const normalizedBirthDate = normalizeIsoDate(candidate?.bornOn);
    const normalizedDocumentNumber = normalizeDocumentNumber(candidate?.documentNumber || candidate?.passportNumber);
    const normalizedDocumentExpiry = normalizeIsoDate(candidate?.passportExpiryDate);
    const normalizedNationality = normalizeCountryCode(candidate?.nationality);
    const normalizedIssuingCountry = normalizeCountryCode(candidate?.passportIssuingCountry);
    const normalizedDocumentType = candidate?.documentType ? normalizeDocumentType(candidate.documentType) : undefined;
    const candidateWarnings = (warnings || candidate?.warnings || []).filter(Boolean);

    setPassengers((current) =>
      current.map((passenger, passengerIndex) => {
        if (passengerIndex !== index) return passenger;
        return {
          ...passenger,
          title: normalizedGender ? inferTitleFromGender(normalizedGender, passenger.title) : passenger.title,
          givenName: normalizedGivenName || passenger.givenName,
          familyName: normalizedFamilyName || passenger.familyName,
          bornOn: normalizedBirthDate || passenger.bornOn,
          gender: normalizedGender || passenger.gender,
          documentType: normalizedDocumentType || passenger.documentType,
          documentNumber: normalizedDocumentNumber || passenger.documentNumber,
          documentExpiryDate: normalizedDocumentExpiry || passenger.documentExpiryDate,
          nationality: normalizedNationality || passenger.nationality,
          documentIssuingCountry: normalizedIssuingCountry || passenger.documentIssuingCountry,
          scannerStatus: copy.scannerReady,
          scannerWarnings: candidateWarnings,
        };
      }),
    );
  };

  const analyzeAsset = async (index: number, asset: Asset | undefined, documentType: DocumentType, emptyAssetMessage: string) => {
    let documentImageDataUrl: string | null = null;

    try {
      documentImageDataUrl = await assetToDataUrl(asset);
    } catch {
      documentImageDataUrl = null;
    }

    if (!documentImageDataUrl) {
      setFormError(emptyAssetMessage);
      return;
    }

    setScanningIndex(index);
    setFormError("");
    setStatusMessage("");

    try {
      const response = await analyzeDocumentScan({
        documentImageDataUrl,
        declaredDocumentType: documentType,
      });

      if (!response.available || !response.candidate) {
        setFormError(copy.scannerUnavailable);
        setPassengers((current) =>
          current.map((passenger, passengerIndex) =>
            passengerIndex === index
              ? {
                  ...passenger,
                  scannerStatus: "",
                  scannerWarnings: response.warnings || [],
                }
              : passenger,
          ),
        );
        return;
      }

      applyScannerCandidate(index, response.candidate, response.warnings || response.candidate.warnings || []);
    } catch (error: any) {
      const errorMessage = String(error?.message || "");
      setFormError(errorMessage.includes("permission") ? copy.cameraPermission : copy.scannerUnavailable);
    } finally {
      setScanningIndex(null);
    }
  };

  const handleScanCamera = async (index: number, documentType: DocumentType) => {
    const result = await launchCamera({
      mediaType: "photo",
      includeBase64: true,
      saveToPhotos: false,
      quality: 0.8,
    });

    if (result.didCancel) return;

    if (result.errorCode) {
      setFormError(result.errorCode === "camera_unavailable" ? copy.scannerUnavailable : copy.cameraPermission);
      return;
    }

    await analyzeAsset(index, result.assets?.[0], documentType, copy.scannerCameraImageMissing);
  };

  const handleScanLibrary = async (index: number, documentType: DocumentType) => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      includeBase64: true,
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel) return;

    if (result.errorCode) {
      setFormError(copy.scannerUnavailable);
      return;
    }

    await analyzeAsset(index, result.assets?.[0], documentType, copy.scannerNoImage);
  };

  const openScanPrompt = (index: number, source: ScanSource) => {
    setFormError("");
    setScanPrompt({ index, source });
  };

  const handleSelectDocumentForScan = async (documentType: DocumentType) => {
    if (!scanPrompt) return;

    const { index, source } = scanPrompt;
    setScanPrompt(null);
    updatePassenger(index, "documentType", documentType);

    if (source === "camera") {
      await handleScanCamera(index, documentType);
      return;
    }

    await handleScanLibrary(index, documentType);
  };

  const validateForm = () => {
    if (!contactEmail.trim() || !contactPhone.trim()) {
      return copy.missingContact;
    }

    for (const passenger of passengers) {
      if (!passenger.givenName.trim() || !passenger.familyName.trim() || !passenger.bornOn.trim() || !passenger.gender || !passenger.documentNumber.trim() || !passenger.documentExpiryDate.trim() || !passenger.nationality.trim() || !passenger.documentIssuingCountry.trim()) {
        return copy.missingPassenger;
      }
    }

    return "";
  };

  const handleContinue = async () => {
    const validationError = validateForm();
    setFormError(validationError);
    setStatusMessage("");
    if (validationError) {
      return;
    }

    setSubmitting(true);

    try {
      const normalizedEmail = contactEmail.trim().toLowerCase();
      const normalizedPhone = contactPhone.trim();
      const passengerDetails = passengers.map((passenger, index) => ({
        ...passenger,
        email: passenger.email.trim() || normalizedEmail,
        phoneNumber: passenger.phoneNumber.trim() || normalizedPhone,
        passengerId: offer.passengers?.[index]?.passengerId || `pax_${index + 1}`,
      }));

      const response = await createBooking({
        contactEmail: normalizedEmail,
        contactPhone: normalizedPhone,
        totalPrice: offer.price.toFixed(2),
        currency: offer.currency,
        flightData: {
          id: offer.id,
          airline: offer.airline,
          flightNumber: offer.flightNumber,
          origin: offer.originCode || "N/A",
          destination: offer.destinationCode || "N/A",
          departureTime: offer.departureTime,
          arrivalTime: offer.arrivalTime,
          cabinClass: offer.cabinClass,
          slices: offer.slices,
          logoUrl: offer.logoUrl,
          originCity: offer.originCity,
          destinationCity: offer.destinationCity,
        },
        passengerDetails,
      });

      const referenceCode = response.booking.referenceCode || "";
      rememberGuestReservation({
        referenceCode,
        contactEmail: normalizedEmail,
        bookingId: response.booking.id,
      });

      if (!response.clientSecret) {
        throw new Error(copy.paymentSetupFailed);
      }

      setStatusMessage(copy.paymentPreparing);
      await ensureStripeReady();

      const initResult = await initPaymentSheet({
        merchantDisplayName: "Michels Travel",
        paymentIntentClientSecret: response.clientSecret,
        defaultBillingDetails: {
          email: normalizedEmail,
          phone: normalizedPhone,
          name: passengerDetails[0] ? `${passengerDetails[0].givenName} ${passengerDetails[0].familyName}`.trim() : undefined,
        },
        allowsDelayedPaymentMethods: false,
      });

      if (initResult.error) {
        throw new Error(initResult.error.message || copy.paymentSetupFailed);
      }

      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) {
        const normalizedCode = String(paymentResult.error.code || "").toLowerCase();
        if (normalizedCode.includes("canceled")) {
          setFormError(copy.paymentCancelled);
          setStatusMessage("");
          return;
        }

        throw new Error(paymentResult.error.message || copy.paymentFailed);
      }

      const verification = await verifyBookingPayment(response.booking.id, referenceCode, normalizedEmail);
      const destinationRoute =
        mode === "senior"
          ? { name: "SeniorMain", params: { screen: "SeniorTrips" } }
          : { name: "RegularMain", params: { screen: "RegularTrips" } };

      Alert.alert(
        copy.paymentSuccessTitle,
        verification.verified ? copy.paymentSuccessBody : copy.paymentPendingBody,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate(destinationRoute.name, destinationRoute.params),
          },
        ],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.paymentFailed;
      setFormError(message || copy.paymentFailed);
      setStatusMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      mode={mode}
      badge={copy.badge}
      title={copy.title}
      subtitle={copy.subtitle}
      contentStyle={styles.container}
      heroSize="expanded"
    >
      <Card>
        <Text style={styles.sectionTitle}>{copy.summaryTitle}</Text>
        <Text style={styles.summaryRoute}>{formatFlightSummary(offer, localeLanguage)}</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatLabel}>{copy.totalTravelers}</Text>
            <Text style={styles.summaryStatValue}>{passengers.length}</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatLabel}>{copy.totalFare}</Text>
            <Text style={styles.summaryStatValue}>{new Intl.NumberFormat("en-US", { style: "currency", currency: offer.currency }).format(offer.price)}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{copy.contactTitle}</Text>
        <View style={styles.fieldGrid}>
          <FormField label={copy.email} value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" keyboardType="email-address" />
          <FormField label={copy.phone} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
        </View>
      </Card>

      <View style={styles.passengerStack}>
        {passengers.map((passenger, index) => (
          <Card key={`${passenger.type}-${index}`}>
            <View style={styles.passengerHeader}>
              <View>
                <Text style={styles.sectionTitle}>{copy.passenger} {index + 1}</Text>
                <Text style={styles.passengerType}>{passengerLabel(passenger.type)}</Text>
              </View>
              <View style={[styles.passengerBadge, { backgroundColor: accentSoft }]}>
                <Text style={[styles.passengerBadgeText, { color: accentColor }]}>{passengerLabel(passenger.type)}</Text>
              </View>
            </View>

            <View style={styles.selectorRow}>
              <View style={styles.selectorBlock}>
                <Text style={styles.selectorLabel}>{copy.titleLabel}</Text>
                <View style={styles.choiceRow}>
                  {([
                    ["mr", "Mr"],
                    ["mrs", "Mrs"],
                    ["ms", "Ms"],
                  ] as const).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.choicePill, passenger.title === value && { backgroundColor: accentSoft, borderColor: accentColor }]}
                      onPress={() => updatePassenger(index, "title", value)}
                    >
                      <Text style={[styles.choiceText, passenger.title === value && { color: accentColor }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.selectorBlock}>
                <Text style={styles.selectorLabel}>{copy.gender}</Text>
                <View style={styles.choiceRow}>
                  {([
                    ["m", "M"],
                    ["f", "F"],
                  ] as const).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.choicePill, passenger.gender === value && { backgroundColor: accentSoft, borderColor: accentColor }]}
                      onPress={() => updatePassenger(index, "gender", value)}
                    >
                      <Text style={[styles.choiceText, passenger.gender === value && { color: accentColor }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.fieldGrid}>
              <FormField label={copy.firstName} value={passenger.givenName} onChangeText={(value) => updatePassenger(index, "givenName", value)} autoCapitalize="words" />
              <FormField label={copy.lastName} value={passenger.familyName} onChangeText={(value) => updatePassenger(index, "familyName", value)} autoCapitalize="words" />
              <FormField label={copy.birthDate} value={passenger.bornOn} onChangeText={(value) => updatePassenger(index, "bornOn", value)} placeholder="YYYY-MM-DD" autoCapitalize="none" />
              <FormField label={copy.documentNumber} value={passenger.documentNumber} onChangeText={(value) => updatePassenger(index, "documentNumber", value)} autoCapitalize="characters" />
              <FormField label={copy.documentExpiryDate} value={passenger.documentExpiryDate} onChangeText={(value) => updatePassenger(index, "documentExpiryDate", value)} placeholder="YYYY-MM-DD" autoCapitalize="none" />
              <FormField label={copy.nationality} value={passenger.nationality} onChangeText={(value) => updatePassenger(index, "nationality", value.toUpperCase())} autoCapitalize="characters" />
              <FormField label={copy.issuingCountry} value={passenger.documentIssuingCountry} onChangeText={(value) => updatePassenger(index, "documentIssuingCountry", value.toUpperCase())} autoCapitalize="characters" />
              <FormField label={copy.email} value={passenger.email} onChangeText={(value) => updatePassenger(index, "email", value)} autoCapitalize="none" keyboardType="email-address" />
              <FormField label={copy.phone} value={passenger.phoneNumber} onChangeText={(value) => updatePassenger(index, "phoneNumber", value)} keyboardType="phone-pad" />
            </View>

            <View style={styles.selectorBlock}>
              <Text style={styles.selectorLabel}>{copy.documentType}</Text>
              <View style={styles.choiceRow}>
                {([
                  ["passport", "Passport"],
                  ["id_card", "ID"],
                  ["drivers_license", "DL"],
                ] as const).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.choicePill, passenger.documentType === value && { backgroundColor: accentSoft, borderColor: accentColor }]}
                    onPress={() => updatePassenger(index, "documentType", value)}
                  >
                    <Text style={[styles.choiceText, passenger.documentType === value && { color: accentColor }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.scannerActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: accentColor }]}
                onPress={() => openScanPrompt(index, "camera")}
                disabled={scanningIndex === index}
              >
                {scanningIndex === index ? <ActivityIndicator color={accentColor} /> : <Text style={[styles.secondaryButtonText, { color: accentColor }]}>{copy.useCamera}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: accentColor }]}
                onPress={() => openScanPrompt(index, "library")}
                disabled={scanningIndex === index}
              >
                <Text style={[styles.secondaryButtonText, { color: accentColor }]}>{copy.useLibrary}</Text>
              </TouchableOpacity>
            </View>

            {scanningIndex === index ? <Text style={styles.scannerText}>{copy.scannerBusy}</Text> : null}
            {passenger.scannerStatus ? <Text style={styles.scannerText}>{passenger.scannerStatus}</Text> : null}
            {passenger.scannerWarnings && passenger.scannerWarnings.length > 0 ? (
              <Text style={styles.scannerWarning}>{passenger.scannerWarnings.join(" · ")}</Text>
            ) : null}
          </Card>
        ))}
      </View>

      {formError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{formError}</Text>
        </Card>
      ) : null}

      {statusMessage ? (
        <Card style={styles.readyCard}>
          <Text style={styles.readyText}>{statusMessage}</Text>
        </Card>
      ) : null}

      <PrimaryButton label={copy.continue} onPress={handleContinue} loading={submitting} />

      <Modal visible={!!scanPrompt} transparent animationType="fade" onRequestClose={() => setScanPrompt(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setScanPrompt(null)}>
          <Pressable style={styles.modalPanel} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{copy.documentGuideTitle}</Text>
            <Text style={styles.modalSubtitle}>
              {scanPrompt?.source === "library" ? copy.documentGuideLibrary : copy.documentGuideCamera}
            </Text>

            <View style={styles.modalOptions}>
              {scanPromptOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalOptionCard, { borderColor: accentColor }]}
                  onPress={() => handleSelectDocumentForScan(option.value)}
                >
                  <Text style={styles.modalOptionTitle}>{option.label}</Text>
                  <Text style={styles.modalOptionHint}>{option.hint}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalCancel} onPress={() => setScanPrompt(null)}>
              <Text style={styles.modalCancelText}>{copy.cancel}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing(3) },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: theme.colors.gray900 },
  summaryRoute: { marginTop: theme.spacing(2), fontSize: 14, lineHeight: 21, color: theme.colors.gray600 },
  summaryStats: { marginTop: theme.spacing(3), flexDirection: "row", gap: theme.spacing(2) },
  summaryStat: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  summaryStatLabel: { fontSize: 10, fontWeight: "800", color: theme.colors.gray500, textTransform: "uppercase", letterSpacing: 0.7 },
  summaryStatValue: { marginTop: 8, fontSize: 16, fontWeight: "800", color: theme.colors.gray900 },
  fieldGrid: { marginTop: theme.spacing(3), gap: theme.spacing(2) },
  passengerStack: { gap: theme.spacing(3) },
  passengerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing(2) },
  passengerType: { marginTop: 4, fontSize: 13, color: theme.colors.gray600, fontWeight: "600" },
  passengerBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  passengerBadgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  selectorRow: { marginTop: theme.spacing(3), flexDirection: "row", gap: theme.spacing(2) },
  selectorBlock: { marginTop: theme.spacing(3), gap: theme.spacing(1.5) },
  selectorLabel: { fontSize: 11, color: theme.colors.gray500, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(1.5) },
  choicePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceText: { fontSize: 12, fontWeight: "700", color: theme.colors.gray700 },
  scannerActions: { marginTop: theme.spacing(3), flexDirection: "row", gap: theme.spacing(2) },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing(2),
  },
  secondaryButtonText: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  scannerText: { marginTop: theme.spacing(2), fontSize: 12, color: theme.colors.gray600, lineHeight: 18 },
  scannerWarning: { marginTop: theme.spacing(1), fontSize: 11, color: theme.colors.warning, lineHeight: 16 },
  errorCard: { borderColor: "#F5C2C7", backgroundColor: "#FFF5F6" },
  errorText: { fontSize: 13, lineHeight: 19, color: theme.colors.danger, fontWeight: "700" },
  readyCard: { borderColor: "#B7E4C7", backgroundColor: "#ECFDF3" },
  readyTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.success },
  readyText: { marginTop: theme.spacing(2), fontSize: 13, lineHeight: 19, color: theme.colors.gray700 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.46)",
    justifyContent: "center",
    paddingHorizontal: theme.spacing(3),
  },
  modalPanel: {
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing(4),
    gap: theme.spacing(2.5),
    ...theme.shadow.floating,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.gray600,
  },
  modalOptions: {
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
  },
  modalOptionCard: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  modalOptionHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.gray600,
  },
  modalCancel: {
    alignSelf: "center",
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(2),
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.gray500,
  },
});
