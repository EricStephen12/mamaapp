/**
 * Bank-grade Secure Token Store
 * Uses hardware-backed Keychain (iOS) & Keystore / EncryptedSharedPreferences (Android) via Expo SecureStore.
 * Keeps JWT in memory for zero-overhead synchronous reads during active session.
 * Falls back to localStorage on Web.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'mama_auth_jwt_token';
const USER_KEY = 'mama_auth_user_profile';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string;
}

let _token: string | null = null;
let _user: AuthUser | null = null;
const _listeners = new Set<(user: AuthUser | null) => void>();

function notifyListeners() {
  _listeners.forEach((fn) => fn(_user));
}

function sanitizeScopeId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {}
    return;
  }
  try {
    const options = Platform.OS === 'ios'
      ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
      : undefined;
    await SecureStore.setItemAsync(key, value, options);
  } catch (err) {
    console.warn('[tokenStore] SecureStore write error:', err);
  }
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn('[tokenStore] SecureStore read error:', err);
    return null;
  }
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn('[tokenStore] SecureStore delete error:', err);
  }
}

export const tokenStore = {
  async init(): Promise<void> {
    try {
      _token = await storageGet(TOKEN_KEY);
      const rawUser = await storageGet(USER_KEY);
      _user = rawUser ? JSON.parse(rawUser) : null;
    } catch {
      _token = null;
      _user = null;
    }
    notifyListeners();
  },

  async setSession(token: string, user: AuthUser): Promise<void> {
    _token = token;
    _user = user;
    notifyListeners();
    await storageSet(TOKEN_KEY, token);
    await storageSet(USER_KEY, JSON.stringify(user));
  },

  async clearSession(): Promise<void> {
    _token = null;
    _user = null;
    notifyListeners();
    await storageDelete(TOKEN_KEY);
    await storageDelete(USER_KEY);
  },

  getToken(): string | null {
    return _token;
  },

  getUser(): AuthUser | null {
    return _user;
  },

  isLoggedIn(): boolean {
    return !!_token && !!_user;
  },

  /**
   * Returns a safe per-user storage namespace ('user_<id>' or 'guest')
   * so each user has their own isolated local data bank on the device.
   */
  getActiveScope(): string {
    if (_user?.id) {
      return `user_${sanitizeScopeId(_user.id)}`;
    }
    return 'guest';
  },

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  },
};
