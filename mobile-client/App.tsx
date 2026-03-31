import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBarIcon } from "./src/components/TabBarIcon";
import { AppStatusScreen } from "./src/screens/AppStatusScreen";
import { DestinationsScreen } from "./src/screens/DestinationsScreen";
import { HelpScreen } from "./src/screens/HelpScreen";
import { LanguageSelectScreen } from "./src/screens/LanguageSelectScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { PrivacyScreen } from "./src/screens/PrivacyScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { BookingFormScreen } from "./src/screens/BookingFormScreen";
import { RegularHomeScreen } from "./src/screens/HomeSearchScreen";
import { RegularResultsScreen } from "./src/screens/ResultsScreen";
import { SeniorHomeScreen } from "./src/screens/SeniorHomeScreen";
import { SeniorResultsScreen } from "./src/screens/SeniorResultsScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import { TermsScreen } from "./src/screens/TermsScreen";
import { TripDetailScreen } from "./src/screens/TripDetailScreen";
import { TripsScreen } from "./src/screens/TripsScreen";
import { useOnboardingStore } from "./src/store/onboardingStore";
import { RegularTabParamList, RootStackParamList, SeniorTabParamList } from "./src/types/navigation";
import { theme } from "./src/theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();
const RegularTabs = createBottomTabNavigator<RegularTabParamList>();
const SeniorTabs = createBottomTabNavigator<SeniorTabParamList>();

function RegularTabsNavigator() {
  const insets = useSafeAreaInsets();
  const language = useOnboardingStore((state) => state.language);
  const labels = language === "en"
    ? { home: "Search", destinations: "Catalog", trips: "Trips", help: "Help" }
    : language === "es"
      ? { home: "Buscar", destinations: "Catalogo", trips: "Viajes", help: "Ayuda" }
      : { home: "Buscar", destinations: "Catalogo", trips: "Viagens", help: "Ajuda" };

  return (
    <RegularTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: Math.max(insets.bottom, 8),
          height: 50 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          borderRadius: 22,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          ...theme.shadow.floating,
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: "800", marginTop: 0, marginBottom: 0 },
      }}
    >
      <RegularTabs.Screen
        name="RegularHome"
        component={RegularHomeScreen}
        options={{
          title: labels.home,
          tabBarLabel: labels.home,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon variant="search" color={color} focused={focused} accentBackground={theme.colors.primarySoft} />
          ),
        }}
      />
      <RegularTabs.Screen
        name="RegularCatalog"
        component={DestinationsScreen}
        options={{
          title: labels.destinations,
          tabBarLabel: labels.destinations,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon variant="catalog" color={color} focused={focused} accentBackground={theme.colors.primarySoft} />
          ),
        }}
      />
      <RegularTabs.Screen
        name="RegularTrips"
        component={TripsScreen}
        options={{
          title: labels.trips,
          tabBarLabel: labels.trips,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon variant="trips" color={color} focused={focused} accentBackground={theme.colors.primarySoft} />
          ),
        }}
      />
      <RegularTabs.Screen
        name="RegularHelp"
        component={HelpScreen}
        options={{
          title: labels.help,
          tabBarLabel: labels.help,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon variant="help" color={color} focused={focused} accentBackground={theme.colors.primarySoft} />
          ),
        }}
      />
    </RegularTabs.Navigator>
  );
}

function SeniorTabsNavigator() {
  const insets = useSafeAreaInsets();
  const language = useOnboardingStore((state) => state.language);
  const labels = language === "en"
    ? { home: "Senior", trips: "Trips", help: "Help" }
    : language === "es"
      ? { home: "Senior", trips: "Viajes", help: "Ayuda" }
      : { home: "Senior", trips: "Viagens", help: "Ajuda" };

  return (
    <SeniorTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.seniorDark,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: Math.max(insets.bottom, 8),
          height: 50 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          borderRadius: 22,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          ...theme.shadow.floating,
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: "800", marginTop: 0, marginBottom: 0 },
      }}
    >
      <SeniorTabs.Screen
        name="SeniorHome"
        component={SeniorHomeScreen}
        options={{
          title: labels.home,
          tabBarLabel: labels.home,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon variant="senior" color={color} focused={focused} accentBackground={theme.colors.seniorSoft} />
          ),
        }}
      />
      <SeniorTabs.Screen
        name="SeniorTrips"
        component={TripsScreen}
        options={{
          title: labels.trips,
          tabBarLabel: labels.trips,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon variant="trips" color={color} focused={focused} accentBackground={theme.colors.seniorSoft} />
          ),
        }}
      />
      <SeniorTabs.Screen
        name="SeniorHelp"
        component={HelpScreen}
        options={{
          title: labels.help,
          tabBarLabel: labels.help,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon variant="help" color={color} focused={focused} accentBackground={theme.colors.seniorSoft} />
          ),
        }}
      />
    </SeniorTabs.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          ...DefaultTheme,
          colors: { ...DefaultTheme.colors, primary: theme.colors.primary, background: theme.colors.white },
        }}
      >
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="AppStatus" component={AppStatusScreen} />
          <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="RegularMain" component={RegularTabsNavigator} />
          <Stack.Screen name="SeniorMain" component={SeniorTabsNavigator} />
          <Stack.Screen name="RegularResults" component={RegularResultsScreen} />
          <Stack.Screen name="SeniorResults" component={SeniorResultsScreen} />
          <Stack.Screen name="TripDetail" component={TripDetailScreen} />
          <Stack.Screen name="BookingForm" component={BookingFormScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
