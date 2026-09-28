import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { type ReactNode } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, space, usePalette } from '@/theme';

import { Disclaimer } from './Disclaimer';
import { Text } from './Text';

export const MAX_WIDTH = 1120;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isWide: width >= 760,
    isXL: width >= 1100,
    gutter: width >= 760 ? space.xxl : space.lg,
  };
}

export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

export function Screen({
  children,
  header,
  scroll = true,
  contentStyle,
  footerDisclaimer = true,
  scrollRef,
  onRefresh,
  refreshing,
  bottomInset = true,
  scrollProps,
}: {
  children: ReactNode;
  header?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footerDisclaimer?: boolean;
  scrollRef?: React.Ref<ScrollView>;
  onRefresh?: () => void;
  refreshing?: boolean;
  bottomInset?: boolean;
  scrollProps?: ScrollViewProps;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { gutter } = useLayout();
  const inner = (
    <View style={[styles.inner, { paddingHorizontal: gutter }, contentStyle]}>
      {children}
      {footerDisclaimer ? <Disclaimer style={{ marginTop: space.lg }} /> : null}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      {header}
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          {...scrollProps}
          contentContainerStyle={{ paddingBottom: (bottomInset ? insets.bottom : 0) + space.xxl, paddingTop: space.md }}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
          }>
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}

export function AppHeader({
  title,
  subtitle,
  back,
  right,
  overline,
}: {
  title: string;
  subtitle?: string;
  overline?: string;
  /** Fallback route when there is no history (deep link / refresh). */
  back?: Href;
  right?: ReactNode;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { gutter } = useLayout();
  return (
    <View
      style={{
        paddingTop: insets.top + space.sm,
        paddingBottom: space.md,
        backgroundColor: p.bg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: p.border,
      }}>
      <View style={[styles.headerRow, { paddingHorizontal: gutter }]}>
        {back ? (
          <Pressable
            testID="header-back"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => goBack(back)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: p.surface, borderColor: p.border, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Ionicons name="chevron-back" size={20} color={p.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {overline ? (
            <Text variant="overline" tone="primary" numberOfLines={1}>
              {overline}
            </Text>
          ) : null}
          <Text variant="h2" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySm" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    gap: space.lg,
  },
  headerRow: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
