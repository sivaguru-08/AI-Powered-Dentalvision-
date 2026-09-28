import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { ToothStatus } from '@/domain/models';
import { statusLabel } from '@/domain/health';
import { fonts, radius, space, statusColor, statusSoft, usePalette } from '@/theme';

import { Text } from './Text';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ------------------------------------------------------------------ Card

export function Card({
  children,
  style,
  padded = true,
  onPress,
  variant = 'default',
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'flat' | 'studio';
  testID?: string;
}) {
  const p = usePalette();
  const base: ViewStyle = {
    backgroundColor: variant === 'studio' ? p.studioAlt : variant === 'flat' ? p.surfaceAlt : p.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: variant === 'studio' ? p.studioBorder : p.border,
    padding: padded ? space.lg : 0,
    boxShadow:
      variant === 'default'
        ? p.scheme === 'light'
          ? '0px 1px 2px rgba(11,26,44,0.04), 0px 8px 24px rgba(11,26,44,0.05)'
          : '0px 8px 24px rgba(0,0,0,0.25)'
        : undefined,
  };
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => [base, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }, style]}>
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[base, style]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------- Button

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'studio';

export function Button({
  label,
  onPress,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  full,
  testID,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  iconRight?: IconName;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
  testID?: string;
}) {
  const p = usePalette();
  const colors: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: p.primary, fg: p.primaryText, border: p.primary },
    secondary: { bg: p.surface, fg: p.text, border: p.borderStrong },
    ghost: { bg: 'transparent', fg: p.primary, border: 'transparent' },
    danger: { bg: p.prioritySoft, fg: p.priority, border: p.prioritySoft },
    success: { bg: p.healthy, fg: '#fff', border: p.healthy },
    studio: { bg: 'rgba(255,255,255,0.08)', fg: p.studioText, border: p.studioBorder },
  };
  const c = colors[variant];
  const h = size === 'sm' ? 34 : size === 'lg' ? 52 : 44;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: h,
          paddingHorizontal: size === 'sm' ? space.md : space.lg,
          borderRadius: size === 'lg' ? radius.md : radius.sm,
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: full ? 'stretch' : undefined,
        },
        variant === 'primary' && !disabled
          ? { boxShadow: `0px 6px 16px ${p.primary}40` }
          : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={c.fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={c.fg} /> : null}
          <Text
            style={{
              color: c.fg,
              fontFamily: fonts.semibold,
              fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14,
            }}>
            {label}
          </Text>
          {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 15 : 18} color={c.fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  tone = 'default',
  size = 40,
  active,
  accessibilityLabel,
  testID,
}: {
  icon: IconName;
  onPress?: () => void;
  tone?: 'default' | 'studio';
  size?: number;
  active?: boolean;
  accessibilityLabel: string;
  testID?: string;
}) {
  const p = usePalette();
  const studio = tone === 'studio';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2.6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active
          ? p.primary
          : studio
            ? 'rgba(255,255,255,0.08)'
            : p.surface,
        borderWidth: 1,
        borderColor: active ? p.primary : studio ? p.studioBorder : p.border,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Ionicons
        name={icon}
        size={size * 0.46}
        color={active ? '#fff' : studio ? p.studioText : p.text}
      />
    </Pressable>
  );
}

// ------------------------------------------------------------ Badges

export function Badge({
  label,
  color,
  bg,
  icon,
  size = 'md',
}: {
  label: string;
  color: string;
  bg: string;
  icon?: IconName;
  size?: 'sm' | 'md';
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: bg,
        paddingHorizontal: size === 'sm' ? 7 : 9,
        paddingVertical: size === 'sm' ? 2 : 4,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
      }}>
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 11 : 12} color={color} /> : null}
      <Text style={{ color, fontFamily: fonts.semibold, fontSize: size === 'sm' ? 10.5 : 11.5 }}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status, label, size }: { status: ToothStatus; label?: string; size?: 'sm' | 'md' }) {
  const p = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: statusSoft(p, status),
        paddingHorizontal: size === 'sm' ? 7 : 9,
        paddingVertical: size === 'sm' ? 2 : 4,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
      }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor(p, status) }} />
      <Text
        style={{
          color: statusColor(p, status),
          fontFamily: fonts.semibold,
          fontSize: size === 'sm' ? 10.5 : 11.5,
        }}>
        {label ?? statusLabel(status)}
      </Text>
    </View>
  );
}

