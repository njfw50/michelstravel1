import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { User, Mail, Phone, Lock, CheckCircle2 } from "lucide-react-native";

import { ScreenContainer } from "@/components/screen-container";
import { apiClient } from "@/lib/api-client";
import { FlightOffer } from "@/types/flights";
import { useAuthCustom } from "@/hooks/use-auth-custom";

export default function CheckoutScreen() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { user } = useAuthCustom();
  const [offer, setOffer] = useState<FlightOffer | null>(null);
  const [isLoadingHeader, setIsLoadingHeader] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states simplified for Senior
  const [givenName, setGivenName] = useState(user?.firstName || "");
  const [familyName, setFamilyName] = useState(user?.lastName || "");
  const [bornOn, setBornOn] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function loadFlight() {
      if (!flightId) return;
      try {
        const data = await apiClient.getFlightOffer(flightId);
        setOffer(data);
      } catch (err: any) {
        Alert.alert("Erro", "Voo não encontrado ou expirou.");
        router.push("/search");
      } finally {
        setIsLoadingHeader(false);
      }
    }
    loadFlight();
  }, [flightId]);

  const handleBooking = async () => {
    if (!givenName || !familyName || !email || !phone) {
      Alert.alert("Campos Falta", "Por favor, preencha nome, email e telefone.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        flightOfferId: flightId,
        contactEmail: email,
        contactPhone: phone,
        passengers: [
          {
            type: "adult",
            givenName,
            familyName,
            bornOn: bornOn || "1950-01-01",
            gender: "m", // Simplified default 
            email,
            phoneNumber: phone,
            documentType: "passport",
            documentNumber: documentNumber || "12345678",
            documentExpiryDate: "2030-01-01",
            documentIssuingCountry: "BR",
            nationality: "BR",
            title: "mr",
          }
        ]
      };

      await apiClient.createBooking(payload);
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert("Erro na Emissão", err.message || "Não foi possível concluir a emissão.");
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isSuccess) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6 pb-20">
          <CheckCircle2 color="#10b981" size={100} />
          <Text className="text-4xl font-bold text-slate-900 mt-6 text-center">
            Viagem Comprada!
          </Text>
          <Text className="text-xl text-slate-600 mt-4 text-center">
            Sua passagem foi emitida com sucesso. Enviamos os detalhes para {email}.
          </Text>
          <TouchableOpacity
            className="mt-12 bg-emerald-500 rounded-full py-5 px-10 items-center justify-center shadow-sm"
            onPress={() => router.push("/")}
          >
            <Text className="text-2xl font-bold text-white">Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        
        <View className="mb-6 mt-2">
          <Text className="text-3xl font-bold text-slate-900">Finalizar Viagem</Text>
          <Text className="text-lg text-slate-600 mt-2">Só precisamos confirmar quem viaja.</Text>
        </View>

        {/* FLIGHT SUMMARY */}
        {isLoadingHeader ? (
          <ActivityIndicator size="large" color="#0ea5e9" className="my-10" />
        ) : offer ? (
          <View className="bg-blue-50 border-2 border-blue-200 rounded-[32px] p-6 mb-8 shadow-sm">
            <Text className="text-lg font-bold text-blue-800 uppercase tracking-widest">
              Resumo do Voo
            </Text>
            <Text className="text-2xl font-extrabold text-blue-900 mt-2">
              {offer.airline} {offer.flightNumber}
            </Text>
            <Text className="text-base text-blue-700 mt-1">
              De: {offer.slices?.[0]?.originCity || offer.slices?.[0]?.originCode}
            </Text>
            <Text className="text-base text-blue-700">
              Para: {offer.slices?.[0]?.destinationCity || offer.slices?.[0]?.destinationCode}
            </Text>
            <Text className="text-4xl font-black text-blue-900 mt-4">
              {formatPrice(offer.price, offer.currency)}
            </Text>
          </View>
        ) : null}

        {/* PASSENGER FORM */}
        <View className="gap-5 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <View>
            <Text className="text-lg font-semibold text-slate-700 mb-2">Primeiro Nome</Text>
            <View className="flex-row items-center border-2 border-slate-300 rounded-[24px] px-4 py-3 bg-slate-50">
              <User size={24} color="#64748b" />
              <TextInput
                value={givenName}
                onChangeText={setGivenName}
                placeholder="Ex: João"
                className="flex-1 text-2xl font-bold text-slate-900 ml-3"
              />
            </View>
          </View>

          <View>
            <Text className="text-lg font-semibold text-slate-700 mb-2">Sobrenome</Text>
            <View className="flex-row items-center border-2 border-slate-300 rounded-[24px] px-4 py-3 bg-slate-50">
              <User size={24} color="#64748b" />
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Ex: Silva"
                className="flex-1 text-2xl font-bold text-slate-900 ml-3"
              />
            </View>
          </View>

          <View>
            <Text className="text-lg font-semibold text-slate-700 mb-2">E-mail para envio da passagem</Text>
            <View className="flex-row items-center border-2 border-slate-300 rounded-[24px] px-4 py-3 bg-slate-50">
              <Mail size={24} color="#64748b" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Ex: joao@gmail.com"
                className="flex-1 text-2xl font-bold text-slate-900 ml-3"
              />
            </View>
          </View>

          <View>
            <Text className="text-lg font-semibold text-slate-700 mb-2">Telefone com DDD</Text>
            <View className="flex-row items-center border-2 border-slate-300 rounded-[24px] px-4 py-3 bg-slate-50">
              <Phone size={24} color="#64748b" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Ex: 11999999999"
                className="flex-1 text-2xl font-bold text-slate-900 ml-3"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleBooking}
          disabled={isSubmitting || isLoadingHeader}
          activeOpacity={0.8}
          className={`mt-10 flex-row items-center justify-center p-6 rounded-[32px] shadow-sm ${
            isSubmitting || isLoadingHeader ? "bg-slate-400" : "bg-emerald-500"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Lock size={28} color="#fff" />
              <Text className="text-2xl font-bold text-white ml-3">
                Comprar e Fechar Voo
              </Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </ScreenContainer>
  );
}
