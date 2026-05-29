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
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProfile } from '@/lib/hooks/useProfile';
import { useSession } from '@/lib/hooks/useSession';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { session } = useSession();
  const { signOut } = useAuth();
  const { profile, loading, saving, error, updateProfile } = useProfile(session?.user.id);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState('');
  const [instruments, setInstruments] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
      setGenres(profile.genres?.join(', ') ?? '');
      setInstruments(profile.instruments?.join(', ') ?? '');
    }
  }, [profile]);

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para cambiar la foto.');
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

      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64' as any,
      });

      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, byteArray, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
    } catch (e: any) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploadingAvatar(false);
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
      instruments: instruments ? instruments.split(',').map(i => i.trim()).filter(Boolean) : null,
    });
    if (success) Alert.alert('Perfil guardado');
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
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mi perfil</Text>

        <Pressable style={styles.avatarContainer} onPress={handlePickAvatar} disabled={uploadingAvatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {profile?.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          {uploadingAvatar ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View style={styles.avatarOverlay}>
              <Text style={styles.avatarOverlayText}>Cambiar</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre de usuario</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="@usuario"
            placeholderTextColor="#666"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bio}
            onChangeText={setBio}
            placeholder="Contá algo sobre vos..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Géneros musicales</Text>
          <TextInput
            style={styles.input}
            value={genres}
            onChangeText={setGenres}
            placeholder="Rock, Jazz, Electrónica..."
            placeholderTextColor="#666"
          />
          <Text style={styles.hint}>Separalos con comas</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Instrumentos</Text>
          <TextInput
            style={styles.input}
            value={instruments}
            onChangeText={setInstruments}
            placeholder="Guitarra, Batería, Voz..."
            placeholderTextColor="#666"
          />
          <Text style={styles.hint}>Separalos con comas</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          )}
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  inner: { padding: 24, gap: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  avatarContainer: { alignSelf: 'center', marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlayText: { color: '#fff', fontSize: 12 },
  field: { gap: 6 },
  label: { fontSize: 14, color: '#888', fontWeight: '500' },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
  },
  multiline: { height: 90, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#555' },
  error: { color: '#ff4444', fontSize: 14, textAlign: 'center' },
  saveButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutButtonText: { color: '#666', fontSize: 16 },
});
