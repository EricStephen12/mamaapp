/**
 * Secure API Client
 * - Automatically attaches Bearer JWT to every request
 * - Handles 401 (session expired → clears token)
 * - Parses structured error messages from the server
 */
import { tokenStore } from './tokenStore';

const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://mama-backend-0k9s.onrender.com'
).replace(/\/$/, '');

export function wakeBackendServer(): void {
  fetch(`${BASE_URL}/api/health`).catch(() => {});
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
  skipAuth?: boolean;
  /** Abort the request after this many ms (default 28s to survive Render cold starts) */
  timeoutMs?: number;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, skipAuth = false, timeoutMs = 28000, ...rest } = options;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(headers as Record<string, string>),
      },
      ...rest,
    });
    clearTimeout(timeoutId);

    // Session error handling — only throw session expired for authenticated requests
    if (response.status === 401 && !skipAuth) {
      throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as { error?: string; message?: string };
      throw new Error(errorBody.error || errorBody.message || `Error ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw error;
  }
}
