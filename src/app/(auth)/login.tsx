import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  LayoutAnimation,
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { signIn, signInWithGoogle, loading, error } = useAuth();
  const insets = useSafeAreaInsets();


  async function handleLogin() {
    if (!email || !password) return;
    const success = await signIn(email, password);
    if (success) router.replace('/(tabs)/discover');
  }

  const formContent = (
    <ScrollView
      contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Iniciar sesión</Text>

      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          onFocus={() => { LayoutAnimation.configureNext({ duration: 300, update: { type: LayoutAnimation.Types.keyboard } }); setFocusedInput('email'); }}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, styles.inputWithIcon, focusedInput === 'password' && styles.inputFocused]}
          placeholder="Contraseña"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          onFocus={() => { LayoutAnimation.configureNext({ duration: 300, update: { type: LayoutAnimation.Types.keyboard } }); setFocusedInput('password'); }}
          onBlur={() => setFocusedInput(null)}
        />
        <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)} hitSlop={10}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
        </Pressable>
      </View>

      <View style={styles.rememberRow}>
        <Pressable style={styles.rememberLeft} onPress={() => setRememberMe(v => !v)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
            {rememberMe && <Ionicons name="checkmark" size={11} color="#fff" />}
          </View>
          <Text style={styles.rememberText}>Recordarme</Text>
        </Pressable>
        <Pressable onPress={() => Alert.alert('Próximamente', 'Recuperación de contraseña.')}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.ctaBtn} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.ctaBtnText}>Iniciar sesión</Text>}
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o continuar con</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <Pressable style={styles.socialBtn} onPress={signInWithGoogle} disabled={loading}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.socialText}>Google</Text>
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={() => Alert.alert('Próximamente', 'Login con Apple.')}>
          <Ionicons name="logo-apple" size={18} color="#fff" />
          <Text style={styles.socialText}>Apple</Text>
        </Pressable>
      </View>

      <Pressable style={styles.switchRow} onPress={() => router.replace('/(auth)/register')}>
        <Text style={styles.switchText}>¿Nuevo en Artizone? </Text>
        <Text style={styles.switchLink}>Creá tu cuenta</Text>
      </Pressable>
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {/* Gradiente: oscuro arriba donde está el branding, transparente abajo donde está el BlurView */}
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Branding flotando sobre la foto */}
        <View style={[styles.brandArea, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.brandTitle}>Artizone</Text>
          <Text style={styles.brandSub}>Tu comunidad musical</Text>
        </View>

        <View style={styles.sheet}>
          {/* La misma foto borroneada con CIFilter — funciona en cualquier iOS */}
          <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={50} />
          {/* Tint oscuro encima del blur */}
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
  inputFocused: { borderColor: '#7c3aed' },
  eyeBtn: { position: 'absolute', right: 18, height: 54, justifyContent: 'center' },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  rememberText: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  forgotText: { color: '#a78bfa', fontSize: 13 },

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
