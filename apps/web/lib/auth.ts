import { AuthSession } from './types';

const sessionKey = 'atlas-session-v2';

export function saveSession(session: AuthSession) {
  localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function readSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(sessionKey);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    localStorage.removeItem(sessionKey);
    return null;
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') localStorage.removeItem(sessionKey);
}

export function getAccessToken() {
  return readSession()?.accessToken ?? null;
}
