import { View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  iconColor?: string;
}

export function StatCard({ title, value, change, icon, iconColor = '#0a7ea4' }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? '#22C55E' : '#EF4444';

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${iconColor}15` }}>
          <Text className="text-xl">{icon}</Text>
        </View>
        {change !== undefined && (
          <View className="flex-row items-center gap-1">
            <Text style={{ color: changeColor, fontSize: 12, fontWeight: '600' }}>
              {isPositive ? '↑' : '↓'} {Math.abs(change)}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-foreground mb-1">{value}</Text>
      <Text className="text-sm text-muted">{title}</Text>
    </View>
  );
}
