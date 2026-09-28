import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

import { space, usePalette } from '@/theme';

import { Button, type IconName } from './primitives';
import { Text } from './Text';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const p = usePalette();
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: space.md }}>
      <Animated.View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          borderWidth: 3,
          borderColor: p.primarySoft,
          borderTopColor: p.primary,
          transform: [{ rotate }],
        }}
      />
      <Text variant="bodySm" tone="muted">
        {label}
      </Text>
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const p = usePalette();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, gap: space.md, paddingHorizontal: space.xl }}>
      <Ionicons name="alert-circle-outline" size={36} color={p.priority} />
      <Text variant="h3" align="center">
        Something went wrong
      </Text>
      <Text variant="bodySm" tone="muted" align="center">
        {error.message}
      </Text>
      {onRetry ? <Button label="Try again" icon="refresh" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const p = usePalette();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, gap: space.sm, paddingHorizontal: space.xl }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 22,
          backgroundColor: p.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.sm,
        }}>
        <Ionicons name={icon} size={28} color={p.textFaint} />
      </View>
      <Text variant="h3" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="bodySm" tone="muted" align="center">
          {message}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
