import { apiClient } from './client';
import { tokenStore } from './tokenStore';

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
    return result;
  },

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const result = await apiClient<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
    await tokenStore.setSession(result.token, result.user);
    return result;
  },

  async signOut(): Promise<void> {
    await tokenStore.clearSession();
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
};
