import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Button, Card, StatusBadge } from '@/components/ui/primitives';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Text } from '@/components/ui/Text';
import type { Patient, StudyStatus } from '@/domain/models';
import { fonts, radius, space, usePalette, type Palette } from '@/theme';
import { initials, relativeDay } from '@/utils/format';

export function studyStatusStyle(p: Palette, s: StudyStatus) {
  switch (s) {
    case 'Reviewed':
      return { color: p.healthy, bg: p.healthySoft, icon: 'checkmark-circle' as const };
    case 'Analyzed':
      return { color: p.primary, bg: p.primarySoft, icon: 'sparkles' as const };
    case 'Uploaded':
      return { color: p.accent, bg: p.accentSoft, icon: 'cloud-done-outline' as const };
    case 'Analyzing':
      return { color: p.simulation, bg: p.simulationSoft, icon: 'hourglass-outline' as const };
    default:
      return { color: p.textMuted, bg: p.unknownSoft, icon: 'time-outline' as const };
  }
}

export function StudyStatusBadge({ status }: { status: StudyStatus }) {
  const p = usePalette();
  const s = studyStatusStyle(p, status);
  return <Badge label={status} color={s.color} bg={s.bg} icon={s.icon} size="sm" />;
}

export function Avatar({ name, size = 44, color }: { name: string; size?: number; color?: string }) {
  const p = usePalette();
  const c = color ?? p.primary;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.8,
        backgroundColor: `${c}1F`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontFamily: fonts.heading, fontSize: size * 0.36, color: c }}>{initials(name)}</Text>
    </View>
  );
}

export function PatientRow({ patient, compact }: { patient: Patient; compact?: boolean }) {
  const p = usePalette();
  const analyzed = patient.study.status === 'Analyzed' || patient.study.status === 'Reviewed';
  const open = () => router.push({ pathname: '/patient/[id]', params: { id: patient.id } });
  return (
    <Card onPress={open} testID={`patient-${patient.code}`} style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Avatar name={patient.name} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text variant="title" numberOfLines={1}>
              Patient {patient.code}
            </Text>
            <Text variant="bodySm" tone="muted" numberOfLines={1}>
              {patient.name}
            </Text>
          </View>
          <Text variant="bodySm" tone="muted" numberOfLines={1}>
            Age {patient.age} · {patient.gender} · {patient.study.scanType}
          </Text>
        </View>
        {!compact && analyzed ? <ScoreRing score={patient.dentalHealthIndex} size={52} stroke={5} sublabel="" /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
        <StudyStatusBadge status={patient.study.status} />
        {analyzed ? (
          <StatusBadge
            status={patient.counts.priority ? 'priority' : patient.affectedTeeth.length ? 'attention' : 'healthy'}
            label={`Findings: ${patient.affectedTeeth.length}`}
            size="sm"
          />
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={p.textFaint} />
          <Text variant="caption" tone="faint">
            {relativeDay(patient.study.date)}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Button label="Open" size="sm" iconRight="arrow-forward" onPress={open} testID={`open-patient-${patient.code}`} />
      </View>
      {!compact && analyzed && patient.affectedTeeth.length ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            flexWrap: 'wrap',
            paddingTop: space.sm,
            borderTopWidth: 1,
            borderTopColor: p.border,
          }}>
          <Text variant="caption" tone="muted">
            Affected teeth:
          </Text>
          {patient.affectedTeeth.map((t) => (
            <View key={t} style={{ paddingHorizontal: 7, paddingVertical: 1, borderRadius: radius.xs, backgroundColor: p.surfaceAlt }}>
              <Text variant="caption">{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
