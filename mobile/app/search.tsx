import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Plane, Calendar, Search, ArrowRight } from "lucide-react-native";

import { ScreenContainer } from "@/components/screen-container";
import { apiClient } from "@/lib/api-client";
import { FlightOffer } from "@/types/flights";
import { IS_ADMIN_APP } from "@/lib/app-variant";

export default function SearchScreen() {
  const [origin, setOrigin] = useState("EWR");
  const [destination, setDestination] = useState("VCP");
  const [date, setDate] = useState("2026-06-15");
  const [isLoading, setIsLoading] = useState(false);
  const [flights, setFlights] = useState<FlightOffer[]>([]);

  const handleSearch = async () => {
    if (!origin || !destination || !date) {
      Alert.alert("Campos Obriatórios", "Por favor preencha Origem, Destino e Data.");
      return;
    }

    setIsLoading(true);
    setFlights([]);
    try {
      const results = await apiClient.searchFlights({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        date,
        adults: 1,
        children: 0,
        infants: 0,
        cabinClass: "economy",
      });
      setFlights(results);
    } catch (error: any) {
      Alert.alert("Erro na Busca", error.message || "Não foi possível buscar os voos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFlight = (flight: FlightOffer) => {
    Alert.alert(
      "Confirmar Voo",
      `Você selecionou o voo ${flight.airline} ${flight.flightNumber}. Faremos o checkout agora.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Continuar", 
          onPress: () => router.push(`/checkout?flightId=${flight.id}`) 
        }
      ]
    );
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const headerTitle = IS_ADMIN_APP ? "Emissão de Voos" : "Nova Viagem";
  const headerSubtitle = IS_ADMIN_APP 
    ? "Busque passagens para os clientes" 
    : "Para onde você quer ir agora?";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        
        {/* HEADING */}
        <View className="mb-8 mt-4">
          <Text className="text-3xl font-bold text-slate-900">{headerTitle}</Text>
          <Text className="text-xl text-slate-600 mt-2">{headerSubtitle}</Text>
        </View>

        {/* SEARCH FORM (Huge Touch Targets) */}
        <View className="gap-5 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          
          <View>
            <Text className="text-lg font-semibold text-slate-700 mb-2">Saindo de (Origem)</Text>
            <View className="flex-row items-center border-2 border-slate-300 rounded-[24px] px-4 py-3 bg-slate-50">
              <Plane size={24} color="#64748b" />
              <TextInput
                value={origin}
                onChangeText={setOrigin}
                placeholder="Ex: EWR (Newark)"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                className="flex-1 text-2xl font-bold text-slate-900 ml-3"
              />
            </View>
          </View>

          <View>
            <Text className="text-lg font-semibold text-slate-700 mb-2">Indo para (Destino)</Text>
            <View className="flex-row items-center border-2 border-slate-300 rounded-[24px] px-4 py-3 bg-slate-50">
              <Plane size={24} color="#64748b" className="rotate-90" />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Ex: VCP (Campinas)"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                className="flex-1 text-2xl font-bold text-slate-900 ml-3"
              />
            </View>
          </View>

          <View>
            <Text className="text-lg font-semibold text-slate-700 mb-2">Data da Viagem</Text>
            <View className="flex-row items-center border-2 border-slate-300 rounded-[24px] px-4 py-3 bg-slate-50">
              <Calendar size={24} color="#64748b" />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="flex-1 text-2xl font-bold text-slate-900 ml-3"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSearch}
            disabled={isLoading}
            activeOpacity={0.8}
            className={`mt-4 flex-row items-center justify-center p-5 rounded-[24px] shadow-sm ${
              isLoading ? "bg-slate-400" : "bg-primary"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Search size={28} color="#fff" />
                <Text className="text-2xl font-bold text-white ml-3">
                  Buscar Voos
                </Text>
              </>
            )}
          </TouchableOpacity>

        </View>

        {/* RESULTS */}
        {flights.length > 0 && (
          <View className="mt-8 gap-5">
            <Text className="text-2xl font-bold text-slate-900 mb-2">
              Opções Encontradas
            </Text>

            {flights.map((flight) => (
              <View 
                key={flight.id} 
                className="bg-white rounded-[32px] border-2 border-slate-200 p-5 shadow-sm overflow-hidden"
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="text-xl font-bold text-slate-900">{flight.airline}</Text>
                    <Text className="text-base text-slate-500 mt-1">Voo {flight.flightNumber}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-3xl font-extrabold text-blue-600">
                      {formatPrice(flight.price, flight.currency)}
                    </Text>
                    <Text className="text-base font-semibold text-slate-500 mt-1">
                      {flight.duration.replace("PT", "").toLowerCase()}
                    </Text>
                  </View>
                </View>

                {/* Slices Info Simplified */}
                {flight.slices && flight.slices[0] && (
                  <View className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100 flex-row items-center justify-between">
                    <View>
                      <Text className="text-2xl font-bold text-slate-900">
                        {flight.slices[0].segments[0].departureTime.substring(11, 16)}
                      </Text>
                      <Text className="text-base text-slate-500">{flight.slices[0].originCode}</Text>
                    </View>
                    <ArrowRight size={24} color="#94a3b8" />
                    <View className="items-end">
                      <Text className="text-2xl font-bold text-slate-900">
                        {flight.slices[0].segments[flight.slices[0].segments.length - 1].arrivalTime.substring(11, 16)}
                      </Text>
                      <Text className="text-base text-slate-500">{flight.slices[0].destinationCode}</Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSelectFlight(flight)}
                  className="bg-emerald-500 p-4 rounded-full flex-row items-center justify-center shadow-sm"
                >
                  <Text className="text-xl font-bold text-white">Escolher este Voo</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
}
