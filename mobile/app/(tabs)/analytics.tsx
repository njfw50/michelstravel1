import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function AnalyticsScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Analytics</Text>
          <Text className="text-sm text-muted mt-1">Métricas e relatórios</Text>
        </View>

        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-6xl mb-4">📊</Text>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Analytics em desenvolvimento
          </Text>
          <Text className="text-sm text-muted text-center px-8">
            Gráficos e relatórios detalhados estarão disponíveis em breve
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
