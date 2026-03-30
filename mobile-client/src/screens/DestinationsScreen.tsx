import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { getDestinationHighlights, type DestinationPlace } from "../services/destinations";
import { useOnboardingStore } from "../store/onboardingStore";
import { theme } from "../theme/theme";

const destinationOptions = [
  { city: "Orlando", country: "us", label: { pt: "Orlando, EUA", en: "Orlando, USA", es: "Orlando, EE. UU." } },
  { city: "Miami", country: "us", label: { pt: "Miami, EUA", en: "Miami, USA", es: "Miami, EE. UU." } },
  { city: "New York", country: "us", label: { pt: "Nova York, EUA", en: "New York, USA", es: "Nueva York, EE. UU." } },
  { city: "Boston", country: "us", label: { pt: "Boston, EUA", en: "Boston, USA", es: "Boston, EE. UU." } },
  { city: "Rio de Janeiro", country: "br", label: { pt: "Rio de Janeiro, Brasil", en: "Rio de Janeiro, Brazil", es: "Río de Janeiro, Brasil" } },
  { city: "Sao Paulo", country: "br", label: { pt: "São Paulo, Brasil", en: "São Paulo, Brazil", es: "São Paulo, Brasil" } },
  { city: "Salvador", country: "br", label: { pt: "Salvador, Brasil", en: "Salvador, Brazil", es: "Salvador, Brasil" } },
  { city: "Brasilia", country: "br", label: { pt: "Brasília, Brasil", en: "Brasília, Brazil", es: "Brasilia, Brasil" } },
] as const;

