import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLayout } from '@/components/ui/Screen';
import { useAuth } from '@/state/auth';
import { fonts, space, usePalette } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName, active: IconName) =>
  function TabBarIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? active : name} color={color as string} size={size - 2} />;
  };

export default function TabsLayout() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const { user } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isWide ? 'left' : 'bottom',
        tabBarVariant: isWide ? 'material' : 'uikit',
        tabBarActiveTintColor: p.primary,
        tabBarInactiveTintColor: p.textFaint,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: isWide
          ? { backgroundColor: p.surface, borderRightColor: p.border, width: 220, paddingTop: insets.top + space.lg }
          : {
              backgroundColor: p.surface,
              borderTopColor: p.border,
              height: 62 + insets.bottom,
              paddingTop: 6,
              paddingBottom: insets.bottom + 6,
            },
        tabBarLabelPosition: isWide ? 'beside-icon' : 'below-icon',
        tabBarItemStyle: isWide ? { borderRadius: 12, marginHorizontal: 10, marginVertical: 2, justifyContent: 'flex-start' } : undefined,
        tabBarActiveBackgroundColor: isWide ? p.primarySoft : undefined,
        sceneStyle: { backgroundColor: p.bg },
        animation: 'shift',
      }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: icon('grid-outline', 'grid'), tabBarButtonTestID: 'tab-dashboard' }} />
      <Tabs.Screen name="patients" options={{ title: user?.role === 'nurse' ? 'My Patients' : 'Patients', tabBarIcon: icon('people-outline', 'people'), tabBarButtonTestID: 'tab-patients' }} />
      <Tabs.Screen name="scans" options={{ title: 'Scans', tabBarIcon: icon('scan-outline', 'scan'), tabBarButtonTestID: 'tab-scans' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: icon('document-text-outline', 'document-text'), tabBarButtonTestID: 'tab-reports' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-circle-outline', 'person-circle'), tabBarButtonTestID: 'tab-profile' }} />
    </Tabs>
  );
}
