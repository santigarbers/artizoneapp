import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoCarousel } from '@/components/features/VideoCarousel';
import { INSTRUMENT_CONFIG } from '@/constants/instruments';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProfile } from '@/lib/hooks/useProfile';
import { useSession } from '@/lib/hooks/useSession';
import { useVideos } from '@/lib/hooks/useVideos';
import { supabase } from '@/lib/supabase';

const INSTRUMENT_LIST = Object.keys(INSTRUMENT_CONFIG);
const AVAILABILITY_OPTIONS = ['Mañanas', 'Tardes', 'Fines de semana', 'Flexible'];
const BIO_MAX = 150;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { signOut } = useAuth();
  const { profile, loading, saving, error, updateProfile } = useProfile(session?.user.id);
  const { videos, addVideo } = useVideos(session?.user.id);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [genres, setGenres] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [city, setCity] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
      setSelectedInstruments(profile.instruments ?? []);
      setGenres(profile.genres?.join(', ') ?? '');
      setLookingFor(profile.looking_for ?? '');
    }
  }, [profile]);

  function toggleInstrument(inst: string) {
    setSelectedInstruments(prev =>
      prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
    );
  }

  function toggleAvailability(av: string) {
    setAvailability(prev =>
      prev.includes(av) ? prev.filter(a => a !== av) : [...prev, av]
    );
  }

  async function handleGetLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu ubicación.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      setCity(geo?.city ?? geo?.district ?? geo?.subregion ?? '');
      await supabase.from('profiles')
        .update({ location: `POINT(${longitude} ${latitude})` })
        .eq('id', session!.user.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLocating(false);
    }
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
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = `${session!.user.id}/avatar.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' as any });
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, byteArray, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
    } catch (e: any) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handlePickVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingVideo(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'mp4';
      const path = `${session!.user.id}/${Date.now()}.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' as any });
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(path, byteArray, { contentType: `video/${ext}`, upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('videos').getPublicUrl(path);
      await addVideo(data.publicUrl);
    } catch (e: any) {
      Alert.alert('Error al subir el video', e.message);
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleSave() {
    if (!username.trim()) {
      Alert.alert('El nombre de usuario es obligatorio');
      return;
    }
    const success = await updateProfile({
      username: username.trim(),
      bio: bio.trim() || null,
      genres: genres ? genres.split(',').map(g => g.trim()).filter(Boolean) : null,
      instruments: selectedInstruments.length > 0 ? selectedInstruments : null,
      looking_for: lookingFor.trim() || null,
    });
    if (success) Alert.alert('Perfil guardado ✓');
  }

  async function handleLogout() {
    await signOut();
    router.replace('/(auth)/login');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['rgba(124,58,237,0.22)', 'rgba(109,40,217,0.10)', 'rgba(76,29,149,0.05)', 'transparent']}
        locations={[0, 0.3, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickAvatar} disabled={uploadingAvatar} style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {profile?.username?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarSpinner}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.plusBtn}>
              {uploadingAvatar
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.plusIcon}>+</Text>
              }
            </View>
          </Pressable>
        </View>

        {/* ── Nombre de usuario ── */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>NOMBRE DE USUARIO</Text>
          <TextInput
            style={styles.fieldInput}
            value={username}
            onChangeText={setUsername}
            placeholder="p. ej. Alex Turner"
            placeholderTextColor="#3a3a3a"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* ── Bio corta ── */}
        <View style={styles.card}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>BIO CORTA</Text>
            <Text style={styles.charCount}>{bio.length}/{BIO_MAX}</Text>
          </View>
          <TextInput
            style={[styles.fieldInput, styles.multilineInput]}
            value={bio}
            onChangeText={t => setBio(t.slice(0, BIO_MAX))}
            placeholder="Guitarrista busca un baterista para tocar jazz..."
            placeholderTextColor="#3a3a3a"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={BIO_MAX}
          />
        </View>

        {/* ── Instrumentos ── */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>INSTRUMENTOS</Text>
          <View style={styles.chipGrid}>
            {INSTRUMENT_LIST.map(inst => {
              const selected = selectedInstruments.includes(inst);
              const cfg = INSTRUMENT_CONFIG[inst];
              return (
                <Pressable
                  key={inst}
                  style={[
                    styles.chip,
                    selected && { backgroundColor: `${cfg.color}22`, borderColor: `${cfg.color}77` },
                  ]}
                  onPress={() => toggleInstrument(inst)}
                >
                  <Text style={styles.chipEmoji}>{cfg.icon}</Text>
                  <Text style={[styles.chipText, selected && { color: cfg.color, fontWeight: '600' }]}>
                    {inst}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Géneros ── */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>GÉNEROS MUSICALES</Text>
          <TextInput
            style={styles.fieldInput}
            value={genres}
            onChangeText={setGenres}
            placeholder="Rock, Jazz, Electrónica..."
            placeholderTextColor="#3a3a3a"
          />
          <Text style={styles.hint}>Separalos con comas</Text>
        </View>

        {/* ── Ubicación y Disponibilidad ── */}
        <Text style={styles.sectionHeader}>📍  Ubicación y Disponibilidad</Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>CIUDAD / ÁREA</Text>
          <View style={styles.locationRow}>
            <TextInput
              style={[styles.fieldInput, styles.locationInput]}
              value={city}
              onChangeText={setCity}
              placeholder="Ingresa tu ciudad"
              placeholderTextColor="#3a3a3a"
            />
            <Pressable
              style={[styles.locationBtn, locating && { opacity: 0.6 }]}
              onPress={handleGetLocation}
              disabled={locating}
            >
              {locating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.locationBtnText}>CERCANO A MÍ</Text>
              }
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>¿CUÁNDO ESTÁS DISPONIBLE?</Text>
          <View style={styles.chipRow}>
            {AVAILABILITY_OPTIONS.map(av => {
              const selected = availability.includes(av);
              return (
                <Pressable
                  key={av}
                  style={[styles.chip, selected && styles.chipPurple]}
                  onPress={() => toggleAvailability(av)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextPurple]}>{av}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Qué buscás ── */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>¿QUÉ BUSCÁS?</Text>
          <TextInput
            style={[styles.fieldInput, styles.multilineInput]}
            value={lookingFor}
            onChangeText={setLookingFor}
            placeholder="Busco banda para tocar en vivo, jam sessions de jazz, grabar un EP..."
            placeholderTextColor="#3a3a3a"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── Video ── */}
        {videos.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>MIS VIDEOS</Text>
            <VideoCarousel videos={videos} />
            <Pressable
              style={styles.addMoreVideo}
              onPress={handlePickVideo}
              disabled={uploadingVideo}
            >
              {uploadingVideo
                ? <ActivityIndicator color="#7c3aed" />
                : <Text style={styles.addMoreVideoText}>+ Agregar otro video</Text>
              }
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.videoCard}
            onPress={handlePickVideo}
            disabled={uploadingVideo}
          >
            {uploadingVideo ? (
              <ActivityIndicator color="#7c3aed" size="large" />
            ) : (
              <>
                <View style={styles.videoIconCircle}>
                  <Text style={styles.videoIcon}>🎬</Text>
                </View>
                <Text style={styles.videoCardTitle}>Agregar un video</Text>
                <Text style={styles.videoCardSubtitle}>Enlaza tu mejor canción</Text>
              </>
            )}
          </Pressable>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {/* ── Guardar ── */}
        <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.saveBtnText}>Guardar cambios</Text>
          }
        </Pressable>

        {/* ── Logout ── */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  inner: { paddingHorizontal: 20, gap: 14 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 8 },
  avatarWrapper: { position: 'relative', width: 96, height: 96 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: 'rgba(124,58,237,0.75)',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 38, fontWeight: 'bold' },
  avatarSpinner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#000',
  },
  plusIcon: { color: '#fff', fontSize: 18, lineHeight: 20, fontWeight: '300' },

  // Cards
  card: {
    backgroundColor: '#0d0d0d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1c1c1c',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  fieldLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: { color: '#444', fontSize: 11 },
  fieldInput: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 2,
  },
  multilineInput: { minHeight: 72 },
  hint: { color: '#3a3a3a', fontSize: 12 },

  // Chip grid (instruments)
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#111',
  },
  chipPurple: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chipEmoji: { fontSize: 13 },
  chipText: { color: '#666', fontSize: 13 },
  chipTextPurple: { color: '#fff', fontWeight: '600' },

  // Section header
  sectionHeader: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 2,
  },

  // Location row
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationInput: { flex: 1 },
  locationBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minWidth: 40,
    alignItems: 'center',
  },
  locationBtnText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#1e1e1e', marginVertical: 2 },

  // Video card
  videoCard: {
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#080808',
  },
  videoIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: { fontSize: 24 },
  videoCardTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  videoCardSubtitle: { color: '#555', fontSize: 13 },
  addMoreVideo: { alignItems: 'center', paddingTop: 8 },
  addMoreVideoText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },

  // Error
  error: { color: '#ff4444', fontSize: 13, textAlign: 'center' },

  // Save
  saveBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },

  // Logout
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#444', fontSize: 15 },
});
