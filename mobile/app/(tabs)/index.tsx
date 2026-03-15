import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useAuthCustom } from "@/hooks/use-auth-custom";

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

export default function HomeScreen() {
  const { user, profile } = useAuthCustom();
  const firstName = user?.firstName?.trim() || "Cliente";
  const preferredAirport = profile?.preferredAirport || "EWR";
  const passengerCount = profile?.savedPassengers?.length || 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="rounded-[30px] border border-border bg-surface px-5 py-5">
          <View className="flex-row items-center gap-4">
            <Image source={brandLogo} resizeMode="contain" style={{ width: 76, height: 76 }} />
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-[1px] text-primary">
                Michels Travel Senior
              </Text>
              <Text className="mt-2 text-2xl font-bold text-foreground">Ola, {firstName}</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">
                Este app agora e o seu espaco proprio para planejar a viagem com mais calma, menos medo e ajuda humana por perto.
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row flex-wrap gap-2">
            <View className="rounded-full border border-border bg-background px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">
                Aeroporto base {preferredAirport}
              </Text>
            </View>
            <View className="rounded-full border border-border bg-background px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">
                {passengerCount} passageiro{passengerCount === 1 ? "" : "s"} salvo{passengerCount === 1 ? "" : "s"}
              </Text>
            </View>
            <View className="rounded-full border border-border bg-background px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">
                {profile?.needsHumanHelp ? "Humano em prioridade" : "Ajuda quando pedir"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="mt-5 rounded-[22px] bg-primary px-5 py-4"
            onPress={() => router.push("/bookings")}
            activeOpacity={0.85}
          >
            <Text className="text-center text-base font-semibold text-background">
              Comecar a planejar minha viagem
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 gap-4">
          {quickTools.map((tool) => (
            <TouchableOpacity
              key={tool.title}
              className="rounded-[26px] border border-border bg-surface px-5 py-5"
              onPress={() => router.push(tool.route as never)}
              activeOpacity={0.85}
            >
              <Text className="text-3xl">{tool.emoji}</Text>
              <Text className="mt-3 text-xl font-bold text-foreground">{tool.title}</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">{tool.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6 rounded-[26px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Ferramentas feitas para idosos</Text>
          <Text className="mt-3 text-sm leading-6 text-muted">
            Aqui o app trabalha em etapas simples. Primeiro voce escolhe o que importa, depois vê opcoes explicadas em linguagem clara, e por ultimo guarda sua escolha ou chama ajuda humana.
          </Text>

          <View className="mt-4 gap-3">
            {[
              "Busca guiada por conforto, horario e conexao.",
              "Escolha da ida e da volta separadas, sem misturar opcoes.",
              "Passageiros salvos sem guardar cartao nem documento depois da venda.",
            ].map((item) => (
              <View key={item} className="rounded-[22px] bg-background px-4 py-4">
                <Text className="text-sm leading-6 text-foreground">{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
