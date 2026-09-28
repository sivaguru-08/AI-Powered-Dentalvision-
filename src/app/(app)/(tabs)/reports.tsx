import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StudyStatusBadge } from '@/components/dental/PatientRow';
import { TabHeader } from '@/components/layout/TabHeader';
import { Button, Card } from '@/components/ui/primitives';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/state/auth';
import { usePatients } from '@/state/data';
import { space, usePalette } from '@/theme';
import { formatDate } from '@/utils/format';

export default function Reports() {
  const p = usePalette();
  const { user } = useAuth();
  const { data, loading, error, reload } = usePatients();
  const list = (data ?? []).filter(
    (x) =>
      (x.study.status === 'Analyzed' || x.study.status === 'Reviewed') &&
      (user?.role === 'nurse' ? x.assignedNurse === user.name : true)
  );
  return (
    <Screen header={<TabHeader overline="DentalVision 3D assessments" title="Reports" />}>
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading ? <LoadingState label="Loading reports…" /> : null}
      {!loading && list.length === 0 ? <EmptyState icon="document-text-outline" title="No reports yet" message="Reports appear once a study has been analysed." /> : null}
      {list.map((pt, i) => (
        <Animated.View key={pt.id} entering={FadeInDown.delay(i * 60).duration(350)}>
          <Card onPress={() => router.push({ pathname: '/patient/[id]/report', params: { id: pt.id } })} testID={`report-${pt.code}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: p.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="document-text-outline" size={21} color={p.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text variant="title" numberOfLines={1}>
                  Assessment · Patient {pt.code}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {pt.name} · {pt.study.scanType} · {formatDate(pt.study.date)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                  <StudyStatusBadge status={pt.study.status} />
                </View>
              </View>
              <ScoreRing score={pt.dentalHealthIndex} size={50} stroke={5} sublabel="" />
            </View>
          </Card>
        </Animated.View>
      ))}
      {list.length ? (
        <Button label="Open latest report" variant="secondary" icon="open-outline" onPress={() => router.push({ pathname: '/patient/[id]/report', params: { id: list[0].id } })} />
      ) : null}
    </Screen>
  );
}
