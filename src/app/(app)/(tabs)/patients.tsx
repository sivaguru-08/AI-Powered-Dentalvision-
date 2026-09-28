import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PatientRow } from '@/components/dental/PatientRow';
import { TabHeader } from '@/components/layout/TabHeader';
import { SegmentedControl } from '@/components/ui/primitives';
import { Screen, useLayout } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/state/auth';
import { usePatients } from '@/state/data';
import { fonts, radius, space, usePalette } from '@/theme';

type Filter = 'all' | 'findings' | 'pending' | 'awaiting';

export default function Patients() {
  const p = usePalette();
  const { user } = useAuth();
  const { isWide } = useLayout();
  const { data, loading, error, reload } = usePatients();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const scoped = (data ?? []).filter((x) => (user?.role === 'nurse' ? x.assignedNurse === user.name : true));
  const list = scoped.filter((x) => {
    const s = q.trim().toLowerCase();
    const matches = !s || x.name.toLowerCase().includes(s) || x.code.includes(s) || x.id.toLowerCase().includes(s);
    if (!matches) return false;
    if (filter === 'findings') return x.affectedTeeth.length > 0 && x.study.status !== 'Awaiting scan';
    if (filter === 'pending') return x.study.status === 'Analyzed';
    if (filter === 'awaiting') return x.study.status === 'Awaiting scan' || x.study.status === 'Uploaded';
    return true;
  });

  return (
    <Screen header={<TabHeader overline={user?.role === 'nurse' ? 'Assigned to you' : 'Patient records'} title={user?.role === 'nurse' ? 'My Patients' : 'Patients'} />}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          height: 48,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          backgroundColor: p.surface,
          borderWidth: 1,
          borderColor: p.border,
        }}>
        <Ionicons name="search" size={18} color={p.textFaint} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or patient ID"
          placeholderTextColor={p.textFaint}
          testID="patient-search"
          style={[{ flex: 1, height: '100%', color: p.text, fontFamily: fonts.medium, fontSize: 15 }, { outlineStyle: 'none' } as object]}
        />
      </View>
      <SegmentedControl
        options={[
          { value: 'all', label: 'All' },
          { value: 'findings', label: 'Findings' },
          { value: 'pending', label: 'To review' },
          { value: 'awaiting', label: 'Awaiting' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Text variant="caption" tone="muted">
        Showing {list.length} demo patient{list.length === 1 ? '' : 's'}
        {user?.role !== 'nurse' ? ' of 248 registered (only demo records are available in the pilot)' : ''}
      </Text>
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading ? <LoadingState label="Loading patients…" /> : null}
      {!loading && list.length === 0 ? (
        <EmptyState icon="people-outline" title="No patients found" message="Try a different search or filter." />
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {list.map((pt, i) => (
          <Animated.View key={pt.id} entering={FadeInDown.delay(i * 50).duration(350)} style={{ width: isWide ? '48.9%' : '100%' }}>
            <PatientRow patient={pt} />
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}
