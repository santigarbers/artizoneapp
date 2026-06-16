import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConnections } from '@/lib/hooks/useConnections';
import { useConversations } from '@/lib/hooks/useConversations';
import { useGroups } from '@/lib/hooks/useGroups';
import { useSession } from '@/lib/hooks/useSession';
import { getInstrumentConfig } from '@/constants/instruments';
import { supabase } from '@/lib/supabase';
import { CreateGroupSheet } from '@/components/features/CreateGroupSheet';
import { GroupAvatar } from '@/components/features/GroupAvatar';
import { ConversationSkeletonList } from '@/components/ui/ConversationSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function Avatar({ url, username, size }: { url: string | null; username: string; size: number }) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>
        {username?.[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

export default function ConnectionsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { pending, accepted, loading: loadingConn, updateStatus } = useConnections(session?.user.id);
  const { conversations, loading: loadingConv, refetch } = useConversations(session?.user.id);
  const { groups, loading: loadingGroups, refetch: refetchGroups, createGroup } = useGroups(session?.user.id);
  const [instrumentsMap, setInstrumentsMap] = useState<Record<string, string[]>>({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); refetchGroups(); }, []));

  useEffect(() => {
    if (conversations.length === 0) return;
    const ids = [...new Set(conversations.map(c => c.other_user_id))];
    supabase
      .from('profiles')
      .select('id, instruments')
      .in('id', ids)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string[]> = {};
        (data as { id: string; instruments: string[] | null }[]).forEach(p => {
          map[p.id] = p.instruments ?? [];
        });
        setInstrumentsMap(map);
      });
  }, [conversations]);

  async function handleAccept(connectionId: string) {
    const { error } = await updateStatus(connectionId, 'accepted');
    if (error) Alert.alert('Error', error.message);
    else refetch();
  }

  async function handleReject(connectionId: string) {
    const { error } = await updateStatus(connectionId, 'rejected');
    if (error) Alert.alert('Error', error.message);
  }

  const loading = loadingConn || loadingConv || loadingGroups;

  // Merge conversations + groups into a single list sorted by last activity
  const unifiedChats = useMemo(() => {
    const items: Array<
      | { type: '1:1'; key: string; lastAt: number; data: typeof conversations[number] }
      | { type: 'group'; key: string; lastAt: number; data: typeof groups[number] }
    > = [
      ...conversations.map(c => ({
        type: '1:1' as const,
        key: `1:1-${c.connection_id}`,
        lastAt: c.last_message_at ? new Date(c.last_message_at).getTime() : 0,
        data: c,
      })),
      ...groups.map(g => ({
        type: 'group' as const,
        key: `group-${g.group_id}`,
        lastAt: g.last_message_at ? new Date(g.last_message_at).getTime() : Date.now(),
        data: g,
      })),
    ];
    return items.sort((a, b) => b.lastAt - a.lastAt);
  }, [conversations, groups]);

  const isEmpty = !loading && pending.length === 0 && accepted.length === 0 && unifiedChats.length === 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(124,58,237,0.22)', 'rgba(109,40,217,0.10)', 'rgba(76,29,149,0.05)', 'transparent']}
        locations={[0, 0.3, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 88 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#fff" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Messages</Text>
          <Pressable style={styles.createGroupBtn} onPress={() => setShowCreateGroup(true)}>
            <Text style={styles.createGroupText}>Crear grupo+</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={styles.section}>
            <Skeleton width={140} height={12} borderRadius={6} />
            <ConversationSkeletonList count={5} />
          </View>
        )}

        {/* Pending invitations */}
        {!loading && pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INVITACIONES ({pending.length})</Text>
            {pending.map(c => (
              <View key={c.id} style={styles.pendingCard}>
                <Pressable
                  style={styles.pendingLeft}
                  onPress={() =>
                    router.push({ pathname: '/profile/[id]', params: { id: c.sender.id } })
                  }
                >
                  <Avatar url={c.sender.avatar_url} username={c.sender.username} size={46} />
                  <View style={styles.pendingMeta}>
                    <Text style={styles.pendingName}>@{c.sender.username}</Text>
                    <Text style={styles.pendingHint}>quiere conectar contigo</Text>
                  </View>
                </Pressable>
                <View style={styles.pendingActions}>
                  <Pressable style={styles.acceptBtn} onPress={() => handleAccept(c.id)}>
                    <Text style={styles.acceptText}>Aceptar</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => handleReject(c.id)}>
                    <Text style={styles.rejectText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* New connections horizontal scroll */}
        {!loading && accepted.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>NEW CONNECTIONS</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newConnRow}
            >
              {accepted.map(c => {
                const other = c.sender_id === session?.user.id ? c.receiver : c.sender;
                return (
                  <Pressable
                    key={c.id}
                    style={styles.newConnItem}
                    onPress={() =>
                      router.push({ pathname: '/profile/[id]', params: { id: other.id } })
                    }
                  >
                    <View style={styles.newConnRing}>
                      <Avatar url={other.avatar_url} username={other.username} size={58} />
                    </View>
                    <Text style={styles.newConnName} numberOfLines={1}>
                      @{other.username}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Unified chat list: 1:1 + groups sorted by last activity */}
        {!loading && unifiedChats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.conversationList}>
              {unifiedChats.map((item, idx) => {
                const isLast = idx === unifiedChats.length - 1;

                if (item.type === '1:1') {
                  const c = item.data;
                  const instruments = instrumentsMap[c.other_user_id] ?? [];
                  const cfg = instruments[0] ? getInstrumentConfig(instruments[0]) : null;
                  const hasUnread = c.unread_count > 0;
                  return (
                    <Pressable
                      key={item.key}
                      // @ts-ignore — pre-existing Expo Router typed route limitation
                      onPress={() => router.push({ pathname: `/chat/${c.connection_id}`, params: { username: c.other_username, avatar_url: c.other_avatar_url ?? '' } })}
                      style={[styles.convRow, !isLast && styles.convRowBorder]}
                    >
                      <View style={styles.avatarWrapper}>
                        <Avatar url={c.other_avatar_url} username={c.other_username} size={54} />
                        {hasUnread && <View style={styles.onlineRing} />}
                      </View>
                      <View style={styles.convBody}>
                        <View style={styles.convTop}>
                          <Text style={[styles.convName, hasUnread && styles.convNameBold]} numberOfLines={1}>
                            @{c.other_username}
                          </Text>
                          {cfg && <Text style={styles.instIconInline}>{cfg.icon}</Text>}
                          <View style={styles.convTopSpacer} />
                          {c.last_message_at && (
                            <Text style={[styles.convTime, hasUnread && styles.convTimeBold]}>
                              {timeAgo(c.last_message_at)}
                            </Text>
                          )}
                          {hasUnread && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadText}>{c.unread_count > 9 ? '9+' : c.unread_count}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.convBottom}>
                          <Text style={styles.lastMsg} numberOfLines={1}>Sin mensajes aún</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                }

                // Group row
                const g = item.data;
                const hasUnread = g.unread_count > 0;
                return (
                  <Pressable
                    key={item.key}
                    style={[styles.convRow, !isLast && styles.convRowBorder]}
                    onPress={() =>
                      router.push({
                        pathname: '/group/[id]',
                        params: { id: g.group_id, name: g.group_name, members_preview: JSON.stringify(g.members_preview ?? []) },
                      })
                    }
                  >
                    <GroupAvatar
                      avatarUrl={g.group_avatar_url}
                      members={g.members_preview ?? []}
                      size={54}
                    />
                    <View style={styles.convBody}>
                      <View style={styles.convTop}>
                        <View style={styles.groupNameRow}>
                          <Text style={styles.groupBadge}>👥</Text>
                          <Text style={[styles.convName, hasUnread && styles.convNameBold]} numberOfLines={1}>
                            {g.group_name}
                          </Text>
                        </View>
                        {g.last_message_at && (
                          <Text style={[styles.convTime, hasUnread && styles.convTimeBold]}>
                            {timeAgo(g.last_message_at)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.convBottom}>
                        <Text style={[styles.lastMsg, hasUnread && styles.lastMsgBold]} numberOfLines={1}>
                          {g.last_message ?? 'Sin mensajes aún'}
                        </Text>
                        {hasUnread && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{g.unread_count > 9 ? '9+' : g.unread_count}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty state */}
        {isEmpty && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎵</Text>
            <Text style={styles.emptyText}>Todavía no tenés conexiones</Text>
            <Text style={styles.emptyHint}>
              Descubrí músicos cerca tuyo y empezá a conectar.
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.replace('/(tabs)/discover')}
            >
              <Text style={styles.emptyBtnText}>Ir a Descubrir</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <CreateGroupSheet
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        currentUserId={session?.user.id ?? ''}
        accepted={accepted}
        createGroup={createGroup}
        onCreated={(groupId, groupName, membersPreview) =>
          router.push({
            pathname: '/group/[id]',
            params: { id: groupId, name: groupName, members_preview: JSON.stringify(membersPreview) },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
  inner: { paddingHorizontal: 20, gap: 28 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  createGroupBtn: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  createGroupText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '600',
  },

  section: { gap: 14 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Pending invitations
  pendingCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pendingMeta: { gap: 3, flex: 1 },
  pendingName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  pendingHint: { color: '#666', fontSize: 12 },
  pendingActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  acceptText: { color: '#000', fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { color: '#666', fontSize: 14 },

  // New connections
  newConnRow: { gap: 16, paddingRight: 4 },
  newConnItem: { alignItems: 'center', gap: 8, width: 72 },
  newConnRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.5)',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  newConnName: { color: '#aaa', fontSize: 11, textAlign: 'center' },

  // Avatar
  avatarPlaceholder: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: 'bold' },

  // Conversation list
  conversationList: {
    backgroundColor: '#0f0f0f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1c1c1c',
    overflow: 'hidden',
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  convRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e1e1e',
  },
  avatarWrapper: { position: 'relative' },
  onlineRing: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#7c3aed',
    borderWidth: 2,
    borderColor: '#0f0f0f',
  },

  convBody: { flex: 1, gap: 5 },
  convTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  convName: { color: '#ccc', fontSize: 15, fontWeight: '500', flexShrink: 1 },
  convNameBold: { color: '#fff', fontWeight: '700' },
  convTopSpacer: { flex: 1 },
  convTime: { color: '#555', fontSize: 12 },
  convTimeBold: { color: '#7c3aed' },

  convBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  instIconInline: { fontSize: 14 },
  lastMsg: { color: '#555', fontSize: 13, flex: 1 },
  lastMsgBold: { color: '#aaa', fontWeight: '500' },
  unreadBadge: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  groupBadge: { fontSize: 12 },

  // Empty
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 60,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptyHint: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  emptyBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
});
