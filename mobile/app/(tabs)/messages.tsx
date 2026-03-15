import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';

const helpOptions = [
  {
    title: 'Falar com a Mia',
    description: 'Receba orientacao calma sobre bagagem, conexoes, horario e o que fazer depois.',
    badge: 'Assistente digital',
  },
  {
    title: 'Pedir ajuda humana',
    description: 'Se voce preferir, um atendente pode continuar com voce sem pressa.',
    badge: 'Atendimento humano',
  },
  {
    title: 'Escanear documento com o celular',
    description: 'O novo scanner vai ajudar a mandar documento para a reserva com menos erro.',
    badge: 'Scanner guiado',
  },
];

export default function MessagesScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Ajuda</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Este espaco vai reunir sua assistente digital, o contato humano e o envio de documentos.
          </Text>
        </View>

        <View className="gap-4">
          {helpOptions.map((option) => (
            <View key={option.title} className="rounded-[24px] border border-border bg-surface px-5 py-5">
              <View className="self-start rounded-full bg-background px-3 py-2">
                <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">
                  {option.badge}
                </Text>
              </View>
              <Text className="mt-4 text-xl font-bold text-foreground">{option.title}</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">{option.description}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          className="mt-6 rounded-[24px] border border-border bg-background px-5 py-4"
          activeOpacity={0.85}
        >
          <Text className="text-center text-base font-semibold text-foreground">
            Abrir suporte agora
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
