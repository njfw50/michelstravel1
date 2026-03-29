import React, { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { LocationPickerField } from "../components/LocationPickerField";
import { MiniCalendarField } from "../components/MiniCalendarField";
import { PrimaryButton } from "../components/PrimaryButton";
import { buildWhatsAppHref, AGENCY_PHONE_DISPLAY } from "../config/contact";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSessionStore } from "../store/sessionStore";
import { SeniorBagPreference, SeniorConnectionPreference, SeniorPriority, SeniorTimePreference } from "../types/app";
import { LocationSelection } from "../types/search";
import { theme } from "../theme/theme";
import { formatDateLabel, isValidIsoDate, todayIsoDate } from "../utils/dateCalendar";
const quickRoutes = [
  { origin: { code: "EWR", label: "Newark" }, destination: { code: "GRU", label: "São Paulo" } },
  { origin: { code: "EWR", label: "Newark" }, destination: { code: "MCO", label: "Orlando" } },
  { origin: { code: "MIA", label: "Miami" }, destination: { code: "LIS", label: "Lisboa" } },
  { origin: { code: "MCO", label: "Orlando" }, destination: { code: "GRU", label: "São Paulo" } },
];

function CounterRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.counterRow}>
      <View style={styles.counterCopy}>
        <Text style={styles.counterTitle}>{label}</Text>
        <Text style={styles.counterHint}>{hint}</Text>
      </View>
      <View style={styles.counterControls}>
        <TouchableOpacity style={styles.counterButton} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={styles.counterButtonText}>-</Text>
        </TouchableOpacity>
        <View style={styles.counterValueWrap}>
          <Text style={styles.counterValue}>{value}</Text>
        </View>
        <TouchableOpacity style={[styles.counterButton, value >= max && styles.counterButtonDisabled]} disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))}>
          <Text style={styles.counterButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function SeniorHomeScreen({ navigation }: { navigation: any }) {
  const language = useOnboardingStore((state) => state.language);
  const accessMode = useSessionStore((state) => state.accessMode);
  const [currentStep, setCurrentStep] = useState(0);
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("round-trip");
  const [origin, setOrigin] = useState<LocationSelection | null>(null);
  const [destination, setDestination] = useState<LocationSelection | null>(null);
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [priority, setPriority] = useState<SeniorPriority>("comfort");
  const [connections, setConnections] = useState<SeniorConnectionPreference>("one");
  const [bags, setBags] = useState<SeniorBagPreference>("flexible");
  const [timePreference, setTimePreference] = useState<SeniorTimePreference>("day");

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Senior support",
        title: "Plan your trip with more calm, clarity, and guidance.",
        subtitle: "A step-by-step experience with comfortable reading and visible human support throughout the booking journey.",
        guest: "Continue as a guest and check your reservation anytime with your booking code and email.",
        helperTitle: "Would you like to speak with our team first?",
        helperText: `Talk to our team on WhatsApp ${AGENCY_PHONE_DISPLAY} before choosing your flight if you want personal guidance.`,
        helperButton: "Open WhatsApp",
        steps: ["Route", "Dates", "Priority", "Details"],
        routeTitle: "First, tell us where you are leaving from and where you want to go.",
        routeSubtitle: "Only this decision for now. The next step will take care of the rest.",
        datesTitle: "Now choose the dates and how many people will travel.",
        datesSubtitle: "One calm answer at a time.",
        priorityTitle: "What matters most on this trip?",
        prioritySubtitle: "This helps us show the best options first.",
        detailTitle: "Let us finish with connections, baggage, and timing.",
        detailSubtitle: "This keeps the results calmer and easier to compare.",
        origin: "Origin",
        destination: "Destination",
        routePlaceholder: "Choose airport or city",
        swap: "Swap route",
        date: "Departure",
        returnDate: "Return",
        dateHint: "Use year-month-day",
        returnHint: "Only for round trip",
        adults: "Adults",
        adultsHint: "Age 12 or older",
        children: "Children",
        childrenHint: "Age 2 to 11",
        infants: "Infants",
        infantsHint: "Under 2 years old",
        next: "Continue",
        back: "Go back",
        search: "See my best options",
        summaryTitle: "Your trip summary",
        quickRoutes: "Quick routes",
        trustStepValue: "1 at a time",
        trustStepLabel: "One decision per screen",
        trustHumanValue: "Human help",
        trustHumanLabel: "Visible when you need it",
        roundTrip: "Round trip",
        oneWay: "One way",
        priorityOptions: [
          { value: "comfort", label: "More comfort" },
          { value: "fastest", label: "Less total travel time" },
          { value: "balanced", label: "Best balance between price and comfort" },
          { value: "cheapest", label: "Lower price" },
        ] as { value: SeniorPriority; label: string }[],
        connectionsLabel: "Connections",
        connectionOptions: [
          { value: "none", label: "Avoid connections" },
          { value: "one", label: "At most 1 connection" },
          { value: "any", label: "Any connection" },
        ] as { value: SeniorConnectionPreference; label: string }[],
        baggageLabel: "Baggage",
        bagOptions: [
          { value: "checked", label: "Need checked baggage" },
          { value: "carry", label: "Need carry-on baggage" },
          { value: "flexible", label: "Flexible baggage" },
        ] as { value: SeniorBagPreference; label: string }[],
        timeLabel: "Time",
        timeOptions: [
          { value: "day", label: "Avoid very late hours" },
          { value: "any", label: "Any time" },
        ] as { value: SeniorTimePreference; label: string }[],
        summaryTravelers: "Travelers",
        summaryPriority: "Priority",
        summaryConnections: "Connections",
        summaryBaggage: "Baggage",
        summaryTime: "Time",
      };
    }

    if (language === "es") {
      return {
        badge: "Atención senior",
        title: "Planifique su viaje con más calma, claridad y acompañamiento.",
        subtitle: "Una experiencia paso a paso, con lectura cómoda y apoyo humano visible durante toda la compra.",
        guest: "Continúe como invitado y consulte su reserva cuando quiera con su código y correo.",
        helperTitle: "¿Quiere hablar primero con nuestro equipo?",
        helperText: `Hable con nuestro equipo por WhatsApp ${AGENCY_PHONE_DISPLAY} antes de elegir su vuelo si prefiere orientación personal.`,
        helperButton: "Abrir WhatsApp",
        steps: ["Ruta", "Fechas", "Prioridad", "Detalles"],
        routeTitle: "Primero, díganos desde dónde sale y a dónde quiere ir.",
        routeSubtitle: "Solo esta decisión ahora. El siguiente paso cuida el resto.",
        datesTitle: "Ahora elija las fechas y cuántas personas van a viajar.",
        datesSubtitle: "Una respuesta tranquila por vez.",
        priorityTitle: "¿Qué es lo más importante en este viaje?",
        prioritySubtitle: "Esto nos ayuda a mostrar primero las mejores opciones.",
        detailTitle: "Terminemos con conexiones, equipaje y horario.",
        detailSubtitle: "Así los resultados quedan más tranquilos y fáciles de comparar.",
        origin: "Origen",
        destination: "Destino",
        routePlaceholder: "Elija aeropuerto o ciudad",
        swap: "Cambiar ruta",
        date: "Salida",
        returnDate: "Regreso",
        dateHint: "Use año-mes-día",
        returnHint: "Solo para ida y vuelta",
        adults: "Adultos",
        adultsHint: "12 años o más",
        children: "Niños",
        childrenHint: "De 2 a 11 años",
        infants: "Bebés",
        infantsHint: "Menos de 2 años",
        next: "Continuar",
        back: "Volver",
        search: "Ver mis mejores opciones",
        summaryTitle: "Resumen del viaje",
        quickRoutes: "Rutas rápidas",
        trustStepValue: "1 por vez",
        trustStepLabel: "Una decisión por pantalla",
        trustHumanValue: "Ayuda humana",
        trustHumanLabel: "Visible cuando la necesite",
        roundTrip: "Ida y vuelta",
        oneWay: "Solo ida",
        priorityOptions: [
          { value: "comfort", label: "Más confort" },
          { value: "fastest", label: "Menor tiempo total" },
          { value: "balanced", label: "Mejor equilibrio entre precio y confort" },
          { value: "cheapest", label: "Menor precio" },
        ] as { value: SeniorPriority; label: string }[],
        connectionsLabel: "Conexiones",
        connectionOptions: [
          { value: "none", label: "Evitar conexiones" },
          { value: "one", label: "Máximo 1 conexión" },
          { value: "any", label: "Cualquier conexión" },
        ] as { value: SeniorConnectionPreference; label: string }[],
        baggageLabel: "Equipaje",
        bagOptions: [
          { value: "checked", label: "Necesita equipaje despachado" },
          { value: "carry", label: "Necesita equipaje de mano" },
          { value: "flexible", label: "Equipaje flexible" },
        ] as { value: SeniorBagPreference; label: string }[],
        timeLabel: "Horario",
        timeOptions: [
          { value: "day", label: "Evitar horarios muy tarde" },
          { value: "any", label: "Cualquier horario" },
        ] as { value: SeniorTimePreference; label: string }[],
        summaryTravelers: "Pasajeros",
        summaryPriority: "Prioridad",
        summaryConnections: "Conexiones",
        summaryBaggage: "Equipaje",
        summaryTime: "Horario",
      };
    }

    return {
      badge: "Atendimento sênior",
      title: "Planeje sua viagem com mais calma, clareza e orientação.",
      subtitle: "Uma experiência passo a passo, com leitura confortável e apoio humano visível durante toda a compra.",
      guest: "Continue como convidado e consulte sua reserva quando quiser com seu código e e-mail.",
      helperTitle: "Quer falar com nossa equipe antes de escolher?",
      helperText: `Fale com nossa equipe no WhatsApp ${AGENCY_PHONE_DISPLAY} antes de escolher seu voo se preferir orientação pessoal.`,
      helperButton: "Abrir WhatsApp",
      steps: ["Rota", "Datas", "Prioridade", "Detalhes"],
      routeTitle: "Primeiro diga de onde você sai e para onde quer ir.",
      routeSubtitle: "Só esta decisão agora. A próxima etapa cuida do resto.",
      datesTitle: "Agora escolha as datas e quantas pessoas vão viajar.",
      datesSubtitle: "Uma resposta tranquila por vez.",
      priorityTitle: "O que importa mais nesta viagem?",
      prioritySubtitle: "Isso nos ajuda a mostrar primeiro as melhores opções.",
      detailTitle: "Vamos terminar com conexões, bagagem e horário.",
      detailSubtitle: "Assim os resultados ficam mais tranquilos e fáceis de comparar.",
      origin: "Origem",
      destination: "Destino",
      routePlaceholder: "Escolha aeroporto ou cidade",
      swap: "Trocar rota",
      date: "Saída",
      returnDate: "Volta",
      dateHint: "Use ano-mês-dia",
      returnHint: "Só para ida e volta",
      adults: "Adultos",
      adultsHint: "12 anos ou mais",
      children: "Crianças",
      childrenHint: "De 2 a 11 anos",
      infants: "Bebês",
      infantsHint: "Menos de 2 anos",
      next: "Continuar",
      back: "Voltar",
      search: "Ver minhas melhores opções",
      summaryTitle: "Resumo da viagem",
      quickRoutes: "Rotas rápidas",
      trustStepValue: "1 por vez",
      trustStepLabel: "Uma decisão por tela",
      trustHumanValue: "Ajuda humana",
      trustHumanLabel: "Visível quando precisar",
      roundTrip: "Ida e volta",
      oneWay: "Só ida",
      priorityOptions: [
        { value: "comfort", label: "Mais conforto" },
        { value: "fastest", label: "Menor tempo total" },
        { value: "balanced", label: "Melhor equilíbrio entre preço e conforto" },
        { value: "cheapest", label: "Menor preço" },
      ] as { value: SeniorPriority; label: string }[],
      connectionsLabel: "Conexões",
      connectionOptions: [
        { value: "none", label: "Evitar conexões" },
        { value: "one", label: "No máximo 1 conexão" },
        { value: "any", label: "Qualquer conexão" },
      ] as { value: SeniorConnectionPreference; label: string }[],
      baggageLabel: "Bagagem",
      bagOptions: [
        { value: "checked", label: "Precisa mala despachada" },
        { value: "carry", label: "Precisa bagagem de mão" },
        { value: "flexible", label: "Bagagem flexível" },
      ] as { value: SeniorBagPreference; label: string }[],
      timeLabel: "Horário",
      timeOptions: [
        { value: "day", label: "Evitar horário muito tarde" },
        { value: "any", label: "Qualquer horário" },
      ] as { value: SeniorTimePreference; label: string }[],
      summaryTravelers: "Passageiros",
      summaryPriority: "Prioridade",
      summaryConnections: "Conexões",
      summaryBaggage: "Bagagem",
      summaryTime: "Horário",
    };
  }, [language]);

  const travelers = adults + children + infants;

  const stepTitle =
    currentStep === 0 ? copy.routeTitle : currentStep === 1 ? copy.datesTitle : currentStep === 2 ? copy.priorityTitle : copy.detailTitle;
  const stepSubtitle =
    currentStep === 0 ? copy.routeSubtitle : currentStep === 1 ? copy.datesSubtitle : currentStep === 2 ? copy.prioritySubtitle : copy.detailSubtitle;

  const canMoveNext =
    currentStep === 0 ? Boolean(origin?.code && destination?.code)
      : currentStep === 1 ? Boolean(isValidIsoDate(date) && (tripType === "one-way" || (isValidIsoDate(returnDate) && returnDate >= date)))
        : currentStep === 2 ? Boolean(priority)
          : Boolean(connections && bags && timePreference);

  const whatsappHref = buildWhatsAppHref(language, "Atendimento sênior mobile", [
    origin && destination ? `${origin.code} -> ${destination.code}` : null,
    date || null,
  ]);

  const summaryItems = [
    origin && destination ? `${origin.label} (${origin.code}) -> ${destination.label} (${destination.code})` : null,
    isValidIsoDate(date)
      ? `${formatDateLabel(date, language)}${tripType === "round-trip" && isValidIsoDate(returnDate) ? ` / ${formatDateLabel(returnDate, language)}` : ""}`
      : null,
    `${copy.summaryTravelers}: ${travelers}`,
    `${copy.summaryPriority}: ${copy.priorityOptions.find((item) => item.value === priority)?.label || priority}`,
    `${copy.summaryConnections}: ${copy.connectionOptions.find((item) => item.value === connections)?.label || connections}`,
    `${copy.summaryBaggage}: ${copy.bagOptions.find((item) => item.value === bags)?.label || bags}`,
    `${copy.summaryTime}: ${copy.timeOptions.find((item) => item.value === timePreference)?.label || timePreference}`,
  ].filter(Boolean);

  const swapRoute = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const openWhatsApp = async () => {
    try {
      await Linking.openURL(whatsappHref);
    } catch {
      // No-op when WhatsApp/browser is unavailable.
    }
  };

  const handleSearch = () => {
    if (!origin?.code || !destination?.code) {
      return;
    }

    navigation.navigate("SeniorResults", {
      search: {
        origin: origin.code,
        destination: destination.code,
        date,
        returnDate: tripType === "round-trip" ? returnDate : undefined,
        tripType,
        passengers: String(travelers),
        adults: String(adults),
        children: String(children),
        infants: String(infants),
        cabinClass: "economy",
      },
      preferences: {
        priority,
        connections,
        bags,
        time: timePreference,
      },
    });
  };

  return (
    <AppShell mode="senior" badge={copy.badge} title={copy.title} subtitle={copy.subtitle} contentStyle={styles.container} heroSize="expanded">
      <View style={styles.trustRow}>
        <View style={styles.trustCard}>
          <Text style={styles.trustValue}>{copy.trustStepValue}</Text>
          <Text style={styles.trustLabel}>{copy.trustStepLabel}</Text>
        </View>
        <View style={styles.trustCard}>
          <Text style={styles.trustValue}>{copy.trustHumanValue}</Text>
          <Text style={styles.trustLabel}>{copy.trustHumanLabel}</Text>
        </View>
      </View>

      {accessMode === "guest" ? (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerText}>{copy.guest}</Text>
        </View>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>{copy.helperTitle}</Text>
        <Text style={styles.helperText}>{copy.helperText}</Text>
        <PrimaryButton label={copy.helperButton} onPress={openWhatsApp} style={[styles.helperButton, styles.primarySeniorButton]} />
      </Card>

      <View style={styles.stepRow}>
        {copy.steps.map((step, index) => (
          <View key={step} style={[styles.stepChip, index === currentStep && styles.stepChipActive]}>
            <Text style={[styles.stepChipText, index === currentStep && styles.stepChipTextActive]}>{index + 1}. {step}</Text>
          </View>
        ))}
      </View>

      <Card>
        <Text style={styles.sectionTitle}>{stepTitle}</Text>
        <Text style={styles.helperText}>{stepSubtitle}</Text>

        {currentStep === 0 ? (
          <View style={styles.stepContent}>
            <View style={styles.row}>
              {(["round-trip", "one-way"] as const).map((type) => (
                <TouchableOpacity key={type} style={[styles.choiceChip, tripType === type && styles.choiceChipActive]} onPress={() => setTripType(type)}>
                  <Text style={[styles.choiceChipText, tripType === type && styles.choiceChipTextActive]}>{type === "round-trip" ? copy.roundTrip : copy.oneWay}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <LocationPickerField
              label={copy.origin}
              placeholder={copy.routePlaceholder}
              value={origin}
              onChange={setOrigin}
              language={language}
              mode="senior"
            />

            <View style={styles.swapRow}>
              <TouchableOpacity style={styles.swapButton} onPress={swapRoute}>
                <Text style={styles.swapButtonText}>{copy.swap}</Text>
              </TouchableOpacity>
            </View>

            <LocationPickerField
              label={copy.destination}
              placeholder={copy.routePlaceholder}
              value={destination}
              onChange={setDestination}
              language={language}
              mode="senior"
            />

            <Text style={styles.quickRoutesLabel}>{copy.quickRoutes}</Text>
            <View style={styles.quickRouteGrid}>
              {quickRoutes.map((route) => (
                <TouchableOpacity
                  key={`${route.origin.code}-${route.destination.code}`}
                  style={styles.quickRouteCard}
                  onPress={() => {
                    setOrigin(route.origin);
                    setDestination(route.destination);
                  }}
                >
                  <Text style={styles.quickRouteCode}>{route.origin.label}</Text>
                  <Text style={styles.quickRouteArrow}>{"->"}</Text>
                  <Text style={styles.quickRouteCode}>{route.destination.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {currentStep === 1 ? (
          <View style={styles.stepContent}>
            <MiniCalendarField
              label={copy.date}
              placeholder="2026-04-03"
              value={date}
              onChange={(next) => {
                setDate(next);
                if (returnDate && returnDate < next) {
                  setReturnDate("");
                }
              }}
              hint={copy.dateHint}
              language={language}
              minimumDate={todayIsoDate()}
              accentColor={theme.colors.senior}
              accentSoft={theme.colors.seniorSoft}
              fieldStyle={styles.seniorDateField}
              labelStyle={styles.seniorDateLabel}
              valueStyle={styles.seniorDateValue}
              hintStyle={styles.seniorDateHint}
            />
            {tripType === "round-trip" ? (
              <MiniCalendarField
                label={copy.returnDate}
                placeholder="2026-04-10"
                value={returnDate}
                onChange={setReturnDate}
                hint={copy.returnHint}
                language={language}
                minimumDate={isValidIsoDate(date) ? date : todayIsoDate()}
                accentColor={theme.colors.senior}
                accentSoft={theme.colors.seniorSoft}
                fieldStyle={styles.seniorDateField}
                labelStyle={styles.seniorDateLabel}
                valueStyle={styles.seniorDateValue}
                hintStyle={styles.seniorDateHint}
              />
            ) : null}

            <View style={styles.counterGroup}>
              <CounterRow label={copy.adults} hint={copy.adultsHint} value={adults} min={1} max={9} onChange={(next) => {
                setAdults(next);
                if (infants > next) setInfants(next);
              }} />
              <CounterRow label={copy.children} hint={copy.childrenHint} value={children} min={0} max={8} onChange={setChildren} />
              <CounterRow label={copy.infants} hint={copy.infantsHint} value={infants} min={0} max={adults} onChange={setInfants} />
            </View>
          </View>
        ) : null}

        {currentStep === 2 ? (
          <View style={styles.stepContent}>
            {copy.priorityOptions.map((item) => (
              <TouchableOpacity key={item.value} style={[styles.optionCard, priority === item.value && styles.optionCardActive]} onPress={() => setPriority(item.value)}>
                <Text style={[styles.optionTitle, priority === item.value && styles.optionTitleActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {currentStep === 3 ? (
          <View style={styles.stepContent}>
            <Text style={styles.groupLabel}>{copy.connectionsLabel}</Text>
            <View style={styles.row}>
              {copy.connectionOptions.map((item) => (
                <TouchableOpacity key={item.value} style={[styles.choiceChip, connections === item.value && styles.choiceChipActive]} onPress={() => setConnections(item.value)}>
                  <Text style={[styles.choiceChipText, connections === item.value && styles.choiceChipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.groupLabel}>{copy.baggageLabel}</Text>
            <View style={styles.row}>
              {copy.bagOptions.map((item) => (
                <TouchableOpacity key={item.value} style={[styles.choiceChip, bags === item.value && styles.choiceChipActive]} onPress={() => setBags(item.value)}>
                  <Text style={[styles.choiceChipText, bags === item.value && styles.choiceChipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.groupLabel}>{copy.timeLabel}</Text>
            <View style={styles.row}>
              {copy.timeOptions.map((item) => (
                <TouchableOpacity key={item.value} style={[styles.choiceChip, timePreference === item.value && styles.choiceChipActive]} onPress={() => setTimePreference(item.value)}>
                  <Text style={[styles.choiceChipText, timePreference === item.value && styles.choiceChipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.secondaryAction, currentStep === 0 && styles.secondaryActionDisabled]} disabled={currentStep === 0} onPress={() => setCurrentStep((value) => Math.max(0, value - 1))}>
            <Text style={[styles.secondaryActionText, currentStep === 0 && styles.secondaryActionTextDisabled]}>{copy.back}</Text>
          </TouchableOpacity>

          {currentStep < 3 ? (
            <PrimaryButton label={copy.next} onPress={() => setCurrentStep((value) => Math.min(3, value + 1))} disabled={!canMoveNext} style={[styles.primaryAction, styles.primarySeniorButton]} />
          ) : (
            <PrimaryButton label={copy.search} onPress={handleSearch} disabled={!canMoveNext} style={[styles.primaryAction, styles.primarySeniorButton]} />
          )}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{copy.summaryTitle}</Text>
        <View style={styles.summaryList}>
          {summaryItems.map((item) => (
            <View key={item} style={styles.summaryRow}>
              <Text style={styles.summaryText}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing(3) },
  trustRow: { flexDirection: "row", gap: theme.spacing(2) },
  trustCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: "#E7EEF9",
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    ...theme.shadow.card,
  },
  trustValue: { fontSize: 22, fontWeight: "800", color: theme.colors.gray900 },
  trustLabel: {
    marginTop: 6,
    fontSize: 11,
    color: theme.colors.gray500,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  guestBanner: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing(4),
    backgroundColor: theme.colors.seniorSoft,
    borderWidth: 1,
    borderColor: "#F2D39C",
  },
  guestBannerText: { color: theme.colors.seniorDark, fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: theme.colors.gray900 },
  helperText: { marginTop: 8, fontSize: 14, color: theme.colors.gray600, lineHeight: 21 },
  helperButton: { marginTop: theme.spacing(4) },
  stepRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2) },
  stepChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepChipActive: { borderColor: theme.colors.senior, backgroundColor: theme.colors.seniorSoft },
  stepChipText: { color: theme.colors.gray700, fontSize: 12, fontWeight: "700" },
  stepChipTextActive: { color: theme.colors.seniorDark },
  stepContent: { marginTop: theme.spacing(3), gap: theme.spacing(3) },
  row: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2) },
  swapRow: { alignItems: "center" },
  swapButton: {
    borderRadius: 999,
    backgroundColor: theme.colors.seniorSoft,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  swapButtonText: { color: theme.colors.seniorDark, fontSize: 13, fontWeight: "800" },
  choiceChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  choiceChipActive: { borderColor: theme.colors.senior, backgroundColor: theme.colors.seniorSoft },
  choiceChipText: { color: theme.colors.gray700, fontSize: 13, fontWeight: "700" },
  choiceChipTextActive: { color: theme.colors.seniorDark },
  quickRoutesLabel: { color: theme.colors.gray700, fontSize: 13, fontWeight: "800" },
  quickRouteGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2) },
  quickRouteCard: {
    minWidth: "47%",
    flexGrow: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  quickRouteCode: { fontSize: 15, fontWeight: "800", color: theme.colors.gray900 },
  quickRouteArrow: { fontSize: 14, fontWeight: "800", color: theme.colors.senior },
  counterGroup: { gap: theme.spacing(2) },
  seniorDateField: {
    borderRadius: 20,
    borderColor: theme.colors.gray200,
    backgroundColor: theme.colors.white,
  },
  seniorDateLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.gray700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  seniorDateValue: {
    fontSize: 18,
    marginTop: 8,
  },
  seniorDateHint: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.gray600,
    fontWeight: "600",
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: "#F8FAFC",
    padding: theme.spacing(3),
    gap: theme.spacing(3),
  },
  counterCopy: { flex: 1 },
  counterTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.gray900 },
  counterHint: { marginTop: 4, fontSize: 12, color: theme.colors.gray500 },
  counterControls: { flexDirection: "row", alignItems: "center", gap: theme.spacing(2) },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonDisabled: { opacity: 0.4 },
  counterButtonText: { color: theme.colors.gray900, fontSize: 20, fontWeight: "800" },
  counterValueWrap: {
    minWidth: 48,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: { fontSize: 18, fontWeight: "800", color: theme.colors.gray900 },
  optionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: theme.colors.white,
    padding: theme.spacing(4),
  },
  optionCardActive: { borderColor: theme.colors.senior, backgroundColor: theme.colors.seniorSoft },
  optionTitle: { color: theme.colors.gray700, fontSize: 15, fontWeight: "800" },
  optionTitleActive: { color: theme.colors.seniorDark },
  groupLabel: { color: theme.colors.gray700, fontSize: 13, fontWeight: "800" },
  actionRow: { marginTop: theme.spacing(4), flexDirection: "row", gap: theme.spacing(2), alignItems: "center" },
  secondaryAction: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: 14,
  },
  secondaryActionDisabled: { opacity: 0.5 },
  secondaryActionText: { color: theme.colors.gray700, fontSize: 14, fontWeight: "800" },
  secondaryActionTextDisabled: { color: theme.colors.gray500 },
  primaryAction: { flex: 1 },
  primarySeniorButton: { backgroundColor: theme.colors.senior },
  summaryList: { marginTop: theme.spacing(3), gap: theme.spacing(2) },
  summaryRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  summaryText: { color: theme.colors.gray700, fontSize: 14, lineHeight: 20, fontWeight: "600" },
});
