import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBandManagement } from '@/lib/hooks/useBands';
import { useSession } from '@/lib/hooks/useSession';

const TABS = ['Contenido', 'Integrantes', 'Info'] as const;
type Tab = (typeof TABS)[number];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activa' },
  { value: 'hiatus', label: 'En pausa' },
  { value: 'disbanded', label: 'Disuelta' },
] as const;

export default function BandManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const mgmt = useBandManagement(id, session?.user.id);
  const [tab, setTab] = useState<Tab>('Contenido');

  useEffect(() => {
    if (!mgmt.loading && !mgmt.myMembership) {
      router.replace({ pathname: '/band/[id]', params: { id } });
    }
  }, [mgmt.loading, mgmt.myMembership, id]);

  if (mgmt.loading || !mgmt.band) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!mgmt.myMembership) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={14}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{mgmt.band.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map(t => (
          <Pressable key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>{t}</Text>
            {tab === t && <View style={styles.tabIndicator} />}
          </Pressable>
        ))}
      </View>

      {tab === 'Contenido' && <ContenidoTab />}
      {tab === 'Integrantes' && (
        <IntegrantesTab
          bandId={id}
          mgmt={mgmt}
          insets={insets}
        />
      )}
      {tab === 'Info' && <InfoTab mgmt={mgmt} insets={insets} />}
    </View>
  );
}

function ContenidoTab() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🎵</Text>
      <Text style={styles.emptyTitle}>Todavía no hay contenido</Text>
      <Text style={styles.emptySubtitle}>Discografía, fotos y shows van a vivir acá.</Text>
    </View>
  );
}

