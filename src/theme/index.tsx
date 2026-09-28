import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { dark, light, type Palette } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  palette: Palette;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(
    () => ({ palette: scheme === 'dark' ? dark : light, preference, setPreference }),
    [scheme, preference]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeState() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeState must be used inside <AppThemeProvider>');
  return ctx;
}

export function usePalette(): Palette {
  return useThemeState().palette;
}

/** Memoised themed StyleSheet factory: `const s = useStyles(makeStyles)`. */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(factory: (p: Palette) => T): T {
  const p = usePalette();
  return useMemo(() => StyleSheet.create(factory(p)), [p, factory]);
}

export * from './tokens';
