import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../lib/api";
import { theme } from "../theme/theme";
import { AppLanguage, JourneyMode } from "../types/app";
import { LocationSelection } from "../types/search";

type Place = {
  id: string;
  name: string;
  iataCode: string;
  cityName?: string;
  countryName?: string;
  type?: string;
};

const POPULAR_PLACES: Place[] = [
  { id: "popular-ewr", name: "Newark Liberty International Airport", iataCode: "EWR", cityName: "Newark", countryName: "United States", type: "airport" },
  { id: "popular-mco", name: "Orlando International Airport", iataCode: "MCO", cityName: "Orlando", countryName: "United States", type: "airport" },
  { id: "popular-mia", name: "Miami International Airport", iataCode: "MIA", cityName: "Miami", countryName: "United States", type: "airport" },
  { id: "popular-jfk", name: "John F. Kennedy International Airport", iataCode: "JFK", cityName: "New York", countryName: "United States", type: "airport" },
  { id: "popular-lga", name: "LaGuardia Airport", iataCode: "LGA", cityName: "New York", countryName: "United States", type: "airport" },
  { id: "popular-gru", name: "Sao Paulo/Guarulhos International Airport", iataCode: "GRU", cityName: "Sao Paulo", countryName: "Brazil", type: "airport" },
  { id: "popular-lis", name: "Humberto Delgado Airport", iataCode: "LIS", cityName: "Lisbon", countryName: "Portugal", type: "airport" },
  { id: "popular-bcn", name: "Josep Tarradellas Barcelona-El Prat Airport", iataCode: "BCN", cityName: "Barcelona", countryName: "Spain", type: "airport" },
];

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function uniquePlaces(places: Place[]) {
  const seen = new Set<string>();
  const next: Place[] = [];

  for (const place of places) {
    const key = `${place.iataCode}-${place.name}-${place.cityName ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(place);
  }

  return next;
}

function scorePlace(place: Place, query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return 0;

  const code = normalizeSearchValue(place.iataCode || "");
  const city = normalizeSearchValue(place.cityName || "");
  const name = normalizeSearchValue(place.name || "");
  const country = normalizeSearchValue(place.countryName || "");

  let score = 0;

  if (code === normalizedQuery) score += 100;
  else if (code.startsWith(normalizedQuery)) score += 80;
  else if (code.includes(normalizedQuery)) score += 65;

  if (city === normalizedQuery) score += 70;
  else if (city.startsWith(normalizedQuery)) score += 55;
  else if (city.includes(normalizedQuery)) score += 40;

  if (name.startsWith(normalizedQuery)) score += 35;
  else if (name.includes(normalizedQuery)) score += 25;

  if (country.startsWith(normalizedQuery)) score += 12;

  if (place.type === "airport") score += 4;

  return score;
}

function rankPlaces(places: Place[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  const deduped = uniquePlaces(places);

  if (!normalizedQuery) {
    return deduped.slice(0, 8);
  }

  return deduped
    .filter((place) => {
      const searchable = normalizeSearchValue(
        [place.iataCode, place.cityName, place.name, place.countryName].filter(Boolean).join(" "),
      );
      return searchable.includes(normalizedQuery);
    })
    .sort((left, right) => {
      const scoreDiff = scorePlace(right, normalizedQuery) - scorePlace(left, normalizedQuery);
      if (scoreDiff !== 0) return scoreDiff;

      return (left.cityName || left.name).localeCompare(right.cityName || right.name);
    })
    .slice(0, 12);
}

type LocationPickerFieldProps = {
  label: string;
  placeholder: string;
  value: LocationSelection | null;
  onChange: (next: LocationSelection | null) => void;
  language: AppLanguage;
  mode?: JourneyMode;
};

export function LocationPickerField({
  label,
  placeholder,
  value,
  onChange,
  language,
  mode = "regular",
}: LocationPickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>(POPULAR_PLACES.slice(0, 6));
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const cacheRef = useRef<Map<string, Place[]>>(new Map());
  const warmPlacesRef = useRef<Place[]>(POPULAR_PLACES);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        title: "Choose city or airport",
        subtitle: "Search by city, airport, or IATA code.",
        searchPlaceholder: "Type city or airport",
        current: "Current selection",
        empty: "Start typing to see airports and cities.",
        noResults: "No results found for this search.",
        close: "Close",
        clear: "Clear",
      };
    }

    if (language === "es") {
      return {
        title: "Elija ciudad o aeropuerto",
        subtitle: "Busque por ciudad, aeropuerto o código IATA.",
        searchPlaceholder: "Escriba ciudad o aeropuerto",
        current: "Selección actual",
        empty: "Empiece a escribir para ver aeropuertos y ciudades.",
        noResults: "No encontramos resultados para esta búsqueda.",
        close: "Cerrar",
        clear: "Limpiar",
      };
    }

    return {
      title: "Escolha cidade ou aeroporto",
      subtitle: "Busque por cidade, aeroporto ou código IATA.",
      searchPlaceholder: "Digite cidade ou aeroporto",
      current: "Seleção atual",
      empty: "Comece a digitar para ver aeroportos e cidades.",
      noResults: "Nenhum resultado encontrado para esta busca.",
      close: "Fechar",
      clear: "Limpar",
    };
  }, [language]);

  const palette = mode === "senior"
    ? {
        accent: theme.colors.senior,
        accentDark: theme.colors.seniorDark,
        accentSoft: theme.colors.seniorSoft,
      }
    : {
        accent: theme.colors.primary,
        accentDark: theme.colors.primaryDark,
        accentSoft: theme.colors.primarySoft,
      };

  useEffect(() => {
    if (!visible) {
      return;
    }

    const trimmed = query.trim();
    const normalizedQuery = normalizeSearchValue(trimmed);

    const warmCandidates = [
      ...POPULAR_PLACES,
      ...warmPlacesRef.current,
      ...Array.from(cacheRef.current.entries())
        .filter(([key]) => normalizedQuery && (normalizedQuery.startsWith(key) || key.startsWith(normalizedQuery)))
        .flatMap(([, places]) => places),
    ];

    if (trimmed.length < 2) {
      setResults(rankPlaces(warmCandidates, trimmed));
      setLoading(false);
      return;
    }

    const cachedResults = cacheRef.current.get(normalizedQuery);
    if (cachedResults) {
      setResults(rankPlaces([...cachedResults, ...warmCandidates], trimmed));
      setHasSearched(true);
      setLoading(false);
      return;
    }

    setResults(rankPlaces(warmCandidates, trimmed));

    let isActive = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);

      try {
        const response = await api.get<Place[]>("/api/places/search", {
          params: { query: trimmed },
        });

        if (isActive) {
          const nextResults = response.data ?? [];
          cacheRef.current.set(normalizedQuery, nextResults);
          warmPlacesRef.current = uniquePlaces([...warmPlacesRef.current, ...nextResults]);
          setResults(rankPlaces([...nextResults, ...warmCandidates], trimmed));
        }
      } catch {
        if (isActive) {
          setResults(rankPlaces(warmCandidates, trimmed));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }, 140);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [query, visible]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults(POPULAR_PLACES.slice(0, 6));
      setHasSearched(false);
    }
  }, [visible]);

  const handleSelect = (place: Place) => {
    onChange({
      code: place.iataCode,
      label: place.cityName || place.name,
      city: place.cityName || place.name,
      country: place.countryName || null,
    });
    setVisible(false);
  };

  const helperText = value?.country ? `${value.code} · ${value.country}` : value?.code || placeholder;
  const codeBadge = value?.code || "IATA";

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          { borderColor: value ? palette.accent : theme.colors.outline },
          value && { backgroundColor: palette.accentSoft },
        ]}
        activeOpacity={0.92}
        onPress={() => setVisible(true)}
      >
        <View style={[styles.triggerTopLine, { backgroundColor: value ? palette.accent : theme.colors.outline }]} />
        <Text style={styles.triggerLabel}>{label}</Text>
        <View style={styles.triggerContentRow}>
          <View style={styles.triggerCopy}>
            <Text style={[styles.triggerValue, !value && styles.triggerPlaceholder]}>
              {value ? value.label : placeholder}
            </Text>
            <Text style={[styles.triggerHelper, value && { color: palette.accentDark }]}>{helperText}</Text>
          </View>
          <View style={[styles.triggerBadge, { backgroundColor: value ? theme.colors.white : theme.colors.surfaceSoft }]}>
            <Text style={[styles.triggerBadgeText, value && { color: palette.accentDark }]}>{codeBadge}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.panelTopGlow} />
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{copy.title}</Text>
                <Text style={styles.subtitle}>{copy.subtitle}</Text>
              </View>
              <TouchableOpacity style={[styles.closeButton, { backgroundColor: palette.accentSoft }]} onPress={() => setVisible(false)}>
                <Text style={[styles.closeButtonText, { color: palette.accentDark }]}>{copy.close}</Text>
              </TouchableOpacity>
            </View>

            {value ? (
              <View style={[styles.currentSelection, { borderColor: palette.accent, backgroundColor: palette.accentSoft }]}>
                <Text style={styles.currentLabel}>{copy.current}</Text>
                <View style={styles.currentMeta}>
                  <Text style={styles.currentValue}>{value.label}</Text>
                  <TouchableOpacity onPress={() => onChange(null)}>
                    <Text style={[styles.clearButton, { color: palette.accentDark }]}>{copy.clear}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.currentHelper}>
                  {value.code}
                  {value.country ? ` · ${value.country}` : ""}
                </Text>
              </View>
            ) : null}

            <View style={styles.searchBox}>
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder={copy.searchPlaceholder}
                placeholderTextColor={theme.colors.gray500}
                style={styles.searchInput}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {loading ? <ActivityIndicator color={palette.accent} /> : null}
            </View>

            <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {!loading && query.trim().length < 2 ? (
                <Text style={styles.feedbackText}>{copy.empty}</Text>
              ) : null}

              {!loading && hasSearched && query.trim().length >= 2 && results.length === 0 ? (
                <Text style={styles.feedbackText}>{copy.noResults}</Text>
              ) : null}

              {results.map((place) => (
                <TouchableOpacity
                  key={`${place.id}-${place.iataCode}`}
                  style={styles.resultItem}
                  activeOpacity={0.9}
                  onPress={() => handleSelect(place)}
                >
                  <View style={[styles.resultBadge, { backgroundColor: palette.accentSoft }]}>
                    <Text style={[styles.resultCode, { color: palette.accentDark }]}>{place.iataCode}</Text>
                  </View>
                  <View style={styles.resultCopy}>
                    <Text style={styles.resultTitle}>{place.cityName || place.name}</Text>
                    <Text style={styles.resultSubtitle}>
                      {place.name}
                      {place.countryName ? ` · ${place.countryName}` : ""}
                    </Text>
                  </View>
                  <View style={styles.resultMetaPill}>
                    <Text style={styles.resultMetaText}>
                      {place.type === "airport"
                        ? language === "en"
                          ? "Airport"
                          : language === "es"
                            ? "Aeropuerto"
                            : "Aeroporto"
                        : language === "en"
                          ? "City"
                          : language === "es"
                            ? "Ciudad"
                            : "Cidade"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(4),
    overflow: "hidden",
  },
  triggerTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: theme.colors.gray500,
  },
  triggerContentRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(3),
  },
  triggerCopy: {
    flex: 1,
  },
  triggerValue: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  triggerPlaceholder: {
    color: theme.colors.gray500,
  },
  triggerHelper: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.gray600,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.46)",
    justifyContent: "center",
    padding: theme.spacing(4),
  },
  panel: {
    maxHeight: "82%",
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(4),
    borderWidth: 1,
    borderColor: theme.colors.outline,
    ...theme.shadow.floating,
    overflow: "hidden",
  },
  panelTopGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  header: {
    flexDirection: "row",
    gap: theme.spacing(3),
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.gray600,
  },
  closeButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  currentSelection: {
    marginTop: theme.spacing(4),
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: theme.colors.gray500,
  },
  currentMeta: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  currentValue: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  clearButton: {
    fontSize: 13,
    fontWeight: "800",
  },
  currentHelper: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.gray600,
  },
  searchBox: {
    marginTop: theme.spacing(4),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing(4),
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.gray900,
    paddingVertical: theme.spacing(3.5),
  },
  results: {
    marginTop: theme.spacing(4),
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.gray600,
    paddingHorizontal: theme.spacing(1),
    paddingVertical: theme.spacing(3),
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(3),
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  resultBadge: {
    minWidth: 56,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCode: {
    fontSize: 14,
    fontWeight: "800",
  },
  resultCopy: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.gray900,
  },
  resultSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.gray600,
  },
  triggerBadge: {
    minWidth: 66,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.gray600,
    letterSpacing: 0.8,
  },
  resultMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resultMetaText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});
