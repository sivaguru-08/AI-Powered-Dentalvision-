import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { AnimatedLogo } from '@/components/ui/Logo';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/state/auth';
import { fonts, usePalette } from '@/theme';

const SPLASH_MS = 2600;

export default function Splash() {
  const p = usePalette();
  const { user } = useAuth();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: SPLASH_MS - 200, easing: Easing.inOut(Easing.cubic) });
    const t = setTimeout(() => router.replace(user ? '/dashboard' : '/login'), SPLASH_MS);
    return () => clearTimeout(t);
  }, [user, progress]);

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={{ flex: 1 }} testID="splash">
      <LinearGradient colors={p.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: `${(i + 1) * 10}%` }]} />
        ))}
      </View>
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(700)}>
          <AnimatedLogo size={170} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(250).duration(700)} style={{ alignItems: 'center', gap: 10, marginTop: 18 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 38, letterSpacing: -1, color: '#FFFFFF' }}>
            DentalVision <Text style={{ fontFamily: fonts.display, fontSize: 38, color: '#5FD4FF' }}>3D</Text>
          </Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: 'rgba(226,236,250,0.8)', textAlign: 'center' }}>
            Explainable AI-Powered Dental Intelligence
          </Text>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(600).duration(600)} style={styles.footer}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, bar]} />
        </View>
        <Text style={{ fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1.6, color: 'rgba(201,188,255,0.9)' }}>
          SIMULATION MODE · DEMO DATA ONLY
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  footer: { position: 'absolute', bottom: 56, left: 0, right: 0, alignItems: 'center', gap: 14 },
  track: { width: 180, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2, backgroundColor: '#5FD4FF' },
  grid: { ...StyleSheet.absoluteFill, opacity: 0.35 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(143,184,255,0.18)' },
});
