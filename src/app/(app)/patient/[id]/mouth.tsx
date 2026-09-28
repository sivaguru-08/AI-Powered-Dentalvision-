import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DentalArch } from '@/components/dental/DentalArch';
import { ToothQuickCard } from '@/components/dental/ToothQuickCard';
import { PatientNav } from '@/components/layout/PatientNav';
import { SimulationBanner } from '@/components/ui/Disclaimer';
import { Card } from '@/components/ui/primitives';
import { AppHeader, Screen, useLayout } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import type { ToothNumber } from '@/domain/models';
import { usePatient } from '@/state/data';
import { fonts, radius, space, statusColor, usePalette } from '@/theme';

export default function MouthOverview() {
  const p = usePalette();
  const { id, tooth: initial } = useLocalSearchParams<{ id: string; tooth?: string }>();
  const { data: pt, loading, error, reload } = usePatient(id);
  const [selected, setSelected] = useState<ToothNumber | null>(initial ?? null);
  const { width, isWide, gutter } = useLayout();

  const contentW = Math.min(width, 1120) - gutter * 2;
  const archW = isWide ? Math.min(contentW * 0.56, 520) : Math.min(contentW, 460);
  const selTooth = pt?.teeth.find((t) => t.toothNumber === selected) ?? null;

  return (
    <Screen
      header={
        <AppHeader
          back={{ pathname: '/patient/[id]', params: { id } }}
          overline={pt ? `Patient ${pt.code} · ${pt.name}` : 'Patient'}
          title="Dental Mouth Overview"
          subtitle="FDI notation · tap a tooth to inspect"
        />
      }>
      <PatientNav current="mouth" />
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading || !pt ? (
        !error ? <LoadingState label="Mapping teeth…" /> : null
      ) : (
        <>
          <SimulationBanner />
          {pt.findings.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' }}>
              <Text variant="label" tone="muted">
                Flagged:
              </Text>
              {pt.findings.map((f) => (
                <Pressable
                  key={f.toothNumber}
                  onPress={() => setSelected(f.toothNumber)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 10,
                    height: 30,
                    borderRadius: radius.pill,
                    backgroundColor: selected === f.toothNumber ? statusColor(p, f.status) : `${statusColor(p, f.status)}1F`,
                    opacity: pressed ? 0.8 : 1,
                  })}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: selected === f.toothNumber ? '#fff' : statusColor(p, f.status) }}>
                    {f.toothNumber} · {f.shortTitle}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: space.lg, alignItems: isWide ? 'flex-start' : 'stretch' }}>
            <Card style={{ alignItems: 'center', paddingVertical: space.lg, flex: isWide ? 1.2 : undefined }}>
              <Animated.View entering={FadeIn.duration(500)}>
                <DentalArch teeth={pt.teeth} selected={selected} onSelect={setSelected} width={archW - 8} />
              </Animated.View>
              <Legend />
            </Card>
            <View style={{ flex: isWide ? 1 : undefined, gap: space.lg }}>
              <ToothQuickCard patientId={pt.id} tooth={selTooth} onSelect={setSelected} />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

function Legend() {
  const p = usePalette();
  const items = [
    { s: 'healthy', l: 'Healthy' },
    { s: 'attention', l: 'Needs attention' },
    { s: 'priority', l: 'Simulated abnormality' },
    { s: 'unknown', l: 'Not assessed' },
  ] as const;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md, marginTop: space.sm }}>
      {items.map((i) => (
        <View key={i.s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: statusColor(p, i.s) }} />
          <Text variant="caption" tone="muted">
            {i.l}
          </Text>
        </View>
      ))}
    </View>
  );
}
