import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { LocationPickerField } from "../components/LocationPickerField";
import { MiniCalendarField } from "../components/MiniCalendarField";
import { PrimaryButton } from "../components/PrimaryButton";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSessionStore } from "../store/sessionStore";
import { theme } from "../theme/theme";
import { LocationSelection } from "../types/search";
import { formatDateLabel, isValidIsoDate, todayIsoDate } from "../utils/dateCalendar";

const cabinOptions = [
  {
    value: "economy",
    label: { pt: "Econômica", en: "Economy", es: "Económica" },
    hint: { pt: "Mais buscada", en: "Most popular", es: "La más elegida" },
  },
  {
    value: "premium_economy",
    label: { pt: "Premium Economy", en: "Premium Economy", es: "Premium Economy" },
    hint: { pt: "Mais espaço", en: "More space", es: "Más espacio" },
  },
  {
    value: "business",
    label: { pt: "Executiva", en: "Business", es: "Business" },
    hint: { pt: "Conforto extra", en: "Extra comfort", es: "Más comodidad" },
  },
  {
    value: "first",
    label: { pt: "Primeira classe", en: "First class", es: "Primera clase" },
    hint: { pt: "Experiência premium", en: "Premium experience", es: "Experiencia premium" },
  },
] as const;

const quickRoutes = [
  {
    origin: { code: "EWR", label: "Newark" },
    destination: { code: "MCO", label: "Orlando" },
  },
  {
    origin: { code: "EWR", label: "Newark" },
    destination: { code: "GRU", label: "São Paulo" },
  },
  {
    origin: { code: "MIA", label: "Miami" },
    destination: { code: "LIS", label: "Lisboa" },
  },
  {
    origin: { code: "MCO", label: "Orlando" },
    destination: { code: "SDQ", label: "Santo Domingo" },
  },
];

type MultiCityLegState = {
  origin: LocationSelection | null;
  destination: LocationSelection | null;
  date: string;
};

function createEmptyLeg(): MultiCityLegState {
  return {
    origin: null,
    destination: null,
    date: "",
  };
}

function CounterRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  accentSoft,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  accentSoft: string;
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

        <View style={[styles.counterValue, { backgroundColor: accentSoft }]}>
          <Text style={styles.counterValueText}>{value}</Text>
        </View>

        <TouchableOpacity
          style={[styles.counterButton, value >= max && styles.counterButtonDisabled]}
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Text style={styles.counterButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function RegularHomeScreen({ navigation }: { navigation: any }) {
  const language = useOnboardingStore((state) => state.language);
  const accessMode = useSessionStore((state) => state.accessMode);

  const [origin, setOrigin] = useState<LocationSelection | null>(null);
  const [destination, setDestination] = useState<LocationSelection | null>(null);
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [legs, setLegs] = useState<MultiCityLegState[]>([createEmptyLeg(), createEmptyLeg()]);
  const [tripType, setTripType] = useState<"one-way" | "round-trip" | "multi-city">("round-trip");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");
  const [travelerModalVisible, setTravelerModalVisible] = useState(false);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Smart search",
        title: "Build your trip in a few taps.",
        subtitle: "Choose route, dates, travelers, and cabin to compare real fares with the same clarity of the website.",
        guest: "Guest access stays active. Your reservation can still be tracked later with your booking code and email.",
        searchEyebrow: "Flight search",
        searchTitle: "Search the way customers expect",
        searchSubtitle: "Route, dates, travelers, and cabin organized in the right order.",
        roundTrip: "Round trip",
        oneWay: "One way",
        multiCity: "Multi destination",
        swap: "Swap route",
        origin: "Origin",
        destination: "Destination",
        routePlaceholder: "Choose airport or city",
        departure: "Departure",
        departurePlaceholder: "YYYY-MM-DD",
        departureHint: "Use year-month-day",
        return: "Return",
        returnPlaceholder: "YYYY-MM-DD",
        returnHint: "Only for round trip",
        travelersAndCabin: "Travelers and cabin",
        travelersHint: "Adjust travelers and choose the cabin that fits your trip.",
        search: "Search flights",
        apply: "Apply selection",
        travelersTitle: "Travelers and cabin",
        travelersSubtitle: "Review everyone traveling before opening the offers.",
        adults: "Adults",
        adultsHint: "Age 12 or older",
        children: "Children",
        childrenHint: "Age 2 to 11",
        infants: "Infants",
        infantsHint: "Under 2 years old",
        cabinTitle: "Cabin",
        previewRoute: "Route",
        previewDates: "Dates",
        previewTravelers: "Travelers",
        leg: "Leg",
        addLeg: "Add another destination",
        removeLeg: "Remove",
        quickRoutes: "Quick routes",
        quickRoutesSubtitle: "Popular routes to fill in one tap.",
        helpTitle: "Need help before choosing?",
        helpSubtitle: "Open support and continue this same search with human assistance whenever you prefer.",
        helpCta: "Open support",
        supportMini: "Talk to our team",
        person: "person",
        people: "people",
        previewTitle: "Ready before search",
      };
    }

    if (language === "es") {
      return {
        badge: "Búsqueda inteligente",
        title: "Prepare su viaje en pocos toques.",
        subtitle: "Elija ruta, fechas, pasajeros y cabina para comparar tarifas reales con la misma claridad del sitio.",
        guest: "El acceso como invitado sigue activo. Su reserva también podrá consultarse después con su código y correo.",
        searchEyebrow: "Búsqueda de vuelos",
        searchTitle: "Busque como el cliente espera",
        searchSubtitle: "Ruta, fechas, pasajeros y cabina organizados en el orden correcto.",
        roundTrip: "Ida y vuelta",
        oneWay: "Solo ida",
        multiCity: "Multi destino",
        swap: "Cambiar ruta",
        origin: "Origen",
        destination: "Destino",
        routePlaceholder: "Elija aeropuerto o ciudad",
        departure: "Salida",
        departurePlaceholder: "AAAA-MM-DD",
        departureHint: "Use año-mes-día",
        return: "Regreso",
        returnPlaceholder: "AAAA-MM-DD",
        returnHint: "Solo para ida y vuelta",
        travelersAndCabin: "Pasajeros y cabina",
        travelersHint: "Ajuste pasajeros y elija la cabina adecuada para este viaje.",
        search: "Buscar vuelos",
        apply: "Aplicar selección",
        travelersTitle: "Pasajeros y cabina",
        travelersSubtitle: "Revise quién viaja antes de abrir las ofertas.",
        adults: "Adultos",
        adultsHint: "12 años o más",
        children: "Niños",
        childrenHint: "De 2 a 11 años",
        infants: "Bebés",
        infantsHint: "Menos de 2 años",
        cabinTitle: "Cabina",
        previewRoute: "Ruta",
        previewDates: "Fechas",
        previewTravelers: "Pasajeros",
        leg: "Tramo",
        addLeg: "Agregar otro destino",
        removeLeg: "Quitar",
        quickRoutes: "Rutas rápidas",
        quickRoutesSubtitle: "Rutas populares para completar en un toque.",
        helpTitle: "¿Necesita ayuda antes de elegir?",
        helpSubtitle: "Abra soporte y continúe esta misma búsqueda con ayuda humana cuando lo prefiera.",
        helpCta: "Abrir soporte",
        supportMini: "Hablar con el equipo",
        person: "persona",
        people: "personas",
        previewTitle: "Todo listo antes de buscar",
      };
    }

    return {
      badge: "Busca inteligente",
      title: "Monte sua viagem em poucos toques.",
      subtitle: "Escolha rota, datas, passageiros e cabine para comparar tarifas reais com a mesma clareza do site.",
      guest: "O acesso como convidado continua ativo. Sua reserva também poderá ser consultada depois com seu código e e-mail.",
      searchEyebrow: "Busca de voos",
      searchTitle: "Busque do jeito que o cliente espera",
      searchSubtitle: "Rota, datas, passageiros e cabine organizados na ordem certa.",
      roundTrip: "Ida e volta",
      oneWay: "Só ida",
      multiCity: "Multi destino",
      swap: "Trocar rota",
      origin: "Origem",
      destination: "Destino",
      routePlaceholder: "Escolha aeroporto ou cidade",
      departure: "Saída",
      departurePlaceholder: "AAAA-MM-DD",
      departureHint: "Use ano-mês-dia",
      return: "Volta",
      returnPlaceholder: "AAAA-MM-DD",
      returnHint: "Só para ida e volta",
      travelersAndCabin: "Passageiros e cabine",
      travelersHint: "Ajuste os passageiros e escolha a cabine ideal para esta viagem.",
      search: "Buscar voos",
      apply: "Aplicar seleção",
      travelersTitle: "Passageiros e cabine",
      travelersSubtitle: "Revise quem vai viajar antes de abrir as ofertas.",
      adults: "Adultos",
      adultsHint: "12 anos ou mais",
      children: "Crianças",
      childrenHint: "De 2 a 11 anos",
      infants: "Bebês",
      infantsHint: "Menos de 2 anos",
      cabinTitle: "Cabine",
      previewRoute: "Rota",
      previewDates: "Datas",
      previewTravelers: "Passageiros",
      leg: "Trecho",
      addLeg: "Adicionar outro destino",
      removeLeg: "Remover",
      quickRoutes: "Rotas rápidas",
      quickRoutesSubtitle: "Rotas populares para preencher em um toque.",
      helpTitle: "Precisa de ajuda antes de escolher?",
      helpSubtitle: "Abra o suporte e continue esta mesma busca com ajuda humana sempre que preferir.",
      helpCta: "Abrir suporte",
      supportMini: "Falar com a equipe",
      person: "pessoa",
      people: "pessoas",
      previewTitle: "Tudo pronto antes da busca",
    };
  }, [language]);

  const palette = {
    accent: theme.colors.primary,
    accentDark: theme.colors.primaryDark,
    accentSoft: theme.colors.primarySoft,
  };

  const travelers = adults + children + infants;
  const cabinLabel = cabinOptions.find((option) => option.value === cabinClass)?.label[language] ?? cabinClass;
  const travelerLabel = `${travelers} ${travelers === 1 ? copy.person : copy.people}`;
  const routeReady = Boolean(origin?.code && destination?.code);
  const dateReady = isValidIsoDate(date) && (tripType === "one-way" || (isValidIsoDate(returnDate) && returnDate >= date));
  const multiCityReady = legs.length >= 2 && legs.every((leg) => leg.origin?.code && leg.destination?.code && isValidIsoDate(leg.date));
  const searchDisabled = tripType === "multi-city" ? !multiCityReady : !routeReady || !dateReady;

  const updateLeg = (index: number, patch: Partial<MultiCityLegState>) => {
    setLegs((current) => current.map((leg, legIndex) => (legIndex === index ? { ...leg, ...patch } : leg)));
  };

  const addLeg = () => {
    setLegs((current) => {
      if (current.length >= 5) {
        return current;
      }

      const previous = current[current.length - 1];
      return [
        ...current,
        {
          origin: previous.destination ?? null,
          destination: null,
          date: "",
        },
      ];
    });
  };

  const removeLeg = (index: number) => {
    setLegs((current) => {
      if (current.length <= 2) {
        return current;
      }

      return current.filter((_, legIndex) => legIndex !== index);
    });
  };

  const previewItems = [
    ...(tripType === "multi-city"
      ? legs.map((leg, index) => {
          if (!leg.origin?.code || !leg.destination?.code || !isValidIsoDate(leg.date)) {
            return null;
          }

          return `${copy.leg} ${index + 1}: ${leg.origin.label} (${leg.origin.code}) -> ${leg.destination.label} (${leg.destination.code}) · ${formatDateLabel(leg.date, language)}`;
        })
      : [
          routeReady ? `${copy.previewRoute}: ${origin?.label} (${origin?.code}) -> ${destination?.label} (${destination?.code})` : null,
          isValidIsoDate(date)
            ? `${copy.previewDates}: ${formatDateLabel(date, language)}${tripType === "round-trip" && isValidIsoDate(returnDate) ? ` · ${formatDateLabel(returnDate, language)}` : ""}`
            : null,
        ]),
    `${copy.previewTravelers}: ${travelerLabel} · ${cabinLabel}`,
  ].filter(Boolean);

  const handleSearch = () => {
    if (tripType === "multi-city") {
      if (!multiCityReady) {
        return;
      }

      navigation.navigate("RegularResults", {
        search: {
          origin: legs[0].origin?.code || "",
          destination: legs[legs.length - 1].destination?.code || "",
          date: legs[0].date,
          tripType,
          passengers: String(travelers),
          adults: String(adults),
          children: String(children),
          infants: String(infants),
          cabinClass,
          legs: legs.map((leg) => ({
            origin: leg.origin?.code || "",
            destination: leg.destination?.code || "",
            date: leg.date,
          })),
        },
      });
      return;
    }

    if (!origin?.code || !destination?.code) {
      return;
    }

    navigation.navigate("RegularResults", {
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
        cabinClass,
      },
    });
  };

  const swapRoute = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <AppShell mode="regular" badge={copy.badge} title={copy.title} subtitle={copy.subtitle} contentStyle={styles.container} heroSize="expanded" reserveBottomNav>
      {accessMode === "guest" ? (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerText}>{copy.guest}</Text>
        </View>
      ) : null}

      <Card>
        <Text style={styles.eyebrow}>{copy.searchEyebrow}</Text>
        <Text style={styles.sectionTitle}>{copy.searchTitle}</Text>
        <Text style={styles.sectionSubtitle}>{copy.searchSubtitle}</Text>

        <View style={styles.tripTypeRow}>
          {(["round-trip", "one-way", "multi-city"] as const).map((type) => {
            const active = tripType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.tripTypeChip,
                  active && { borderColor: palette.accent, backgroundColor: palette.accentSoft },
                ]}
                onPress={() => setTripType(type)}
              >
                <Text style={[styles.tripTypeText, active && { color: palette.accentDark }]}>
                  {type === "round-trip" ? copy.roundTrip : type === "one-way" ? copy.oneWay : copy.multiCity}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.formStack}>
          {tripType === "multi-city" ? (
            <View style={styles.multiCityStack}>
              {legs.map((leg, index) => (
                <View key={`leg-${index}`} style={styles.legCard}>
                  <View style={styles.legHeader}>
                    <Text style={styles.legTitle}>{copy.leg} {index + 1}</Text>
                    {legs.length > 2 ? (
                      <TouchableOpacity style={styles.legRemoveButton} onPress={() => removeLeg(index)}>
                        <Text style={styles.legRemoveText}>{copy.removeLeg}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <LocationPickerField
                    label={copy.origin}
                    placeholder={copy.routePlaceholder}
                    value={leg.origin}
                    onChange={(next) => updateLeg(index, { origin: next })}
                    language={language}
                    mode="regular"
                  />

                  <LocationPickerField
                    label={copy.destination}
                    placeholder={copy.routePlaceholder}
                    value={leg.destination}
                    onChange={(next) => updateLeg(index, { destination: next })}
                    language={language}
                    mode="regular"
                  />

                  <MiniCalendarField
                    modalTitle={`${copy.leg} ${index + 1}`}
                    label={copy.departure}
                    value={leg.date}
                    onChange={(next) => updateLeg(index, { date: next })}
                    placeholder={copy.departurePlaceholder}
                    hint={copy.departureHint}
                    language={language}
                    minimumDate={index === 0 ? todayIsoDate() : legs[index - 1]?.date || todayIsoDate()}
                    accentColor={palette.accent}
                    accentSoft={palette.accentSoft}
                    fieldStyle={styles.dateField}
                    labelStyle={styles.dateLabel}
                    valueStyle={styles.dateInput}
                    hintStyle={styles.dateHint}
                  />
                </View>
              ))}

              {legs.length < 5 ? (
                <TouchableOpacity style={styles.addLegButton} onPress={addLeg}>
                  <Text style={styles.addLegText}>{copy.addLeg}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <>
              <LocationPickerField
                label={copy.origin}
                placeholder={copy.routePlaceholder}
                value={origin}
                onChange={setOrigin}
                language={language}
                mode="regular"
              />

              <View style={styles.swapRow}>
                <TouchableOpacity style={[styles.swapButton, { backgroundColor: palette.accentSoft }]} onPress={swapRoute}>
                  <Text style={[styles.swapButtonText, { color: palette.accentDark }]}>{copy.swap}</Text>
                </TouchableOpacity>
              </View>

              <LocationPickerField
                label={copy.destination}
                placeholder={copy.routePlaceholder}
                value={destination}
                onChange={setDestination}
                language={language}
                mode="regular"
              />

              <View style={styles.dateGrid}>
                <MiniCalendarField
                  label={copy.departure}
                  value={date}
                  onChange={(next) => {
                    setDate(next);
                    if (returnDate && returnDate < next) {
                      setReturnDate("");
                    }
                  }}
                  placeholder={copy.departurePlaceholder}
                  hint={copy.departureHint}
                  language={language}
                  minimumDate={todayIsoDate()}
                  accentColor={palette.accent}
                  accentSoft={palette.accentSoft}
                  fieldStyle={styles.dateField}
                  labelStyle={styles.dateLabel}
                  valueStyle={styles.dateInput}
                  hintStyle={styles.dateHint}
                />

                {tripType === "round-trip" ? (
                  <MiniCalendarField
                    label={copy.return}
                    value={returnDate}
                    onChange={setReturnDate}
                    placeholder={copy.returnPlaceholder}
                    hint={copy.returnHint}
                    language={language}
                    minimumDate={isValidIsoDate(date) ? date : todayIsoDate()}
                    accentColor={palette.accent}
                    accentSoft={palette.accentSoft}
                    fieldStyle={styles.dateField}
                    labelStyle={styles.dateLabel}
                    valueStyle={styles.dateInput}
                    hintStyle={styles.dateHint}
                  />
                ) : null}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.summaryField} onPress={() => setTravelerModalVisible(true)}>
            <Text style={styles.summaryLabel}>{copy.travelersAndCabin}</Text>
            <Text style={styles.summaryValue}>{travelerLabel}</Text>
            <Text style={styles.summaryHint}>{`${cabinLabel} · ${copy.travelersHint}`}</Text>
          </TouchableOpacity>

          <View style={styles.previewPanel}>
            <Text style={styles.previewTitle}>{copy.previewTitle}</Text>
            {previewItems.map((item) => (
              <View key={item} style={styles.previewItem}>
                <Text style={styles.previewText}>{item}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton label={copy.search} onPress={handleSearch} disabled={searchDisabled} style={styles.primaryCta} />
        </View>
      </Card>

      <Card>
        <View style={styles.utilityHeader}>
          <View style={styles.utilityHeaderCopy}>
            <Text style={styles.sectionTitle}>{copy.quickRoutes}</Text>
            <Text style={styles.utilitySubtitle}>{copy.quickRoutesSubtitle}</Text>
          </View>
          <TouchableOpacity style={styles.utilitySupportButton} onPress={() => navigation.navigate("RegularHelp")}>
            <Text style={styles.utilitySupportText}>{copy.supportMini}</Text>
          </TouchableOpacity>
        </View>

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
              <Text style={styles.quickRouteCodeRow}>
                {route.origin.code} {"->"} {route.destination.code}
              </Text>
              <Text style={styles.quickRouteTitle}>
                {route.origin.label} {"->"} {route.destination.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Modal visible={travelerModalVisible} transparent animationType="fade" onRequestClose={() => setTravelerModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setTravelerModalVisible(false)}>
          <Pressable style={styles.modalPanel} onPress={(event) => event.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{copy.travelersTitle}</Text>
              <Text style={styles.modalSubtitle}>{copy.travelersSubtitle}</Text>

              <View style={styles.modalSection}>
                <CounterRow
                  label={copy.adults}
                  hint={copy.adultsHint}
                  value={adults}
                  min={1}
                  max={9}
                  onChange={(next) => {
                    setAdults(next);
                    if (infants > next) {
                      setInfants(next);
                    }
                  }}
                  accentSoft={palette.accentSoft}
                />
                <CounterRow
                  label={copy.children}
                  hint={copy.childrenHint}
                  value={children}
                  min={0}
                  max={8}
                  onChange={setChildren}
                  accentSoft={palette.accentSoft}
                />
                <CounterRow
                  label={copy.infants}
                  hint={copy.infantsHint}
                  value={infants}
                  min={0}
                  max={adults}
                  onChange={setInfants}
                  accentSoft={palette.accentSoft}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>{copy.cabinTitle}</Text>
                <View style={styles.cabinGrid}>
                  {cabinOptions.map((option) => {
                    const active = cabinClass === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.cabinCard,
                          active && { borderColor: palette.accent, backgroundColor: palette.accentSoft },
                        ]}
                        onPress={() => setCabinClass(option.value)}
                      >
                        <Text style={[styles.cabinTitle, active && { color: palette.accentDark }]}>
                          {option.label[language]}
                        </Text>
                        <Text style={styles.cabinHint}>{option.hint[language]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <PrimaryButton label={copy.apply} onPress={() => setTravelerModalVisible(false)} style={styles.primaryCta} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing(3),
  },
  guestBanner: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.warningSoft,
    borderWidth: 1,
    borderColor: "rgba(232,156,0,0.2)",
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
  },
  guestBannerText: {
    color: theme.colors.warning,
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: theme.colors.primary,
  },
  sectionTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.gray900,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.gray600,
    fontWeight: "500",
  },
  tripTypeRow: {
    marginTop: theme.spacing(3),
    flexDirection: "row",
    gap: theme.spacing(1.5),
  },
  tripTypeChip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: 8,
  },
  tripTypeText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.gray600,
  },
  formStack: {
    marginTop: theme.spacing(3),
    gap: theme.spacing(2.5),
  },
  swapButton: {
    alignSelf: "center",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: 8,
    ...theme.shadow.xs,
  },
  swapText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.gray600,
  },
  dateRow: {
    flexDirection: "row",
    gap: theme.spacing(2),
  },
  dateField: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(3.5),
    paddingVertical: theme.spacing(3),
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: theme.colors.gray500,
  },
  dateInput: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.gray900,
    paddingVertical: 0,
  },
  dateHint: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.gray500,
    fontWeight: "600",
  },
  summaryField: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3.5),
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: theme.colors.gray500,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  summaryHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.gray600,
  },
  previewPanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineSoft,
    backgroundColor: theme.colors.surfaceSoft,
    padding: theme.spacing(3),
    gap: theme.spacing(2),
  },
  previewTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewItem: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2.5),
    borderWidth: 1,
    borderColor: theme.colors.outlineSoft,
  },
  previewText: {
    color: theme.colors.gray700,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  primaryCta: {
    marginTop: theme.spacing(1),
  },
  quickRouteGrid: {
    marginTop: theme.spacing(3),
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(2),
  },
  quickRouteCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    minWidth: "47%",
    flexGrow: 1,
    ...theme.shadow.xs,
  },
  quickRouteCodeRow: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },
  quickRouteTitle: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.gray900,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,15,40,0.46)",
    justifyContent: "center",
    padding: theme.spacing(4),
  },
  modalPanel: {
    maxHeight: "86%",
    borderRadius: theme.radius.xxl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(4),
    borderWidth: 1,
    borderColor: theme.colors.outline,
    ...theme.shadow.floating,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.gray900,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 20,
    color: theme.colors.gray600,
  },
  modalSection: {
    marginTop: theme.spacing(4),
    gap: theme.spacing(2),
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.gray700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(3),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(3.5),
    paddingVertical: theme.spacing(3),
  },
  counterCopy: {
    flex: 1,
  },
  counterTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  counterHint: {
    marginTop: 3,
    fontSize: 12,
    color: theme.colors.gray500,
  },
  counterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  counterButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.xs,
  },
  counterButtonDisabled: {
    opacity: 0.4,
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  counterValue: {
    minWidth: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 9,
    backgroundColor: theme.colors.primarySoft,
  },
  counterValueText: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  cabinGrid: {
    gap: theme.spacing(2),
  },
  cabinCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3.5),
  },
  cabinTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  cabinHint: {
    marginTop: 5,
    fontSize: 13,
    color: theme.colors.gray600,
  },
  multiCityStack: {
    gap: theme.spacing(2),
  },
  legCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    padding: theme.spacing(3.5),
    gap: theme.spacing(2),
  },
  legHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.gray700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  legRemoveButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.dangerSoft,
  },
  legRemoveText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.danger,
  },
  addLegButton: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: theme.colors.primaryMist,
  },
  addLegText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  counterValueWrap: {
    minWidth: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 9,
    backgroundColor: theme.colors.primarySoft,
  },
});
