import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

export const TOOTH_PATH =
  'M20,8 C26,4 31,6 34,9 C37,6 42,4 48,8 C54,12 54,24 50,32 C48,37 47,44 45,54 C44,58 40,58 39,54 L36,41 C35,37.5 33,37.5 32,41 L29,54 C28,58 24,58 23,54 C21,44 20,37 18,32 C14,24 14,12 20,8 Z';

/** Static brand mark: stylised molar in a gradient tile. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 68 68">
      <Defs>
        <LinearGradient id="lm-bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1F7BFF" />
          <Stop offset="1" stopColor="#12B5B0" />
        </LinearGradient>
      </Defs>
      <Path d="M16,0 H52 A16,16 0 0 1 68,16 V52 A16,16 0 0 1 52,68 H16 A16,16 0 0 1 0,52 V16 A16,16 0 0 1 16,0 Z" fill="url(#lm-bg)" />
      <Path d={TOOTH_PATH} fill="#FFFFFF" fillOpacity={0.95} transform="translate(0 3)" />
      <Ellipse cx={34} cy={36} rx={27} ry={8} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.6} fill="none" transform="rotate(-18 34 36)" />
    </Svg>
  );
}

/** Animated hero mark used on the splash screen. */
export function AnimatedLogo({ size = 150 }: { size?: number }) {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [spin, pulse]);
  const orbit = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const orbit2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${-spin.value * 240 + 40}deg` }] }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.4, transform: [{ scale: 0.9 + pulse.value * 0.15 }] }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size,
            backgroundColor: 'rgba(56,150,255,0.25)',
            boxShadow: '0px 0px 60px 20px rgba(56,150,255,0.35)',
          },
          glow,
        ]}
      />
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, orbit]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Ellipse cx={50} cy={50} rx={47} ry={18} stroke="#5FD4FF" strokeOpacity={0.7} strokeWidth={0.8} fill="none" />
          <Circle cx={97} cy={50} r={2.2} fill="#5FD4FF" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, orbit2]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Ellipse cx={50} cy={50} rx={44} ry={24} stroke="#8FB8FF" strokeOpacity={0.4} strokeWidth={0.6} fill="none" strokeDasharray="2 3" />
          <Circle cx={6} cy={50} r={1.6} fill="#B9D2FF" />
        </Svg>
      </Animated.View>
      <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 68 64">
        <Defs>
          <LinearGradient id="al-tooth" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#BFD9FF" />
          </LinearGradient>
        </Defs>
        <Path d={TOOTH_PATH} fill="url(#al-tooth)" />
        <Path d="M22,16 C26,13 30,14 32,17" stroke="#FFFFFF" strokeWidth={1.4} strokeOpacity={0.9} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
