export const theme = {
  colors: {
    // Brand — azul profundo premium
    primary: "#2C44B0",
    primaryDark: "#1A2D82",
    primaryInk: "#111E5A",
    primarySoft: "#EAF0FF",
    primaryMist: "#F2F6FF",
    primaryGlow: "rgba(44,68,176,0.12)",

    // Brand — dourado senior premium
    senior: "#D4820E",
    seniorDark: "#7E4A08",
    seniorSoft: "#FFF3DC",
    seniorMist: "#FFFAF0",
    seniorGlow: "rgba(212,130,14,0.12)",

    // Accent / Status
    accent: "#FF5A4E",
    accentSoft: "#FFF0EF",
    success: "#0C9E52",
    successSoft: "#EDFAF3",
    warning: "#E89C00",
    warningSoft: "#FFF8E6",
    danger: "#C93B3B",
    dangerSoft: "#FFF0F0",

    // Neutros — escala refinada
    gray950: "#080F1E",
    gray900: "#0D1526",
    gray800: "#1E2A3A",
    gray700: "#2E3D52",
    gray600: "#4A5C72",
    gray500: "#637589",
    gray400: "#8A9BB0",
    gray300: "#B8C7D8",
    gray200: "#D8E3EF",
    gray150: "#E8EFF8",
    gray100: "#F0F5FA",
    gray50: "#F7FAFD",

    // Superfícies
    surface: "#FFFFFF",
    surfaceMuted: "#FAFCFF",
    surfaceSoft: "#F5F8FD",
    surfaceCard: "#FFFFFF",
    outline: "#D8E5F5",
    outlineSoft: "#E8F0FA",
    background: "#F0F5FB",
    white: "#FFFFFF",

    // Gradientes — usados como arrays
    gradientNavy: ["#0C1A40", "#1A2D82", "#2C44B0"] as string[],
    gradientSenior: ["#7E4A08", "#C47010", "#E09428"] as string[],
    gradientAccent: ["#FF5A4E", "#FF8A60"] as string[],
  },

  spacing: (factor: number) => 4 * factor,

  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 26,
    xxl: 34,
    pill: 999,
  },

  shadow: {
    xs: {
      elevation: 2,
      shadowColor: "#0D1526",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    card: {
      elevation: 6,
      shadowColor: "#0D1526",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 18,
    },
    elevated: {
      elevation: 12,
      shadowColor: "#0D1526",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.10,
      shadowRadius: 28,
    },
    floating: {
      elevation: 20,
      shadowColor: "#0D1526",
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.14,
      shadowRadius: 40,
    },
    glow: {
      elevation: 8,
      shadowColor: "#2C44B0",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 20,
    },
    seniorGlow: {
      elevation: 8,
      shadowColor: "#C47010",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 20,
    },
  },

  text: {
    display: { fontSize: 32, fontWeight: "800" as const, color: "#0D1526", lineHeight: 38 },
    title: { fontSize: 24, fontWeight: "800" as const, color: "#0D1526", lineHeight: 30 },
    heading: { fontSize: 20, fontWeight: "700" as const, color: "#0D1526", lineHeight: 26 },
    subheading: { fontSize: 17, fontWeight: "700" as const, color: "#2E3D52", lineHeight: 24 },
    body: { fontSize: 15, fontWeight: "500" as const, color: "#2E3D52", lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: "600" as const, color: "#637589", lineHeight: 17 },
    label: { fontSize: 11, fontWeight: "800" as const, color: "#637589", textTransform: "uppercase" as const, letterSpacing: 0.9 },
    small: { fontSize: 11, color: "#637589", lineHeight: 16 },
  },
};
