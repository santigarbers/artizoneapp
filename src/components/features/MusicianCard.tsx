import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Musician } from '@/lib/hooks/useNearbyMusicians';

type Props = {
  musician: Musician | null;
  onClose: () => void;
};

export function MusicianCard({ musician, onClose }: Props) {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (musician) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [musician]);

  if (!musician) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {musician.avatar_url ? (
            <Image source={{ uri: musician.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {musician.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.username}>@{musician.username}</Text>
          <Text style={styles.distance}>
            {musician.distance_meters < 1000
              ? `${Math.round(musician.distance_meters)} m`
              : `${(musician.distance_meters / 1000).toFixed(1)} km`}
          </Text>
        </View>

        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {musician.bio && (
        <Text style={styles.bio} numberOfLines={2}>{musician.bio}</Text>
      )}

      {musician.genres && musician.genres.length > 0 && (
        <View style={styles.tagsRow}>
          {musician.genres.map(g => (
            <View key={g} style={[styles.tag, styles.tagGenre]}>
              <Text style={styles.tagText}>{g}</Text>
            </View>
          ))}
        </View>
      )}

      {musician.instruments && musician.instruments.length > 0 && (
        <View style={styles.tagsRow}>
          {musician.instruments.map(i => (
            <View key={i} style={[styles.tag, styles.tagInstrument]}>
              <Text style={styles.tagText}>{i}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={styles.profileButton}
        onPress={() => router.push(`/profile/${musician.id}`)}
      >
        <Text style={styles.profileButtonText}>Ver perfil completo</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  username: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  distance: {
    color: '#888',
    fontSize: 13,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#888',
    fontSize: 12,
  },
  bio: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagGenre: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  tagInstrument: {
    backgroundColor: '#1a2e1a',
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  tagText: {
    color: '#ccc',
    fontSize: 12,
  },
  profileButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  profileButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
});
