import { useMemo, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import {
  AGENCY_PHONE_DISPLAY,
  AGENCY_PHONE_TEL,
  buildWhatsAppHref,
  buildWhatsAppMessage,
} from "@/lib/contact";
import { useAuthCustom } from "@/hooks/use-auth-custom";

const guides = [
  {
    id: "baggage",
    badge: "Mia explica",
    title: "Bagagem sem medo",
    summary: "Entenda o que vai na bolsa, na bagagem de mao e na mala despachada antes de pagar.",
    answer: [
      "Bolsa pequena costuma ir embaixo do assento.",
      "Bagagem de mao vai no compartimento acima.",
      "Mala despachada vai para o porao do aviao e nem sempre esta incluida.",
      "Se a tarifa estiver leve demais para voce, fale com a equipe antes de fechar.",
    ],
  },
  {
    id: "connections",
    badge: "Mais calma",
    title: "Conexao menos cansativa",
    summary: "Nem sempre o mais barato e o melhor para quem quer cansar menos.",
    answer: [
      "Prefira menos conexoes quando a diferenca de preco for razoavel.",
      "Conexao muito curta pode causar pressa e inseguranca.",
      "Conexao muito longa tambem desgasta. O ideal e um meio-termo.",
      "No app, o planejador senior prioriza conforto antes do menor preco.",
    ],
  },
  {
    id: "documents",
    badge: "Antes da viagem",
    title: "Documentos em ordem",
    summary: "Revise com calma o nome, validade do passaporte e quem vai viajar.",
    answer: [
      "Confirme se o nome esta igual ao documento.",
      "Confira a validade do passaporte antes de emitir.",
      "Guarde so o necessario. Dados sensiveis nao devem ficar salvos depois da venda.",
      "Se tiver duvida, chame a equipe antes de pagar.",
    ],
  },
  {
    id: "nervous",
    badge: "Apoio humano",
    title: "Comprar com mais seguranca",
    summary: "Se voce estiver inseguro, o melhor caminho e desacelerar e pedir ajuda.",
    answer: [
      "Leia um passo por vez.",
      "Escolha primeiro a ida. Depois a volta.",
      "Nao confirme nada correndo so porque esta barato.",
      "Se precisar, fale com a equipe e termine com uma pessoa de verdade.",
    ],
  },
];

async function openExternalLink(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert("Nao foi possivel abrir", "Seu aparelho nao conseguiu abrir esse link agora.");
    return;
  }

  await Linking.openURL(url);
}

export default function MessagesScreen() {
  const { profile } = useAuthCustom();
  const [activeGuideId, setActiveGuideId] = useState(guides[0].id);

  const activeGuide = useMemo(
    () => guides.find((guide) => guide.id === activeGuideId) || guides[0],
    [activeGuideId],
  );

  const language = profile?.preferredLanguage || "pt";

  const handleOpenWhatsApp = async () => {
    const message = buildWhatsAppMessage({
      language,
      topic: "Ajuda pelo app senior",
      details: [
        "Quero ajuda humana para continuar minha viagem com calma.",
        profile?.preferredAirport ? `Aeroporto base: ${profile.preferredAirport}` : null,
      ],
    });

    await openExternalLink(buildWhatsAppHref(message));
  };

  const handleCall = async () => {
    await openExternalLink(`tel:${AGENCY_PHONE_TEL}`);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Ajuda com calma</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Use este espaco para tirar duvidas comuns, receber orientacao simples e chamar humano quando for preciso.
          </Text>
        </View>

        <View className="rounded-[26px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Falar com alguem agora</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Se voce ja sabe que quer ajuda humana, pode falar direto no WhatsApp ou ligar para a equipe.
          </Text>

          <View className="mt-4 gap-3">
            <TouchableOpacity
              className="rounded-[22px] bg-primary px-5 py-4"
              onPress={handleOpenWhatsApp}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-background">Abrir WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-[22px] border border-border bg-background px-5 py-4"
              onPress={handleCall}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-foreground">
                Ligar agora para {AGENCY_PHONE_DISPLAY}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-6 rounded-[26px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Perguntas rapidas da Mia</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Toque em um assunto e leia a explicacao com passos simples.
          </Text>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {guides.map((guide) => (
              <TouchableOpacity
                key={guide.id}
                className={`rounded-full px-4 py-3 ${guide.id === activeGuideId ? "bg-primary" : "border border-border bg-background"}`}
                onPress={() => setActiveGuideId(guide.id)}
                activeOpacity={0.85}
              >
                <Text className={`text-sm font-semibold ${guide.id === activeGuideId ? "text-background" : "text-foreground"}`}>
                  {guide.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mt-5 rounded-[24px] bg-background px-4 py-4">
            <View className="self-start rounded-full border border-border bg-surface px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">
                {activeGuide.badge}
              </Text>
            </View>
            <Text className="mt-4 text-xl font-bold text-foreground">{activeGuide.title}</Text>
            <Text className="mt-2 text-sm leading-6 text-muted">{activeGuide.summary}</Text>

            <View className="mt-4 gap-3">
              {activeGuide.answer.map((item) => (
                <View key={item} className="rounded-[20px] border border-border bg-surface px-4 py-4">
                  <Text className="text-sm leading-6 text-foreground">{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-6 rounded-[26px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Checklist antes de comprar</Text>
          <View className="mt-4 gap-3">
            {[
              "Confirme o nome como esta no documento.",
              "Veja se a bagagem dessa tarifa serve para voce.",
              "Prefira conexoes mais tranquilas se isso der mais seguranca.",
              "Se algo parecer confuso, fale com a equipe antes de pagar.",
            ].map((item) => (
              <View key={item} className="rounded-[20px] bg-background px-4 py-4">
                <Text className="text-sm leading-6 text-foreground">{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
