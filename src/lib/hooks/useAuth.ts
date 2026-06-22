import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = 'artizoneapp://';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(email: string, password: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
    return !error;
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
    return !error;
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) { setError(error.message); return false; }

      const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
      if (result.type !== 'success') return false;

      // implicit flow: tokens come in the URL fragment (#access_token=...&refresh_token=...)
      const fragment = result.url.includes('#')
        ? result.url.split('#')[1]
        : result.url.split('?')[1] ?? '';
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token) { setError('No se recibió token de acceso'); return false; }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token ?? '',
      });
      if (sessionError) { setError(sessionError.message); return false; }
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión con Google');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { signUp, signIn, signInWithGoogle, signOut, loading, error };
}
