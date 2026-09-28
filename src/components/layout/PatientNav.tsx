import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { Text } from '@/components/ui/Text';
import { fonts, radius, space, usePalette } from '@/theme';

export type PatientSection = 'overview' | 'mouth' | 'chart' | 'health' | 'scan' | 'report';

const SECTIONS: { key: PatientSection; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'overview', label: 'Overview', icon: 'person-outline' },
  { key: 'mouth', label: 'Mouth', icon: 'happy-outline' },
  { key: 'chart', label: 'Dental Chart', icon: 'grid-outline' },
  { key: 'health', label: 'Tooth Health', icon: 'pulse-outline' },
  { key: 'scan', label: 'Scan', icon: 'scan-outline' },
  { key: 'report', label: 'Report', icon: 'document-text-outline' },
];

const PATHS = {
  overview: '/patient/[id]',
  mouth: '/patient/[id]/mouth',
  chart: '/patient/[id]/chart',
  health: '/patient/[id]/health',
  scan: '/patient/[id]/scan',
  report: '/patient/[id]/report',
} as const;

export function patientHref(section: PatientSection, id: string) {
  return { pathname: PATHS[section], params: { id } };
}

/**
 * Keeps the patient context while moving between sections: sibling sections
 * replace each other so "back" always returns to where the user came from.
 */
export function PatientNav({ current }: { current: PatientSection }) {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const go = (s: PatientSection) => {
    if (s === current) return;
    const href = patientHref(s, id);
    if (current === 'overview') router.push(href);
    else if (s === 'overview') router.dismissTo(href);
    else router.replace(href);
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}>
      {SECTIONS.map((s) => {
        const active = s.key === current;
        return (
          <Pressable
            key={s.key}
            testID={`pnav-${s.key}`}
            onPress={() => go(s.key)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              height: 34,
              borderRadius: radius.pill,
              backgroundColor: active ? p.primary : p.surface,
              borderWidth: 1,
              borderColor: active ? p.primary : p.border,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Ionicons name={s.icon} size={14} color={active ? '#fff' : p.textMuted} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 12.5, color: active ? '#fff' : p.textMuted }}>{s.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
