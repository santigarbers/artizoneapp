import { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateBand } from '@/lib/hooks/useBands';
import { useSession } from '@/lib/hooks/useSession';

export default function NewBandScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { createBand, creating } = useCreateBand(session?.user.id);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState('');
  const [formedYear, setFormedYear] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);

  async function pickImage(setter: (uri: string) => void, aspect: [number, number]) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Ponele un nombre a la banda');
      return;
    }
    const year = formedYear.trim() ? parseInt(formedYear.trim(), 10) : null;
    const { bandId, error } = await createBand(
      {
        name,
        bio,
        genres: genres ? genres.split(',').map(g => g.trim()).filter(Boolean) : null,
        formed_year: year && !isNaN(year) ? year : null,
        city,
        neighborhood,
      },
      avatarUri ?? undefined,
      coverUri ?? undefined
    );
    if (error || !bandId) {
      Alert.alert('Error', error ?? 'No se pudo crear la banda');
      return;
    }
    router.replace({ pathname: '/band/[id]', params: { id: bandId } });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={14}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Nueva banda</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Cover + avatar */}
        <Pressable style={styles.coverWrapper} onPress={() => pickImage(setCoverUri, [16, 9])}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImg} contentFit="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverIcon}>🖼️</Text>
              <Text style={styles.coverHint}>Portada (opcional)</Text>
            </View>
          )}
        </Pressable>

        <Pressable style={styles.avatarWrapper} onPress={() => pickImage(setAvatarUri, [1, 1])}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>🎸</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Text style={styles.avatarEditIcon}>+</Text>
          </View>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>NOMBRE DE LA BANDA</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="p. ej. Los Fantasmas"
            placeholderTextColor="#3a3a3a"
            maxLength={60}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>BIO</Text>
          <TextInput
            style={[styles.fieldInput, styles.multilineInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Contá de qué se trata la banda..."
            placeholderTextColor="#3a3a3a"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>GÉNEROS</Text>
          <TextInput
            style={styles.fieldInput}
            value={genres}
            onChangeText={setGenres}
            placeholder="Rock, Jazz, Electrónica..."
            placeholderTextColor="#3a3a3a"
          />
          <Text style={styles.hint}>Separalos con comas</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>AÑO DE FORMACIÓN</Text>
          <TextInput
            style={styles.fieldInput}
            value={formedYear}
            onChangeText={setFormedYear}
            placeholder="p. ej. 2019"
            placeholderTextColor="#3a3a3a"
            keyboardType="number-pad"
            maxLength={4}
          />

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>CIUDAD</Text>
          <TextInput
            style={styles.fieldInput}
            value={city}
            onChangeText={setCity}
            placeholder="p. ej. Buenos Aires"
            placeholderTextColor="#3a3a3a"
          />

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>BARRIO</Text>
          <TextInput
            style={styles.fieldInput}
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder="p. ej. Palermo"
            placeholderTextColor="#3a3a3a"
          />
        </View>

        <Pressable
          style={[styles.createBtn, (creating || !name.trim()) && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={creating || !name.trim()}
        >
          {creating
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.createBtnText}>Crear banda</Text>
          }
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  inner: { paddingHorizontal: 20, gap: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },

  coverWrapper: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1c1c1c',
  },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  coverIcon: { fontSize: 24 },
  coverHint: { color: '#444', fontSize: 12 },

  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginTop: -42,
    marginLeft: 16,
    borderWidth: 3,
    borderColor: '#000',
    position: 'relative',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 39 },
  avatarPlaceholder: {
    flex: 1,
    borderRadius: 39,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 30 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarEditIcon: { color: '#fff', fontSize: 16, lineHeight: 18, fontWeight: '300' },

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
  fieldInput: { color: '#fff', fontSize: 16, paddingVertical: 2 },
  multilineInput: { minHeight: 72 },
  hint: { color: '#3a3a3a', fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#1e1e1e', marginVertical: 2 },

  createBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  createBtnDisabled: { opacity: 0.35 },
  createBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
