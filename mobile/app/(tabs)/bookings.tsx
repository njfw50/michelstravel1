import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";

export default function BookingsScreen() {
  const [loading, setLoading] = useState(false);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Reservas</Text>
          <Text className="text-sm text-muted mt-1">Gerencie todas as reservas de voos</Text>
        </View>

        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-6xl mb-4">✈️</Text>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Nenhuma reserva encontrada
          </Text>
          <Text className="text-sm text-muted text-center px-8">
            As reservas aparecerão aqui quando você criar novas reservas
          </Text>
        </View>

        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-2"
          activeOpacity={0.8}
        >
          <Text className="text-xl">➕</Text>
          <Text className="text-background font-semibold text-base">
            Nova Reserva
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
