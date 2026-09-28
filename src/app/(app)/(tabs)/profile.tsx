import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar } from '@/components/dental/PatientRow';
import { TabHeader } from '@/components/layout/TabHeader';
import { Badge, Button, Card, KeyValue, SectionHeader, SegmentedControl } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { repository } from '@/data';
import { ROLE_LABELS } from '@/data/mock/clinic';
import { useAuth } from '@/state/auth';
import { space, usePalette, useThemeState, type ThemePreference } from '@/theme';

export default function Profile() {
  const p = usePalette();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useThemeState();
  if (!user) return null;
  const permissions: Record<string, string[]> = {
    doctor: ['View dashboard & patients', 'Inspect teeth in 3D', 'View AI findings & XAI', 'Approve / modify / reject findings'],
    admin: ['Hospital statistics', 'Staff roster', 'Recent scans', 'Access patient records & reports'],
    nurse: ['View assigned patients', 'Upload / select scans', 'Run simulated analysis', 'View results (read-only review)'],
  };
  return (
    <Screen header={<TabHeader overline="Account" title="Profile" />}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <Avatar name={user.name} size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="h2">{user.name}</Text>
          <Text variant="bodySm" tone="muted">
            {user.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Badge label={ROLE_LABELS[user.role]} color={p.primary} bg={p.primarySoft} icon="shield-checkmark-outline" size="sm" />
            <Badge label={user.department} color={p.textMuted} bg={p.surfaceAlt} size="sm" />
          </View>
        </View>
      </Card>

      <Card style={{ gap: space.md }}>
        <SectionHeader title="Account" icon="person-outline" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
          <KeyValue label="Email" value={user.email} />
          <KeyValue label="User ID" value={user.id} />
          <KeyValue label="Authentication" value="Simulated (demo)" />
        </View>
      </Card>

      <Card style={{ gap: space.md }}>
        <SectionHeader title="Role permissions" icon="key-outline" />
        {permissions[user.role].map((x) => (
          <Text key={x} variant="body">
            ✓ {x}
          </Text>
        ))}
      </Card>

      <Card style={{ gap: space.md }}>
        <SectionHeader title="Appearance" icon="color-palette-outline" />
        <SegmentedControl<ThemePreference>
          options={[
            { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
            { value: 'light', label: 'Light', icon: 'sunny-outline' },
            { value: 'dark', label: 'Dark', icon: 'moon-outline' },
          ]}
          value={preference}
          onChange={setPreference}
          testIDPrefix="theme"
        />
      </Card>

      <Card style={{ gap: space.md }}>
        <SectionHeader title="Data source" icon="server-outline" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
          <KeyValue label="Repository" value={repository.mode === 'mock' ? 'MockRepository (local)' : 'ApiRepository'} />
          <KeyValue label="AI results" value="Simulated / demo data" />
        </View>
        <Text variant="caption" tone="muted">
          Set EXPO_PUBLIC_DATA_SOURCE=api and EXPO_PUBLIC_API_URL to connect a real backend. See README.
        </Text>
      </Card>

      <Button
        label="Log out"
        variant="danger"
        icon="log-out-outline"
        onPress={() => {
          logout();
          router.replace('/login');
        }}
        testID="logout"
      />
    </Screen>
  );
}
