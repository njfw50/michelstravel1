import { ScrollView, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { apiClient } from "@/lib/api-client";
import { DashboardStats, RecentActivity } from "@/types";
import { useAuthCustom } from "@/hooks/use-auth-custom";

export default function HomeScreen() {
  const { user, logout } = useAuthCustom();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      // Mock data - será substituído pelas APIs reais
      const mockStats: DashboardStats = {
        todayRevenue: 15750.00,
        activeBookings: 23,
        pendingCommissions: 1890.50,
        newClients: 8,
        revenueChange: 12.5,
        bookingsChange: 8.3,
        commissionsChange: 15.2,
        clientsChange: -3.1,
      };

      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'booking',
          title: 'Nova reserva confirmada',
          description: 'João Silva - São Paulo → Miami',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          icon: '✈️',
        },
        {
          id: '2',
          type: 'payment',
          title: 'Pagamento recebido',
          description: 'R$ 3.450,00 - Cartão de crédito',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          icon: '💳',
        },
        {
          id: '3',
          type: 'message',
          title: 'Nova mensagem',
          description: 'Maria Santos: Gostaria de alterar a data',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          icon: '💬',
        },
        {
          id: '4',
          type: 'escalation',
          title: 'Escalação pendente',
          description: 'Cliente solicitou falar com agente',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          icon: '🔔',
        },
      ];

      setStats(mockStats);
      setActivities(mockActivities);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
            <Text className="text-sm text-muted mt-1">Bem-vindo, {user?.name || 'Admin'}</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-xl bg-surface items-center justify-center border border-border"
            onPress={logout}
            activeOpacity={0.7}
          >
            <Text className="text-lg">👤</Text>
          </TouchableOpacity>
        </View>

        {/* Métricas */}
        <View className="gap-4 mb-6">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <StatCard
                title="Receita Hoje"
                value={stats ? formatCurrency(stats.todayRevenue) : 'R$ 0,00'}
                change={stats?.revenueChange}
                icon="💰"
                iconColor="#22C55E"
              />
            </View>
            <View className="flex-1">
              <StatCard
                title="Reservas Ativas"
                value={stats?.activeBookings || 0}
                change={stats?.bookingsChange}
                icon="✈️"
                iconColor="#0a7ea4"
              />
            </View>
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <StatCard
                title="Comissões"
                value={stats ? formatCurrency(stats.pendingCommissions) : 'R$ 0,00'}
                change={stats?.commissionsChange}
                icon="💵"
                iconColor="#F59E0B"
              />
            </View>
            <View className="flex-1">
              <StatCard
                title="Novos Clientes"
                value={stats?.newClients || 0}
                change={stats?.clientsChange}
                icon="👥"
                iconColor="#8B5CF6"
              />
            </View>
          </View>
        </View>

        {/* Atividades Recentes */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Atividades Recentes</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-sm text-primary font-semibold">Ver todas</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            {activities.map((activity, index) => (
              <View key={activity.id}>
                <ActivityItem activity={activity} />
                {index < activities.length - 1 && (
                  <View className="h-px bg-border" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Ação Rápida */}
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-2"
          onPress={() => router.push('/bookings')}
          activeOpacity={0.8}
        >
          <Text className="text-xl">➕</Text>
          <Text className="text-background font-semibold text-base">
            Nova Reserva
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
