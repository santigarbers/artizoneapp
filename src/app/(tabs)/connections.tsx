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
import { router } from 'expo-router';
import { useConnections } from '@/lib/hooks/useConnections';
import { useSession } from '@/lib/hooks/useSession';

export default function ConnectionsScreen() {
  const { session } = useSession();
  const { pending, accepted, loading, updateStatus } = useConnections(session?.user.id);

  async function handleAccept(connectionId: string) {
    const { error } = await updateStatus(connectionId, 'accepted');
    if (error) Alert.alert('Error', error.message);
  }

  async function handleReject(connectionId: string) {
    const { error } = await updateStatus(connectionId, 'rejected');
    if (error) Alert.alert('Error', error.message);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Conexiones</Text>

      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invitaciones recibidas</Text>
          {pending.map(c => (
            <View key={c.id} style={styles.card}>
              <Pressable
                style={styles.cardLeft}
                onPress={() => router.push(`/profile/${c.sender.id}`)}
              >
                {c.sender.avatar_url ? (
                  <Image source={{ uri: c.sender.avatar_url }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {c.sender.username?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <Text style={styles.username}>@{c.sender.username}</Text>
              </Pressable>
              <View style={styles.actions}>
                <Pressable style={styles.acceptButton} onPress={() => handleAccept(c.id)}>
                  <Text style={styles.acceptText}>Aceptar</Text>
                </Pressable>
                <Pressable style={styles.rejectButton} onPress={() => handleReject(c.id)}>
                  <Text style={styles.rejectText}>Rechazar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {accepted.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conectados</Text>
          {accepted.map(c => {
            const other = c.sender_id === session?.user.id ? c.receiver : c.sender;
            return (
              <Pressable
                key={c.id}
                style={styles.connectedCard}
                onPress={() => router.push(`/profile/${other.id}`)}
              >
                {other.avatar_url ? (
                  <Image source={{ uri: other.avatar_url }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {other.username?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <Text style={styles.username}>@{other.username}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {pending.length === 0 && accepted.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Todavía no tenés conexiones.</Text>
          <Text style={styles.emptyHint}>Explorá el mapa para encontrar músicos cerca tuyo.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  inner: { padding: 24, paddingTop: 60, gap: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  section: { gap: 12 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 16, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8 },
  acceptButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptText: { color: '#000', fontWeight: '600', fontSize: 14 },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectText: { color: '#888', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  emptyHint: { color: '#555', fontSize: 14, textAlign: 'center' },
});