function IntegrantesTab({ bandId, mgmt, insets }: { bandId: string; mgmt: ReturnType<typeof useBandManagement>; insets: { bottom: number } }) {
  async function handleRoleToggle(memberId: string, currentRole: string) {
    const nextRole = currentRole === 'leader' ? 'member' : 'leader';
    const { error } = await mgmt.changeMemberRole(memberId, nextRole);
    if (error) Alert.alert('Error', error);
  }

  function handleRemove(memberId: string, name: string) {
    Alert.alert('Remover integrante', `¿Seguro que querés remover a ${name} de la banda?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const { error } = await mgmt.removeMember(memberId);
          if (error) Alert.alert('Error', error);
        },
      },
    ]);
  }

  function handleCancelInvitation(invitationId: string) {
    Alert.alert('Cancelar invitación', '¿Cancelar esta invitación pendiente?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await mgmt.cancelInvitation(invitationId);
          if (error) Alert.alert('Error', error);
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.tabContent, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {mgmt.isLeader && (
        <Pressable
          style={styles.inviteBtn}
          onPress={() => router.push({ pathname: '/band/[id]/manage/members/invite', params: { id: bandId } })}
        >
          <Text style={styles.inviteBtnText}>+ Invitar músico</Text>
        </Pressable>
      )}

      <Text style={styles.groupLabel}>ACTIVOS · {mgmt.activeMembers.length}</Text>
      <View style={styles.membersList}>
        {mgmt.activeMembers.map(m => {
          const name = m.profile?.display_name ?? `@${m.profile?.username}`;
          return (
            <View key={m.id} style={styles.memberRow}>
              {m.profile?.avatar_url ? (
                <Image source={{ uri: m.profile.avatar_url }} style={styles.memberAvatar} contentFit="cover" />
              ) : (
                <View style={styles.memberAvatarPlaceholder}>
                  <Text style={styles.memberInitial}>{name[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{name}</Text>
                <Text style={styles.memberRole}>
                  {m.role === 'leader' ? 'Líder' : 'Integrante'}
                  {m.instruments?.length ? ` · ${m.instruments.join(', ')}` : ''}
                </Text>
              </View>
              {mgmt.isLeader && m.profile_id !== mgmt.myMembership?.profile_id && (
                <View style={styles.memberActions}>
                  <Pressable style={styles.smallBtn} onPress={() => handleRoleToggle(m.id, m.role)}>
                    <Text style={styles.smallBtnText}>{m.role === 'leader' ? 'Bajar a miembro' : 'Hacer líder'}</Text>
                  </Pressable>
                  <Pressable style={styles.smallBtnDanger} onPress={() => handleRemove(m.id, name)}>
                    <Text style={styles.smallBtnDangerText}>Remover</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {mgmt.pendingInvitations.length > 0 && (
        <>
          <Text style={styles.groupLabel}>INVITACIONES PENDIENTES · {mgmt.pendingInvitations.length}</Text>
          <View style={styles.membersList}>
            {mgmt.pendingInvitations.map(inv => {
              const name = inv.invitee?.display_name ?? `@${inv.invitee?.username}`;
              return (
                <View key={inv.id} style={styles.memberRow}>
                  {inv.invitee?.avatar_url ? (
                    <Image source={{ uri: inv.invitee.avatar_url }} style={styles.memberAvatar} contentFit="cover" />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberInitial}>{name[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{name}</Text>
                    <Text style={styles.memberRole}>Pendiente{inv.proposed_role ? ` · ${inv.proposed_role}` : ''}</Text>
                  </View>
                  {mgmt.isLeader && (
                    <Pressable style={styles.smallBtnDanger} onPress={() => handleCancelInvitation(inv.id)}>
                      <Text style={styles.smallBtnDangerText}>Cancelar</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}

      {mgmt.exMembers.length > 0 && (
        <>
          <Text style={styles.groupLabel}>EX INTEGRANTES · {mgmt.exMembers.length}</Text>
          <View style={styles.membersList}>
            {mgmt.exMembers.map(m => {
              const name = m.profile?.display_name ?? `@${m.profile?.username}`;
              return (
                <View key={m.id} style={[styles.memberRow, styles.memberRowMuted]}>
                  {m.profile?.avatar_url ? (
                    <Image source={{ uri: m.profile.avatar_url }} style={styles.memberAvatar} contentFit="cover" />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberInitial}>{name[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberNameMuted}>{name}</Text>
                    <Text style={styles.memberRole}>Ex integrante</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function InfoTab({ mgmt, insets }: { mgmt: ReturnType<typeof useBandManagement>; insets: { bottom: number } }) {
  const band = mgmt.band!;
  const [name, setName] = useState(band.name);
  const [bio, setBio] = useState(band.bio ?? '');
  const [genres, setGenres] = useState(band.genres?.join(', ') ?? '');
  const [formedYear, setFormedYear] = useState(band.formed_year?.toString() ?? '');
  const [city, setCity] = useState(band.city ?? '');
  const [neighborhood, setNeighborhood] = useState(band.neighborhood ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const readOnly = !mgmt.isLeader;

  async function pickAndUpload(kind: 'avatar' | 'cover') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: kind === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const setUploading = kind === 'avatar' ? setUploadingAvatar : setUploadingCover;
    setUploading(true);
    const { error } = await mgmt.updateBandImage(result.assets[0].uri, kind);
    setUploading(false);
    if (error) Alert.alert('Error', error);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    const year = formedYear.trim() ? parseInt(formedYear.trim(), 10) : null;
    const { error } = await mgmt.updateBandInfo({
      name: name.trim(),
      bio: bio.trim() || null,
      genres: genres ? genres.split(',').map(g => g.trim()).filter(Boolean) : null,
      formed_year: year && !isNaN(year) ? year : null,
      city: city.trim() || null,
      neighborhood: neighborhood.trim() || null,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else Alert.alert('Guardado ✓');
  }

  function handleChangeStatus(value: 'active' | 'hiatus' | 'disbanded') {
    mgmt.updateBandInfo({ status: value });
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.tabContent, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.imagesRow}>
        <Pressable style={styles.coverPicker} onPress={() => !readOnly && pickAndUpload('cover')} disabled={readOnly}>
          {band.cover_url ? (
            <Image source={{ uri: band.cover_url }} style={styles.coverPickerImg} contentFit="cover" />
          ) : (
            <View style={styles.coverPickerPlaceholder}>
              <Text style={styles.coverIcon}>🖼️</Text>
            </View>
          )}
          {uploadingCover && <ActivityIndicator color="#fff" style={StyleSheet.absoluteFill} />}
        </Pressable>
        <Pressable style={styles.avatarPicker} onPress={() => !readOnly && pickAndUpload('avatar')} disabled={readOnly}>
          {band.avatar_url ? (
            <Image source={{ uri: band.avatar_url }} style={styles.avatarPickerImg} contentFit="cover" />
          ) : (
            <View style={styles.avatarPickerPlaceholder}>
              <Text style={styles.avatarIcon}>🎸</Text>
            </View>
          )}
          {uploadingAvatar && <ActivityIndicator color="#fff" style={StyleSheet.absoluteFill} />}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>NOMBRE</Text>
        <TextInput
          style={styles.fieldInput}
          value={name}
          onChangeText={setName}
          editable={!readOnly}
          placeholderTextColor="#3a3a3a"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>BIO</Text>
        <TextInput
          style={[styles.fieldInput, styles.multilineInput]}
          value={bio}
          onChangeText={setBio}
          editable={!readOnly}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholderTextColor="#3a3a3a"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>GÉNEROS</Text>
        <TextInput
          style={styles.fieldInput}
          value={genres}
          onChangeText={setGenres}
          editable={!readOnly}
          placeholder="Rock, Jazz..."
          placeholderTextColor="#3a3a3a"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>AÑO DE FORMACIÓN</Text>
        <TextInput
          style={styles.fieldInput}
          value={formedYear}
          onChangeText={setFormedYear}
          editable={!readOnly}
          keyboardType="number-pad"
          maxLength={4}
          placeholderTextColor="#3a3a3a"
        />
        <View style={styles.divider} />
        <Text style={styles.fieldLabel}>CIUDAD</Text>
        <TextInput
          style={styles.fieldInput}
          value={city}
          onChangeText={setCity}
          editable={!readOnly}
          placeholderTextColor="#3a3a3a"
        />
        <View style={styles.divider} />
        <Text style={styles.fieldLabel}>BARRIO</Text>
        <TextInput
          style={styles.fieldInput}
          value={neighborhood}
          onChangeText={setNeighborhood}
          editable={!readOnly}
          placeholderTextColor="#3a3a3a"
        />
      </View>

      {mgmt.isLeader && (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>ESTADO DE LA BANDA</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(opt => (
              <Pressable
                key={opt.value}
                style={[styles.statusChip, band.status === opt.value && styles.statusChipActive]}
                onPress={() => handleChangeStatus(opt.value)}
              >
                <Text style={[styles.statusChipText, band.status === opt.value && styles.statusChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {mgmt.isLeader && (
        <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Guardar cambios</Text>}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e1e1e',
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 8 },
  tabLabel: { color: '#555', fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
  tabIndicator: { height: 2, width: 28, backgroundColor: '#7c3aed', borderRadius: 1 },

  tabContent: { padding: 20, gap: 14 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: '#555', fontSize: 13 },

  inviteBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  inviteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  groupLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  membersList: { gap: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  memberRowMuted: { opacity: 0.5 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22 },
  memberAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  memberNameMuted: { color: '#888', fontSize: 15, fontWeight: '600' },
  memberRole: { color: '#666', fontSize: 13 },
  memberActions: { gap: 6, alignItems: 'flex-end' },
  smallBtn: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallBtnText: { color: '#999', fontSize: 11, fontWeight: '600' },
  smallBtnDanger: {
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.35)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallBtnDangerText: { color: '#ff4444', fontSize: 11, fontWeight: '600' },

  imagesRow: { position: 'relative', marginBottom: 8 },
  coverPicker: {
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1c1c1c',
  },
  coverPickerImg: { width: '100%', height: '100%' },
  coverPickerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverIcon: { fontSize: 22 },
  avatarPicker: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginTop: -36,
    marginLeft: 16,
    borderWidth: 3,
    borderColor: '#000',
    overflow: 'hidden',
  },
  avatarPickerImg: { width: '100%', height: '100%' },
  avatarPickerPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 26 },

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
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#1e1e1e', marginVertical: 2 },

  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  statusChipText: { color: '#666', fontSize: 13 },
  statusChipTextActive: { color: '#fff', fontWeight: '600' },

  saveBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
