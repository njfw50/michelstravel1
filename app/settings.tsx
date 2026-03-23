import { ScrollView, View, Text, Pressable, Switch } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useKaraoke } from "@/lib/karaoke-context";
import { UserPreferences } from "@/lib/types";

export default function SettingsScreen() {
  const colors = useColors();
  const { preferences, updatePreferences } = useKaraoke();
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);
  const router = useRouter();

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleLyricsSize = async (size: 'small' | 'medium' | 'large') => {
    const updated = { ...localPrefs, lyricsSize: size };
    setLocalPrefs(updated);
    await updatePreferences(updated);
  };

  const handleEchoToggle = async (value: boolean) => {
    const updated = { ...localPrefs, enableEcho: value };
    setLocalPrefs(updated);
    await updatePreferences(updated);
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
        </View>

        {/* Audio Preferences */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Audio
          </Text>

          {/* Voice Assistant entry point */}
          <Pressable
            onPress={() => router.push("/voice-assistant")}
            className="p-4 mb-3 rounded-lg flex-row items-center"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <View
              className="w-12 h-12 mr-3 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <MaterialIcons name="hearing" size={24} color={colors.onPrimary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Assistente de Voz</Text>
              <Text className="text-muted-foreground text-sm">
                Fale, transcreva e ouça nas línguas PT/ES/EN
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
          </Pressable>

          {/* Volume */}
          <View
            className="p-4 rounded-lg mb-3"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-semibold">Volume</Text>
              <Text className="text-primary font-bold">{localPrefs.volume}%</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="volume-down" size={16} color={colors.muted} />
              <View
                className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.border }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: colors.primary,
                    width: `${localPrefs.volume}%`,
                  }}
                />
              </View>
              <MaterialIcons name="volume-up" size={16} color={colors.muted} />
            </View>
          </View>

          {/* Echo Effect */}
          <View
            className="p-4 rounded-lg flex-row items-center justify-between"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="graphic-eq" size={20} color={colors.primary} />
              <Text className="text-foreground font-semibold">Echo Effect</Text>
            </View>
            <Switch
              value={localPrefs.enableEcho}
              onValueChange={handleEchoToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.foreground}
            />
          </View>
        </View>

        {/* Display Preferences */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Display
          </Text>

          {/* Lyrics Size */}
          <View
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-foreground font-semibold mb-3">Lyrics Size</Text>
            <View className="gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <Pressable
                  key={size}
                  onPress={() => handleLyricsSize(size)}
                  style={({ pressed }) => [
                    {
                      opacity: pressed ? 0.8 : 1,
                      borderColor:
                        localPrefs.lyricsSize === size
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        localPrefs.lyricsSize === size
                          ? colors.primary + '20'
                          : 'transparent',
                    },
                  ]}
                  className="p-3 rounded-lg border flex-row items-center justify-between"
                >
                  <Text
                    className="font-semibold capitalize"
                    style={{
                      color:
                        localPrefs.lyricsSize === size
                          ? colors.primary
                          : colors.foreground,
                      fontSize: size === 'small' ? 14 : size === 'medium' ? 16 : 18,
                    }}
                  >
                    {size}
                  </Text>
                  {localPrefs.lyricsSize === size && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* About */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            About
          </Text>

          <View
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-foreground">App Version</Text>
              <Text className="text-muted font-semibold">1.0.0</Text>
            </View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-foreground">Build</Text>
              <Text className="text-muted font-semibold">001</Text>
            </View>
            <View className="pt-4 border-t" style={{ borderTopColor: colors.border }}>
              <Text className="text-xs text-muted text-center leading-relaxed">
                Karaoke Pro v1.0.0 • Made with passion for music lovers
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="px-4 py-6">
          <Pressable
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
                borderColor: colors.error,
              },
            ]}
            className="p-4 rounded-lg border items-center"
          >
            <Text className="text-error font-semibold">Clear Cache</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
