/**
 * Secure API Client
 * - Automatically attaches Bearer JWT to every request
 * - Handles 401 (session expired → clears token)
 * - Parses structured error messages from the server
 */
import { tokenStore } from './tokenStore';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
  skipAuth?: boolean;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, skipAuth = false, ...rest } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    url += `?${query}`;
  }

  // Attach auth header automatically
  const authHeaders: Record<string, string> = {};
  if (!skipAuth) {
    const token = tokenStore.getToken();
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(headers as Record<string, string>),
    },
    ...rest,
  });

  // Session expired — clear the token so app redirects to login
  if (response.status === 401) {
    await tokenStore.clearSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(errorBody.error || errorBody.message || `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
