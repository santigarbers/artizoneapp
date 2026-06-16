import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectButton } from '@/components/features/ConnectButton';
import { VideoCarousel } from '@/components/features/VideoCarousel';
import { ProfileSkeleton } from '@/components/ui/ProfileSkeleton';
import { getInstrumentConfig } from '@/constants/instruments';
import { useConnections } from '@/lib/hooks/useConnections';
import { useSession } from '@/lib/hooks/useSession';
import { useVideos } from '@/lib/hooks/useVideos';
import { supabase } from '@/lib/supabase';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HERO_HEIGHT = SCREEN_HEIGHT * 0.50;

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  genres: string[] | null;
  instruments: string[] | null;
  avatar_url: string | null;
  looking_for: string | null;
};

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export default function MusicianProfileScreen() {
  const { id, distanceMeters } = useLocalSearchParams<{ id: string; distanceMeters?: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { videos } = useVideos(id);
  const { getConnectionWith, sendConnection, fetchConnections } = useConnections(session?.user.id);

  const distance = distanceMeters ? parseFloat(distanceMeters) : null;

  useEffect(() => {
    loadProfile();
    fetchConnections();
  }, [id]);

  async function loadProfile() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, bio, genres, instruments, avatar_url, looking_for')
      .eq('id', id)
      .single();
    if (error) setLoadError('No se pudo cargar el perfil. Verificá tu conexión.');
    else setProfile(data);
    setLoading(false);
  }

  async function handleConnect() {
    const { error } = await sendConnection(id);
    if (error) Alert.alert('Error', error.message);
  }

  if (loading) return <ProfileSkeleton />;

  if (loadError || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.error}>{loadError ?? 'Perfil no encontrado'}</Text>
        {loadError && (
          <Pressable onPress={loadProfile} style={styles.retryButton}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const connection = getConnectionWith(id);
  const instruments = profile.instruments ?? [];
  const genres = profile.genres ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── HERO ── */}
        <View style={[styles.hero, { height: HERO_HEIGHT }]}>
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]}>
              <Text style={styles.heroInitial}>
                {profile.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.55)', '#000']}
            locations={[0, 0.28, 0.68, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <Pressable
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            hitSlop={14}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          {/* Name + distance */}
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>@{profile.username}</Text>
            {distance !== null && (
              <Text style={styles.heroDistance}>📍 {formatDistance(distance)}</Text>
            )}
          </View>
        </View>

        {/* ── BODY ── */}
        <View style={styles.body}>

          {/* Chips: instrumentos + géneros */}
          {(instruments.length > 0 || genres.length > 0) && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {instruments.map((inst) => {
                const cfg = getInstrumentConfig(inst);
                return (
                  <View
                    key={inst}
                    style={[
                      styles.chipInstrument,
                      { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}55` },
                    ]}
                  >
                    <Text style={styles.chipEmoji}>{cfg.icon}</Text>
                    <Text style={[styles.chipInstrumentText, { color: cfg.color }]}>{inst}</Text>
                  </View>
                );
              })}
              {genres.map((g) => (
                <View key={g} style={styles.chipGenre}>
                  <Text style={styles.chipGenreText}>{g}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Connect button */}
          <View style={styles.connectRow}>
            <ConnectButton connection={connection} onConnect={handleConnect} />
          </View>

          {/* Qué busca */}
          {profile.looking_for && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qué está buscando</Text>
              <View style={styles.lookingForCard}>
                <LinearGradient
                  colors={['rgba(124,58,237,0.12)', 'rgba(124,58,237,0.04)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.lookingForQuote}>"</Text>
                <Text style={styles.lookingForText}>{profile.looking_for}</Text>
              </View>
            </View>
          )}

          {/* Bio */}
          {profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experiencia y vibe</Text>
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            </View>
          )}

          {/* Portfolio */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
            </View>
            {videos.length === 0 ? (
              <Text style={styles.emptyText}>Este músico todavía no subió videos.</Text>
            ) : (
              <VideoCarousel videos={videos} />
            )}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  error: { color: '#ff4444', fontSize: 15, textAlign: 'center' },
  retryButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: { color: '#888', fontSize: 14 },

  // Hero
  hero: { width: '100%', overflow: 'hidden' },
  heroPlaceholder: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitial: { color: '#fff', fontSize: 72, fontWeight: 'bold' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 26, lineHeight: 32, marginLeft: -2 },
  heroInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 4,
  },
  heroName: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  heroDistance: { color: 'rgba(255,255,255,0.65)', fontSize: 14 },

  // Body
  body: { paddingHorizontal: 16, gap: 24, paddingTop: 20 },

  // Chips
  chipsScroll: { gap: 8, paddingRight: 16 },
  chipInstrument: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipEmoji: { fontSize: 14 },
  chipInstrumentText: { fontSize: 13, fontWeight: '600' },
  chipGenre: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#111',
  },
  chipGenreText: { color: '#ccc', fontSize: 13 },

  // Connect
  connectRow: { marginTop: -4 },

  // Sections
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Looking for
  lookingForCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    padding: 16,
    overflow: 'hidden',
    gap: 4,
  },
  lookingForQuote: { color: 'rgba(124,58,237,0.6)', fontSize: 32, lineHeight: 28, fontWeight: 'bold' },
  lookingForText: { color: '#ddd', fontSize: 15, lineHeight: 22 },

  // Bio
  bioCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1c1c1c',
    padding: 16,
  },
  bioText: { color: '#ccc', fontSize: 15, lineHeight: 24 },

  // Empty
  emptyText: { color: '#444', fontSize: 14 },
});
