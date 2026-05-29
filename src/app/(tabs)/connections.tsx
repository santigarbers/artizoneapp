import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useConnections } from '@/lib/hooks/useConnections';
import { useConversations } from '@/lib/hooks/useConversations';
import { useSession } from '@/lib/hooks/useSession';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ConnectionsScreen() {
  const { session } = useSession();
  const { pending, loading: loadingConn, updateStatus } = useConnections(session?.user.id);
  const { conversations, loading: loadingConv, refetch } = useConversations(session?.user.id);

  useFocusEffect(useCallback(() => { refetch(); }, []));

  async function handleAccept(connectionId: string) {
    const { error } = await updateStatus(connectionId, 'accepted');
    if (error) Alert.alert('Error', error.message);
    else refetch();
  }

  async function handleReject(connectionId: string) {
    const { error } = await updateStatus(connectionId, 'rejected');
    if (error) Alert.alert('Error', error.message);
  }

  const loading = loadingConn || loadingConv;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#fff" />}
    >
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
                    <Text style={styles.avatarInitial}>{c.sender.username?.[0]?.toUpperCase() ?? '?'}</Text>
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

      {conversations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversaciones</Text>
          {conversations.map(c => (
            <Pressable
              key={c.connection_id}
              style={styles.convCard}
              onPress={() => router.push({ pathname: `/chat/${c.connection_id}`, params: { username: c.other_username } })}
            >
              <View style={styles.avatarWrapper}>
                {c.other_avatar_url ? (
                  <Image source={{ uri: c.other_avatar_url }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{c.other_username?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                )}
                {c.unread_count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{c.unread_count > 9 ? '9+' : c.unread_count}</Text>
                  </View>
                )}
              </View>

              <View style={styles.convInfo}>
                <Text style={styles.convUsername}>@{c.other_username}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {c.last_message ?? 'Sin mensajes aún'}
                </Text>
              </View>

              {c.last_message_at && (
                <Text style={styles.time}>{timeAgo(c.last_message_at)}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {pending.length === 0 && conversations.length === 0 && (
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
  section: { gap: 10 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222',
    gap: 12,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  convInfo: { flex: 1, gap: 2 },
  convUsername: { color: '#fff', fontSize: 15, fontWeight: '600' },
  lastMessage: { color: '#666', fontSize: 13 },
  time: { color: '#555', fontSize: 12 },
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
