import { Text, TouchableOpacity, View } from "react-native";

import {
  formatClock,
  formatCurrency,
  formatMinutes,
  formatShortDate,
  getRouteLabel,
  getSeniorBadge,
} from "@/lib/senior-flight";
import { SeniorRecommendation } from "@/types/flights";

type SeniorFlightCardProps = {
  recommendation: SeniorRecommendation;
  ctaLabel?: string;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  selected?: boolean;
};

function toneClasses(tone: string) {
  if (tone === "success") {
    return {
      badge: "bg-success/10 border-success/20",
      text: "text-success",
    };
  }

  if (tone === "warning") {
    return {
      badge: "bg-warning/10 border-warning/20",
      text: "text-warning",
    };
  }

  return {
    badge: "bg-primary/10 border-primary/20",
    text: "text-primary",
  };
}

export function SeniorFlightCard({
  recommendation,
  ctaLabel,
  title,
  subtitle,
  onPress,
  selected = false,
}: SeniorFlightCardProps) {
  const { flight, insight, kind } = recommendation;
  const badge = getSeniorBadge(kind);
  const tone = toneClasses(badge.tone);

  return (
    <View className={`rounded-[28px] border bg-surface px-5 py-5 ${selected ? "border-primary" : "border-border"}`}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <View className={`self-start rounded-full border px-3 py-2 ${tone.badge}`}>
            <Text className={`text-xs font-semibold uppercase tracking-[0.8px] ${tone.text}`}>
              {badge.label}
            </Text>
          </View>
          {title ? <Text className="mt-4 text-xl font-bold text-foreground">{title}</Text> : null}
          {subtitle ? <Text className="mt-1 text-sm leading-6 text-muted">{subtitle}</Text> : null}
          <Text className="mt-4 text-lg font-bold text-foreground">{flight.airline}</Text>
          <Text className="mt-1 text-sm text-muted">{getRouteLabel(flight)} · {formatShortDate(flight.departureTime)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-sm text-muted">Preco total</Text>
          <Text className="mt-1 text-2xl font-bold text-foreground">
            {formatCurrency(flight.price, flight.currency)}
          </Text>
        </View>
      </View>

      <View className="mt-5 rounded-[24px] bg-background px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-foreground">{formatClock(flight.departureTime)}</Text>
            <Text className="mt-1 text-sm text-muted">{flight.originCode || "--"}</Text>
          </View>
          <View className="mx-4 flex-1">
            <Text className="text-center text-sm font-semibold text-foreground">
              {insight.totalStops === 0 ? "Direto" : `${insight.totalStops} parada${insight.totalStops > 1 ? "s" : ""}`}
            </Text>
            <Text className="mt-1 text-center text-xs text-muted">{flight.duration}</Text>
          </View>
          <View className="items-end">
            <Text className="text-3xl font-bold text-foreground">{formatClock(flight.arrivalTime)}</Text>
            <Text className="mt-1 text-sm text-muted">{flight.destinationCode || "--"}</Text>
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="rounded-full border border-border bg-background px-3 py-2">
          <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">
            {insight.totalStops === 0 ? "Sem conexao" : `${insight.totalStops} conexao${insight.totalStops > 1 ? "es" : ""}`}
          </Text>
        </View>
        <View className="rounded-full border border-border bg-background px-3 py-2">
          <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">
            Maior espera {formatMinutes(insight.longestLayoverMinutes)}
          </Text>
        </View>
        <View className="rounded-full border border-border bg-background px-3 py-2">
          <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-foreground">
            {insight.hasCheckedBag ? "Mala incluida" : insight.hasCarryOn ? "Bagagem de mao" : "Sem bagagem incluida"}
          </Text>
        </View>
      </View>

      <Text className="mt-4 text-sm leading-6 text-muted">{badge.description}</Text>
      <Text className="mt-2 text-sm leading-6 text-foreground">{insight.reasonLine}</Text>

      {onPress ? (
        <TouchableOpacity
          className="mt-5 rounded-[22px] bg-primary px-5 py-4"
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text className="text-center text-base font-semibold text-background">
            {ctaLabel || "Escolher esta opcao"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
