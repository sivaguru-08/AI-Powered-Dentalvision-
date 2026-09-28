import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { repository } from '@/data';
import type { Role, User } from '@/domain/models';

interface AuthState {
  user: User | null;
  login: (email: string, password: string, role: Role) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const SESSION_KEY = 'dv3d.demo-session';

/** On web the demo session survives a page refresh; native keeps it in memory. */
const webSession = {
  read(): User | null {
    if (Platform.OS !== 'web') return null;
    try {
      const raw = globalThis.sessionStorage?.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
  write(u: User | null) {
    if (Platform.OS !== 'web') return;
    try {
      if (u) globalThis.sessionStorage?.setItem(SESSION_KEY, JSON.stringify(u));
      else globalThis.sessionStorage?.removeItem(SESSION_KEY);
    } catch {
      // storage unavailable (private mode) — session stays in memory
    }
  },
};

/** Simulated session. Replace with secure token storage for production. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => webSession.read());

  const login = useCallback(async (email: string, password: string, role: Role) => {
    const u = await repository.login(email, password, role);
    webSession.write(u);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    webSession.write(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
