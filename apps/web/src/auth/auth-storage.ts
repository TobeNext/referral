import type { AuthResponse } from '../api/types';

const SESSION_KEY = 'referral.auth';

export function readAuthSession(): AuthResponse | null {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as AuthResponse : null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthResponse): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getAccessToken(): string | undefined {
  return readAuthSession()?.accessToken;
}
