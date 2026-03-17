import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { AdminHomeScreen } from "@/components/admin-home-screen";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthCustom } from "@/hooks/use-auth-custom";
import { IS_ADMIN_APP } from "@/lib/app-variant";

const brandLogo = require("../../assets/images/site-logo.png");

const quickTools = [
  {
    title: "Planejador senior",
    description: "Escolha a ida e a volta em duas etapas, com foco em menos cansaco e mais clareza.",
    emoji: "✈️",
    route: "/bookings",
  },
  {
    title: "Ajuda com calma",
    description: "Abra respostas simples sobre bagagem, conexao, documentos e chame humano quando quiser.",
    emoji: "💬",
    route: "/messages",
  },
  {
    title: "Passageiros e preferencias",
    description: "Guarde quem viaja com voce e como prefere ser atendido.",
    emoji: "👤",
    route: "/analytics",
  },
];

function SeniorHomeScreen() {
  const { user } = useAuthCustom();
  const firstName = user?.firstName?.trim() || "Cliente";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>
        
        {/* Header Ultra Simplificado com Foto */}
        <View className="mb-8 items-center mt-4">
          <Image source={brandLogo} resizeMode="contain" style={{ width: 100, height: 100 }} />
          <Text className="mt-4 text-3xl font-bold text-slate-900 text-center">
            Olá, {firstName}!
          </Text>
          <Text className="mt-2 text-xl text-slate-600 text-center">
            Como podemos ajudar você hoje?
          </Text>
        </View>

        {/* Botões Principais - Huge Touch Targets */}
        <View className="gap-6">
          
          {/* Botão de Viagem Atual (Meu Voo) */}
          <TouchableOpacity
            className="rounded-[32px] border-2 border-emerald-500 bg-emerald-50 p-6 flex-row items-center justify-between shadow-sm"
            onPress={() => router.push("/bookings")}
            activeOpacity={0.8}
          >
            <View className="flex-1 mr-4">
              <Text className="text-4xl mb-2">✈️</Text>
              <Text className="text-2xl font-bold text-slate-900">Meu Voo Atual</Text>
              <Text className="text-lg text-slate-600 mt-1">Ver portões, horários ou passagens de hoje</Text>
            </View>
          </TouchableOpacity>

          {/* Botão Central de Pânico / Ligar Humano */}
          <TouchableOpacity
            className="rounded-[32px] border-2 border-red-500 bg-red-500 p-6 flex-row items-center justify-between shadow-md"
            onPress={() => router.push("/messages")}
            activeOpacity={0.8}
          >
            <View className="flex-1 mr-4">
              <Text className="text-4xl mb-2">📞</Text>
              <Text className="text-2xl font-bold text-white">Ligar para um Atendente</Text>
              <Text className="text-lg text-red-100 mt-1">Falar com uma pessoa de verdade agora mesmo</Text>
            </View>
          </TouchableOpacity>

          {/* Botão Comprar / Planejar com Voz */}
          <TouchableOpacity
            className="rounded-[32px] border-2 border-primary bg-surface p-6 flex-row items-center justify-between shadow-sm"
            onPress={() => router.push("/search")}
            activeOpacity={0.8}
          >
            <View className="flex-1 mr-4">
              <Text className="text-4xl mb-2">✈️</Text>
              <Text className="text-2xl font-bold text-slate-900">Nova Viagem</Text>
              <Text className="text-lg text-slate-600 mt-1">Pesquise origens, destinos e compre agora</Text>
            </View>
          </TouchableOpacity>

        </View>

        <View className="mt-8 rounded-[24px] bg-slate-100 p-6">
          <Text className="text-xl font-bold text-slate-800 text-center">
            "Não se preocupe em apertar botão errado. A qualquer momento ligamos para você se precisar."
          </Text>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

export default function HomeScreen() {
  if (IS_ADMIN_APP) {
    return <AdminHomeScreen />;
  }

  return <SeniorHomeScreen />;
}
