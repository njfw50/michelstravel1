import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { ResultsFilterPanel } from "../components/ResultsFilterPanel";
import { ResultsPagination } from "../components/ResultsPagination";
import { RoundTripSliceCard } from "../components/RoundTripSliceCard";
import { SeniorFlightOfferCard } from "../components/SeniorFlightOfferCard";
import { searchFlightOffers } from "../services/flights";
import { useOnboardingStore } from "../store/onboardingStore";
import { theme } from "../theme/theme";
import { FlightOffer, FlightSearchRequest } from "../types/flights";
import {
  ResultsFilterState,
  filterOffers,
  getPriceThresholds,
  sortOffers,
} from "../utils/resultsFilters";
import {
  getOrderedOutboundOptions,
  getOrderedReturnOptions,
  hasRoundTripSlices,
} from "../utils/roundTripFlow";
import {
  buildNearbySearchRequests,
  NearbySearchOption,
  summarizeNearbySearchOption,
} from "../utils/nearbySearches";
import { buildSeniorRecommendations } from "../utils/seniorRecommendations";

const PAGE_SIZE = 7;

function formatPreference(label: string, value: string) {
  return `${label}: ${value}`;
}

export function SeniorResultsScreen({ navigation, route }: { navigation: any; route: any }) {
  const language = useOnboardingStore((state) => state.language);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [nearbyOptions, setNearbyOptions] = useState<NearbySearchOption[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOutboundCardKey, setSelectedOutboundCardKey] = useState<string | null>(null);
  const [rankedPage, setRankedPage] = useState(1);
  const [outboundPage, setOutboundPage] = useState(1);
  const [returnPage, setReturnPage] = useState(1);
  const [filters, setFilters] = useState<ResultsFilterState>({
    sortBy: "best",
    stops: "all",
    baggage: "all",
    departureTime: "all",
    priceBand: "all",
    airlines: [],
  });
  const search = route.params.search as FlightSearchRequest;
  const preferences = route.params.preferences;

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Senior results",
        title: "Options organized with more calm",
        loading: "Selecting the most comfortable options for you...",
        errorTitle: "We could not complete your search",
        retry: "Try again",
        warningTitle: "We did not find flights within your exact connection preference.",
        warningText: "So we opened the closest alternatives to keep good options available for you.",
        emptyTitle: "No offers found",
        emptyText: "Adjust route, dates, or preferences to open more combinations.",
        nearbyTitle: "Closest dates with seats available",
        nearbyText: "These nearby dates already have live offers for the same route.",
        nearbyLoading: "Checking nearby dates...",
        nearbyOpen: "Open these dates",
        nearbyFrom: "from",
        filteredEmptyTitle: "No flights match the current filters",
        filteredEmptyText: "Clear or relax some filters to reopen more options.",
        priorityLabel: "Priority",
        connectionsLabel: "Connections",
        baggageLabel: "Baggage",
        timeLabel: "Time",
        priorityValues: { comfort: "More comfort", fastest: "Less total travel time", balanced: "Best balance", cheapest: "Lower price" },
        connectionValues: { none: "Avoid connections", one: "At most 1 connection", any: "Any connection" },
        bagValues: { checked: "Need checked baggage", carry: "Need carry-on baggage", flexible: "Flexible baggage" },
        timeValues: { day: "Avoid very late hours", any: "Any time" },
        roundTripTitle: "Choose the outbound with more comfort",
        roundTripText: "We keep the outbound visible while you decide the return combination.",
        returnStepTitle: "Choose the return to complete the trip",
        returnStepText: "Your outbound remains on hold below so you can confirm the combination calmly.",
        stepOutbound: "Outbound",
        stepReturn: "Return",
        outboundHeld: "Outbound on hold",
        changeOutbound: "Change outbound",
        fromPrice: "From",
        combinedPrice: "Combined total",
        chooseOutbound: "Choose outbound",
        chooseReturn: "Choose return",
        noReturnTitle: "No return is available for this outbound with the current filters",
        noReturnText: "Change the outbound or relax some filters to reopen return combinations.",
      };
    }

    if (language === "es") {
      return {
        badge: "Resultados senior",
        title: "Opciones organizadas con más calma",
        loading: "Seleccionando las opciones más cómodas para usted...",
        errorTitle: "No pudimos completar su búsqueda",
        retry: "Intentar de nuevo",
        warningTitle: "No encontramos vuelos dentro de su preferencia exacta de conexiones.",
        warningText: "Por eso abrimos las alternativas más cercanas para que usted siga teniendo buenas opciones.",
        emptyTitle: "No encontramos ofertas",
        emptyText: "Ajuste ruta, fechas o preferencias para abrir más combinaciones.",
        nearbyTitle: "Fechas cercanas con disponibilidad",
        nearbyText: "Estas fechas cercanas ya tienen ofertas activas para la misma ruta.",
        nearbyLoading: "Revisando fechas cercanas...",
        nearbyOpen: "Abrir estas fechas",
        nearbyFrom: "desde",
        filteredEmptyTitle: "Ningún vuelo coincide con los filtros actuales",
        filteredEmptyText: "Limpie o flexibilice algunos filtros para recuperar más opciones.",
        priorityLabel: "Prioridad",
        connectionsLabel: "Conexiones",
        baggageLabel: "Equipaje",
        timeLabel: "Horario",
        priorityValues: { comfort: "Más confort", fastest: "Menor tiempo total", balanced: "Mejor equilibrio", cheapest: "Menor precio" },
        connectionValues: { none: "Evitar conexiones", one: "Máximo 1 conexión", any: "Cualquier conexión" },
        bagValues: { checked: "Necesita equipaje despachado", carry: "Necesita equipaje de mano", flexible: "Equipaje flexible" },
        timeValues: { day: "Evitar horarios muy tarde", any: "Cualquier horario" },
        roundTripTitle: "Seleccione la ida con más comodidad",
        roundTripText: "Mantendremos la ida visible mientras decide la combinación de regreso.",
        returnStepTitle: "Seleccione el regreso para completar el viaje",
        returnStepText: "Su ida permanece en espera abajo para confirmar la combinación con calma.",
        stepOutbound: "Ida",
        stepReturn: "Regreso",
        outboundHeld: "Ida en espera",
        changeOutbound: "Cambiar ida",
        fromPrice: "Desde",
        combinedPrice: "Total combinado",
        chooseOutbound: "Elegir ida",
        chooseReturn: "Elegir regreso",
        noReturnTitle: "No hay regreso disponible para esta ida con los filtros actuales",
        noReturnText: "Cambie la ida o flexibilice algunos filtros para recuperar combinaciones.",
      };
    }

    return {
      badge: "Resultados sênior",
      title: "Opções organizadas com mais calma",
      loading: "Selecionando as opções mais confortáveis para você...",
      errorTitle: "Não foi possível concluir sua busca",
      retry: "Tentar novamente",
      warningTitle: "Não encontramos voos dentro da sua preferência exata de conexões.",
      warningText: "Por isso abrimos as alternativas mais próximas para manter boas opções disponíveis para você.",
      emptyTitle: "Nenhuma oferta encontrada",
      emptyText: "Ajuste rota, datas ou preferências para abrir mais combinações.",
      nearbyTitle: "Datas próximas com disponibilidade",
      nearbyText: "Estas datas próximas já têm ofertas ativas para a mesma rota.",
      nearbyLoading: "Verificando datas próximas...",
      nearbyOpen: "Abrir estas datas",
      nearbyFrom: "a partir de",
      filteredEmptyTitle: "Nenhum voo corresponde aos filtros atuais",
      filteredEmptyText: "Limpe ou flexibilize alguns filtros para recuperar mais opções.",
      priorityLabel: "Prioridade",
      connectionsLabel: "Conexões",
      baggageLabel: "Bagagem",
      timeLabel: "Horário",
      priorityValues: { comfort: "Mais conforto", fastest: "Menor tempo total", balanced: "Melhor equilíbrio", cheapest: "Menor preço" },
      connectionValues: { none: "Evitar conexões", one: "No máximo 1 conexão", any: "Qualquer conexão" },
      bagValues: { checked: "Precisa mala despachada", carry: "Precisa bagagem de mão", flexible: "Bagagem flexível" },
      timeValues: { day: "Evitar horário muito tarde", any: "Qualquer horário" },
      roundTripTitle: "Selecione a ida com mais conforto",
      roundTripText: "Mantemos a ida visível enquanto você decide a combinação da volta.",
      returnStepTitle: "Selecione a volta para completar a viagem",
      returnStepText: "Sua ida permanece em hold abaixo para confirmar a combinação com calma.",
      stepOutbound: "Ida",
      stepReturn: "Volta",
      outboundHeld: "Ida em hold",
      changeOutbound: "Alterar ida",
      fromPrice: "A partir de",
      combinedPrice: "Total combinado",
      chooseOutbound: "Escolher ida",
      chooseReturn: "Escolher volta",
      noReturnTitle: "Não há volta disponível para esta ida com os filtros atuais",
      noReturnText: "Altere a ida ou flexibilize alguns filtros para recuperar combinações.",
    };
  }, [language]);

  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const nearbyRequests = useMemo(() => buildNearbySearchRequests(search), [search]);

  const formatSuggestionLabel = (item: NearbySearchOption) => {
    const formatter = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" });
    const departure = formatter.format(new Date(`${item.search.date}T12:00:00Z`));
    if (item.search.tripType === "round-trip" && item.search.returnDate) {
      const returning = formatter.format(new Date(`${item.search.returnDate}T12:00:00Z`));
      return `${departure} - ${returning}`;
    }
    return departure;
  };

  const loadOffers = async () => {
    setLoading(true);
    setError("");
    setNearbyLoading(false);
    setNearbyOptions([]);

    try {
      const response = await searchFlightOffers(search);
      setOffers(response);

      if (response.length === 0 && nearbyRequests.length > 0) {
        setNearbyLoading(true);
        const settled = await Promise.all(
          nearbyRequests.map(async (candidate) => {
            try {
              const candidateOffers = await searchFlightOffers(candidate);
              return summarizeNearbySearchOption(candidate, candidateOffers);
            } catch {
              return null;
            }
          }),
        );
        setNearbyOptions(settled.filter((item): item is NearbySearchOption => Boolean(item)));
      }
    } catch (requestError: any) {
      setOffers([]);
      setError(requestError?.response?.data?.error || "Não foi possível carregar os voos agora.");
    } finally {
      setNearbyLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [search]);

  useEffect(() => {
    setFilters({
      sortBy: "best",
      stops: "all",
      baggage: "all",
      departureTime: "all",
      priceBand: "all",
      airlines: [],
    });
    setSelectedOutboundCardKey(null);
    setRankedPage(1);
    setOutboundPage(1);
    setReturnPage(1);
  }, [search, preferences]);

  const priceThresholds = useMemo(() => getPriceThresholds(offers), [offers]);
  const filteredBaseOffers = useMemo(() => {
    return sortOffers(filterOffers(offers, filters, priceThresholds), filters.sortBy);
  }, [filters, offers, priceThresholds]);

  const { rankedFlights, fallbackApplied } = useMemo(
    () => buildSeniorRecommendations(filteredBaseOffers, preferences),
    [filteredBaseOffers, preferences],
  );

  const showTwoStepFlow = search.tripType === "round-trip" && offers.some(hasRoundTripSlices);
  const orderedRoundTripOffers = useMemo(() => rankedFlights.map((item) => item.flight), [rankedFlights]);
  const outboundOptions = useMemo(() => {
    if (!showTwoStepFlow) return [];
    return getOrderedOutboundOptions(orderedRoundTripOffers);
  }, [orderedRoundTripOffers, showTwoStepFlow]);
  const selectedOutbound = useMemo(() => {
    return outboundOptions.find((option) => option.key === selectedOutboundCardKey) || null;
  }, [outboundOptions, selectedOutboundCardKey]);
  const returnOptions = useMemo(() => {
    if (!showTwoStepFlow) return [];
    return getOrderedReturnOptions(orderedRoundTripOffers, selectedOutbound?.matchKey || null);
  }, [orderedRoundTripOffers, selectedOutbound, showTwoStepFlow]);

  const summaryPills = [
    formatPreference(copy.priorityLabel, copy.priorityValues[preferences.priority as keyof typeof copy.priorityValues]),
    formatPreference(copy.connectionsLabel, copy.connectionValues[preferences.connections as keyof typeof copy.connectionValues]),
    formatPreference(copy.baggageLabel, copy.bagValues[preferences.bags as keyof typeof copy.bagValues]),
    formatPreference(copy.timeLabel, copy.timeValues[preferences.time as keyof typeof copy.timeValues]),
  ];

  useEffect(() => {
    if (!selectedOutboundCardKey) return;
    const outboundStillVisible = outboundOptions.some((option) => option.key === selectedOutboundCardKey);
    if (!outboundStillVisible) {
      setSelectedOutboundCardKey(null);
    }
  }, [outboundOptions, selectedOutboundCardKey]);

  useEffect(() => {
    setRankedPage(1);
    setOutboundPage(1);
    setReturnPage(1);
  }, [filters, offers.length]);

  useEffect(() => {
    setReturnPage(1);
  }, [selectedOutboundCardKey]);

  const pagedOutboundOptions = useMemo(() => {
    const start = (outboundPage - 1) * PAGE_SIZE;
    return outboundOptions.slice(start, start + PAGE_SIZE);
  }, [outboundOptions, outboundPage]);

  const pagedReturnOptions = useMemo(() => {
    const start = (returnPage - 1) * PAGE_SIZE;
    return returnOptions.slice(start, start + PAGE_SIZE);
  }, [returnOptions, returnPage]);

  const pagedRankedFlights = useMemo(() => {
    const start = (rankedPage - 1) * PAGE_SIZE;
    return rankedFlights.slice(start, start + PAGE_SIZE);
  }, [rankedFlights, rankedPage]);

  return (
    <AppShell
      mode="senior"
      badge={copy.badge}
      title={copy.title}
      subtitle={`${search.origin} -> ${search.destination} · ${search.date}${search.tripType === "round-trip" && search.returnDate ? ` · ${search.returnDate}` : ""}`}
      contentStyle={styles.container}
    >
      <View style={styles.summaryRow}>
        {summaryPills.map((pill) => (
          <View key={pill} style={styles.summaryPill}>
            <Text style={styles.summaryPillText}>{pill}</Text>
          </View>
        ))}
      </View>

      {!loading && !error && offers.length > 0 ? (
        <ResultsFilterPanel
          language={language}
          offers={offers}
          filteredCount={filteredBaseOffers.length}
          filters={filters}
          thresholds={priceThresholds}
          onChange={setFilters}
        />
      ) : null}

      {loading ? (
        <View style={styles.feedbackCard}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.feedbackText}>{copy.loading}</Text>
        </View>
      ) : null}

      {error ? (
        <Card>
          <Text style={styles.errorTitle}>{copy.errorTitle}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton label={copy.retry} onPress={loadOffers} style={styles.retryButton} />
        </Card>
      ) : null}

      {!loading && !error && fallbackApplied ? (
        <Card>
          <Text style={styles.warningTitle}>{copy.warningTitle}</Text>
          <Text style={styles.warningText}>{copy.warningText}</Text>
        </Card>
      ) : null}

      {!loading && !error && offers.length > 0 && filteredBaseOffers.length === 0 ? (
        <Card>
          <Text style={styles.errorTitle}>{copy.filteredEmptyTitle}</Text>
          <Text style={styles.errorText}>{copy.filteredEmptyText}</Text>
        </Card>
      ) : null}

      {!loading && !error && showTwoStepFlow && filteredBaseOffers.length > 0 ? (
        <Card>
          <View style={styles.stepHeader}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Text style={styles.stepDotText}>1</Text>
            </View>
            <View style={[styles.stepLine, selectedOutbound ? styles.stepLineActive : null]} />
            <View style={[styles.stepDot, selectedOutbound ? styles.stepDotActive : styles.stepDotMuted]}>
              <Text style={styles.stepDotText}>2</Text>
            </View>
          </View>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepTitle}>{selectedOutbound ? copy.returnStepTitle : copy.roundTripTitle}</Text>
            <Text style={styles.stepCaption}>{selectedOutbound ? copy.stepReturn : copy.stepOutbound}</Text>
          </View>
          <Text style={styles.stepText}>{selectedOutbound ? copy.returnStepText : copy.roundTripText}</Text>
        </Card>
      ) : null}

      {!loading && !error && showTwoStepFlow && selectedOutbound ? (
        <RoundTripSliceCard
          mode="senior"
          language={language}
          badge={copy.stepOutbound}
          airline={selectedOutbound.airline}
          logoUrl={selectedOutbound.logoUrl}
          slice={selectedOutbound.slice}
          passengers={selectedOutbound.offer.passengers}
          price={selectedOutbound.lowestPrice}
          currency={selectedOutbound.offer.currency}
          priceLabel={copy.fromPrice}
          helperText={copy.returnStepText}
          selectedLabel={copy.outboundHeld}
          selected
          actionLabel={copy.changeOutbound}
          onPress={() => setSelectedOutboundCardKey(null)}
        />
      ) : null}

      {!loading && !error && showTwoStepFlow && !selectedOutbound ? (
        <View style={styles.stack}>
          {pagedOutboundOptions.map((option) => (
            <RoundTripSliceCard
              key={option.key}
              mode="senior"
              language={language}
              badge={copy.stepOutbound}
              airline={option.airline}
              logoUrl={option.logoUrl}
              slice={option.slice}
              passengers={option.offer.passengers}
              price={option.lowestPrice}
              currency={option.offer.currency}
              priceLabel={copy.fromPrice}
              actionLabel={copy.chooseOutbound}
              onPress={() => setSelectedOutboundCardKey(option.key)}
            />
          ))}
          <ResultsPagination
            language={language}
            currentPage={outboundPage}
            pageSize={PAGE_SIZE}
            totalItems={outboundOptions.length}
            onPrevious={() => setOutboundPage((current) => Math.max(1, current - 1))}
            onNext={() => setOutboundPage((current) => current + 1)}
          />
        </View>
      ) : null}

      {!loading && !error && showTwoStepFlow && selectedOutbound && returnOptions.length > 0 ? (
        <View style={styles.stack}>
          {pagedReturnOptions.map((option) => (
            <RoundTripSliceCard
              key={option.key}
              mode="senior"
              language={language}
              badge={copy.stepReturn}
              airline={option.airline}
              logoUrl={option.logoUrl}
              slice={option.slice}
              passengers={option.offer.passengers}
              price={option.price}
              currency={option.offer.currency}
              priceLabel={copy.combinedPrice}
              actionLabel={copy.chooseReturn}
              onPress={() => navigation.navigate("TripDetail", { offerId: option.offer.id, initialOffer: option.offer, mode: "senior", preferences, search })}
            />
          ))}
          <ResultsPagination
            language={language}
            currentPage={returnPage}
            pageSize={PAGE_SIZE}
            totalItems={returnOptions.length}
            onPrevious={() => setReturnPage((current) => Math.max(1, current - 1))}
            onNext={() => setReturnPage((current) => current + 1)}
          />
        </View>
      ) : null}

      {!loading && !error && showTwoStepFlow && selectedOutbound && returnOptions.length === 0 ? (
        <Card>
          <Text style={styles.errorTitle}>{copy.noReturnTitle}</Text>
          <Text style={styles.errorText}>{copy.noReturnText}</Text>
        </Card>
      ) : null}

      {!loading && !error && !showTwoStepFlow && pagedRankedFlights.length > 0 ? (
        <View style={styles.stack}>
          {pagedRankedFlights.map((item) => (
            <SeniorFlightOfferCard
              key={item.flight.id}
              offer={item.flight}
              insight={item.insight}
              kind={item.kind}
              language={language}
              onPress={() => navigation.navigate("TripDetail", { offerId: item.flight.id, initialOffer: item.flight, mode: "senior", preferences, search })}
            />
          ))}
          <ResultsPagination
            language={language}
            currentPage={rankedPage}
            pageSize={PAGE_SIZE}
            totalItems={rankedFlights.length}
            onPrevious={() => setRankedPage((current) => Math.max(1, current - 1))}
            onNext={() => setRankedPage((current) => current + 1)}
          />
        </View>
      ) : null}

      {!loading && !error && !showTwoStepFlow && rankedFlights.length === 0 ? (
        <View style={styles.stack}>
          <Card>
            <Text style={styles.errorTitle}>{offers.length > 0 ? copy.filteredEmptyTitle : copy.emptyTitle}</Text>
            <Text style={styles.errorText}>{offers.length > 0 ? copy.filteredEmptyText : copy.emptyText}</Text>
          </Card>

          {!offers.length && nearbyLoading ? (
            <View style={styles.feedbackCard}>
              <ActivityIndicator color={theme.colors.senior} />
              <Text style={styles.feedbackText}>{copy.nearbyLoading}</Text>
            </View>
          ) : null}

          {!offers.length && !nearbyLoading && nearbyOptions.length > 0 ? (
            <Card>
              <Text style={styles.errorTitle}>{copy.nearbyTitle}</Text>
              <Text style={styles.errorText}>{copy.nearbyText}</Text>

              <View style={styles.suggestionStack}>
                {nearbyOptions.map((item) => (
                  <TouchableOpacity
                    key={`${item.search.date}-${item.search.returnDate || "one-way"}`}
                    activeOpacity={0.9}
                    style={styles.suggestionCard}
                    onPress={() => navigation.replace("SeniorResults", { search: item.search, preferences })}
                  >
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionTitle}>{formatSuggestionLabel(item)}</Text>
                      <Text style={styles.suggestionMeta}>{item.offerCount}</Text>
                    </View>
                    <Text style={styles.suggestionPrice}>
                      {copy.nearbyFrom}{" "}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: item.currency,
                        maximumFractionDigits: 0,
                      }).format(item.fromPrice)}
                    </Text>
                    <Text style={styles.suggestionAction}>{copy.nearbyOpen}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          ) : null}
        </View>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing(3) },
  summaryRow: { marginTop: theme.spacing(4), flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2) },
  summaryPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.seniorSoft,
  },
  summaryPillText: { color: theme.colors.seniorDark, fontSize: 12, fontWeight: "700" },
  feedbackCard: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing(4),
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(3),
    ...theme.shadow.card,
  },
  feedbackText: { color: theme.colors.gray700, fontSize: 14, flex: 1 },
  errorTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.gray900 },
  errorText: { marginTop: theme.spacing(2), fontSize: 14, color: theme.colors.gray600, lineHeight: 21 },
  retryButton: { marginTop: theme.spacing(4) },
  warningTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.gray900 },
  warningText: { marginTop: theme.spacing(2), fontSize: 14, color: theme.colors.gray600, lineHeight: 21 },
  stepHeader: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: theme.colors.senior },
  stepDotMuted: { backgroundColor: theme.colors.gray200 },
  stepDotText: { color: theme.colors.white, fontSize: 13, fontWeight: "800" },
  stepLine: { flex: 1, height: 2, backgroundColor: theme.colors.gray200, marginHorizontal: theme.spacing(2) },
  stepLineActive: { backgroundColor: theme.colors.senior },
  stepTitleRow: { marginTop: theme.spacing(3), flexDirection: "row", justifyContent: "space-between", gap: theme.spacing(2) },
  stepTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: theme.colors.gray900 },
  stepCaption: {
    color: theme.colors.seniorDark,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  stepText: { marginTop: theme.spacing(2), fontSize: 14, lineHeight: 21, color: theme.colors.gray600 },
  stack: { gap: theme.spacing(3) },
  suggestionStack: { marginTop: theme.spacing(3), gap: theme.spacing(2) },
  suggestionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.seniorDark,
    backgroundColor: theme.colors.seniorSoft,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  suggestionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing(2) },
  suggestionTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: theme.colors.seniorDark },
  suggestionMeta: {
    minWidth: 36,
    textAlign: "center",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.white,
    color: theme.colors.seniorDark,
    fontSize: 12,
    fontWeight: "800",
  },
  suggestionPrice: { marginTop: 8, fontSize: 14, fontWeight: "700", color: theme.colors.gray700 },
  suggestionAction: { marginTop: 10, fontSize: 12, fontWeight: "800", color: theme.colors.seniorDark },
});
