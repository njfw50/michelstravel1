import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useAdminAuth } from "@/hooks/use-admin-auth";

function formatExpiry(expiresAt: number | null) {
  if (!expiresAt) return "Sessao ativa";
  try {
    return new Date(expiresAt).toLocaleString("pt-BR");
  } catch {
    return "Sessao ativa";
  }
}

export function AdminAccountScreen() {
  const { expiresAt, isLoading, logout } = useAdminAuth();

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-4 pb-8">
        <View className="rounded-[28px] border border-border bg-surface px-5 py-5">
          <Text className="text-xs font-semibold uppercase tracking-[1px] text-primary">Michels Travel Admin</Text>
          <Text className="mt-3 text-3xl font-bold text-foreground">Conta do operador</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Este app e separado do Senior e separado do app do cliente comprador.
          </Text>
        </View>

        <View className="mt-4 rounded-[28px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Sessao atual</Text>
          <View className="mt-4 gap-3">
            <View className="rounded-[22px] bg-background px-4 py-4">
              <Text className="text-sm font-semibold text-foreground">Status</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">Autenticado no app admin</Text>
            </View>
            <View className="rounded-[22px] bg-background px-4 py-4">
              <Text className="text-sm font-semibold text-foreground">Validade</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">{formatExpiry(expiresAt)}</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-[28px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Acesso rapido</Text>
          <View className="mt-4 gap-3">
            <TouchableOpacity
              className="rounded-[22px] bg-primary px-5 py-4"
              onPress={() => router.push("/" as never)}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-background">Voltar para o radar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-[22px] border border-border bg-background px-5 py-4"
              onPress={() => router.push("/bookings" as never)}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-foreground">Abrir vendas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-[22px] border border-border bg-background px-5 py-4"
              onPress={() => router.push("/messages" as never)}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-foreground">Abrir inbox</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className={`mt-6 rounded-[22px] border border-border bg-background px-5 py-4 ${isLoading ? "opacity-70" : ""}`}
          onPress={() => void logout()}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          <Text className="text-center text-base font-semibold text-foreground">Sair do Michels Travel Admin</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
