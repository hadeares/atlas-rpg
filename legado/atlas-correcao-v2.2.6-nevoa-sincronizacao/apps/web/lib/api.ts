import { clearSession, getAccessToken } from './auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api';

interface ApiOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const authenticated = options.authenticated ?? true;

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (authenticated) {
    const token = getAccessToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    cache: options.cache ?? 'no-store',
    headers
  });

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
    throw new Error(message || 'Não foi possível concluir a operação.');
  }

  return response.json() as Promise<T>;
}
