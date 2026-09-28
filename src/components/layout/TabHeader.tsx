import { type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/dental/PatientRow';
import { LogoMark } from '@/components/ui/Logo';
import { SimulationBadge } from '@/components/ui/primitives';
import { MAX_WIDTH, useLayout } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/state/auth';
import { space, usePalette } from '@/theme';

/** Large title header used on the main tab screens. */
export function TabHeader({ overline, title, right }: { overline?: string; title: string; right?: ReactNode }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { gutter, isWide } = useLayout();
  const { user } = useAuth();
  return (
    <View style={{ paddingTop: insets.top + space.md, paddingBottom: space.sm, backgroundColor: p.bg }}>
      <View style={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: gutter, gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28} />
            <Text variant="h3">
              DentalVision <Text variant="h3" tone="primary">3D</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            {isWide ? <SimulationBadge label="SIMULATION MODE" /> : <SimulationBadge label="DEMO" />}
            {user ? <Avatar name={user.name} size={34} /> : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            {overline ? (
              <Text variant="bodySm" tone="muted">
                {overline}
              </Text>
            ) : null}
            <Text variant="h1">{title}</Text>
          </View>
          {right}
        </View>
      </View>
    </View>
  );
}
