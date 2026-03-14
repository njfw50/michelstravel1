import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthCustom } from '@/hooks/use-auth-custom';
import { cn } from '@/lib/utils';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthCustom();

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      clearError();
      await login(trimmedEmail, trimmedPassword);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Erro ao fazer login', err.message || 'Verifique suas credenciais');
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo e Título */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-4">
              <Text className="text-4xl text-background">✈️</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground mb-2">
              Michels Travel Senior
            </Text>
            <Text className="text-base text-muted">
              Atendimento com mais calma e clareza
            </Text>
          </View>

          {/* Formulário */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
              <TextInput
                className={cn(
                  'bg-surface border border-border rounded-xl px-4 py-3',
                  'text-foreground text-base'
                )}
                placeholder="admin@example.com"
                placeholderTextColor="#9BA1A6"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Senha</Text>
              <TextInput
                className={cn(
                  'bg-surface border border-border rounded-xl px-4 py-3',
                  'text-foreground text-base'
                )}
                placeholder="••••••••"
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {error && (
              <View className="bg-error/10 border border-error rounded-xl px-4 py-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            )}

            <TouchableOpacity
              className={cn(
                'bg-primary rounded-xl py-4 items-center mt-2',
                isLoading && 'opacity-70'
              )}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background font-semibold text-base">
                  Entrar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Informações adicionais */}
          <View className="mt-8">
            <Text className="text-center text-muted text-sm">
              Entre para continuar seu atendimento senior com seguranca
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
