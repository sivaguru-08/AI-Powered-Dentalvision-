import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/ui/Field';
import { AnimatedLogo, LogoMark } from '@/components/ui/Logo';
import { Button, SegmentedControl, SimulationBadge } from '@/components/ui/primitives';
import { useLayout } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { DEMO_USERS, ROLE_LABELS } from '@/data/mock/clinic';
import type { Role } from '@/domain/models';
import { useAuth } from '@/state/auth';
import { fonts, radius, space, usePalette } from '@/theme';

const ROLE_OPTIONS: { value: Role; label: string; icon: 'medkit-outline' | 'business-outline' | 'heart-outline' }[] = [
  { value: 'doctor', label: 'Doctor', icon: 'medkit-outline' },
  { value: 'admin', label: 'Admin', icon: 'business-outline' },
  { value: 'nurse', label: 'Nurse', icon: 'heart-outline' },
];

export default function Login() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('doctor');
  const [email, setEmail] = useState('doctor@demo.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pwRef = useRef<TextInput>(null);

  const selectRole = (r: Role) => {
    setRole(r);
    const demo = DEMO_USERS.find((u) => u.role === r)!;
    setEmail(demo.email);
    setPassword('demo123');
    setError(null);
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password, role);
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const hero = (
    <View style={{ gap: space.lg, alignItems: isWide ? 'flex-start' : 'center' }}>
      {isWide ? <AnimatedLogo size={140} /> : <LogoMark size={56} />}
      <View style={{ gap: 6, alignItems: isWide ? 'flex-start' : 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: isWide ? 40 : 30, letterSpacing: -1, color: '#fff' }}>
          DentalVision <Text style={{ fontFamily: fonts.display, fontSize: isWide ? 40 : 30, color: '#5FD4FF' }}>3D</Text>
        </Text>
        <Text style={{ fontFamily: fonts.medium, fontSize: 14.5, color: 'rgba(226,236,250,0.78)', textAlign: isWide ? 'left' : 'center' }}>
          Explainable AI-Powered Dental Intelligence
        </Text>
      </View>
      {isWide ? (
        <View style={{ gap: space.md, marginTop: space.lg }}>
          {[
            ['cube-outline', 'Interactive 360° tooth inspection'],
            ['sparkles-outline', 'Explainable AI findings with visual evidence'],
            ['shield-checkmark-outline', 'Clinician-in-the-loop review workflow'],
          ].map(([icon, label]) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={styles.featureIcon}>
                <Ionicons name={icon as 'cube-outline'} size={18} color="#8FC4FF" />
              </View>
              <Text style={{ fontFamily: fonts.medium, fontSize: 14.5, color: 'rgba(234,241,251,0.9)' }}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  const form = (
    <Animated.View
      entering={FadeInUp.duration(500)}
      style={{
        backgroundColor: p.surface,
        borderRadius: radius.xl,
        padding: space.xl,
        gap: space.lg,
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: p.border,
        boxShadow: '0px 20px 60px rgba(5, 15, 35, 0.25)',
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 2 }}>
          <Text variant="h2">Welcome back</Text>
          <Text variant="bodySm" tone="muted">
            Sign in to the clinical workspace
          </Text>
        </View>
        <SimulationBadge label="SIMULATION MODE" />
      </View>

      <View style={{ gap: 6 }}>
        <Text variant="label" tone="muted">
          Role
        </Text>
        <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={selectRole} testIDPrefix="role" />
      </View>
      <Field
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => pwRef.current?.focus()}
        testID="login-email"
      />
      <Field
        ref={pwRef}
        label="Password"
        icon="lock-closed-outline"
        secure
        value={password}
        onChangeText={setPassword}
        returnKeyType="go"
        onSubmitEditing={submit}
        testID="login-password"
      />
      {error ? (
        <View style={{ flexDirection: 'row', gap: 8, padding: space.md, borderRadius: radius.sm, backgroundColor: p.prioritySoft }}>
          <Ionicons name="alert-circle" size={16} color={p.priority} />
          <Text variant="bodySm" style={{ color: p.priority, flex: 1 }} testID="login-error">
            {error}
          </Text>
        </View>
      ) : null}
      <Button label="LOGIN" size="lg" icon="log-in-outline" onPress={submit} loading={loading} full testID="login-submit" />

      <View style={{ gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: p.surfaceAlt, borderWidth: 1, borderColor: p.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="key-outline" size={14} color={p.textMuted} />
          <Text variant="label" tone="muted">
            Demo credentials · password demo123
          </Text>
        </View>
        {DEMO_USERS.map((u) => (
          <Pressable
            key={u.email}
            onPress={() => selectRole(u.role)}
            style={({ pressed }) => ({ flexDirection: 'row', justifyContent: 'space-between', opacity: pressed ? 0.6 : 1 })}>
            <Text variant="bodySm" tone="muted">
              {ROLE_LABELS[u.role]}
            </Text>
            <Text variant="bodySm" style={{ fontFamily: fonts.semibold, color: role === u.role ? p.primary : p.text }}>
              {u.email}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text variant="caption" tone="faint" align="center">
        Simulated authentication for demonstration. Not for clinical use.
      </Text>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <LinearGradient
        colors={p.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={isWide ? StyleSheet.absoluteFill : { position: 'absolute', left: 0, right: 0, top: 0, height: 330 }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + (isWide ? space.xxxl : space.xxl),
            paddingBottom: insets.bottom + space.xxl,
            paddingHorizontal: space.lg,
            justifyContent: 'center',
          }}>
          {isWide ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 64, maxWidth: 1040, width: '100%', alignSelf: 'center' }}>
              <View style={{ flex: 1 }}>{hero}</View>
              <View style={{ flex: 1 }}>{form}</View>
            </View>
          ) : (
            <View style={{ gap: space.xxl }}>
              <Animated.View entering={FadeInDown.duration(500)}>{hero}</Animated.View>
              {form}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(95,160,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(143,184,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
