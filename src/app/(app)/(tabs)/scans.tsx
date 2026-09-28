import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StudyStatusBadge } from '@/components/dental/PatientRow';
import { Radiograph } from '@/components/dental/Radiograph';
import { TabHeader } from '@/components/layout/TabHeader';
import { Card, SectionHeader } from '@/components/ui/primitives';
import { Screen, useLayout } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/state/auth';
import { usePatients, useRecentScans } from '@/state/data';
import { radius, space, usePalette } from '@/theme';
import { relativeDay } from '@/utils/format';

export default function Scans() {
  const p = usePalette();
  const { user } = useAuth();
  const { width, isWide, gutter } = useLayout();
  const scans = useRecentScans();
  const patients = usePatients();
  const list = (scans.data ?? []).filter((s) => {
    if (user?.role !== 'nurse') return true;
    return patients.data?.find((x) => x.id === s.patientId)?.assignedNurse === user.name;
  });
  const colW = isWide ? (Math.min(width - 220, 1120) - gutter * 2 - space.md) / 2 : width - gutter * 2;

  return (
    <Screen header={<TabHeader overline="Imaging studies" title="Scans" />}>
      <Text variant="bodySm" tone="muted">
        Open a study to view the simulated radiograph, AI overlay and findings. {user?.role === 'nurse' ? 'Studies awaiting a scan can be uploaded from here.' : ''}
      </Text>
      {scans.error ? <ErrorState error={scans.error} onRetry={scans.reload} /> : null}
      {scans.loading ? <LoadingState label="Loading studies…" /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {list.map((s, i) => {
          const pt = patients.data?.find((x) => x.id === s.patientId);
          const ready = s.status === 'Analyzed' || s.status === 'Reviewed';
          return (
            <Animated.View key={s.id} entering={FadeInDown.delay(i * 60).duration(350)} style={{ width: colW }}>
              <Card padded={false} onPress={() => router.push({ pathname: '/patient/[id]/scan', params: { id: s.patientId } })} testID={`scan-${s.id}`}>
                <View style={{ borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden', height: colW * 0.36 }}>
                  {s.status === 'Awaiting scan' ? (
                    <View style={{ flex: 1, backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Ionicons name="cloud-upload-outline" size={28} color={p.textFaint} />
                      <Text variant="caption" tone="muted">
                        No scan uploaded yet
                      </Text>
                    </View>
                  ) : (
                    <Radiograph teeth={null} width={colW} overlay="original" />
                  )}
                </View>
                <View style={{ padding: space.lg, gap: space.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
                    <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
                      {s.patientName}
                    </Text>
                    <StudyStatusBadge status={s.status} />
                  </View>
                  <Text variant="caption" tone="muted">
                    {s.id} · {s.scanType} · {relativeDay(s.time)}
                    {ready ? ` · ${s.findings} simulated finding${s.findings === 1 ? '' : 's'}` : ''}
                  </Text>
                  {pt ? (
                    <Text variant="caption" tone="faint">
                      Patient {pt.code} · {pt.doctor}
                    </Text>
                  ) : null}
                </View>
              </Card>
            </Animated.View>
          );
        })}
      </View>
      <Card variant="flat" style={{ gap: space.sm }}>
        <SectionHeader title="Supported study types (pilot)" icon="information-circle-outline" />
        <Text variant="bodySm" tone="muted">
          Panoramic X-ray · CBCT · Intra-oral / bitewing X-ray. The pilot renders simulated images; real DICOM ingestion is planned via POST /scan.
        </Text>
      </Card>
      <Pressable onPress={() => router.push('/patients')}>
        <Text variant="label" tone="primary" align="center">
          Browse patient records →
        </Text>
      </Pressable>
    </Screen>
  );
}
