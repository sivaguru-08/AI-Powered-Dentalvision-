import { Ionicons } from '@expo/vector-icons';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, usePalette } from '@/theme';

import { Text } from './Text';

export const DISCLAIMER_TEXT =
  'Simulation only — AI findings and health scores shown in this pilot are illustrative and are not medical diagnoses or treatment instructions. Clinical decisions require qualified dental professionals and validated systems.';

export function Disclaimer({ style, tone = 'default' }: { style?: StyleProp<ViewStyle>; tone?: 'default' | 'studio' }) {
  const p = usePalette();
  const studio = tone === 'studio';
  return (
    <View
      accessibilityRole="text"
      style={[
        {
          flexDirection: 'row',
          gap: space.sm,
          padding: space.md,
          borderRadius: radius.md,
          backgroundColor: studio ? 'rgba(155,133,255,0.08)' : p.simulationSoft,
          borderWidth: 1,
          borderColor: studio ? 'rgba(155,133,255,0.2)' : `${p.simulation}26`,
        },
        style,
      ]}>
      <Ionicons name="information-circle-outline" size={16} color={studio ? '#C9BCFF' : p.simulation} style={{ marginTop: 1 }} />
      <Text variant="caption" style={{ flex: 1, color: studio ? '#C9BCFF' : p.simulation, lineHeight: 17 }}>
        {DISCLAIMER_TEXT}
      </Text>
    </View>
  );
}

/** Compact banner for the top of AI result sections. */
export function SimulationBanner({ label = 'SIMULATION / DEMO DATA — NOT A MEDICAL DIAGNOSIS' }: { label?: string }) {
  const p = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: space.md,
        borderRadius: radius.sm,
        backgroundColor: p.simulationSoft,
        borderWidth: 1,
        borderColor: `${p.simulation}33`,
      }}>
      <Ionicons name="flask-outline" size={13} color={p.simulation} />
      <Text variant="overline" style={{ color: p.simulation, letterSpacing: 0.8, fontSize: 10 }} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}
