import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getInstrumentConfig } from '@/constants/instruments';
import type { ConnectionWithProfile } from '@/lib/hooks/useConnections';
import type { Musician } from '@/lib/hooks/useNearbyMusicians';
import { ConnectButton } from './ConnectButton';

export const CARD_WIDTH = 158;

type Props = {
  musician: Musician;
  connection: ConnectionWithProfile | null;
  onConnect: () => Promise<void> | void;
  isOnline?: boolean;
};

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function MusicianCarouselCard({ musician, connection, onConnect, isOnline }: Props) {
  const instruments = (musician.instruments ?? []).slice(0, 2);

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/profile/[id]',
          params: { id: musician.id, distanceMeters: musician.distance_meters.toString() },
        })
      }
    >
      {musician.avatar_url ? (
        <Image
          source={{ uri: musician.avatar_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={styles.initial}>{musician.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.94)']}
        locations={[0.3, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

      {isOnline && (
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Activo</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.meta}>
          <Text style={styles.username} numberOfLines={1}>
            @{musician.username}
          </Text>
          <Text style={styles.distance}>{formatDistance(musician.distance_meters)}</Text>
        </View>

        {instruments.length > 0 && (
          <View style={styles.instrumentRow}>
            {instruments.map((inst) => {
              const cfg = getInstrumentConfig(inst);
              return (
                <View
                  key={inst}
                  style={[
                    styles.instrumentBadge,
                    {
                      backgroundColor: `${cfg.color}28`,
                      borderColor: `${cfg.color}66`,
                    },
                  ]}
                >
                  <Text style={styles.instrumentIcon}>{cfg.icon}</Text>
                </View>
              );
            })}
          </View>
        )}

        <ConnectButton connection={connection} onConnect={onConnect} compact />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    aspectRatio: 0.62,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#222',
  },
  placeholder: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: '#fff', fontSize: 38, fontWeight: 'bold' },
  onlineBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 8,
  },
  meta: { gap: 2 },
  username: { color: '#fff', fontSize: 14, fontWeight: '700' },
  distance: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  instrumentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  instrumentBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  instrumentIcon: { fontSize: 13 },
});
