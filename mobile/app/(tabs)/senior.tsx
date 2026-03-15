import { View, Text, ScrollView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { StatCard } from "@/components/dashboard/stat-card";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AlertTriangle, AlertCircle, Phone, Mic, ShieldAlert } from "lucide-react-native";

export default function SeniorScreen() {
  const colors = useColors();

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-2 mb-1">
              <View className="bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200">
                <Text className="text-xs font-medium text-violet-700">Ao vivo</Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-slate-900">Senior Care</Text>
            <Text className="text-sm text-slate-500 mt-1">Monitoramento de idosos em voo</Text>
          </View>
          <View className="h-12 w-12 rounded-xl bg-violet-50 border border-violet-200 items-center justify-center">
            <IconSymbol name="heart.text.square.fill" size={24} color="#6d28d9" />
          </View>
        </View>

        {/* Dashboard Metrics */}
        <View className="mb-6 flex-row flex-wrap gap-3">
          <View className="w-[48%] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-xs uppercase text-slate-500 font-medium">Em voo</Text>
            <Text className="text-2xl font-bold text-slate-900 mt-1">12</Text>
          </View>
          <View className="w-[48%] bg-white rounded-2xl p-4 border border-red-200 shadow-sm">
            <Text className="text-xs uppercase text-red-500 font-medium">Alertas</Text>
            <Text className="text-2xl font-bold text-red-700 mt-1">1</Text>
          </View>
          <View className="w-full bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm flex-row items-center justify-between">
            <View>
              <Text className="text-xs uppercase text-amber-700 font-medium">Conexões apertadas</Text>
              <Text className="text-xl font-bold text-amber-900 mt-1">2 clientes</Text>
            </View>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#b45309" />
          </View>
        </View>

        {/* Alert Cards */}
        <Text className="text-lg font-bold text-slate-900 mb-3">Atenção Prioritária</Text>
        
        <View className="bg-white rounded-3xl p-5 border border-red-300 shadow-sm mb-4">
          <View className="flex-row justify-between items-start mb-3">
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-lg font-bold text-slate-900">João Silva, 78</Text>
                <View className="bg-red-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-bold text-red-700">Crítico</Text>
                </View>
              </View>
              <Text className="text-sm text-slate-500">Portão alterado • G4 para H1</Text>
            </View>
            <View className="bg-slate-100 px-3 py-1 rounded-lg">
              <Text className="text-lg font-bold text-slate-900">TP88</Text>
            </View>
          </View>

          <View className="bg-red-50 p-3 rounded-2xl border border-red-100 mb-4">
            <View className="flex-row gap-2">
              <AlertCircle size={20} color="#dc2626" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">Confusão detectada</Text>
                <Text className="text-sm text-slate-600 mt-1">O passageiro está no terminal antigo e o voo fecha em 40min. Acionou botão de ajuda.</Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 bg-emerald-600 rounded-xl py-3 items-center flex-row justify-center gap-2">
              <Phone size={16} color="white" />
              <Text className="text-white font-bold text-sm">Ligar Rápido</Text>
            </View>
            <View className="flex-1 bg-white border border-slate-300 rounded-xl py-3 items-center flex-row justify-center gap-2">
              <Mic size={16} color="#475569" />
              <Text className="text-slate-700 font-bold text-sm">Mandar Áudio</Text>
            </View>
          </View>
        </View>

        {/* Normal Tracking */}
        <Text className="text-lg font-bold text-slate-900 mb-3 mt-2">Monitoramento Ativo</Text>

        <View className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-8">
          <View className="flex-row justify-between items-start mb-3">
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-lg font-bold text-slate-900">Maria Oliveira, 82</Text>
                <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-bold text-emerald-700">Tranquilo</Text>
                </View>
              </View>
              <Text className="text-sm text-slate-500">JFK → MIA • Aguardando Embarque</Text>
            </View>
            <View className="bg-slate-100 px-3 py-1 rounded-lg">
              <Text className="text-lg font-bold text-slate-900">AA102</Text>
            </View>
          </View>
          <Text className="text-sm text-slate-600 mb-4">IA de voz orientou a cliente há 15min. Ela compreendeu e não pediu humano.</Text>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}
