import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Musician } from '@/lib/hooks/useNearbyMusicians';
import type { ConnectionWithProfile } from '@/lib/hooks/useConnections';
import { ConnectButton } from './ConnectButton';

type Props = {
  musician: Musician;
  connection: ConnectionWithProfile | null;
  onConnect: () => Promise<void> | void;
};

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function MusicianListItem({ musician, connection, onConnect }: Props) {
  const topTags = [...(musician.genres ?? []), ...(musician.instruments ?? [])].slice(0, 3);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/profile/${musician.id}`)}>
      {musician.avatar_url ? (
        <Image source={{ uri: musician.avatar_url }} style={styles.photo} contentFit="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.initial}>{musician.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)']}
        locations={[0.3, 0.6, 1]}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <View style={styles.meta}>
          <Text style={styles.username} numberOfLines={1}>@{musician.username}</Text>
          <Text style={styles.distance}>{formatDistance(musician.distance_meters)}</Text>
        </View>

        {topTags.length > 0 && (
          <View style={styles.tags}>
            {topTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <ConnectButton connection={connection} onConnect={onConnect} compact />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.72,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#222',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  photoPlaceholder: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 8,
  },
  meta: { gap: 2 },
  username: { color: '#fff', fontSize: 15, fontWeight: '700' },
  distance: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
});
