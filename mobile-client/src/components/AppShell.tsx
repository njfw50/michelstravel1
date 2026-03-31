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
  icon?: string;
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
        trips: "My Trips",
        help: "Support",
        footerLegal: `Michel's Travel · Efficient travel option · Copyright © ${currentYear}`,
      };
    }
    if (language === "es") {
      return {
        menu: "Navegación",
        close: "Cerrar",
        search: mode === "senior" ? "Reserva senior" : "Buscar vuelos",
        catalog: "Catálogo",
        trips: "Mis viajes",
        help: "Soporte",
        footerLegal: `Michel's Travel · Opción eficiente · Copyright © ${currentYear}`,
      };
    }
    return {
      menu: "Navegação",
      close: "Fechar",
      search: mode === "senior" ? "Reserva sênior" : "Buscar voos",
      catalog: "Catálogo",
      trips: "Minhas viagens",
      help: "Suporte",
      footerLegal: `Michel's Travel · Opção eficiente · Copyright © ${currentYear}`,
    };
  }, [currentYear, language, mode]);

  const isSenior = mode === "senior";

  const modePalette = isSenior
    ? {
        gradientColors: ["#5C3206", "#9A5C0A", "#D4820E", "#E8A030"] as string[],
        chipBg: "rgba(255,245,220,0.18)",
        chipText: "#FFF8E8",
        accentBg: theme.colors.seniorSoft,
        accentText: theme.colors.seniorDark,
        activeBg: theme.colors.seniorMist,
        activeBorder: "#F2C97A",
        menuAccent: theme.colors.senior,
      }
    : {
        gradientColors: ["#080F28", "#111E5A", "#1A2D82", "#2C44B0"] as string[],
        chipBg: "rgba(255,255,255,0.14)",
        chipText: "rgba(255,255,255,0.95)",
        accentBg: theme.colors.primarySoft,
        accentText: theme.colors.primary,
        activeBg: theme.colors.primaryMist,
        activeBorder: "#C0D4FF",
        menuAccent: theme.colors.primary,
      };

  const topSpacing = Math.max(2, Math.min(insets.top, 10));
  const bottomBarInset = reserveBottomNav ? Math.max(insets.bottom + 52, 62) : Math.max(insets.bottom + 6, 12);
  const contentBottomPadding = reserveBottomNav ? 20 : 14;

  const navigateMain = (screen?: string) => {
    setMenuVisible(false);
    if (mode === "senior") {
      navigation.navigate("SeniorMain", screen ? { screen } : undefined);
      return;
    }
    navigation.navigate("RegularMain", screen ? { screen } : undefined);
  };

  const menuItems: MenuItem[] = isSenior
    ? [
        { label: labels.search, action: () => navigateMain("SeniorHome"), active: true, icon: "✈" },
        { label: labels.trips, action: () => navigateMain("SeniorTrips"), icon: "🧳" },
        { label: labels.help, action: () => navigateMain("SeniorHelp"), icon: "💬" },
      ]
    : [
        { label: labels.search, action: () => navigateMain("RegularHome"), active: true, icon: "✈" },
        { label: labels.catalog, action: () => navigateMain("RegularCatalog"), icon: "🗺" },
        { label: labels.trips, action: () => navigateMain("RegularTrips"), icon: "🧳" },
        { label: labels.help, action: () => navigateMain("RegularHelp"), icon: "💬" },
      ];

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }, contentStyle]}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.contentStatic, { paddingBottom: contentBottomPadding }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.ambientBlob, styles.ambientBlobTop, isSenior && styles.ambientBlobTopSenior]} />
      <View style={[styles.ambientBlob, styles.ambientBlobBottom, isSenior && styles.ambientBlobBottomSenior]} />

      <View style={[styles.heroWrap, { paddingTop: topSpacing }]}>
        <LinearGradient
          colors={modePalette.gradientColors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, heroSize === "expanded" && styles.heroExpanded]}
        >
          <View style={styles.orbTopRight} />
          <View style={styles.orbBottomLeft} />

          <View style={styles.navbar}>
            <View style={styles.brandPill}>
              <View style={styles.logoBox}>
                <Image source={logo} style={styles.logoImage} resizeMode="contain" />
              </View>
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitle}>Michels Travel</Text>
                <Text style={styles.brandSub}>Agency</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.menuButton, { backgroundColor: modePalette.chipBg }]}
              onPress={() => setMenuVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.menuIconWrap}>
                <View style={styles.menuLine} />
                <View style={[styles.menuLine, styles.menuLineMid]} />
                <View style={[styles.menuLine, styles.menuLineShort]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={[styles.badgePill, { backgroundColor: modePalette.chipBg }]}>
              <Text style={[styles.badgeText, { color: modePalette.chipText }]}>{badge}</Text>
            </View>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle} numberOfLines={heroSize === "expanded" ? 3 : 2}>
              {subtitle}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.contentWrap}>{content}</View>

      <View style={[styles.footerWrap, { marginBottom: bottomBarInset }]}>
        <Text style={styles.footerLegal} numberOfLines={1}>{labels.footerLegal}</Text>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuPanel} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={modePalette.gradientColors.slice(0, 2)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuHeaderStrip}
            >
              <View style={styles.menuHeaderLogoRow}>
                <View style={styles.menuHeaderLogo}>
                  <Image source={logo} style={styles.menuHeaderLogoImg} resizeMode="contain" />
                </View>
                <View>
                  <Text style={styles.menuHeaderBrand}>Michels Travel</Text>
                  <Text style={styles.menuHeaderSub}>Agency</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.menuCloseBtn}
                onPress={() => setMenuVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.menuCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>

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
                  activeOpacity={0.75}
                >
                  <View style={styles.menuItemRow}>
                    <Text style={styles.menuItemIcon}>{item.icon}</Text>
                    <Text style={[styles.menuItemText, item.active && { color: modePalette.menuAccent }]}>
                      {item.label}
                    </Text>
                    {item.active && (
                      <View style={[styles.menuItemDot, { backgroundColor: modePalette.menuAccent }]} />
                    )}
                  </View>
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
  ambientBlob: { position: "absolute", borderRadius: 999, zIndex: 0 },
  ambientBlobTop: {
    top: -100,
    right: -60,
    width: 240,
    height: 240,
    backgroundColor: "rgba(44,68,176,0.07)",
  },
  ambientBlobTopSenior: { backgroundColor: "rgba(212,130,14,0.07)" },
  ambientBlobBottom: {
    bottom: 60,
    left: -70,
    width: 200,
    height: 200,
    backgroundColor: "rgba(44,68,176,0.05)",
  },
  ambientBlobBottomSenior: { backgroundColor: "rgba(212,130,14,0.05)" },
  heroWrap: {
    paddingHorizontal: 14,
    zIndex: 2,
  },
  hero: {
    borderRadius: theme.radius.xxl,
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3.5),
    overflow: "hidden",
    ...theme.shadow.elevated,
  },
  heroExpanded: { paddingBottom: theme.spacing(4.5) },
  orbTopRight: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  orbBottomLeft: {
    position: "absolute",
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2.5),
    flex: 1,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: { width: 36, height: 36, borderRadius: 10 },
  brandTextWrap: { flex: 1 },
  brandTitle: { color: theme.colors.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.1 },
  brandSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconWrap: { width: 18, gap: 4, alignItems: "flex-end" },
  menuLine: { width: 18, height: 2, borderRadius: 999, backgroundColor: theme.colors.white },
  menuLineMid: { width: 14 },
  menuLineShort: { width: 10 },
  heroContent: { marginTop: theme.spacing(2.5), gap: theme.spacing(1.5) },
  badgePill: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  contentWrap: { flex: 1, zIndex: 1 },
  content: {
    paddingHorizontal: theme.spacing(3.5),
    paddingTop: theme.spacing(3),
    gap: theme.spacing(3),
  },
  contentStatic: {
    flex: 1,
    paddingHorizontal: theme.spacing(3.5),
    paddingTop: theme.spacing(3),
  },
  footerWrap: {
    paddingHorizontal: theme.spacing(4),
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineSoft,
    backgroundColor: theme.colors.surface,
  },
  footerLegal: {
    fontSize: 9,
    color: theme.colors.gray400,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,15,40,0.54)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuPanel: {
    width: "82%",
    maxWidth: 340,
    marginTop: 20,
    marginRight: 12,
    borderRadius: theme.radius.xxl,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    ...theme.shadow.floating,
  },
  menuHeaderStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(4),
  },
  menuHeaderLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2.5),
  },
  menuHeaderLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  menuHeaderLogoImg: { width: 32, height: 32, borderRadius: 9 },
  menuHeaderBrand: { color: theme.colors.white, fontSize: 15, fontWeight: "800" },
  menuHeaderSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  menuCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuCloseBtnText: { color: theme.colors.white, fontSize: 14, fontWeight: "800" },
  menuList: { padding: theme.spacing(3), gap: theme.spacing(2) },
  menuItem: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3.5),
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2.5),
  },
  menuItemIcon: { fontSize: 16 },
  menuItemText: { color: theme.colors.gray800, fontSize: 15, fontWeight: "700", flex: 1 },
  menuItemDot: { width: 7, height: 7, borderRadius: 999 },
});
