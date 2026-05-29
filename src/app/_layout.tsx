import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { useSession } from '@/lib/hooks/useSession';

export default function RootLayout() {
  const { session, loading } = useSession();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/map');
    }
  }, [session, loading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
