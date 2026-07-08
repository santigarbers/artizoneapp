import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INSTRUMENT_CONFIG } from '@/constants/instruments';
import { useBandManagement } from '@/lib/hooks/useBands';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';

type SearchResult = { id: string; username: string; display_name: string | null; avatar_url: string | null };

const INSTRUMENT_LIST = Object.keys(INSTRUMENT_CONFIG);

export default function InviteMusicianScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const mgmt = useBandManagement(id, session?.user.id);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [role, setRole] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const excludeIds = new Set([
        session?.user.id,
        ...mgmt.activeMembers.map(m => m.profile_id),
        ...mgmt.pendingInvitations.map(inv => inv.invitee_id),
      ]);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${query.trim()}%`)
        .limit(20);
      setResults(((data as SearchResult[]) ?? []).filter(p => !excludeIds.has(p.id)));
      setSearching(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query, mgmt.activeMembers, mgmt.pendingInvitations, session?.user.id]);

  function toggleInstrument(inst: string) {
    setInstruments(prev => prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]);
  }

  async function handleSend() {
    if (!selected) return;
    setSending(true);
    const roleWithInstruments = [role.trim(), instruments.join(', ')].filter(Boolean).join(' · ');
    const { error } = await mgmt.inviteMusician(selected.id, roleWithInstruments, message);
    setSending(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    router.back();
  }

  if (selected) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelected(null)} hitSlop={14}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Invitar a {selected.display_name ?? `@${selected.username}`}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.selectedRow}>
          {selected.avatar_url ? (
            <Image source={{ uri: selected.avatar_url }} style={styles.selectedAvatar} contentFit="cover" />
          ) : (
            <View style={styles.selectedAvatarPlaceholder}>
              <Text style={styles.selectedInitial}>{selected.username[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.selectedName}>@{selected.username}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>ROL PROPUESTO</Text>
          <TextInput
            style={styles.fieldInput}
            value={role}
            onChangeText={setRole}
            placeholder="p. ej. Baterista"
            placeholderTextColor="#3a3a3a"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>INSTRUMENTOS EN LA BANDA</Text>
          <View style={styles.chipGrid}>
            {INSTRUMENT_LIST.map(inst => {
              const isSelected = instruments.includes(inst);
              const cfg = INSTRUMENT_CONFIG[inst];
              return (
                <Pressable
                  key={inst}
                  style={[styles.chip, isSelected && { backgroundColor: `${cfg.color}22`, borderColor: `${cfg.color}77` }]}
                  onPress={() => toggleInstrument(inst)}
                >
                  <Text style={styles.chipEmoji}>{cfg.icon}</Text>
                  <Text style={[styles.chipText, isSelected && { color: cfg.color, fontWeight: '600' }]}>{inst}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>MENSAJE (OPCIONAL)</Text>
          <TextInput
            style={[styles.fieldInput, styles.multilineInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="Contale por qué lo/la querés sumar..."
            placeholderTextColor="#3a3a3a"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Pressable style={[styles.sendBtn, sending && { opacity: 0.7 }]} onPress={handleSend} disabled={sending}>
          {sending ? <ActivityIndicator color="#000" /> : <Text style={styles.sendBtnText}>Enviar invitación</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={14}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Invitar músico</Text>
        <View style={{ width: 24 }} />
      </View>

      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por nombre de usuario..."
        placeholderTextColor="#3a3a3a"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {searching && <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !searching && query.trim() ? (
            <Text style={styles.emptyText}>No encontramos músicos con ese nombre.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.resultRow} onPress={() => setSelected(item)}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.resultAvatar} contentFit="cover" />
            ) : (
              <View style={styles.resultAvatarPlaceholder}>
                <Text style={styles.resultInitial}>{item.username[0]?.toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.resultName}>{item.display_name ?? `@${item.username}`}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  searchInput: {
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1c1c1c',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },

  list: { gap: 4, paddingTop: 4 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 24 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  resultAvatar: { width: 44, height: 44, borderRadius: 22 },
  resultAvatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#222', alignItems: 'center', justifyContent: 'center',
  },
  resultInitial: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  resultName: { color: '#fff', fontSize: 15 },

  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedAvatar: { width: 56, height: 56, borderRadius: 28 },
  selectedAvatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#222', alignItems: 'center', justifyContent: 'center',
  },
  selectedInitial: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  selectedName: { color: '#fff', fontSize: 17, fontWeight: '700' },

  card: {
    backgroundColor: '#0d0d0d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1c1c1c',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  fieldLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  fieldInput: { color: '#fff', fontSize: 16, paddingVertical: 2 },
  multilineInput: { minHeight: 72 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#111',
  },
  chipEmoji: { fontSize: 13 },
  chipText: { color: '#666', fontSize: 13 },

  sendBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  sendBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
