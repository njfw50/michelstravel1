import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useAuthCustom } from '@/hooks/use-auth-custom';

const brandLogo = require('../../assets/images/site-logo.png');

const cards = [
  {
    title: 'Buscar voo agora',
    description: 'Abre o fluxo real do site dentro do app para pesquisar, comparar e comprar.',
    emoji: '✈️',
    route: '/bookings',
  },
  {
    title: 'Pedir ajuda',
    description: 'Mantenha a Mia e os canais de ajuda por perto sem sair do app.',
    emoji: '💬',
    route: '/messages',
  },
  {
    title: 'Minha conta',
    description: 'Veja seu cadastro, idioma e preferencia de atendimento senior.',
    emoji: '👤',
    route: '/analytics',
  },
];

export default function HomeScreen() {
  const { user, profile } = useAuthCustom();
  const firstName = user?.firstName?.trim() || 'Cliente';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="rounded-[28px] border border-border bg-surface px-5 py-5">
          <View className="flex-row items-center gap-4">
            <Image
              source={brandLogo}
              resizeMode="contain"
              style={{ width: 72, height: 72 }}
            />
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-[1px] text-primary">
                Michels Travel Senior
              </Text>
              <Text className="mt-2 text-2xl font-bold text-foreground">Ola, {firstName}</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">
                Agora o app fica claro e usa a base real do site para busca e compra.
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row flex-wrap gap-2">
            <View className="rounded-full border border-border bg-background px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">Base branca</Text>
            </View>
            <View className="rounded-full border border-border bg-background px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">Fluxo do site</Text>
            </View>
            <View className="rounded-full border border-border bg-background px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">
                {profile?.experienceMode === 'senior' ? 'Modo senior' : 'Conta ativa'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="mt-5 rounded-[22px] bg-primary px-5 py-4"
            onPress={() => router.push('/bookings')}
            activeOpacity={0.85}
          >
            <Text className="text-center text-base font-semibold text-background">
              Abrir busca e compra
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 gap-4">
          {cards.map((card) => (
            <TouchableOpacity
              key={card.title}
              className="rounded-[24px] border border-border bg-surface px-5 py-5"
              onPress={() => router.push(card.route as never)}
              activeOpacity={0.85}
            >
              <Text className="text-3xl">{card.emoji}</Text>
              <Text className="mt-3 text-xl font-bold text-foreground">{card.title}</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6 rounded-[24px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Como o app funciona agora</Text>
          <Text className="mt-3 text-sm leading-6 text-muted">
            O cadastro e a conta sao nativos. A busca, os resultados e a compra usam o fluxo real do site dentro do app, para voce nao perder o que ja existe e nem ficar em telas vazias.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
