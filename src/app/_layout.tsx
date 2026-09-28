import '@/global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from '@/state/auth';
import { AppThemeProvider, usePalette } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Harmless third-party notices: R3F still uses THREE.Clock; expo-gl lacks WEBGL_lose_context.
LogBox.ignoreLogs(['THREE.Clock', 'WEBGL_lose_context']);

function RootStack() {
  const p = usePalette();
  const navTheme = p.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: p.bg, card: p.surface } }}>
      <StatusBar style={p.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: p.bg },
        }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
