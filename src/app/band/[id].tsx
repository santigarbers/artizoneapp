import {
  ActivityIndicator,
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
import { useBand } from '@/lib/hooks/useBands';
import { useSession } from '@/lib/hooks/useSession';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HERO_HEIGHT = SCREEN_HEIGHT * 0.4;

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  hiatus: 'En pausa',
  disbanded: 'Disuelta',
};

const ROLE_LABEL: Record<string, string> = {
  leader: 'Líder',
  member: 'Integrante',
  ex_member: 'Ex integrante',
  guest: 'Invitado',
};

export default function BandProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { band, members, loading, error, refetch } = useBand(id);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (error || !band) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? 'Banda no encontrada'}</Text>
        {error && (
          <Pressable onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const myMembership = members.find(m => m.profile_id === session?.user.id);
  const isActiveMember = !!myMembership;
  const genres = band.genres ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── HERO ── */}
        <View style={[styles.hero, { height: HERO_HEIGHT }]}>
          {band.cover_url ? (
            <Image source={{ uri: band.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]} />
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.55)', '#000']}
            locations={[0, 0.28, 0.68, 1]}
            style={StyleSheet.absoluteFill}
          />

          <Pressable
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            hitSlop={14}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.heroInfo}>
            <View style={styles.avatarRing}>
              {band.avatar_url ? (
                <Image source={{ uri: band.avatar_url }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{band.name[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroName}>{band.name}</Text>
            <View style={styles.heroMetaRow}>
              {band.formed_year && <Text style={styles.heroMeta}>Desde {band.formed_year}</Text>}
              {band.city && <Text style={styles.heroMeta}>📍 {band.city}</Text>}
              <Text style={[styles.heroMeta, styles.statusPill]}>{STATUS_LABEL[band.status]}</Text>
            </View>
          </View>
        </View>

        {/* ── BODY ── */}
        <View style={styles.body}>
          {genres.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {genres.map(g => (
                <View key={g} style={styles.chipGenre}>
                  <Text style={styles.chipGenreText}>{g}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {isActiveMember && (
            <Pressable
              style={styles.manageBtn}
              onPress={() => router.push({ pathname: '/band/[id]/manage', params: { id: band.id } })}
            >
              <Text style={styles.manageBtnText}>Gestionar</Text>
            </Pressable>
          )}

          {band.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bio</Text>
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{band.bio}</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Integrantes</Text>
            <View style={styles.membersList}>
              {members.map(m => (
                <Pressable
                  key={m.id}
                  style={styles.memberRow}
                  onPress={() => router.push({ pathname: '/profile/[id]', params: { id: m.profile_id } })}
                >
                  {m.profile?.avatar_url ? (
                    <Image source={{ uri: m.profile.avatar_url }} style={styles.memberAvatar} contentFit="cover" />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberInitial}>
                        {(m.profile?.display_name ?? m.profile?.username)?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.profile?.display_name ?? `@${m.profile?.username}`}</Text>
                    <Text style={styles.memberRole}>
                      {ROLE_LABEL[m.role]}
                      {m.instruments?.length ? ` · ${m.instruments.join(', ')}` : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 16 },
  error: { color: '#ff4444', fontSize: 15, textAlign: 'center' },
  retryButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: { color: '#888', fontSize: 14 },

  hero: { width: '100%', overflow: 'hidden' },
  heroPlaceholder: { backgroundColor: '#1a1a1a' },
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
  heroInfo: { position: 'absolute', bottom: 20, left: 20, right: 20, gap: 8 },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.75)',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  heroName: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  heroMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  statusPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  body: { paddingHorizontal: 16, gap: 24, paddingTop: 20 },

  chipsScroll: { gap: 8, paddingRight: 16 },
  chipGenre: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#111',
  },
  chipGenreText: { color: '#ccc', fontSize: 13 },

  manageBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  manageBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  section: { gap: 12 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  bioCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1c1c1c',
    padding: 16,
  },
  bioText: { color: '#ccc', fontSize: 15, lineHeight: 24 },

  membersList: { gap: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
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
  memberRole: { color: '#666', fontSize: 13 },
});
