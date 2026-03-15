import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IS_ADMIN_APP } from "@/lib/app-variant";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: IS_ADMIN_APP ? "Radar" : "Inicio",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={IS_ADMIN_APP ? "bell.fill" : "house.fill"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: IS_ADMIN_APP ? "Vendas" : "Planejar",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="airplane.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: IS_ADMIN_APP ? "Inbox" : "Ajuda",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={IS_ADMIN_APP ? "tray.full.fill" : "message.fill"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: IS_ADMIN_APP ? "Conta" : "Conta",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={IS_ADMIN_APP ? "person.text.rectangle.fill" : "person.crop.circle.fill"} color={color} />,
        }}
      />
    </Tabs>
  );
}
