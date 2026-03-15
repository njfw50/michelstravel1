import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useAuthCustom } from '@/hooks/use-auth-custom';
import { AuthMethod } from '@/types';
import { cn } from '@/lib/utils';

type FormMode = 'login' | 'register';

const brandLogo = require('../../assets/images/site-logo.png');

export default function LoginScreen() {
  const [mode, setMode] = useState<FormMode>('login');
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isLoading, error, clearError } = useAuthCustom();

  useEffect(() => {
    clearError();
  }, [mode, method, clearError]);

  const handleSubmit = async () => {
    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      Alert.alert('Dados incompletos', 'Preencha seu telefone ou email e a senha.');
      return;
    }

    if (method === 'phone' && trimmedIdentifier.replace(/\D/g, '').length < 10) {
      Alert.alert('Telefone incompleto', 'Digite um telefone com DDD e numero.');
      return;
    }

    if (mode === 'register' && firstName.trim().length < 2) {
      Alert.alert('Nome incompleto', 'Digite pelo menos seu primeiro nome.');
      return;
    }

    if (mode === 'register' && trimmedPassword.length < 6) {
      Alert.alert('Senha curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    try {
      clearError();

      if (mode === 'login') {
        await login({
          method,
          identifier: trimmedIdentifier,
          password: trimmedPassword,
        });
      } else {
        await register({
          method,
          identifier: trimmedIdentifier,
          password: trimmedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
        });
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(
        mode === 'login' ? 'Nao foi possivel entrar' : 'Nao foi possivel criar sua conta',
        err?.response?.data?.error || err?.message || 'Tente novamente em instantes.',
      );
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 }}
        >
          <View className="flex-1 justify-center">
            <View className="rounded-[32px] border border-border bg-surface px-5 py-5 shadow-sm">
              <View className="rounded-[28px] border border-border bg-background px-5 py-6">
                <View className="self-center rounded-full border border-border bg-surface px-3 py-2">
                  <Text className="text-xs font-semibold uppercase tracking-[1px] text-primary">
                    Michels Travel Senior
                  </Text>
                </View>
                <Image
                  source={brandLogo}
                  resizeMode="contain"
                  style={{ width: 100, height: 100, alignSelf: 'center', marginBottom: 16 }}
                />
                <Text className="text-center text-3xl font-bold text-foreground">
                  Michels Travel Senior
                </Text>
                <Text className="mt-3 text-center text-base leading-6 text-muted">
                  Base clara, visual do site e entrada simples para voce pesquisar ou continuar sua viagem.
                </Text>

                <View className="mt-5 flex-row flex-wrap justify-center gap-2">
                  {['Mais calma', 'Ajuda humana', 'Viagem organizada'].map((label) => (
                    <View key={label} className="rounded-full border border-border bg-surface px-3 py-2">
                      <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="mt-6 flex-row rounded-2xl bg-background p-1">
                {[
                  { key: 'login', label: 'Entrar' },
                  { key: 'register', label: 'Criar conta' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    className={cn(
                      'flex-1 rounded-2xl px-4 py-3',
                      mode === item.key ? 'bg-primary' : 'bg-transparent',
                    )}
                    onPress={() => setMode(item.key as FormMode)}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <Text
                      className={cn(
                        'text-center text-sm font-semibold',
                        mode === item.key ? 'text-background' : 'text-foreground',
                      )}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-4 flex-row rounded-2xl bg-background p-1">
                {[
                  { key: 'phone', label: 'Telefone' },
                  { key: 'email', label: 'Email' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    className={cn(
                      'flex-1 rounded-2xl px-4 py-3',
                      method === item.key ? 'bg-surface border border-border' : 'bg-transparent',
                    )}
                    onPress={() => setMethod(item.key as AuthMethod)}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <Text className="text-center text-sm font-semibold text-foreground">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-6 gap-4">
                {mode === 'register' && (
                  <>
                    <View>
                      <Text className="mb-2 text-sm font-medium text-foreground">Primeiro nome</Text>
                      <TextInput
                        className="rounded-2xl border border-border bg-background px-4 py-4 text-base text-foreground"
                        placeholder="Como voce gostaria de ser chamado"
                        placeholderTextColor="#8C98AE"
                        value={firstName}
                        onChangeText={setFirstName}
                        editable={!isLoading}
                      />
                    </View>

                    <View>
                      <Text className="mb-2 text-sm font-medium text-foreground">Sobrenome</Text>
                      <TextInput
                        className="rounded-2xl border border-border bg-background px-4 py-4 text-base text-foreground"
                        placeholder="Opcional"
                        placeholderTextColor="#8C98AE"
                        value={lastName}
                        onChangeText={setLastName}
                        editable={!isLoading}
                      />
                    </View>
                  </>
                )}

                <View>
                  <Text className="mb-2 text-sm font-medium text-foreground">
                    {method === 'phone' ? 'Telefone' : 'Email'}
                  </Text>
                  <TextInput
                    className="rounded-2xl border border-border bg-background px-4 py-4 text-base text-foreground"
                    placeholder={method === 'phone' ? '+1 (862) 350-1161' : 'voce@email.com'}
                    placeholderTextColor="#8C98AE"
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-foreground">Senha</Text>
                  <TextInput
                    className="rounded-2xl border border-border bg-background px-4 py-4 text-base text-foreground"
                    placeholder="Digite sua senha"
                    placeholderTextColor="#8C98AE"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>

                {error && (
                  <View className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3">
                    <Text className="text-sm text-error">{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  className={cn(
                    'mt-2 rounded-2xl bg-primary px-4 py-4',
                    isLoading && 'opacity-70',
                  )}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-center text-base font-semibold text-background">
                      {mode === 'login' ? 'Entrar agora' : 'Criar minha conta'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="mt-6 rounded-2xl border border-border bg-background px-4 py-4">
                <Text className="text-sm font-semibold text-foreground">
                  {mode === 'login'
                    ? 'Entre e continue sua viagem exatamente de onde parou.'
                    : 'Crie sua conta para salvar passageiros, documentos e preferencias do atendimento senior.'}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-muted">
                  Voce pode usar {method === 'phone' ? 'telefone e senha' : 'email e senha'} sem precisar reaprender o sistema a cada acesso.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
