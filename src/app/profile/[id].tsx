import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoCarousel } from '@/components/features/VideoCarousel';
import { useConnections } from '@/lib/hooks/useConnections';
import { useSession } from '@/lib/hooks/useSession';
import { useVideos } from '@/lib/hooks/useVideos';
import { supabase } from '@/lib/supabase';

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  genres: string[] | null;
  instruments: string[] | null;
  avatar_url: string | null;
};

export default function MusicianProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { videos } = useVideos(id);
  const { getConnectionWith, sendConnection, fetchConnections } = useConnections(session?.user.id);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username, bio, genres, instruments, avatar_url')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
    fetchConnections();
  }, [id]);

  async function handleConnect() {
    setConnecting(true);
    const { error } = await sendConnection(id);
    setConnecting(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Invitación enviada');
    }
  }

  const connection = getConnectionWith(id);

  function renderConnectButton() {
    if (!connection) {
      return (
        <Pressable style={styles.connectButton} onPress={handleConnect} disabled={connecting}>
          {connecting
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.connectButtonText}>Conectar</Text>
          }
        </Pressable>
      );
    }
    if (connection.status === 'pending') {
      return (
        <View style={styles.statusButton}>
          <Text style={styles.statusText}>Invitación pendiente</Text>
        </View>
      );
    }
    if (connection.status === 'accepted') {
      return (
        <View style={[styles.statusButton, styles.statusAccepted]}>
          <Text style={styles.statusText}>Conectados</Text>
        </View>
      );
    }
    return null;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Perfil no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Volver</Text>
      </Pressable>

      <View style={styles.avatarContainer}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {profile.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.username}>@{profile.username}</Text>

      {profile.bio && (
        <Text style={styles.bio}>{profile.bio}</Text>
      )}

      {renderConnectButton()}

      {profile.genres && profile.genres.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Géneros</Text>
          <View style={styles.tagsRow}>
            {profile.genres.map(g => (
              <View key={g} style={[styles.tag, styles.tagGenre]}>
                <Text style={styles.tagText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {profile.instruments && profile.instruments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instrumentos</Text>
          <View style={styles.tagsRow}>
            {profile.instruments.map(i => (
              <View key={i} style={[styles.tag, styles.tagInstrument]}>
                <Text style={styles.tagText}>{i}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {videos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Videos</Text>
          <VideoCarousel videos={videos} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  inner: { padding: 24, paddingTop: 60, gap: 16 },
  backButton: { marginBottom: 8 },
  backText: { color: '#888', fontSize: 16 },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 8,
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  bio: { color: '#aaa', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  connectButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  connectButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  statusButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statusAccepted: { borderColor: '#2a4a2a', backgroundColor: '#1a2e1a' },
  statusText: { color: '#888', fontSize: 15 },
  error: { color: '#ff4444', fontSize: 15 },
  section: { gap: 8 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagGenre: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#333' },
  tagInstrument: { backgroundColor: '#1a2e1a', borderWidth: 1, borderColor: '#2a4a2a' },
  tagText: { color: '#ccc', fontSize: 13 },
});
