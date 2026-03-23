import { ScrollView, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useKaraoke } from '@/lib/karaoke-context';
import { getSongById } from '@/lib/mock-songs';
import { Song } from '@/lib/types';

export default function SongDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const { isFavorite, addFavorite, removeFavorite } = useKaraoke();
  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    if (songId) {
      const foundSong = getSongById(songId);
      setSong(foundSong || null);
    }
  }, [songId]);

  if (!song) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Song not found</Text>
      </ScreenContainer>
    );
  }

  const favorite = isFavorite(song.id);
  const difficultyColor = {
    easy: colors.success,
    medium: colors.warning,
    hard: colors.error,
  }[song.difficulty];

  const handleFavorite = async () => {
    if (favorite) {
      await removeFavorite(song.id);
    } else {
      await addFavorite(song.id);
    }
  };

  const handleStartSinging = () => {
    router.push({
      pathname: '/karaoke-performance',
      params: { songId: song.id },
    });
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View className="px-4 pt-4 pb-2 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialIcons name="arrow-back" size={28} color={colors.foreground} />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-foreground ml-4">
            Song Details
          </Text>
        </View>

        {/* Album Art */}
        <View className="mx-4 mt-4 mb-6 rounded-2xl overflow-hidden aspect-square">
          <View
            className="w-full h-full items-center justify-center"
            style={{ backgroundColor: colors.surface }}
          >
            <MaterialIcons name="music-note" size={80} color={colors.primary} />
          </View>
        </View>

        {/* Song Info */}
        <View className="px-4 mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            {song.title}
          </Text>
          <Text className="text-lg text-muted mb-4">{song.artist}</Text>

          {/* Metadata */}
          <View className="flex-row gap-4 mb-6">
            <View
              className="flex-1 p-3 rounded-lg items-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-xs text-muted mb-1">Duration</Text>
              <Text className="text-lg font-semibold text-foreground">
                {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
              </Text>
            </View>
            <View
              className="flex-1 p-3 rounded-lg items-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-xs text-muted mb-1">Difficulty</Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: difficultyColor }}
              >
                <Text className="text-sm font-semibold text-foreground capitalize">
                  {song.difficulty}
                </Text>
              </View>
            </View>
            <View
              className="flex-1 p-3 rounded-lg items-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-xs text-muted mb-1">Category</Text>
              <Text className="text-lg font-semibold text-primary">
                {song.category}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View
            className="p-4 rounded-lg mb-6 flex-row items-center justify-between"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="play-circle-outline" size={20} color={colors.primary} />
              <Text className="text-foreground font-semibold">
                {(song.plays / 1000000).toFixed(1)}M plays
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="star" size={20} color={colors.warning} />
              <Text className="text-foreground font-semibold">4.8</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 mb-6">
            {/* Start Singing Button */}
            <Pressable
              onPress={handleStartSinging}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.8 : 1,
                  backgroundColor: colors.primary,
                },
              ]}
              className="py-4 rounded-lg items-center flex-row justify-center gap-2"
            >
              <MaterialIcons name="mic" size={24} color={colors.background} />
              <Text className="text-lg font-bold text-background">
                Start Singing
              </Text>
            </Pressable>

            {/* Favorite Button */}
            <Pressable
              onPress={handleFavorite}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.8 : 1,
                  borderColor: favorite ? colors.error : colors.border,
                  backgroundColor: favorite ? colors.error + '20' : colors.surface,
                },
              ]}
              className="py-4 rounded-lg items-center flex-row justify-center gap-2 border"
            >
              <MaterialIcons
                name={favorite ? 'favorite' : 'favorite-border'}
                size={24}
                color={favorite ? colors.error : colors.foreground}
              />
              <Text
                className="text-lg font-bold"
                style={{
                  color: favorite ? colors.error : colors.foreground,
                }}
              >
                {favorite ? 'Saved' : 'Save'}
              </Text>
            </Pressable>

            {/* Share Button */}
            <Pressable
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.8 : 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              className="py-4 rounded-lg items-center flex-row justify-center gap-2 border"
            >
              <MaterialIcons name="share" size={24} color={colors.foreground} />
              <Text className="text-lg font-bold text-foreground">Share</Text>
            </Pressable>
          </View>

          {/* Lyrics Preview */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Lyrics Preview
            </Text>
            <View
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.surface }}
            >
              {song.lyrics.slice(0, 4).map((line, index) => (
                <Text
                  key={index}
                  className="text-sm text-muted leading-relaxed mb-2"
                >
                  {line.text}
                </Text>
              ))}
              {song.lyrics.length > 4 && (
                <Text className="text-xs text-muted italic mt-2">
                  ... and {song.lyrics.length - 4} more lines
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
