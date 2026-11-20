import { apiClient } from './client';
import { tokenStore } from './tokenStore';
import { preferencesStore } from '../preferencesStore';
import { pantryService } from './pantryService';
import { savedMealsService } from './savedMealsService';
import { aiMealCache } from './aiMealCache';
import { subscriptionService } from '../subscriptionService';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string | null;
    name: string;
  };
}

export const authService = {
  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    const result = await apiClient<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    await tokenStore.setSession(result.token, result.user);
    subscriptionService.identify(result.user.id).catch(() => {});
    await Promise.all([
      preferencesStore.init(),
      pantryService.fetchAll(),
      savedMealsService.fetchAll(),
    ]).catch(() => {});
    return result;
  },

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const result = await apiClient<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
    await tokenStore.setSession(result.token, result.user);
    subscriptionService.identify(result.user.id).catch(() => {});
    await Promise.all([
      preferencesStore.init(),
      pantryService.fetchAll(),
      savedMealsService.fetchAll(),
    ]).catch(() => {});
    return result;
  },

  async signOut(): Promise<void> {
    await tokenStore.clearSession();
    subscriptionService.reset().catch(() => {});
    await Promise.all([
      preferencesStore.init(),
      pantryService.clearLocalPantry(),
      savedMealsService.clearLocalSavedMeals(),
      aiMealCache.clear(),
    ]).catch(() => {});
  },

  async deleteAccount(): Promise<void> {
    if (tokenStore.isLoggedIn()) {
      try {
        await apiClient('/api/auth/account', {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('[authService] Delete account remote error:', err);
      }
    }
    await tokenStore.clearSession();
    preferencesStore.reset();
    await pantryService.clearLocalPantry();
    await savedMealsService.clearLocalSavedMeals();
    await aiMealCache.clear();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  },

  isLoggedIn(): boolean {
    return tokenStore.isLoggedIn();
  },

  getUser() {
    return tokenStore.getUser();
  },
};
