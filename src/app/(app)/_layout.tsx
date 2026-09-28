import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/state/auth';
import { usePalette } from '@/theme';

/** Authenticated area: redirects to login when there is no (simulated) session. */
export default function AppLayout() {
  const { user } = useAuth();
  const p = usePalette();
  if (!user) return <Redirect href="/login" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: p.bg },
      }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="patient/[id]/tooth/[tooth]" options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="analyze/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
