/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiRequest } from '../api/client';
import type { AuthResponse, AuthUser } from '../api/types';
import { clearAuthSession, readAuthSession, writeAuthSession } from './auth-storage';

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  establishSession: (response: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readAuthSession();
  const [user, setUser] = useState<AuthUser | null>(initial?.user ?? null);
  const [ready, setReady] = useState(!initial);

  function logout() {
    clearAuthSession();
    setUser(null);
    setReady(true);
  }

  function establishSession(response: AuthResponse) {
    writeAuthSession(response);
    setUser(response.user);
    setReady(true);
  }

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    if (initial) {
      apiRequest<AuthUser>('/auth/me')
        .then((verified) => {
          establishSession({ ...initial, user: verified });
        })
        .catch(() => logout());
    }
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
    // The initial session is intentionally read once at provider mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AuthContext.Provider value={{ user, ready, establishSession, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
