import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { ConnectionWithProfile } from '@/lib/hooks/useConnections';

type MemberPreview = { user_id: string; username: string; avatar_url: string | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  currentUserId: string;
  accepted: ConnectionWithProfile[];
  createGroup: (name: string, memberIds: string[], avatarUri?: string) => Promise<{ groupId?: string; error?: string }>;
  onCreated: (groupId: string, name: string, membersPreview: MemberPreview[]) => void;
};

export function CreateGroupSheet({ visible, onClose, currentUserId, accepted, createGroup, onCreated }: Props) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function toggle(userId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Ponele un nombre al grupo');
      return;
    }
    if (selected.size === 0) {
      Alert.alert('Seleccioná al menos un miembro');
      return;
    }
    setCreating(true);
    const { groupId, error } = await createGroup(name.trim(), [...selected], avatarUri ?? undefined);
    setCreating(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    // Derive members preview from local state so navigation has real data immediately
    const membersPreview: MemberPreview[] = accepted
      .filter(c => {
        const other = c.sender_id === currentUserId ? c.receiver : c.sender;
        return selected.has(other.id);
      })
      .map(c => {
        const other = c.sender_id === currentUserId ? c.receiver : c.sender;
        return { user_id: other.id, username: other.username, avatar_url: other.avatar_url };
      });

    const groupName = name.trim();
    resetAndClose();
    if (groupId) onCreated(groupId, groupName, membersPreview);
  }

  function resetAndClose() {
    setName('');
    setSelected(new Set());
    setAvatarUri(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={styles.backdrop} onPress={resetAndClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Nuevo grupo</Text>
            <Pressable onPress={resetAndClose} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          {/* Avatar picker */}
          <View style={styles.avatarRow}>
            <Pressable style={styles.avatarCircle} onPress={handlePickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarIcon}>📷</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditIcon}>+</Text>
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Foto del grupo{'\n'}(opcional)</Text>
          </View>

          {/* Nombre */}
          <View style={styles.nameCard}>
            <Text style={styles.label}>NOMBRE DEL GRUPO</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Banda del martes"
              placeholderTextColor="#3a3a3a"
              autoCapitalize="words"
              maxLength={60}
            />
          </View>

          {/* Miembros */}
          <Text style={styles.label}>AGREGAR MIEMBROS</Text>

          {accepted.length === 0 ? (
            <View style={styles.emptyMembers}>
              <Text style={styles.emptyText}>Todavía no tenés conexiones para agregar.</Text>
            </View>
          ) : (
            <FlatList
              data={accepted}
              keyExtractor={c => c.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const other = item.sender_id === currentUserId ? item.receiver : item.sender;
                const isSelected = selected.has(other.id);
                return (
                  <Pressable style={styles.memberRow} onPress={() => toggle(other.id)}>
                    <View style={styles.memberLeft}>
                      {other.avatar_url ? (
                        <Image source={{ uri: other.avatar_url }} style={styles.memberAvatar} contentFit="cover" />
                      ) : (
                        <View style={styles.memberAvatarPlaceholder}>
                          <Text style={styles.memberInitial}>{other.username?.[0]?.toUpperCase() ?? '?'}</Text>
                        </View>
                      )}
                      <Text style={styles.memberName}>@{other.username}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          {/* Crear */}
          <Pressable
            style={[styles.createBtn, (creating || selected.size === 0 || !name.trim()) && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={creating || selected.size === 0 || !name.trim()}
          >
            {creating ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.createBtnText}>
                Crear grupo{selected.size > 0 ? ` · ${selected.size + 1} miembros` : ''}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#1e1e1e',
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: '#333', borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 14,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: { color: '#555', fontSize: 16 },

  // Avatar picker
  avatarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36, position: 'relative',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a1a1a',
    borderWidth: 1.5, borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 24 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#7c3aed',
    borderWidth: 2, borderColor: '#0d0d0d',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { color: '#fff', fontSize: 14, lineHeight: 16, fontWeight: '300' },
  avatarHint: { color: '#555', fontSize: 12, lineHeight: 18 },

  label: {
    color: '#555', fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  nameCard: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1,
    borderColor: '#1c1c1c', paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 20, gap: 8,
  },
  nameInput: { color: '#fff', fontSize: 16, paddingVertical: 2 },

  list: { flexShrink: 1 },
  listContent: { gap: 4, paddingBottom: 8 },

  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4,
  },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22 },
  memberAvatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#222', alignItems: 'center', justifyContent: 'center',
  },
  memberInitial: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  memberName: { color: '#fff', fontSize: 15 },

  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  emptyMembers: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 14 },

  createBtn: {
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  createBtnDisabled: { opacity: 0.35 },
  createBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
