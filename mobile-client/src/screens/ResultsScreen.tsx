import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { FlightOfferCard } from "../components/FlightOfferCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ResultsPagination } from "../components/ResultsPagination";
import { ResultsFilterPanel } from "../components/ResultsFilterPanel";
import { RoundTripSliceCard } from "../components/RoundTripSliceCard";
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

const PAGE_SIZE = 7;

export function RegularResultsScreen({ navigation, route }: { navigation: any; route: any }) {
  const language = useOnboardingStore((state) => state.language);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [nearbyOptions, setNearbyOptions] = useState<NearbySearchOption[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOutboundCardKey, setSelectedOutboundCardKey] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
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

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Results",
        title: "Best options for your trip",
        loading: "Searching the best offers for you...",
        errorTitle: "We could not complete your search",
        errorTimeout: "The search is taking longer than expected. Please try again in a moment.",
        retry: "Try again",
        emptyTitle: "No offers found",
        emptyText: "Adjust dates, origin, destination, or cabin to open more options.",
        nearbyTitle: "Closest dates with seats available",
        nearbyText: "These nearby dates already have live offers from the same search route.",
        nearbyLoading: "Checking nearby dates...",
        nearbyOpen: "Open these dates",
        nearbyFrom: "from",
        filteredEmptyTitle: "No flights match the current filters",
        filteredEmptyText: "Clear or relax some filters to reveal more options.",
        multiCityLegs: "legs",
        multiCityTravelers: "travelers",
        roundTripTitle: "Choose your outbound first",
        roundTripText: "We keep your outbound visible while you choose the best matching return.",
        returnStepTitle: "Now choose the return",
        returnStepText: "Your outbound stays on hold below for review while you decide the return.",
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
        badge: "Resultados",
        title: "Mejores opciones para su viaje",
        loading: "Buscando las mejores ofertas para usted...",
        errorTitle: "No pudimos completar su búsqueda",
        errorTimeout: "La búsqueda está tardando más de lo esperado. Inténtelo de nuevo en unos instantes.",
        retry: "Intentar de nuevo",
        emptyTitle: "No encontramos ofertas",
        emptyText: "Ajuste fechas, origen, destino o cabina para abrir más opciones.",
        nearbyTitle: "Fechas cercanas con disponibilidad",
        nearbyText: "Estas fechas cercanas ya tienen ofertas activas para la misma ruta.",
        nearbyLoading: "Revisando fechas cercanas...",
        nearbyOpen: "Abrir estas fechas",
        nearbyFrom: "desde",
        filteredEmptyTitle: "Ningún vuelo coincide con los filtros actuales",
        filteredEmptyText: "Limpie o flexibilice algunos filtros para ver más opciones.",
        multiCityLegs: "tramos",
        multiCityTravelers: "pasajeros",
        roundTripTitle: "Seleccione primero el vuelo de ida",
        roundTripText: "Mantendremos su ida visible mientras elige el mejor regreso compatible.",
        returnStepTitle: "Ahora seleccione el regreso",
        returnStepText: "Su ida queda en espera abajo para revisar antes de confirmar el regreso.",
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
      badge: "Resultados",
      title: "Melhores opções para sua viagem",
      loading: "Buscando as melhores ofertas para você...",
      errorTitle: "Não foi possível concluir sua busca",
      errorTimeout: "A busca está demorando mais do que o esperado. Tente novamente em instantes.",
      retry: "Tentar novamente",
      emptyTitle: "Nenhuma oferta encontrada",
      emptyText: "Ajuste datas, origem, destino ou cabine para abrir mais opções.",
      nearbyTitle: "Datas próximas com disponibilidade",
      nearbyText: "Estas datas próximas já têm ofertas ativas para a mesma rota pesquisada.",
      nearbyLoading: "Verificando datas próximas...",
      nearbyOpen: "Abrir estas datas",
      nearbyFrom: "a partir de",
      filteredEmptyTitle: "Nenhum voo corresponde aos filtros atuais",
      filteredEmptyText: "Limpe ou flexibilize alguns filtros para revelar mais opções.",
      multiCityLegs: "trechos",
      multiCityTravelers: "passageiros",
      roundTripTitle: "Selecione primeiro o voo de ida",
      roundTripText: "Mantemos sua ida visível enquanto você escolhe a melhor volta compatível.",
      returnStepTitle: "Agora selecione o voo de volta",
      returnStepText: "Sua ida fica em hold abaixo para conferência enquanto você decide a volta.",
      stepOutbound: "Ida",
      stepReturn: "Volta",
      outboundHeld: "Ida em hold",
      changeOutbound: "Alterar ida",
      fromPrice: "A partir de",
      combinedPrice: "Total combinado",
      chooseOutbound: "Escolher ida",
      chooseReturn: "Escolher volta",
      noReturnTitle: "Não há volta disponível para esta ida com os filtros atuais",
      noReturnText: "Altere a ida ou flexibilize alguns filtros para reabrir combinações.",
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

  const summary = useMemo(() => {
    if (search.tripType === "multi-city" && search.legs?.length) {
      const firstLeg = search.legs[0];
      const lastLeg = search.legs[search.legs.length - 1];
      return `${search.legs.length} ${copy.multiCityLegs} · ${firstLeg.origin} -> ${lastLeg.destination} · ${search.passengers} ${copy.multiCityTravelers}`;
    }

    return `${search.origin} -> ${search.destination} · ${search.date}${search.tripType === "round-trip" && search.returnDate ? ` · ${search.returnDate}` : ""} · ${search.passengers} pax`;
  }, [copy.multiCityLegs, copy.multiCityTravelers, search]);

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
      if (requestError?.code === "ECONNABORTED") {
        setError(copy.errorTimeout);
      } else {
        setError(requestError?.response?.data?.error || copy.errorTitle);
      }
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
    setListPage(1);
    setOutboundPage(1);
    setReturnPage(1);
  }, [search]);

  const priceThresholds = useMemo(() => getPriceThresholds(offers), [offers]);
  const filteredOffers = useMemo(() => {
    return sortOffers(filterOffers(offers, filters, priceThresholds), filters.sortBy);
  }, [filters, offers, priceThresholds]);
  const showTwoStepFlow = search.tripType === "round-trip" && offers.some(hasRoundTripSlices);
  const outboundOptions = useMemo(() => {
    if (!showTwoStepFlow) return [];
    return getOrderedOutboundOptions(filteredOffers);
  }, [filteredOffers, showTwoStepFlow]);
  const selectedOutbound = useMemo(() => {
    return outboundOptions.find((option) => option.key === selectedOutboundCardKey) || null;
  }, [outboundOptions, selectedOutboundCardKey]);
  const returnOptions = useMemo(() => {
    if (!showTwoStepFlow) return [];
    return getOrderedReturnOptions(filteredOffers, selectedOutbound?.matchKey || null);
  }, [filteredOffers, selectedOutbound, showTwoStepFlow]);
  const cheapestPrice = useMemo(() => {
    if (offers.length === 0) return null;
    return Math.min(...offers.map((offer) => offer.price));
  }, [offers]);
  const directCount = useMemo(() => {
    return offers.filter((offer) => {
      const slice = offer.slices?.[0];
      const segments = slice?.segments?.length ?? 1;
      return segments <= 1;
    }).length;
  }, [offers]);

  useEffect(() => {
    if (!selectedOutboundCardKey) return;
    const outboundStillVisible = outboundOptions.some((option) => option.key === selectedOutboundCardKey);
    if (!outboundStillVisible) {
      setSelectedOutboundCardKey(null);
    }
  }, [outboundOptions, selectedOutboundCardKey]);

  useEffect(() => {
    setListPage(1);
    setOutboundPage(1);
    setReturnPage(1);
  }, [filters, offers.length]);

  useEffect(() => {
    setReturnPage(1);
  }, [selectedOutboundCardKey]);

  const pagedFilteredOffers = useMemo(() => {
    const start = (listPage - 1) * PAGE_SIZE;
    return filteredOffers.slice(start, start + PAGE_SIZE);
  }, [filteredOffers, listPage]);

  const pagedOutboundOptions = useMemo(() => {
    const start = (outboundPage - 1) * PAGE_SIZE;
    return outboundOptions.slice(start, start + PAGE_SIZE);
  }, [outboundOptions, outboundPage]);

  const pagedReturnOptions = useMemo(() => {
    const start = (returnPage - 1) * PAGE_SIZE;
    return returnOptions.slice(start, start + PAGE_SIZE);
  }, [returnOptions, returnPage]);

  return (
    <AppShell
      mode="regular"
      badge={copy.badge}
      title={copy.title}
      subtitle={summary}
      contentStyle={styles.container}
    >
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

      {!loading && !error && offers.length === 0 ? (
        <View style={styles.stack}>
          <Card>
            <Text style={styles.errorTitle}>{copy.emptyTitle}</Text>
            <Text style={styles.errorText}>{copy.emptyText}</Text>
          </Card>

          {nearbyLoading ? (
            <View style={styles.feedbackCard}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.feedbackText}>{copy.nearbyLoading}</Text>
            </View>
          ) : null}

          {!nearbyLoading && nearbyOptions.length > 0 ? (
            <Card>
              <Text style={styles.errorTitle}>{copy.nearbyTitle}</Text>
              <Text style={styles.errorText}>{copy.nearbyText}</Text>

              <View style={styles.suggestionStack}>
                {nearbyOptions.map((item) => (
                  <TouchableOpacity
                    key={`${item.search.date}-${item.search.returnDate || "one-way"}`}
                    activeOpacity={0.9}
                    style={styles.suggestionCard}
                    onPress={() => navigation.replace("RegularResults", { search: item.search })}
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

      {!loading && !error && offers.length > 0 ? (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{copy.badge}</Text>
            <Text style={styles.summaryValue}>{offers.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{language === "en" ? "Lowest fare" : language === "es" ? "Tarifa más baja" : "Menor tarifa"}</Text>
            <Text style={styles.summaryValue}>
              {cheapestPrice !== null ? new Intl.NumberFormat("en-US", { style: "currency", currency: offers[0]?.currency || "USD", maximumFractionDigits: 0 }).format(cheapestPrice) : "--"}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{language === "en" ? "Direct" : language === "es" ? "Directos" : "Diretos"}</Text>
            <Text style={styles.summaryValue}>{directCount}</Text>
          </View>
        </View>
      ) : null}

      {!loading && !error && offers.length > 0 ? (
        <ResultsFilterPanel
          language={language}
          offers={offers}
          filteredCount={filteredOffers.length}
          filters={filters}
          thresholds={priceThresholds}
          onChange={setFilters}
        />
      ) : null}

      {!loading && !error && offers.length > 0 && filteredOffers.length === 0 ? (
        <Card>
          <Text style={styles.errorTitle}>{copy.filteredEmptyTitle}</Text>
          <Text style={styles.errorText}>{copy.filteredEmptyText}</Text>
        </Card>
      ) : null}

      {!loading && !error && showTwoStepFlow && filteredOffers.length > 0 ? (
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
          mode="regular"
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
              mode="regular"
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
              mode="regular"
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
              onPress={() => navigation.navigate("TripDetail", { offerId: option.offer.id, initialOffer: option.offer, mode: "regular", search })}
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

      {!showTwoStepFlow ? (
        <View style={styles.stack}>
          {pagedFilteredOffers.map((item) => (
            <FlightOfferCard
              key={item.id}
              offer={item}
              onPress={() => navigation.navigate("TripDetail", { offerId: item.id, initialOffer: item, mode: "regular", search })}
            />
          ))}
          <ResultsPagination
            language={language}
            currentPage={listPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredOffers.length}
            onPrevious={() => setListPage((current) => Math.max(1, current - 1))}
            onNext={() => setListPage((current) => current + 1)}
          />
        </View>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing(3) },
  feedbackCard: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing(4),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(3),
    ...theme.shadow.card,
  },
  feedbackText: { color: theme.colors.gray700, fontSize: 14, flex: 1, lineHeight: 20 },
  errorTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.gray900 },
  errorText: { marginTop: theme.spacing(2), fontSize: 14, color: theme.colors.gray600, lineHeight: 21 },
  retryButton: { marginTop: theme.spacing(4) },
  summaryRow: { flexDirection: "row", gap: theme.spacing(2) },
  summaryCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    ...theme.shadow.subtle,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryValue: { marginTop: 8, fontSize: 17, fontWeight: "800", color: theme.colors.primaryInk },
  stepHeader: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: theme.colors.primary },
  stepDotMuted: { backgroundColor: theme.colors.gray200 },
  stepDotText: { color: theme.colors.white, fontSize: 13, fontWeight: "800" },
  stepLine: { flex: 1, height: 2, backgroundColor: theme.colors.gray200, marginHorizontal: theme.spacing(2) },
  stepLineActive: { backgroundColor: theme.colors.primary },
  stepTitleRow: { marginTop: theme.spacing(3), flexDirection: "row", justifyContent: "space-between", gap: theme.spacing(2) },
  stepTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: theme.colors.gray900 },
  stepCaption: {
    color: theme.colors.primary,
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
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
  },
  suggestionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing(2) },
  suggestionTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: theme.colors.primaryInk },
  suggestionMeta: {
    minWidth: 36,
    textAlign: "center",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.surface,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  suggestionPrice: { marginTop: 8, fontSize: 14, fontWeight: "700", color: theme.colors.gray700 },
  suggestionAction: { marginTop: 10, fontSize: 12, fontWeight: "800", color: theme.colors.primary },
});
