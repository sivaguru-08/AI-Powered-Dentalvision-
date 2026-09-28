import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, IconButton, StatusBadge } from '@/components/ui/primitives';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Text } from '@/components/ui/Text';
import { adjacentTooth } from '@/domain/fdi';
import type { Tooth, ToothNumber } from '@/domain/models';
import { space, statusColor, usePalette } from '@/theme';

/** Summary of the tapped tooth with the INSPECT TOOTH call-to-action. */
export function ToothQuickCard({
  patientId,
  tooth,
  onSelect,
}: {
  patientId: string;
  tooth: Tooth | null;
  onSelect: (n: ToothNumber) => void;
}) {
  const p = usePalette();
  if (!tooth) {
    return (
      <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
        <Ionicons name="hand-left-outline" size={26} color={p.primary} />
        <Text variant="h3">Tap any tooth</Text>
        <Text variant="bodySm" tone="muted" align="center">
          Select a tooth on the arch to see its simulated health index and findings.
        </Text>
      </Card>
    );
  }
  const f = tooth.finding;
  const col = statusColor(p, tooth.status);
  return (
    <Animated.View key={tooth.toothNumber} entering={FadeInDown.duration(320)}>
      <Card style={{ gap: space.lg, borderColor: `${col}55` }} testID="tooth-quick-card">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
          <ScoreRing score={tooth.healthIndex} size={92} stroke={8} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="h1" testID="quick-tooth-number">
              Tooth {tooth.toothNumber}
            </Text>
            <Text variant="bodySm" tone="muted">
              {tooth.name}
            </Text>
            <StatusBadge status={tooth.status} />
          </View>
        </View>
        <View style={{ gap: space.sm }}>
          <Row label="Health Index" value={tooth.healthIndex == null ? 'Not assessed' : `${tooth.healthIndex} / 100`} />
          <Row label="Finding" value={f ? f.shortTitle : tooth.healthIndex == null ? '—' : 'No simulated finding'} color={f ? col : undefined} />
          {f ? <Row label="Severity · confidence" value={`${f.severity} · ${Math.round(f.confidence * 100)}%`} /> : null}
          {tooth.note ? <Row label="Note" value={tooth.note} /> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <IconButton icon="chevron-back" accessibilityLabel="Previous tooth" onPress={() => onSelect(adjacentTooth(tooth.toothNumber, -1))} />
          <Button
            label="INSPECT TOOTH"
            icon="cube-outline"
            size="lg"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/patient/[id]/tooth/[tooth]', params: { id: patientId, tooth: tooth.toothNumber } })}
            testID="inspect-tooth"
          />
          <IconButton icon="chevron-forward" accessibilityLabel="Next tooth" onPress={() => onSelect(adjacentTooth(tooth.toothNumber, 1))} />
        </View>
      </Card>
    </Animated.View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: p.border }}>
      <Text variant="bodySm" tone="muted">
        {label}
      </Text>
      <Text variant="title" style={{ color: color ?? p.text, flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}