export function SimulationBadge({ label = 'SIMULATION', tone = 'default' }: { label?: string; tone?: 'default' | 'studio' }) {
  const p = usePalette();
  return (
    <Badge
      label={label}
      icon="flask-outline"
      color={tone === 'studio' ? '#C9BCFF' : p.simulation}
      bg={tone === 'studio' ? 'rgba(155,133,255,0.16)' : p.simulationSoft}
      size="sm"
    />
  );
}

// ---------------------------------------------------- SegmentedControl

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  tone = 'default',
  scrollable,
  testIDPrefix,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  tone?: 'default' | 'studio';
  scrollable?: boolean;
  testIDPrefix?: string;
}) {
  const p = usePalette();
  const studio = tone === 'studio';
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: studio ? 'rgba(255,255,255,0.06)' : p.surfaceAlt,
        borderRadius: radius.md,
        padding: 3,
        borderWidth: 1,
        borderColor: studio ? p.studioBorder : p.border,
        flexWrap: scrollable ? 'nowrap' : 'nowrap',
      }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={testIDPrefix ? `${testIDPrefix}-${o.value}` : undefined}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              paddingVertical: 8,
              paddingHorizontal: 6,
              borderRadius: radius.sm + 1,
              backgroundColor: active ? (studio ? p.primary : p.surface) : 'transparent',
              boxShadow: active && !studio ? '0px 1px 3px rgba(11,26,44,0.12)' : undefined,
            }}>
            {o.icon ? (
              <Ionicons
                name={o.icon}
                size={14}
                color={active ? (studio ? '#fff' : p.primary) : studio ? p.studioMuted : p.textMuted}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.semibold,
                fontSize: 12.5,
                color: active ? (studio ? '#fff' : p.text) : studio ? p.studioMuted : p.textMuted,
              }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// --------------------------------------------------------- ProgressBar

export function ProgressBar({
  value,
  max = 100,
  color,
  height = 8,
  track,
}: {
  value: number;
  max?: number;
  color: string;
  height?: number;
  track?: string;
}) {
  const p = usePalette();
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track ?? p.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function MetricBar({
  label,
  value,
  color,
  suffix = '',
  max = 100,
  tone = 'default',
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
  max?: number;
  tone?: 'default' | 'studio';
}) {
  const p = usePalette();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="bodySm" tone={tone === 'studio' ? 'studioMuted' : 'muted'}>
          {label}
        </Text>
        <Text variant="label" tone={tone === 'studio' ? 'studio' : 'default'}>
          {Math.round(value)}
          {suffix}
        </Text>
      </View>
      <ProgressBar
        value={value}
        max={max}
        color={color}
        height={7}
        track={tone === 'studio' ? 'rgba(255,255,255,0.08)' : p.surfaceAlt}
      />
    </View>
  );
}

// ----------------------------------------------------------- StatTile

export function StatTile({
  label,
  value,
  icon,
  color,
  hint,
  onPress,
  testID,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  color: string;
  hint?: string;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <Card style={{ flex: 1, minWidth: 140, gap: space.sm }} onPress={onPress} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            backgroundColor: `${color}1F`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        {hint ? (
          <Text variant="caption" tone="faint">
            {hint}
          </Text>
        ) : null}
      </View>
      <Text variant="metric">{value}</Text>
      <Text variant="bodySm" tone="muted">
        {label}
      </Text>
    </Card>
  );
}

// ------------------------------------------------------ SectionHeader

export function SectionHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Ionicons name={icon} size={17} color={p.primary} /> : null}
          <Text variant="h3">{title}</Text>
        </View>
        {subtitle ? (
          <Text variant="bodySm" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function Divider({ tone = 'default', spacing = space.md }: { tone?: 'default' | 'studio'; spacing?: number }) {
  const p = usePalette();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth * 2,
        backgroundColor: tone === 'studio' ? p.studioBorder : p.border,
        marginVertical: spacing,
      }}
    />
  );
}

export function KeyValue({ label, value, tone = 'default' }: { label: string; value: ReactNode; tone?: 'default' | 'studio' }) {
  return (
    <View style={{ gap: 2, minWidth: 120, flex: 1 }}>
      <Text variant="overline" tone={tone === 'studio' ? 'studioMuted' : 'faint'}>
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text variant="title" tone={tone === 'studio' ? 'studio' : 'default'}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}