export function DestinationsScreen() {
  const language = useOnboardingStore((state) => state.language);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<DestinationPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Catalog",
        title: "Official destination inspiration",
        subtitle: "Highlights curated from the same travel source that powers the Michels Travel website.",
        loading: "Loading destination highlights...",
        errorTitle: "Could not load destinations",
        retry: "Try again",
        empty: "No highlights returned for this city yet.",
        website: "Official website",
        wikipedia: "Travel overview",
        sourceValue: "Same source",
        sourceLabel: "The app reads destination highlights from the main Michels Travel platform",
        cityValue: "Curated city",
        cityLabel: "Switch cities to compare official travel highlights",
        placesLabel: "Highlights",
      };
    }

    if (language === "es") {
      return {
        badge: "Catálogo",
        title: "Inspiración oficial de destinos",
        subtitle: "Lugares destacados obtenidos de la misma fuente de viajes que impulsa el sitio de Michels Travel.",
        loading: "Cargando destinos destacados...",
        errorTitle: "No fue posible cargar los destinos",
        retry: "Intentar de nuevo",
        empty: "Todavía no hay lugares destacados para esta ciudad.",
        website: "Sitio oficial",
        wikipedia: "Resumen del destino",
        sourceValue: "Misma fuente",
        sourceLabel: "La app lee los destaques desde la plataforma principal de Michels Travel",
        cityValue: "Ciudad curada",
        cityLabel: "Cambie de ciudad para comparar destaques oficiales",
        placesLabel: "Destaques",
      };
    }

    return {
      badge: "Catálogo",
      title: "Inspiração oficial de destinos",
      subtitle: "Destaques obtidos da mesma fonte de viagens que alimenta o site da Michels Travel.",
      loading: "Carregando destinos em destaque...",
      errorTitle: "Não foi possível carregar os destinos",
      retry: "Tentar novamente",
      empty: "Ainda não há destaques para esta cidade.",
      website: "Site oficial",
      wikipedia: "Resumo do destino",
      sourceValue: "Mesma fonte",
      sourceLabel: "O app lê os destaques a partir da plataforma principal da Michels Travel",
      cityValue: "Cidade curada",
      cityLabel: "Troque de cidade para comparar destaques oficiais",
      placesLabel: "Destaques",
    };
  }, [language]);

  const selectedDestination = destinationOptions[selectedIndex];

  const loadHighlights = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getDestinationHighlights({
        city: selectedDestination.city,
        country: selectedDestination.country,
        lang: language,
        limit: 18,
      });
      setItems(response.items ?? []);
    } catch {
      setItems([]);
      setError(copy.errorTitle);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHighlights();
  }, [selectedDestination.city, selectedDestination.country, language]);

  return (
    <AppShell
        mode="regular"
        badge={copy.badge}
        title={copy.title}
        subtitle={copy.subtitle}
        scrollable={false}
        contentStyle={styles.safe}
        reserveBottomNav
      >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.proofRow}>
              <View style={styles.proofCard}>
                <Text style={styles.proofValue}>{copy.sourceValue}</Text>
                <Text style={styles.proofLabel}>{copy.sourceLabel}</Text>
              </View>
              <View style={styles.proofCard}>
                <Text style={styles.proofValue}>{copy.cityValue}</Text>
                <Text style={styles.proofLabel}>{copy.cityLabel}</Text>
              </View>
            </View>

            <View style={styles.spotlightCard}>
              <Text style={styles.spotlightLabel}>{copy.placesLabel}</Text>
              <Text style={styles.spotlightTitle}>{selectedDestination.label[language]}</Text>
              <Text style={styles.spotlightMeta}>{items.length} {copy.placesLabel.toLowerCase()}</Text>
            </View>

            <FlatList
              data={destinationOptions}
              keyExtractor={(item) => item.city}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item, index }) => {
                const active = index === selectedIndex;
                const label = item.label[language];
                return (
                  <TouchableOpacity
                    style={[styles.cityChip, active && styles.cityChipActive]}
                    onPress={() => setSelectedIndex(index)}
                  >
                    <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            {loading ? (
              <Card>
                <View style={styles.feedbackRow}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <Text style={styles.feedbackText}>{copy.loading}</Text>
                </View>
              </Card>
            ) : null}

            {!loading && error ? (
              <Card>
                <Text style={styles.errorTitle}>{copy.errorTitle}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => void loadHighlights()}>
                  <Text style={styles.retryButtonText}>{copy.retry}</Text>
                </TouchableOpacity>
              </Card>
            ) : null}

            {!loading && !error && items.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>{copy.empty}</Text>
              </Card>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Card>
            <View style={[styles.cover, index % 2 === 1 && styles.coverAlt]}>
              <Text style={styles.coverCode}>{selectedDestination.city.toUpperCase()}</Text>
              <Text style={styles.coverCity}>{item.name || item.city || selectedDestination.city}</Text>
              <Text style={styles.coverMeta}>{item.address || `${item.city || selectedDestination.city}`}</Text>
            </View>

            <View style={styles.metaStrip}>
              {item.distance_m ? (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{Math.round(item.distance_m)} m</Text>
                </View>
              ) : null}
              {item.country ? (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{item.country}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>{item.name || item.city || selectedDestination.city}</Text>
            <Text style={styles.route}>{item.address || `${item.city || selectedDestination.city} · ${item.country || ""}`}</Text>

            <View style={styles.linksRow}>
              {item.website ? (
                <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(item.website || "")}>
                  <Text style={styles.linkButtonText}>{copy.website}</Text>
                </TouchableOpacity>
              ) : null}
              {item.wikipedia ? (
                <TouchableOpacity style={styles.linkButtonSecondary} onPress={() => Linking.openURL(`https://wikipedia.org/wiki/${item.wikipedia}`)}>
                  <Text style={styles.linkButtonSecondaryText}>{copy.wikipedia}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Card>
        )}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing(4), gap: theme.spacing(3), paddingBottom: theme.spacing(8) },
  headerBlock: { gap: theme.spacing(3) },
  proofRow: { flexDirection: "row", gap: theme.spacing(2) },
  proofCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    ...theme.shadow.subtle,
  },
  proofValue: { fontSize: 15, fontWeight: "800", color: theme.colors.primaryInk },
  proofLabel: { marginTop: 6, fontSize: 12, lineHeight: 18, color: theme.colors.gray600 },
  spotlightCard: {
    borderRadius: 28,
    backgroundColor: theme.colors.primaryInk,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(4),
    ...theme.shadow.floating,
  },
  spotlightLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.74)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  spotlightTitle: { marginTop: 8, fontSize: 26, fontWeight: "800", color: theme.colors.white },
  spotlightMeta: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.78)" },
  chipRow: { gap: theme.spacing(2), paddingBottom: theme.spacing(2) },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  cityChipActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  cityChipText: { fontSize: 13, fontWeight: "700", color: theme.colors.gray700 },
  cityChipTextActive: { color: theme.colors.primaryDark },
  feedbackRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing(3) },
  feedbackText: { flex: 1, color: theme.colors.gray700, fontSize: 14, lineHeight: 20 },
  errorTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.gray900 },
  retryButton: {
    marginTop: theme.spacing(3),
    alignSelf: "flex-start",
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryButtonText: { color: theme.colors.white, fontWeight: "800", fontSize: 14 },
  emptyText: { color: theme.colors.gray600, fontSize: 14, lineHeight: 21 },
  cover: {
    borderRadius: 24,
    marginBottom: theme.spacing(3),
    backgroundColor: theme.colors.primaryInk,
    padding: theme.spacing(4),
  },
  coverAlt: { backgroundColor: theme.colors.primaryDark },
  coverCode: { color: "rgba(255,255,255,0.74)", fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  coverCity: { marginTop: 10, color: theme.colors.white, fontSize: 24, fontWeight: "800" },
  coverMeta: { marginTop: 8, color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 18 },
  metaStrip: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2), marginBottom: theme.spacing(3) },
  metaPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  metaPillText: { color: theme.colors.gray700, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  title: { fontSize: 20, fontWeight: "800", color: theme.colors.gray900 },
  route: { marginTop: 8, fontSize: 13, lineHeight: 20, color: theme.colors.gray600 },
  linksRow: { marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2) },
  linkButton: {
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  linkButtonText: { color: theme.colors.white, fontSize: 13, fontWeight: "800" },
  linkButtonSecondary: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  linkButtonSecondaryText: { color: theme.colors.primaryDark, fontSize: 13, fontWeight: "800" },
});
