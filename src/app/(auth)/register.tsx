import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/hooks/useAuth';

const BG = require('../../../assets/images/auth-bg.jpg');

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signUp, loading, error } = useAuth();
  const insets = useSafeAreaInsets();

  async function handleRegister() {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Completá todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      Alert.alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    const success = await signUp(email, password);
    if (success) {
      Alert.alert('¡Registro exitoso!', 'Revisá tu email para confirmar tu cuenta.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    }
  }

  const formContent = (
    <ScrollView
      contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Crear cuenta</Text>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, styles.inputWithIcon]}
          placeholder="Contraseña"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          returnKeyType="next"
        />
        <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)} hitSlop={10}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
        </Pressable>
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, styles.inputWithIcon]}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />
        <Pressable style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)} hitSlop={10}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.ctaBtn} onPress={handleRegister} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.ctaBtnText}>Registrarse</Text>}
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o registrate con</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <Pressable style={styles.socialBtn} onPress={() => Alert.alert('Próximamente', 'Registro con Google.')}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.socialText}>Google</Text>
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={() => Alert.alert('Próximamente', 'Registro con Apple.')}>
          <Ionicons name="logo-apple" size={18} color="#fff" />
          <Text style={styles.socialText}>Apple</Text>
        </Pressable>
      </View>

      <Pressable style={styles.switchRow} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.switchText}>¿Ya tenés cuenta? </Text>
        <Text style={styles.switchLink}>Iniciá sesión</Text>
      </Pressable>
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.brandArea, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.brandTitle}>Artizone</Text>
          <Text style={styles.brandSub}>Tu comunidad musical</Text>
        </View>

        <View style={styles.sheet}>
          <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={50} />
          <View style={[StyleSheet.absoluteFill, styles.sheetTint]} />
          {formContent}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  kav: { flex: 1, justifyContent: 'flex-end' },

  brandArea: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    gap: 6,
  },
  brandTitle: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  form: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },

  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },

  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    paddingHorizontal: 22,
    height: 54,
    color: '#fff',
    fontSize: 15,
  },
  inputWithIcon: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 18, height: 54, justifyContent: 'center' },

  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center', marginTop: -4 },

  ctaBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 28, height: 54,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 0.3 },

  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50, borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  googleIcon: { color: '#fff', fontSize: 16, fontWeight: '700' },
  socialText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 2, paddingBottom: 4 },
  switchText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  switchLink: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
});
