import { View, Text, TouchableOpacity } from 'react-native';
import { RecentActivity } from '@/types';

interface ActivityItemProps {
  activity: RecentActivity;
  onPress?: () => void;
}

export function ActivityItem({ activity, onPress }: ActivityItemProps) {
  const getIconBackground = (type: string) => {
    switch (type) {
      case 'booking':
        return '#0a7ea415';
      case 'payment':
        return '#22C55E15';
      case 'message':
        return '#F59E0B15';
      case 'escalation':
        return '#EF444415';
      default:
        return '#68707615';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  return (
    <TouchableOpacity
      className="flex-row items-center gap-3 py-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: getIconBackground(activity.type) }}
      >
        <Text className="text-lg">{activity.icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground mb-0.5">
          {activity.title}
        </Text>
        <Text className="text-xs text-muted" numberOfLines={1}>
          {activity.description}
        </Text>
      </View>
      <Text className="text-xs text-muted">{formatTime(activity.timestamp)}</Text>
    </TouchableOpacity>
  );
}
