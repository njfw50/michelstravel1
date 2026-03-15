import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { SeniorFlightCard } from "@/components/senior-flight-card";
import { useAuthCustom } from "@/hooks/use-auth-custom";
import { apiClient } from "@/lib/api-client";
import { AGENCY_PHONE_TEL, buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import { buildSeniorRecommendations, formatCurrency } from "@/lib/senior-flight";
import { CustomerProfile } from "@/types";
import {
  FlightOffer,
  NativeCabinClass,
  NativeTripType,
  SeniorBagPreference,
  SeniorConnectionPreference,
  SeniorPriority,
  SeniorTimePreference,
} from "@/types/flights";

type PlannerStage = "planner" | "outbound" | "inbound" | "summary";

const routePresets = [
  { label: "Newark -> Sao Paulo", origin: "EWR", destination: "GRU" },
  { label: "Newark -> Rio", origin: "EWR", destination: "GIG" },
  { label: "Newark -> Orlando", origin: "EWR", destination: "MCO" },
  { label: "Newark -> Miami", origin: "EWR", destination: "MIA" },
];

const tripTypeOptions: Array<{ label: string; value: NativeTripType }> = [
  { label: "Ida e volta", value: "round_trip" },
  { label: "Somente ida", value: "one_way" },
];

const cabinOptions: Array<{ label: string; value: NativeCabinClass }> = [
  { label: "Economy", value: "economy" },
  { label: "Business", value: "business" },
];

const priorityOptions: Array<{ label: string; value: SeniorPriority }> = [
  { label: "Menos cansaco", value: "comfort" },
  { label: "Mais rapido", value: "fastest" },
  { label: "Equilibrado", value: "balanced" },
  { label: "Menor preco", value: "cheapest" },
];

const connectionOptions: Array<{ label: string; value: SeniorConnectionPreference }> = [
  { label: "Sem conexao", value: "none" },
  { label: "Ate 1 conexao", value: "one" },
  { label: "Se precisar", value: "any" },
];

const bagOptions: Array<{ label: string; value: SeniorBagPreference }> = [
  { label: "Mala despachada", value: "checked" },
  { label: "Bagagem de mao", value: "carry" },
  { label: "Posso decidir", value: "flexible" },
];

const timeOptions: Array<{ label: string; value: SeniorTimePreference }> = [
  { label: "Evitar madrugada", value: "day" },
  { label: "Qualquer horario", value: "any" },
];

function getFutureDate(daysFromToday: number) {
  const value = new Date();
  value.setDate(value.getDate() + daysFromToday);
  return value.toISOString().slice(0, 10);
}

function normalizeAirport(value: string) {
  return value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3);
}

function ChoiceGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View className="mt-4">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              className={`rounded-full px-4 py-3 ${selected ? "bg-primary" : "border border-border bg-background"}`}
              onPress={() => onChange(option.value)}
              activeOpacity={0.85}
            >
              <Text className={`text-sm font-semibold ${selected ? "text-background" : "text-foreground"}`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function CounterControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View className="rounded-[22px] border border-border bg-background px-4 py-4">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <View className="mt-3 flex-row items-center justify-between">
        <TouchableOpacity
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
          onPress={() => onChange(Math.max(0, value - 1))}
          activeOpacity={0.85}
        >
          <Text className="text-xl font-bold text-foreground">-</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">{value}</Text>
        <TouchableOpacity
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
          onPress={() => onChange(value + 1)}
          activeOpacity={0.85}
        >
          <Text className="text-xl font-bold text-foreground">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function mapSeniorConnectionToProfile(
  connections: SeniorConnectionPreference,
  priority: SeniorPriority,
): CustomerProfile["connectionTolerance"] {
  if (connections === "none") return "avoid";
  if (connections === "one") return "one_stop";
  return priority === "cheapest" ? "price_first" : "balanced";
}

async function openExternalLink(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert("Nao foi possivel abrir", "Seu aparelho nao conseguiu abrir esse link agora.");
    return;
  }

  await Linking.openURL(url);
}

