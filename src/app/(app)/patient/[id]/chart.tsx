import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PatientNav } from '@/components/layout/PatientNav';
import { SimulationBanner } from '@/components/ui/Disclaimer';
import { SegmentedControl, StatusBadge } from '@/components/ui/primitives';
import { AppHeader, Screen, useLayout } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { LOWER_LEFT, LOWER_RIGHT, UPPER_LEFT, UPPER_RIGHT } from '@/domain/fdi';
import type { Tooth } from '@/domain/models';
import { usePatient } from '@/state/data';
import { radius, space, statusColor, usePalette } from '@/theme';

const SHORT_STATUS = { healthy: 'Healthy', attention: 'Attention', priority: 'Priority', unknown: 'N/A' } as const;

const QUADRANTS = [
  { title: 'Upper right · Q1', teeth: UPPER_RIGHT },
  { title: 'Upper left · Q2', teeth: UPPER_LEFT },
  { title: 'Lower right · Q4', teeth: LOWER_RIGHT },
  { title: 'Lower left · Q3', teeth: LOWER_LEFT },
];

export default function DentalChart() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pt, loading, error, reload } = usePatient(id);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const { width, isWide, gutter } = useLayout();
  const contentW = Math.min(width - (isWide ? 220 : 0), 1120) - gutter * 2;
  const quadW = isWide ? (contentW - space.lg) / 2 : contentW;
  const cols = quadW > 520 ? 4 : quadW > 330 ? 4 : 3;
  const cardW = (quadW - space.sm * (cols - 1)) / cols;

  return (
    <Screen
      header={
        <AppHeader
          back={{ pathname: '/patient/[id]', params: { id } }}
          overline={pt ? `Patient ${pt.code} · ${pt.name}` : 'Patient'}
          title="Dental Chart"
          subtitle="Every tooth · tap to open 3D inspection"
        />
      }>
      <PatientNav current="chart" />
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading || !pt ? (
        !error ? <LoadingState label="Building dental chart…" /> : null
      ) : (
        <>
          <SimulationBanner />
          <SegmentedControl
            options={[
              { value: 'all', label: `All teeth (32)` },
              { value: 'flagged', label: `Flagged (${pt.findings.length})` },
            ]}
            value={filter}
            onChange={setFilter}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
            {QUADRANTS.map((q, qi) => {
              const teeth = q.teeth
                .map((n) => pt.teeth.find((t) => t.toothNumber === n)!)
                .filter((t) => filter === 'all' || t.finding);
              if (!teeth.length) return null;
              return (
                <View key={q.title} style={{ width: quadW, gap: space.sm }}>
                  <Text variant="overline" tone="muted">
                    {q.title}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                    {teeth.map((t, i) => (
                      <Animated.View key={t.toothNumber} entering={FadeInDown.delay(qi * 60 + i * 25).duration(300)} style={{ width: cardW }}>
                        <ChartCard tooth={t} onPress={() => router.push({ pathname: '/patient/[id]/tooth/[tooth]', params: { id: pt.id, tooth: t.toothNumber } })} />
                      </Animated.View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

function ChartCard({ tooth, onPress }: { tooth: Tooth; onPress: () => void }) {
  const p = usePalette();
  const c = statusColor(p, tooth.status);
  const condition = tooth.finding ? tooth.finding.shortTitle : tooth.healthIndex == null ? 'Not assessed' : 'Healthy';
  return (
    <Pressable
      onPress={onPress}
      testID={`chart-${tooth.toothNumber}`}
      accessibilityLabel={`Tooth ${tooth.toothNumber}, ${condition}`}
      style={({ pressed }) => ({
        padding: space.md,
        borderRadius: radius.md,
        backgroundColor: p.surface,
        borderWidth: 1,
        borderColor: tooth.finding ? `${c}66` : p.border,
        borderTopWidth: 3,
        borderTopColor: c,
        gap: 4,
        minHeight: 112,
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <Text variant="h2">{tooth.toothNumber}</Text>
      <Text variant="caption" tone="muted" numberOfLines={2} style={{ minHeight: 32 }}>
        {condition}
      </Text>
      <Text variant="title" style={{ color: c }}>
        {tooth.healthIndex == null ? '—' : `${tooth.healthIndex}/100`}
      </Text>
      <StatusBadge status={tooth.status} size="sm" label={SHORT_STATUS[tooth.status]} />
    </Pressable>
  );
}
