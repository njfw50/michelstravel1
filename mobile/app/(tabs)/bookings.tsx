import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';

const travelCards = [
  {
    title: 'Procurar uma nova viagem',
    description: 'Voos para o Brasil, Estados Unidos e conexoes com explicacao clara.',
    status: 'Em breve com busca completa',
  },
  {
    title: 'Continuar uma reserva parada',
    description: 'Quando voce iniciar uma compra no site ou no app, ela vai aparecer aqui para continuar.',
    status: 'Pronto para sincronizar',
  },
  {
    title: 'Minhas viagens confirmadas',
    description: 'Passagens emitidas, documentos enviados e proximos passos do embarque.',
    status: 'Em breve no app',
  },
];

export default function BookingsScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Minhas viagens</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Aqui voce vai acompanhar reservas, documentos e tudo o que precisa para viajar sem confusao.
          </Text>
        </View>

        <View className="gap-4">
          {travelCards.map((card) => (
            <View key={card.title} className="rounded-[24px] border border-border bg-surface px-5 py-5">
              <Text className="text-xl font-bold text-foreground">{card.title}</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">{card.description}</Text>
              <View className="mt-4 self-start rounded-full bg-background px-3 py-2">
                <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-primary">
                  {card.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          className="mt-6 rounded-[24px] bg-primary px-5 py-4"
          activeOpacity={0.85}
        >
          <Text className="text-center text-base font-semibold text-background">
            Buscar viagem com ajuda
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
