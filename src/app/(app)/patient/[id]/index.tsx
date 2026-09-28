import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar, StudyStatusBadge } from '@/components/dental/PatientRow';
import { PatientNav, patientHref } from '@/components/layout/PatientNav';
import { SimulationBanner } from '@/components/ui/Disclaimer';
import { Button, Card, KeyValue, SectionHeader, StatusBadge, type IconName } from '@/components/ui/primitives';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { AppHeader, Screen, useLayout } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { usePatient } from '@/state/data';
import { radius, space, statusColor, usePalette } from '@/theme';
import { formatDate } from '@/utils/format';

export default function PatientProfile() {
  const p = usePalette();
  const { isWide } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pt, loading, error, reload } = usePatient(id);
  const analyzed = pt && (pt.study.status === 'Analyzed' || pt.study.status === 'Reviewed');

  return (
    <Screen
      header={
        <AppHeader
          back="/patients"
          overline="Patient profile"
          title={pt ? `Patient ${pt.code}` : 'Patient'}
          subtitle={pt?.name}
          right={pt ? <StudyStatusBadge status={pt.study.status} /> : null}
        />
      }>
      <PatientNav current="overview" />
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading || !pt ? (
        !error ? <LoadingState label="Loading patient record…" /> : null
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card style={{ gap: space.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                <Avatar name={pt.name} size={60} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="h2">{pt.name}</Text>
                  <Text variant="bodySm" tone="muted">
                    ID {pt.id} · {pt.scenario}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg, columnGap: space.lg }}>
                <KeyValue label="Patient ID" value={pt.id} />
                <KeyValue label="Age" value={`${pt.age} years`} />
                <KeyValue label="Gender" value={pt.gender} />
                <KeyValue label="Study date" value={formatDate(pt.study.date)} />
                <KeyValue label="Scan type" value={pt.study.scanType} />
                <KeyValue label="Doctor" value={pt.doctor} />
                <KeyValue label="Status" value={<StudyStatusBadge status={pt.study.status} />} />
                <KeyValue label="Study ID" value={pt.study.id} />
              </View>
            </Card>
          </Animated.View>

          {!analyzed ? (
            <Card>
              <EmptyState
                icon="cloud-upload-outline"
                title={pt.study.status === 'Uploaded' ? 'Scan uploaded — ready to analyse' : 'Awaiting scan'}
                message="Upload or select a simulated scan, then run the AI analysis to generate the dental overview."
                action={
                  <Button
                    label={pt.study.status === 'Uploaded' ? 'Analyze scan' : 'Upload / select scan'}
                    icon="scan-outline"
                    onPress={() => router.push(patientHref('scan', pt.id))}
                    testID="goto-scan"
                  />
                }
              />
            </Card>
          ) : (
            <>
              <SimulationBanner />
              <Animated.View entering={FadeInDown.delay(80).duration(400)}>
                <Card style={{ gap: space.lg }}>
                  <SectionHeader title="Overall Dental Health" subtitle="Demo Dental Health Index — simulated" icon="pulse-outline" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl, flexWrap: 'wrap' }}>
                    <ScoreRing score={pt.dentalHealthIndex} size={136} stroke={12} />
                    <View style={{ flex: 1, minWidth: 200, gap: space.sm }}>
                      <CountRow label="Healthy teeth" value={pt.counts.healthy} color={statusColor(p, 'healthy')} icon="checkmark-circle" />
                      <CountRow label="Needs attention" value={pt.counts.attention} color={statusColor(p, 'attention')} icon="alert-circle" />
                      <CountRow label="Critical / priority" value={pt.counts.priority} color={statusColor(p, 'priority')} icon="warning" />
                      {pt.counts.unknown ? (
                        <CountRow label="Not assessed" value={pt.counts.unknown} color={statusColor(p, 'unknown')} icon="remove-circle" />
                      ) : null}
                    </View>
                  </View>
                </Card>
              </Animated.View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
                {(
                  [
                    ['mouth', 'View Mouth', 'Interactive dental arch', 'happy-outline'],
                    ['scan', 'View Scan', 'Radiograph & AI overlay', 'scan-outline'],
                    ['chart', 'View Dental Chart', 'All 32 teeth', 'grid-outline'],
                    ['report', 'View Report', 'Clinical summary', 'document-text-outline'],
                  ] as const
                ).map(([key, title, sub, icon], i) => (
                  <Animated.View key={key} entering={FadeInDown.delay(140 + i * 60).duration(400)} style={{ flexGrow: 1, flexBasis: isWide ? 200 : 150 }}>
                    <ActionTile title={title} subtitle={sub} icon={icon} primary={key === 'mouth'} onPress={() => router.push(patientHref(key, pt.id))} testID={`action-${key}`} />
                  </Animated.View>
                ))}
              </View>

              <Card style={{ gap: space.md }}>
                <SectionHeader
                  title="Simulated AI findings"
                  subtitle={`${pt.findings.length} flagged tooth${pt.findings.length === 1 ? '' : ' teeth'}`}
                  icon="sparkles-outline"
                  action={<Button label="Tooth health" variant="ghost" size="sm" iconRight="chevron-forward" onPress={() => router.push(patientHref('health', pt.id))} />}
                />
                {pt.findings.length === 0 ? (
                  <Text variant="bodySm" tone="muted">
                    No simulated findings for this study.
                  </Text>
                ) : (
                  pt.findings.map((f) => (
                    <Pressable
                      key={f.findingId}
                      testID={`finding-${f.toothNumber}`}
                      onPress={() => router.push({ pathname: '/patient/[id]/tooth/[tooth]', params: { id: pt.id, tooth: f.toothNumber } })}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.md,
                        padding: space.md,
                        borderRadius: radius.md,
                        backgroundColor: pressed ? p.surfaceAlt : p.bg,
                        borderWidth: 1,
                        borderColor: p.border,
                      })}>
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${statusColor(p, f.status)}22`, alignItems: 'center', justifyContent: 'center' }}>
                        <Text variant="h3" style={{ color: statusColor(p, f.status) }}>
                          {f.toothNumber}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text variant="title" numberOfLines={1}>
                          {f.title}
                        </Text>
                        <Text variant="caption" tone="muted" numberOfLines={1}>
                          {f.toothName} · {f.severity} · {Math.round(f.confidence * 100)}% sim. confidence
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text variant="title">{f.healthIndex}/100</Text>
                        <StatusBadge status={f.status} size="sm" />
                      </View>
                    </Pressable>
                  ))
                )}
              </Card>
            </>
          )}

          <Card variant="flat" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
            <KeyValue label="Assigned nurse" value={pt.assignedNurse} />
            <KeyValue label="Phone" value={pt.phone} />
            <KeyValue label="Blood group" value={pt.bloodGroup} />
            <KeyValue label="Last visit" value={formatDate(pt.lastVisit)} />
          </Card>
        </>
      )}
    </Screen>
  );
}

function CountRow({ label, value, color, icon }: { label: string; value: number; color: string; icon: IconName }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: p.border }}>
      <Ionicons name={icon} size={18} color={color} />
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="h3">{value}</Text>
    </View>
  );
}

function ActionTile({
  title,
  subtitle,
  icon,
  onPress,
  primary,
  testID,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
  primary?: boolean;
  testID?: string;
}) {
  const p = usePalette();
  return (
    <Card onPress={onPress} testID={testID} style={[{ gap: space.md, minHeight: 118 }, primary ? { backgroundColor: p.primary, borderColor: p.primary } : null]}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          backgroundColor: primary ? 'rgba(255,255,255,0.18)' : p.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name={icon} size={20} color={primary ? '#fff' : p.primary} />
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="title" style={primary ? { color: '#fff' } : undefined}>
          {title}
        </Text>
        <Text variant="caption" style={{ color: primary ? 'rgba(255,255,255,0.8)' : p.textMuted }}>
          {subtitle}
        </Text>
      </View>
    </Card>
  );
}
