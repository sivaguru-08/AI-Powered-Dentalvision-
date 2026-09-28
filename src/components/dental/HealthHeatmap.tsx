import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { LOWER_ROW, UPPER_ROW } from '@/domain/fdi';
import type { Tooth, ToothNumber } from '@/domain/models';
import { fonts, radius, scoreColor, space, usePalette } from '@/theme';

/** Two-row heat strip of every tooth's simulated health index. */
export function HealthHeatmap({
  teeth,
  onSelect,
  selected,
}: {
  teeth: Tooth[];
  onSelect?: (n: ToothNumber) => void;
  selected?: ToothNumber | null;
}) {
  const p = usePalette();
  const byNum = new Map(teeth.map((t) => [t.toothNumber, t]));
  const row = (nums: ToothNumber[], label: string) => (
    <View style={{ gap: 4 }}>
      <Text variant="overline" tone="faint">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {nums.map((n, i) => {
          const t = byNum.get(n);
          const score = t?.healthIndex ?? null;
          const c = scoreColor(p, score);
          const sel = selected === n;
          return (
            <Pressable
              key={n}
              testID={`heat-${n}`}
              accessibilityLabel={`Tooth ${n} health ${score ?? 'not assessed'}`}
              onPress={() => onSelect?.(n)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                aspectRatio: 0.62,
                borderRadius: 7,
                backgroundColor: score == null ? p.unknownSoft : `${c}${score >= 85 ? '2E' : score >= 65 ? '55' : '80'}`,
                borderWidth: sel ? 2 : 1,
                borderColor: sel ? p.primary : `${c}66`,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: i === 8 ? 5 : 0,
                opacity: pressed ? 0.75 : 1,
              })}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 9, color: p.textMuted }}>{n}</Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 11.5, color: score == null ? p.textFaint : p.text }}>
                {score ?? '—'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
  return (
    <View style={{ gap: space.md }}>
      {row(UPPER_ROW, 'Upper  ·  18 → 11 | 21 → 28')}
      {row(LOWER_ROW, 'Lower  ·  48 → 41 | 31 → 38')}
      <View style={{ flexDirection: 'row', gap: space.lg, flexWrap: 'wrap' }}>
        {[
          { c: p.healthy, l: '85–100 Healthy' },
          { c: p.attention, l: '65–84 Attention' },
          { c: p.priority, l: '< 65 Priority' },
          { c: p.unknown, l: 'Not assessed' },
        ].map((x) => (
          <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: radius.xs / 2, backgroundColor: x.c }} />
            <Text variant="caption" tone="muted">
              {x.l}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
