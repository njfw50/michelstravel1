import { ScrollView, View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';

import { ScreenContainer } from '@/components/screen-container';
import { SongCard } from '@/components/song-card';
import { useColors } from '@/hooks/use-colors';
import { useKaraoke } from '@/lib/karaoke-context';
import {
  getAllSongs,
  getTrendingSongs,
  getFeaturedSongs,
  CATEGORIES,
  searchSongs,
} from '@/lib/mock-songs';
import { Song } from '@/lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addFavorite, removeFavorite, isFavorite, addToRecentlyPlayed } = useKaraoke();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allSongs = getAllSongs();
  const trendingSongs = getTrendingSongs(6);
  const featuredSongs = getFeaturedSongs();

  // Filter songs based on search and category
  const filteredSongs = useMemo(() => {
    let results = allSongs;

    if (searchQuery.trim()) {
      results = searchSongs(searchQuery);
    } else if (selectedCategory) {
      results = results.filter((song) => song.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory, allSongs]);

  const handleSongPress = async (song: Song) => {
    await addToRecentlyPlayed(song.id);
    router.push({
      pathname: '/song-detail',
      params: { songId: song.id },
    });
  };

  const handleFavoritePress = async (song: Song) => {
    if (isFavorite(song.id)) {
      await removeFavorite(song.id);
    } else {
      await addFavorite(song.id);
    }
  };

  const showSearchResults = searchQuery.trim().length > 0;
  const showCategoryFilter = selectedCategory !== null;

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground mb-6">
            Karaoke Pro
          </Text>

          {/* Search Bar */}
          <View
            className="flex-row items-center px-4 py-3 rounded-full border"
            style={{ borderColor: colors.border, backgroundColor: colors.surface }}
          >
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Search songs or artists..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-foreground"
              style={{ color: colors.foreground }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Results or Main Content */}
        {showSearchResults ? (
          // Search Results
          <View className="px-4 pt-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">
                Search Results ({filteredSongs.length})
              </Text>
              <Pressable onPress={() => setSearchQuery('')}>
                <Text className="text-primary font-semibold">Clear</Text>
              </Pressable>
            </View>
            {filteredSongs.length > 0 ? (
              filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onPress={handleSongPress}
                  onFavoritePress={handleFavoritePress}
                />
              ))
            ) : (
              <View className="items-center justify-center py-12">
                <MaterialIcons
                  name="music-note"
                  size={48}
                  color={colors.muted}
                />
                <Text className="text-muted mt-4 text-center">
                  No songs found matching “{searchQuery}”
                </Text>
              </View>
            )}
          </View>
        ) : showCategoryFilter ? (
          // Category Results
          <View className="px-4 pt-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">
                {selectedCategory} Songs ({filteredSongs.length})
              </Text>
              <Pressable onPress={() => setSelectedCategory(null)}>
                <Text className="text-primary font-semibold">All</Text>
              </Pressable>
            </View>
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onPress={handleSongPress}
                onFavoritePress={handleFavoritePress}
              />
            ))}
          </View>
        ) : (
          // Main Home Content
          <>
            {/* Featured Section */}
            <View className="px-4 pt-6 pb-4">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Featured
              </Text>
              <FlatList
                data={featuredSongs}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSongPress(item)}
                    className="mr-3"
                  >
                    <View className="w-32 h-40 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                      <View className="w-full h-full bg-muted relative">
                        {/* Placeholder for image */}
                        <View className="w-full h-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
                          <MaterialIcons
                            name="music-note"
                            size={40}
                            color={colors.primary}
                          />
                        </View>
                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                          <MaterialIcons
                            name="play-circle-filled"
                            size={48}
                            color={colors.foreground}
                          />
                        </View>
                      </View>
                      <View className="p-2 bg-surface">
                        <Text
                          className="text-xs font-semibold text-foreground"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text
                          className="text-xs text-muted"
                          numberOfLines={1}
                        >
                          {item.artist}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            </View>

            {/* Categories Section */}
            <View className="px-4 py-4">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Categories
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.name)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                        borderColor: colors.primary,
                        backgroundColor:
                          selectedCategory === category.name
                            ? colors.primary
                            : colors.surface,
                      },
                    ]}
                    className="px-4 py-2 rounded-full border"
                  >
                    <Text
                      className="font-semibold text-sm"
                      style={{
                        color:
                          selectedCategory === category.name
                            ? colors.background
                            : colors.foreground,
                      }}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Trending Section */}
            <View className="px-4 pb-6">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Trending Now
              </Text>
              {trendingSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onPress={handleSongPress}
                  onFavoritePress={handleFavoritePress}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
