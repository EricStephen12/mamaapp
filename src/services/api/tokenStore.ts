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

let _token: string | null = null;
let _user: { id: string; email: string | null; name: string } | null = null;

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
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
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
  },

  async setSession(token: string, user: { id: string; email: string | null; name: string }): Promise<void> {
    _token = token;
    _user = user;
    await storageSet(TOKEN_KEY, token);
    await storageSet(USER_KEY, JSON.stringify(user));
  },

  async clearSession(): Promise<void> {
    _token = null;
    _user = null;
    await storageDelete(TOKEN_KEY);
    await storageDelete(USER_KEY);
  },

  getToken(): string | null {
    return _token;
  },

  getUser(): { id: string; email: string | null; name: string } | null {
    return _user;
  },

  isLoggedIn(): boolean {
    return !!_token;
  },
};
