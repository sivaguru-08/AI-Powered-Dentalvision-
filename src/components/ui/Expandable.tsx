import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { radius, space, usePalette } from '@/theme';

import { Card, type IconName } from './primitives';
import { Text } from './Text';

/** Controlled accordion card used for XAI, causes, recommendations and review. */
export function Expandable({
  title,
  subtitle,
  icon,
  iconColor,
  open,
  onToggle,
  children,
  badge,
  testID,
  onLayout,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  iconColor?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  badge?: ReactNode;
  testID?: string;
  onLayout?: (y: number) => void;
}) {
  const p = usePalette();
  const col = iconColor ?? p.primary;
  return (
    <View onLayout={(e) => onLayout?.(e.nativeEvent.layout.y)}>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={title}
          onPress={onToggle}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            padding: space.lg,
            backgroundColor: pressed ? p.surfaceAlt : 'transparent',
          })}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.sm + 2,
              backgroundColor: `${col}1A`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name={icon} size={19} color={col} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="h3">{title}</Text>
            {subtitle ? (
              <Text variant="bodySm" tone="muted" numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {badge}
          <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
            <Ionicons name="chevron-down" size={20} color={p.textMuted} />
          </View>
        </Pressable>
        {open ? (
          <Animated.View
            entering={FadeInDown.duration(280)}
            exiting={FadeOut.duration(120)}
            style={{
              paddingHorizontal: space.lg,
              paddingBottom: space.lg,
              gap: space.lg,
              borderTopWidth: 1,
              borderTopColor: p.border,
              paddingTop: space.lg,
            }}>
            {children}
          </Animated.View>
        ) : null}
      </Card>
    </View>
  );
}