export default function SearchFlowScreen() {
  const { profile, setProfile } = useAuthCustom();
  const [stage, setStage] = useState<PlannerStage>("planner");
  const [tripType, setTripType] = useState<NativeTripType>("round_trip");
  const [origin, setOrigin] = useState(profile?.preferredAirport || "EWR");
  const [destination, setDestination] = useState("GRU");
  const [departureDate, setDepartureDate] = useState(getFutureDate(21));
  const [returnDate, setReturnDate] = useState(getFutureDate(35));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<NativeCabinClass>("economy");
  const [priority, setPriority] = useState<SeniorPriority>("comfort");
  const [connections, setConnections] = useState<SeniorConnectionPreference>(
    profile?.connectionTolerance === "avoid"
      ? "none"
      : profile?.connectionTolerance === "one_stop"
        ? "one"
        : "any",
  );
  const [bags, setBags] = useState<SeniorBagPreference>(profile?.bagsPreference || "checked");
  const [timePreference, setTimePreference] = useState<SeniorTimePreference>("day");
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [outboundFlights, setOutboundFlights] = useState<FlightOffer[]>([]);
  const [inboundFlights, setInboundFlights] = useState<FlightOffer[]>([]);
  const [selectedOutboundId, setSelectedOutboundId] = useState<string | null>(null);
  const [selectedInboundId, setSelectedInboundId] = useState<string | null>(null);

  const preferences = useMemo(
    () => ({
      priority,
      connections,
      bags,
      time: timePreference,
    }),
    [bags, connections, priority, timePreference],
  );

  const outboundAnalysis = useMemo(
    () => buildSeniorRecommendations(outboundFlights, preferences),
    [outboundFlights, preferences],
  );
  const inboundAnalysis = useMemo(
    () => buildSeniorRecommendations(inboundFlights, preferences),
    [inboundFlights, preferences],
  );

  const selectedOutbound = useMemo(
    () => outboundAnalysis.rankedFlights.find((item) => item.flight.id === selectedOutboundId) || null,
    [outboundAnalysis.rankedFlights, selectedOutboundId],
  );
  const selectedInbound = useMemo(
    () => inboundAnalysis.rankedFlights.find((item) => item.flight.id === selectedInboundId) || null,
    [inboundAnalysis.rankedFlights, selectedInboundId],
  );

  const totalPassengers = adults + children + infants;
  const totalPrice = (selectedOutbound?.flight.price || 0) + (selectedInbound?.flight.price || 0);

  const handlePreset = (preset: { origin: string; destination: string }) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
  };

  const validatePlanner = () => {
    if (normalizeAirport(origin).length !== 3 || normalizeAirport(destination).length !== 3) {
      setSearchError("Use aeroportos com 3 letras, como EWR, GRU, GIG ou MCO.");
      return false;
    }

    if (!departureDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setSearchError("Digite a data da ida no formato YYYY-MM-DD.");
      return false;
    }

    if (tripType === "round_trip" && !returnDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setSearchError("Digite a data da volta no formato YYYY-MM-DD.");
      return false;
    }

    if (totalPassengers <= 0) {
      setSearchError("Escolha pelo menos 1 passageiro.");
      return false;
    }

    if (infants > adults) {
      setSearchError("Cada bebe precisa viajar com pelo menos 1 adulto.");
      return false;
    }

    return true;
  };

  const handleSearch = async () => {
    if (!validatePlanner()) {
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      setSelectedOutboundId(null);
      setSelectedInboundId(null);

      const normalizedOrigin = normalizeAirport(origin);
      const normalizedDestination = normalizeAirport(destination);

      const outbound = await apiClient.searchFlights({
        origin: normalizedOrigin,
        destination: normalizedDestination,
        date: departureDate,
        adults,
        children,
        infants,
        cabinClass,
      });

      if (outbound.length === 0) {
        setSearchError("Nao encontramos voos para a ida nessa combinacao. Tente outra data ou rota.");
        setStage("planner");
        setOutboundFlights([]);
        setInboundFlights([]);
        return;
      }

      let inbound: FlightOffer[] = [];
      if (tripType === "round_trip") {
        inbound = await apiClient.searchFlights({
          origin: normalizedDestination,
          destination: normalizedOrigin,
          date: returnDate,
          adults,
          children,
          infants,
          cabinClass,
        });

        if (inbound.length === 0) {
          setSearchError("Encontramos a ida, mas ainda nao encontramos a volta. Tente mudar a data da volta.");
          setStage("planner");
          setOutboundFlights([]);
          setInboundFlights([]);
          return;
        }
      }

      setOutboundFlights(outbound);
      setInboundFlights(inbound);
      setStage("outbound");
    } catch (error: any) {
      setSearchError(
        error?.response?.data?.error
        || error?.message
        || "Nao foi possivel buscar os voos agora. Tente novamente em instantes.",
      );
      setStage("planner");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectOutbound = (flightId: string) => {
    setSelectedOutboundId(flightId);
    if (tripType === "one_way") {
      setStage("summary");
      return;
    }
    setStage("inbound");
  };

  const handleSelectInbound = (flightId: string) => {
    setSelectedInboundId(flightId);
    setStage("summary");
  };

  const handleSavePlan = async () => {
    try {
      if (!selectedOutbound) {
        Alert.alert("Escolha a viagem", "Selecione pelo menos a ida antes de guardar o plano.");
        return;
      }

      setIsSavingPlan(true);
      const nextProfile = await apiClient.updateProfile({
        preferredAirport: normalizeAirport(origin),
        connectionTolerance: mapSeniorConnectionToProfile(connections, priority),
        bagsPreference: bags,
        needsHumanHelp: true,
        seniorAssistantEnabled: true,
        lastActiveOfferId: tripType === "round_trip"
          ? `${selectedOutbound.flight.id}|${selectedInbound?.flight.id || ""}`.slice(0, 120)
          : selectedOutbound.flight.id,
      });
      await setProfile(nextProfile);
      Alert.alert("Plano guardado", "Sua escolha ficou salva para voce continuar depois.");
    } catch (error: any) {
      Alert.alert(
        "Nao foi possivel guardar",
        error?.response?.data?.error || error?.message || "Tente novamente em instantes.",
      );
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleShareWithTeam = async () => {
    const details = [
      `Rota: ${normalizeAirport(origin)} -> ${normalizeAirport(destination)}`,
      `Tipo de viagem: ${tripType === "round_trip" ? "Ida e volta" : "Somente ida"}`,
      `Ida: ${departureDate}`,
      tripType === "round_trip" ? `Volta: ${returnDate}` : null,
      selectedOutbound ? `Voo de ida: ${selectedOutbound.flight.airline} por ${formatCurrency(selectedOutbound.flight.price, selectedOutbound.flight.currency)}` : null,
      selectedInbound ? `Voo de volta: ${selectedInbound.flight.airline} por ${formatCurrency(selectedInbound.flight.price, selectedInbound.flight.currency)}` : null,
      `Passageiros: ${adults} adulto(s), ${children} crianca(s), ${infants} bebe(s)`,
    ];

    const message = buildWhatsAppMessage({
      language: profile?.preferredLanguage || "pt",
      topic: "Quero ajuda com a viagem que escolhi no app senior",
      details,
    });

    await openExternalLink(buildWhatsAppHref(message));
  };

  const handleCallTeam = async () => {
    await openExternalLink(`tel:${AGENCY_PHONE_TEL}`);
  };

  const featuredOutbound = outboundAnalysis.recommendations;
  const extraOutbound = outboundAnalysis.rankedFlights
    .filter((item) => !featuredOutbound.some((highlight) => highlight.flight.id === item.flight.id))
    .slice(0, 4);
  const featuredInbound = inboundAnalysis.recommendations;
  const extraInbound = inboundAnalysis.rankedFlights
    .filter((item) => !featuredInbound.some((highlight) => highlight.flight.id === item.flight.id))
    .slice(0, 4);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="rounded-[28px] border border-border bg-surface px-5 py-5">
          <Text className="text-xs font-semibold uppercase tracking-[1px] text-primary">Planejador senior</Text>
          <Text className="mt-3 text-3xl font-bold text-foreground">Buscar com calma</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Primeiro voce diz o que importa mais. Depois o app mostra a ida, a volta e explica por que cada opcao pode ser boa para voce.
          </Text>

          <View className="mt-5 rounded-[24px] bg-background px-4 py-4">
            <Text className="text-sm font-semibold text-foreground">Suas preferencias atuais</Text>
            <Text className="mt-2 text-sm leading-6 text-muted">
              {priority === "comfort"
                ? "Menos cansaco"
                : priority === "fastest"
                  ? "Mais rapido"
                  : priority === "balanced"
                    ? "Equilibrado"
                    : "Preco primeiro"}
              {" · "}
              {connections === "none" ? "Sem conexao" : connections === "one" ? "Ate 1 conexao" : "Conexao se precisar"}
              {" · "}
              {bags === "checked" ? "Mala despachada" : bags === "carry" ? "Bagagem de mao" : "Bagagem flexivel"}
            </Text>
          </View>
        </View>

        {stage === "planner" ? (
          <>
            <View className="mt-6 rounded-[28px] border border-border bg-surface px-5 py-5">
              <Text className="text-lg font-bold text-foreground">Rotas mais usadas</Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {routePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    className="rounded-full border border-border bg-background px-4 py-3"
                    onPress={() => handlePreset(preset)}
                    activeOpacity={0.85}
                  >
                    <Text className="text-sm font-semibold text-foreground">{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mt-4 rounded-[28px] border border-border bg-surface px-5 py-5">
              <ChoiceGroup title="Tipo de viagem" options={tripTypeOptions} value={tripType} onChange={setTripType} />
              <ChoiceGroup title="Cabine" options={cabinOptions} value={cabinClass} onChange={setCabinClass} />

              <View className="mt-4 gap-3">
                <View>
                  <Text className="text-sm font-semibold text-foreground">Origem</Text>
                  <TextInput
                    className="mt-3 rounded-[20px] border border-border bg-background px-4 py-4 text-base text-foreground"
                    value={origin}
                    onChangeText={(value) => setOrigin(normalizeAirport(value))}
                    placeholder="EWR"
                    placeholderTextColor="#8C98AE"
                    autoCapitalize="characters"
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-foreground">Destino</Text>
                  <TextInput
                    className="mt-3 rounded-[20px] border border-border bg-background px-4 py-4 text-base text-foreground"
                    value={destination}
                    onChangeText={(value) => setDestination(normalizeAirport(value))}
                    placeholder="GRU"
                    placeholderTextColor="#8C98AE"
                    autoCapitalize="characters"
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-foreground">Data da ida</Text>
                  <TextInput
                    className="mt-3 rounded-[20px] border border-border bg-background px-4 py-4 text-base text-foreground"
                    value={departureDate}
                    onChangeText={setDepartureDate}
                    placeholder="2026-04-15"
                    placeholderTextColor="#8C98AE"
                  />
                </View>
                {tripType === "round_trip" ? (
                  <View>
                    <Text className="text-sm font-semibold text-foreground">Data da volta</Text>
                    <TextInput
                      className="mt-3 rounded-[20px] border border-border bg-background px-4 py-4 text-base text-foreground"
                      value={returnDate}
                      onChangeText={setReturnDate}
                      placeholder="2026-05-02"
                      placeholderTextColor="#8C98AE"
                    />
                  </View>
                ) : null}
              </View>
            </View>

            <View className="mt-4 rounded-[28px] border border-border bg-surface px-5 py-5">
              <Text className="text-lg font-bold text-foreground">Quem vai viajar</Text>
              <View className="mt-4 gap-3">
                <CounterControl label="Adultos" value={adults} onChange={(value) => setAdults(Math.max(1, value))} />
                <CounterControl label="Criancas" value={children} onChange={setChildren} />
                <CounterControl label="Bebes" value={infants} onChange={setInfants} />
              </View>
            </View>

            <View className="mt-4 rounded-[28px] border border-border bg-surface px-5 py-5">
              <Text className="text-lg font-bold text-foreground">O que e mais importante para voce</Text>
              <ChoiceGroup title="Prioridade" options={priorityOptions} value={priority} onChange={setPriority} />
              <ChoiceGroup title="Conexao" options={connectionOptions} value={connections} onChange={setConnections} />
              <ChoiceGroup title="Bagagem" options={bagOptions} value={bags} onChange={setBags} />
              <ChoiceGroup title="Horario" options={timeOptions} value={timePreference} onChange={setTimePreference} />
            </View>

            {searchError ? (
              <View className="mt-4 rounded-[24px] border border-error/20 bg-error/10 px-4 py-4">
                <Text className="text-sm leading-6 text-error">{searchError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className={`mt-6 rounded-[24px] bg-primary px-5 py-5 ${isSearching ? "opacity-70" : ""}`}
              onPress={handleSearch}
              activeOpacity={0.85}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-center text-base font-semibold text-background">
                  Procurar voos com calma
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}

        {stage === "outbound" ? (
          <>
            <View className="mt-6 rounded-[28px] border border-border bg-surface px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">Passo 1</Text>
              <Text className="mt-3 text-2xl font-bold text-foreground">
                Escolha primeiro a sua ida
              </Text>
              <Text className="mt-2 text-sm leading-6 text-muted">
                Separamos as melhores opcoes para cansar menos. Voce escolhe a ida primeiro e a volta depois.
              </Text>
            </View>

            <View className="mt-4 gap-4">
              {featuredOutbound.map((option) => (
                <SeniorFlightCard
                  key={option.flight.id}
                  recommendation={option}
                  ctaLabel="Escolher esta ida"
                  onPress={() => handleSelectOutbound(option.flight.id)}
                />
              ))}
            </View>

            {extraOutbound.length > 0 ? (
              <View className="mt-6">
                <Text className="text-lg font-bold text-foreground">Mais opcoes de ida</Text>
                <View className="mt-4 gap-4">
                  {extraOutbound.map((option) => (
                    <SeniorFlightCard
                      key={option.flight.id}
                      recommendation={option}
                      ctaLabel="Escolher esta ida"
                      onPress={() => handleSelectOutbound(option.flight.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              className="mt-6 rounded-[22px] border border-border bg-background px-5 py-4"
              onPress={() => setStage("planner")}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-foreground">Mudar a busca</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {stage === "inbound" ? (
          <>
            {selectedOutbound ? (
              <View className="mt-6 rounded-[28px] border border-border bg-surface px-5 py-5">
                <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">Sua ida escolhida</Text>
                <Text className="mt-3 text-lg font-bold text-foreground">
                  {selectedOutbound.flight.airline} por {formatCurrency(selectedOutbound.flight.price, selectedOutbound.flight.currency)}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-muted">{selectedOutbound.insight.reasonLine}</Text>
              </View>
            ) : null}

            <View className="mt-4 rounded-[28px] border border-border bg-surface px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">Passo 2</Text>
              <Text className="mt-3 text-2xl font-bold text-foreground">
                Agora escolha a sua volta
              </Text>
              <Text className="mt-2 text-sm leading-6 text-muted">
                A volta tambem aparece em linguagem clara, sem misturar tudo na mesma lista.
              </Text>
            </View>

            <View className="mt-4 gap-4">
              {featuredInbound.map((option) => (
                <SeniorFlightCard
                  key={option.flight.id}
                  recommendation={option}
                  ctaLabel="Escolher esta volta"
                  onPress={() => handleSelectInbound(option.flight.id)}
                />
              ))}
            </View>

            {extraInbound.length > 0 ? (
              <View className="mt-6">
                <Text className="text-lg font-bold text-foreground">Mais opcoes de volta</Text>
                <View className="mt-4 gap-4">
                  {extraInbound.map((option) => (
                    <SeniorFlightCard
                      key={option.flight.id}
                      recommendation={option}
                      ctaLabel="Escolher esta volta"
                      onPress={() => handleSelectInbound(option.flight.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              className="mt-6 rounded-[22px] border border-border bg-background px-5 py-4"
              onPress={() => setStage("outbound")}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-foreground">Voltar para a ida</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {stage === "summary" && selectedOutbound ? (
          <>
            <View className="mt-6 rounded-[28px] border border-border bg-surface px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">Resumo da viagem</Text>
              <Text className="mt-3 text-2xl font-bold text-foreground">Sua escolha ficou organizada</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">
                Agora voce pode guardar essa combinacao e chamar a equipe para concluir com seguranca.
              </Text>
            </View>

            <View className="mt-4 gap-4">
              <SeniorFlightCard
                recommendation={selectedOutbound}
                title="Voo de ida"
                subtitle={`${departureDate} · ${normalizeAirport(origin)} para ${normalizeAirport(destination)}`}
              />
              {tripType === "round_trip" && selectedInbound ? (
                <SeniorFlightCard
                  recommendation={selectedInbound}
                  title="Voo de volta"
                  subtitle={`${returnDate} · ${normalizeAirport(destination)} para ${normalizeAirport(origin)}`}
                />
              ) : null}
            </View>

            <View className="mt-4 rounded-[28px] border border-border bg-surface px-5 py-5">
              <Text className="text-lg font-bold text-foreground">Total estimado</Text>
              <Text className="mt-3 text-3xl font-bold text-foreground">
                {formatCurrency(
                  tripType === "round_trip" ? totalPrice : selectedOutbound.flight.price,
                  selectedOutbound.flight.currency,
                )}
              </Text>
              <Text className="mt-2 text-sm leading-6 text-muted">
                {tripType === "round_trip"
                  ? "Soma da ida e da volta escolhidas no app."
                  : "Valor da ida escolhida no app."}
              </Text>

              <View className="mt-4 gap-3">
                <View className="rounded-[22px] bg-background px-4 py-4">
                  <Text className="text-sm leading-6 text-foreground">
                    Passageiros: {adults} adulto(s), {children} crianca(s), {infants} bebe(s)
                  </Text>
                </View>
                <View className="rounded-[22px] bg-background px-4 py-4">
                  <Text className="text-sm leading-6 text-foreground">
                    Prioridade escolhida: {priority === "comfort"
                      ? "Menos cansaco"
                      : priority === "fastest"
                        ? "Mais rapido"
                        : priority === "balanced"
                          ? "Equilibrado"
                          : "Menor preco"}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className={`mt-6 rounded-[22px] bg-primary px-5 py-4 ${isSavingPlan ? "opacity-70" : ""}`}
              onPress={handleSavePlan}
              activeOpacity={0.85}
              disabled={isSavingPlan}
            >
              <Text className="text-center text-base font-semibold text-background">
                {isSavingPlan ? "Guardando..." : "Guardar esta combinacao"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 rounded-[22px] border border-border bg-background px-5 py-4"
              onPress={handleShareWithTeam}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-foreground">
                Mandar resumo para a equipe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 rounded-[22px] border border-border bg-background px-5 py-4"
              onPress={handleCallTeam}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-foreground">
                Ligar e concluir com uma pessoa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 rounded-[22px] border border-border bg-background px-5 py-4"
              onPress={() => setStage(tripType === "round_trip" ? "inbound" : "outbound")}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-foreground">
                Rever minhas escolhas
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
