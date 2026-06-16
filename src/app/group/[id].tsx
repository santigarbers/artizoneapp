import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroupMessages, type GroupMessage } from '@/lib/hooks/useGroupMessages';
import { useSession } from '@/lib/hooks/useSession';

function timeLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StackedAvatars({ previews }: { previews: string }) {
  let members: { avatar_url: string | null; username: string }[] = [];
  try { members = JSON.parse(previews); } catch { return null; }
  const shown = members.slice(0, 3);
  return (
    <View style={styles.stackedAvatars}>
      {shown.map((m, i) => (
        <View key={i} style={[styles.stackedAvatarWrap, { marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }]}>
          {m.avatar_url ? (
            <Image source={{ uri: m.avatar_url }} style={styles.stackedAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.stackedAvatar, styles.stackedAvatarPlaceholder]}>
              <Text style={styles.stackedAvatarInitial}>{m.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function MessageBubble({ item, isMe }: { item: GroupMessage; isMe: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      {!isMe && (
        <View style={styles.senderAvatarWrap}>
          {item.sender.avatar_url ? (
            <Image source={{ uri: item.sender.avatar_url }} style={styles.senderAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.senderAvatar, styles.senderAvatarPlaceholder]}>
              <Text style={styles.senderAvatarInitial}>{item.sender.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.bubbleCol, isMe && styles.bubbleColMe]}>
        {!isMe && (
          <Text style={styles.senderName}>@{item.sender.username}</Text>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{timeLabel(item.created_at)}</Text>
      </View>
    </View>
  );
}

export default function GroupChatScreen() {
  const { id: groupId, name, members_preview } = useLocalSearchParams<{
    id: string;
    name: string;
    members_preview: string;
  }>();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { messages, loading, sendMessage } = useGroupMessages(groupId, session?.user.id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  async function handleSend() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    await sendMessage(content);
    setSending(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={14} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          {members_preview ? (
            <StackedAvatars previews={members_preview} />
          ) : (
            <View style={styles.groupIconCircle}>
              <Text style={styles.groupIcon}>👥</Text>
            </View>
          )}
          <View style={styles.headerMeta}>
            <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
            <Text style={styles.headerSub}>Grupo</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageBubble item={item} isMe={item.sender_id === session?.user.id} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Empezá la conversación grupal</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mensaje al grupo..."
          placeholderTextColor="#444"
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={styles.sendIcon}>↑</Text>
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e1e1e',
    gap: 12,
    backgroundColor: '#000',
  },
  backBtn: { padding: 4 },
  backIcon: { color: '#fff', fontSize: 22 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerMeta: { flex: 1, gap: 2 },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerSub: { color: '#555', fontSize: 12 },

  groupIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIcon: { fontSize: 18 },

  stackedAvatars: { flexDirection: 'row', alignItems: 'center' },
  stackedAvatarWrap: { borderWidth: 2, borderColor: '#000', borderRadius: 18 },
  stackedAvatar: { width: 32, height: 32, borderRadius: 16 },
  stackedAvatarPlaceholder: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  stackedAvatarInitial: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  list: { padding: 16, gap: 4, flexGrow: 1 },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 3,
    maxWidth: '85%',
  },
  bubbleRowMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

  senderAvatarWrap: { marginBottom: 18 },
  senderAvatar: { width: 28, height: 28, borderRadius: 14 },
  senderAvatarPlaceholder: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  senderAvatarInitial: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  bubbleCol: { gap: 3, maxWidth: '100%' },
  bubbleColMe: { alignItems: 'flex-end' },

  senderName: { color: '#666', fontSize: 11, paddingLeft: 2 },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#e5e5e5' },
  bubbleTime: { color: '#444', fontSize: 10, paddingLeft: 4 },
  bubbleTimeMe: { paddingLeft: 0, paddingRight: 4 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: '#444', fontSize: 14 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1e1e1e',
    backgroundColor: '#000',
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
