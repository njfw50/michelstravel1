import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme/theme";
import { AppLanguage } from "../types/app";
import { FlightOffer } from "../types/flights";
import {
  ResultsFilterState,
  ResultsPriceThresholds,
  getAirlineOptions,
  getOfferStops,
  hasCheckedBag,
} from "../utils/resultsFilters";
import { Card } from "./Card";

type ResultsFilterPanelProps = {
  language: AppLanguage;
  offers: FlightOffer[];
  filteredCount: number;
  filters: ResultsFilterState;
  thresholds: ResultsPriceThresholds;
  onChange: Dispatch<SetStateAction<ResultsFilterState>>;
};

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function SelectionChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ResultsFilterPanel({
  language,
  offers,
  filteredCount,
  filters,
  thresholds,
  onChange,
}: ResultsFilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        title: "Refine your options",
        subtitle: `${filteredCount} of ${offers.length} flights visible`,
        cheapestHint: "Lowest fare",
        directHint: "Direct flights",
        checkedHint: "Checked bag",
        sortTitle: "Sort by",
        stopsTitle: "Stops",
        baggageTitle: "Baggage",
        timeTitle: "Departure time",
        priceTitle: "Budget range",
        airlineTitle: "Airlines",
        showAdvanced: "More filters",
        hideAdvanced: "Hide filters",
        clear: "Clear",
        best: "Best value",
        cheapest: "Lowest price",
        fastest: "Fastest",
        all: "All",
        direct: "Direct",
        oneStop: "1 stop",
        manyStops: "2+ stops",
        checked: "Checked bag",
        carry: "Carry-on",
        light: "Light fare",
        morning: "Morning",
        afternoon: "Afternoon",
        evening: "Evening",
        night: "Night",
        budget: "Budget",
        mid: "Balanced",
        premium: "Premium",
      };
    }

    if (language === "es") {
      return {
        title: "Refine sus opciones",
        subtitle: `${filteredCount} de ${offers.length} vuelos visibles`,
        cheapestHint: "Tarifa más baja",
        directHint: "Vuelos directos",
        checkedHint: "Maleta facturada",
        sortTitle: "Ordenar por",
        stopsTitle: "Escalas",
        baggageTitle: "Equipaje",
        timeTitle: "Horario de salida",
        priceTitle: "Rango de precio",
        airlineTitle: "Aerolíneas",
        showAdvanced: "Más filtros",
        hideAdvanced: "Ocultar filtros",
        clear: "Limpiar",
        best: "Mejor valor",
        cheapest: "Menor precio",
        fastest: "Más rápido",
        all: "Todos",
        direct: "Directo",
        oneStop: "1 escala",
        manyStops: "2+ escalas",
        checked: "Maleta facturada",
        carry: "Mano",
        light: "Tarifa ligera",
        morning: "Mañana",
        afternoon: "Tarde",
        evening: "Noche",
        night: "Madrugada",
        budget: "Económico",
        mid: "Equilibrado",
        premium: "Premium",
      };
    }

    return {
      title: "Refine suas opções",
      subtitle: `${filteredCount} de ${offers.length} voos visíveis`,
      cheapestHint: "Menor tarifa",
      directHint: "Voos diretos",
      checkedHint: "Mala despachada",
      sortTitle: "Ordenar por",
      stopsTitle: "Paradas",
      baggageTitle: "Bagagem",
      timeTitle: "Horário de saída",
      priceTitle: "Faixa de preço",
      airlineTitle: "Companhias",
      showAdvanced: "Mais filtros",
      hideAdvanced: "Ocultar filtros",
      clear: "Limpar",
      best: "Melhor valor",
      cheapest: "Menor preço",
      fastest: "Mais rápido",
      all: "Todos",
      direct: "Direto",
      oneStop: "1 parada",
      manyStops: "2+ paradas",
      checked: "Mala despachada",
      carry: "Bagagem de mão",
      light: "Tarifa leve",
      morning: "Manhã",
      afternoon: "Tarde",
      evening: "Noite",
      night: "Madrugada",
      budget: "Econômico",
      mid: "Equilibrado",
      premium: "Premium",
    };
  }, [filteredCount, language, offers.length]);

  const airlineOptions = useMemo(() => getAirlineOptions(offers), [offers]);
  const cheapestOffer = useMemo(() => offers.reduce<FlightOffer | null>((best, offer) => {
    if (!best || offer.price < best.price) return offer;
    return best;
  }, null), [offers]);
  const directCount = useMemo(() => offers.filter((offer) => getOfferStops(offer) === 0).length, [offers]);
  const checkedCount = useMemo(() => offers.filter((offer) => hasCheckedBag(offer)).length, [offers]);
  const currency = cheapestOffer?.currency || "USD";

  const update = (next: Partial<ResultsFilterState>) => {
    onChange((current) => ({ ...current, ...next }));
  };

  const toggleAirline = (airline: string) => {
    onChange((current) => ({
      ...current,
      airlines: current.airlines.includes(airline)
        ? current.airlines.filter((item) => item !== airline)
        : [...current.airlines, airline],
    }));
  };

  const clearFilters = () => {
    onChange({
      sortBy: "best",
      stops: "all",
      baggage: "all",
      departureTime: "all",
      priceBand: "all",
      airlines: [],
    });
  };

  return (
    <Card>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>{copy.clear}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{copy.cheapestHint}</Text>
          <Text style={styles.metricValue}>
            {cheapestOffer ? formatPrice(cheapestOffer.price, currency) : "--"}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{copy.directHint}</Text>
          <Text style={styles.metricValue}>{directCount}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{copy.checkedHint}</Text>
          <Text style={styles.metricValue}>{checkedCount}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.sortTitle}</Text>
        <View style={styles.chipRow}>
          <SelectionChip label={copy.best} active={filters.sortBy === "best"} onPress={() => update({ sortBy: "best" })} />
          <SelectionChip label={copy.cheapest} active={filters.sortBy === "cheapest"} onPress={() => update({ sortBy: "cheapest" })} />
          <SelectionChip label={copy.fastest} active={filters.sortBy === "fastest"} onPress={() => update({ sortBy: "fastest" })} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.stopsTitle}</Text>
        <View style={styles.chipRow}>
          <SelectionChip label={copy.all} active={filters.stops === "all"} onPress={() => update({ stops: "all" })} />
          <SelectionChip label={copy.direct} active={filters.stops === "direct"} onPress={() => update({ stops: "direct" })} />
          <SelectionChip label={copy.oneStop} active={filters.stops === "one"} onPress={() => update({ stops: "one" })} />
          <SelectionChip label={copy.manyStops} active={filters.stops === "many"} onPress={() => update({ stops: "many" })} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.baggageTitle}</Text>
        <View style={styles.chipRow}>
          <SelectionChip label={copy.all} active={filters.baggage === "all"} onPress={() => update({ baggage: "all" })} />
          <SelectionChip label={copy.checked} active={filters.baggage === "checked"} onPress={() => update({ baggage: "checked" })} />
          <SelectionChip label={copy.carry} active={filters.baggage === "carry"} onPress={() => update({ baggage: "carry" })} />
          <SelectionChip label={copy.light} active={filters.baggage === "light"} onPress={() => update({ baggage: "light" })} />
        </View>
      </View>

      <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced((current) => !current)}>
        <Text style={styles.advancedToggleText}>{showAdvanced ? copy.hideAdvanced : copy.showAdvanced}</Text>
      </TouchableOpacity>

      {showAdvanced ? (
        <View style={styles.advancedWrap}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.timeTitle}</Text>
            <View style={styles.chipRow}>
              <SelectionChip label={copy.all} active={filters.departureTime === "all"} onPress={() => update({ departureTime: "all" })} />
              <SelectionChip label={copy.morning} active={filters.departureTime === "morning"} onPress={() => update({ departureTime: "morning" })} />
              <SelectionChip label={copy.afternoon} active={filters.departureTime === "afternoon"} onPress={() => update({ departureTime: "afternoon" })} />
              <SelectionChip label={copy.evening} active={filters.departureTime === "evening"} onPress={() => update({ departureTime: "evening" })} />
              <SelectionChip label={copy.night} active={filters.departureTime === "night"} onPress={() => update({ departureTime: "night" })} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.priceTitle}</Text>
            <View style={styles.chipRow}>
              <SelectionChip label={copy.all} active={filters.priceBand === "all"} onPress={() => update({ priceBand: "all" })} />
              <SelectionChip
                label={`${copy.budget} · ${formatPrice(thresholds.budgetMax, currency)}`}
                active={filters.priceBand === "budget"}
                onPress={() => update({ priceBand: "budget" })}
              />
              <SelectionChip label={copy.mid} active={filters.priceBand === "mid"} onPress={() => update({ priceBand: "mid" })} />
              <SelectionChip
                label={`${copy.premium} · ${formatPrice(thresholds.premiumMin, currency)}`}
                active={filters.priceBand === "premium"}
                onPress={() => update({ priceBand: "premium" })}
              />
            </View>
          </View>

          {airlineOptions.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{copy.airlineTitle}</Text>
              <View style={styles.chipRow}>
                {airlineOptions.map((airline) => (
                  <SelectionChip
                    key={airline}
                    label={airline}
                    active={filters.airlines.includes(airline)}
                    onPress={() => toggleAirline(airline)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing(2),
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.gray500,
    lineHeight: 17,
  },
  clearButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  metricsRow: {
    marginTop: theme.spacing(3),
    flexDirection: "row",
    gap: theme.spacing(1.5),
  },
  metricCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    justifyContent: "space-between",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.gray500,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  section: {
    marginTop: theme.spacing(3),
    gap: theme.spacing(1.25),
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.gray700,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1.25),
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  chipActive: {
    borderColor: "#C8D8FF",
    backgroundColor: theme.colors.primarySoft,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.gray600,
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
  advancedToggle: {
    marginTop: theme.spacing(3),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingVertical: 11,
    alignItems: "center",
  },
  advancedToggleText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.gray700,
  },
  advancedWrap: {
    marginTop: theme.spacing(1),
  },
});
