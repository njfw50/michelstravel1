import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { useAuthCustom } from '@/hooks/use-auth-custom';

export default function AccountScreen() {
  const { user, profile, logout, isLoading } = useAuthCustom();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Minha conta</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Seus dados de acesso, idioma e preferencias do atendimento senior ficam organizados aqui.
          </Text>
        </View>

        <View className="rounded-[24px] border border-border bg-surface px-5 py-5">
          <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted">Cadastro</Text>
          <Text className="mt-3 text-xl font-bold text-foreground">
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Cliente Michels Travel'}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            {user?.phone || user?.email || 'Seu telefone ou email aparecera aqui'}
          </Text>
        </View>

        <View className="mt-4 gap-4">
          <View className="rounded-[24px] border border-border bg-surface px-5 py-5">
            <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted">Modo de atendimento</Text>
            <Text className="mt-2 text-base font-semibold text-foreground">
              {profile?.experienceMode === 'senior' ? 'Senior com mais calma' : 'Padrao'}
            </Text>
          </View>
          <View className="rounded-[24px] border border-border bg-surface px-5 py-5">
            <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted">Idioma preferido</Text>
            <Text className="mt-2 text-base font-semibold text-foreground">
              {profile?.preferredLanguage === 'en' ? 'English' : profile?.preferredLanguage === 'es' ? 'Espanol' : 'Portugues'}
            </Text>
          </View>
          <View className="rounded-[24px] border border-border bg-surface px-5 py-5">
            <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted">Ajuda humana</Text>
            <Text className="mt-2 text-base font-semibold text-foreground">
              {profile?.needsHumanHelp ? 'Ativada como prioridade' : 'Quando voce pedir'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="mt-6 rounded-[24px] bg-primary px-5 py-4"
          activeOpacity={0.85}
          onPress={logout}
          disabled={isLoading}
        >
          <Text className="text-center text-base font-semibold text-background">
            Sair desta conta
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
