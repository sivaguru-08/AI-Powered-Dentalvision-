import { View } from 'react-native';

import { fonts, radius, space, usePalette } from '@/theme';

import { Text } from './Text';

/** Minimal vertical bar chart built from Views (no chart dependency). */
export function BarChart({
  data,
  height = 120,
  color,
  highlightIndex,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  highlightIndex?: number;
}) {
  const p = usePalette();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, height: height + 34 }}>
      {data.map((d, i) => {
        const hl = i === highlightIndex;
        return (
          <View key={d.label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: hl ? p.text : p.textMuted }}>{d.value}</Text>
            <View
              style={{
                width: '70%',
                maxWidth: 34,
                height: Math.max(4, (d.value / max) * height),
                borderRadius: radius.xs,
                backgroundColor: hl ? (color ?? p.primary) : `${color ?? p.primary}40`,
              }}
            />
            <Text style={{ fontFamily: fonts.medium, fontSize: 10.5, color: p.textFaint }}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Horizontal labelled bars. */
export function HBarList({ data }: { data: { label: string; value: number; color: string }[] }) {
  const p = usePalette();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: space.md }}>
      {data.map((d) => (
        <View key={d.label} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: p.textMuted }}>{d.label}</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: p.text }}>{d.value}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: p.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${(d.value / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: d.color }} />
          </View>
        </View>
      ))}
    </View>
  );
}
