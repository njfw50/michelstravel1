import React, { ReactNode, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme/theme";
import { JourneyMode } from "../types/app";
import { useOnboardingStore } from "../store/onboardingStore";
const logo = require("../assets/logo.png");

type AppShellProps = {
  mode: JourneyMode;
  badge: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  heroSize?: "default" | "expanded";
  reserveBottomNav?: boolean;
};

type MenuItem = {
  label: string;
  action: () => void;
  active?: boolean;
};

export function AppShell({
  mode,
  badge,
  title,
  subtitle,
  children,
  scrollable = true,
  contentStyle,
  heroSize = "default",
  reserveBottomNav = false,
}: AppShellProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const language = useOnboardingStore((state) => state.language);
  const [menuVisible, setMenuVisible] = useState(false);
  const currentYear = new Date().getFullYear();

  const labels = useMemo(() => {
    if (language === "en") {
      return {
        menu: "Navigation",
        close: "Close",
        search: mode === "senior" ? "Senior booking" : "Search flights",
        catalog: "Catalog",
        trips: "Trips",
        help: "Help",
        footerLegal: `Michel's Travel · Efficient travel option · Copyright © ${currentYear}`,
      };
    }

    if (language === "es") {
      return {
        menu: "Navegación",
        close: "Cerrar",
        search: mode === "senior" ? "Reserva senior" : "Buscar vuelos",
        catalog: "Catálogo",
        trips: "Viajes",
        help: "Ayuda",
        footerLegal: `Michel's Travel · Opción eficiente · Copyright © ${currentYear}`,
      };
    }

    return {
      menu: "Navegação",
      close: "Fechar",
      search: mode === "senior" ? "Reserva sênior" : "Buscar voos",
      catalog: "Catálogo",
      trips: "Viagens",
      help: "Ajuda",
      footerLegal: `Michel's Travel · Opção eficiente · Copyright © ${currentYear}`,
    };
  }, [currentYear, language, mode]);

  const modePalette = mode === "senior"
    ? {
        gradient: [theme.colors.seniorDark, theme.colors.senior, "#F0B24B"],
        chipBg: "rgba(255,248,233,0.2)",
        chipText: "#FFF7EA",
        accentBg: theme.colors.seniorSoft,
        accentText: theme.colors.seniorDark,
        activeBg: theme.colors.seniorMist,
        activeBorder: "#F4D29B",
      }
    : {
        gradient: [theme.colors.navy, theme.colors.primaryDark, "#3558C8"],
        chipBg: "rgba(255,255,255,0.16)",
        chipText: theme.colors.white,
        accentBg: theme.colors.primarySoft,
        accentText: theme.colors.primary,
        activeBg: theme.colors.primaryMist,
        activeBorder: "#CFE0FF",
      };

  const topSpacing = 0;
  const bottomInset = Math.min(Math.max(insets.bottom, 0), 10);
  const bottomBarInset = reserveBottomNav ? 44 + bottomInset : 8 + bottomInset;
  const contentBottomPadding = scrollable ? 8 : 12;

  const footerBlock = (
    <View
      style={[
        styles.footerWrap,
        scrollable ? styles.footerWrapInline : null,
        { marginBottom: bottomBarInset, paddingBottom: 5 + Math.floor(bottomInset / 3) },
      ]}
    >
      <Text style={styles.footerLegal} numberOfLines={1}>{labels.footerLegal}</Text>
    </View>
  );

  const navigateMain = (screen?: string) => {
    setMenuVisible(false);

    if (mode === "senior") {
      navigation.navigate("SeniorMain", screen ? { screen } : undefined);
      return;
    }

    navigation.navigate("RegularMain", screen ? { screen } : undefined);
  };

  const menuItems: MenuItem[] = mode === "senior"
    ? [
        { label: labels.search, action: () => navigateMain("SeniorHome"), active: true },
        { label: labels.trips, action: () => navigateMain("SeniorTrips") },
        { label: labels.help, action: () => navigateMain("SeniorHelp") },
      ]
    : [
        { label: labels.search, action: () => navigateMain("RegularHome"), active: true },
        { label: labels.catalog, action: () => navigateMain("RegularCatalog") },
        { label: labels.trips, action: () => navigateMain("RegularTrips") },
        { label: labels.help, action: () => navigateMain("RegularHelp") },
      ];

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }, contentStyle]}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator
    >
      {children}
      {footerBlock}
    </ScrollView>
  ) : (
    <View style={[styles.contentStatic, { paddingBottom: contentBottomPadding }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />
      <View style={[styles.heroWrap, { paddingTop: topSpacing }]}>
        <LinearGradient
          colors={modePalette.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, heroSize === "expanded" && styles.heroExpanded]}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.navbar}>
            <View style={styles.brandPill}>
              <View style={styles.logoBox}>
                <Image source={logo} style={styles.logoImage} resizeMode="contain" />
              </View>
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitle}>Michels Travel</Text>
              </View>
            </View>

            <View style={styles.navActions}>
              <TouchableOpacity style={[styles.menuButton, { backgroundColor: modePalette.chipBg }]} onPress={() => setMenuVisible(true)}>
                <View style={styles.menuIcon}>
                  <View style={styles.menuLine} />
                  <View style={[styles.menuLine, styles.menuLineShort]} />
                  <View style={styles.menuLine} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={[styles.badge, { backgroundColor: modePalette.chipBg, color: modePalette.chipText }]}>{badge}</Text>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle} numberOfLines={heroSize === "expanded" ? 3 : 2}>{subtitle}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.contentWrap}>{content}</View>

      {!scrollable ? footerBlock : null}

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuPanel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>{labels.menu}</Text>
              <TouchableOpacity style={[styles.menuClose, { backgroundColor: modePalette.accentBg }]} onPress={() => setMenuVisible(false)}>
                <Text style={[styles.menuCloseText, { color: modePalette.accentText }]}>{labels.close}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    item.active && {
                      borderColor: modePalette.activeBorder,
                      backgroundColor: modePalette.activeBg,
                    },
                  ]}
                  onPress={item.action}
                >
                  <Text style={[styles.menuItemText, item.active && { color: modePalette.accentText }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  ambientTop: {
    position: "absolute",
    top: -120,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(48,71,166,0.08)",
  },
  ambientBottom: {
    position: "absolute",
    bottom: 40,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(217,137,27,0.06)",
  },
  heroWrap: {
    paddingHorizontal: theme.spacing(3),
  },
  hero: {
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: theme.spacing(3.5),
    paddingTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(2.5),
    ...theme.shadow.floating,
  },
  heroExpanded: {
    minHeight: 176,
    paddingTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(3),
  },
  heroGlowOne: {
    position: "absolute",
    top: -34,
    right: -10,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -56,
    left: -20,
    width: 132,
    height: 132,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2),
    flex: 1,
  },
  logoBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: { width: 37, height: 37, borderRadius: 12 },
  brandTextWrap: { flex: 1 },
  brandTitle: { color: theme.colors.white, fontSize: 17, fontWeight: "800", letterSpacing: 0.2 },
  navActions: { flexDirection: "row", alignItems: "center", gap: theme.spacing(2) },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: { width: 18, gap: 3 },
  menuLine: { height: 2, borderRadius: 999, backgroundColor: theme.colors.white },
  menuLineShort: { width: 12, alignSelf: "flex-end" },
  heroContent: { marginTop: theme.spacing(2) },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 11,
    paddingVertical: 5,
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    marginTop: theme.spacing(2.25),
    color: theme.colors.white,
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 28,
  },
  heroSubtitle: {
    marginTop: theme.spacing(1.25),
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    lineHeight: 17,
  },
  contentWrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing(3),
    paddingTop: theme.spacing(2),
    gap: theme.spacing(3),
  },
  contentStatic: {
    flex: 1,
    paddingHorizontal: theme.spacing(3),
    paddingTop: theme.spacing(2),
  },
  footerWrap: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: 5,
    minHeight: 28,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  footerWrapInline: {
    marginTop: theme.spacing(1),
  },
  footerLegal: {
    fontSize: 8,
    color: theme.colors.gray500,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.46)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuPanel: {
    width: "84%",
    maxWidth: 360,
    marginTop: 26,
    marginRight: 14,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing(5),
    ...theme.shadow.floating,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(3),
  },
  menuTitle: { color: theme.colors.gray900, fontSize: 20, fontWeight: "800" },
  menuClose: {
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuCloseText: { color: theme.colors.primary, fontSize: 12, fontWeight: "800" },
  menuList: { gap: theme.spacing(2) },
  menuItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(4),
  },
  menuItemText: { color: theme.colors.gray900, fontSize: 15, fontWeight: "700" },
});
