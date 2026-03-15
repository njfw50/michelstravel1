import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useAuthCustom } from '@/hooks/use-auth-custom';

const brandLogo = require('../../assets/images/site-logo.png');

const quickActions = [
  {
    title: 'Continuar minha viagem',
    description: 'Retome sua reserva com as mesmas preferencias do atendimento senior.',
    emoji: '🧳',
    route: '/bookings',
  },
  {
    title: 'Falar com a Mia',
    description: 'Tire duvidas com calma sobre datas, bagagem e conexoes.',
    emoji: '💬',
    route: '/messages',
  },
  {
    title: 'Escanear documento',
    description: 'Em breve voce vai enviar o documento pelo celular para preencher sua reserva.',
    emoji: '📄',
    route: '/messages',
  },
];

export default function HomeScreen() {
  const { user, profile } = useAuthCustom();
  const firstName = user?.firstName?.trim() || 'Cliente';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View
          className="rounded-[28px] px-5 py-6"
          style={{ backgroundColor: '#273B97' }}
        >
          <Image
            source={brandLogo}
            resizeMode="contain"
            style={{ width: 92, height: 92, marginBottom: 14 }}
          />
          <Text className="text-3xl font-bold text-white">Ola, {firstName}</Text>
          <Text className="mt-3 text-base leading-6 text-white/85">
            Este app foi preparado para voce entrar rapido, continuar sua viagem com calma e pedir ajuda sem medo.
          </Text>

          <View className="mt-5 flex-row flex-wrap gap-2">
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-white">Atendimento senior</Text>
            </View>
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-white">
                {profile?.bagsPreference === 'checked' ? 'Mala despachada' : 'Bagagem clara'}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-6 gap-4">
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.title}
              className="rounded-[24px] border border-border bg-surface px-5 py-5"
              onPress={() => router.push(action.route as never)}
              activeOpacity={0.85}
            >
              <Text className="text-3xl">{action.emoji}</Text>
              <Text className="mt-3 text-xl font-bold text-foreground">{action.title}</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6 rounded-[24px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Seu jeito de viajar</Text>
          <View className="mt-4 gap-3">
            <View className="rounded-2xl bg-background px-4 py-4">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted">Idioma</Text>
              <Text className="mt-1 text-base font-semibold text-foreground">
                {profile?.preferredLanguage === 'en' ? 'English' : profile?.preferredLanguage === 'es' ? 'Espanol' : 'Portugues'}
              </Text>
            </View>
            <View className="rounded-2xl bg-background px-4 py-4">
              <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted">Conexoes</Text>
              <Text className="mt-1 text-base font-semibold text-foreground">
                {profile?.connectionTolerance === 'avoid'
                  ? 'Evitar conexoes longas'
                  : profile?.connectionTolerance === 'one_stop'
                    ? 'No maximo uma conexao'
                    : profile?.connectionTolerance === 'price_first'
                      ? 'Pode economizar se fizer sentido'
                      : 'Equilibrio entre conforto e preco'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
