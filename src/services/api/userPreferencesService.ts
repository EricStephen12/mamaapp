/**
 * User Preferences Service — syncs KitchenPass to Neon DB
 */
import { apiClient } from './client';
import { tokenStore } from './tokenStore';
import { UserKitchenPass } from '../preferencesStore';

export const userPreferencesService = {
  async syncToDb(pass: UserKitchenPass): Promise<void> {
    if (!tokenStore.isLoggedIn()) return;
    try {
      await apiClient('/api/user/preferences', {
        method: 'POST',
        body: JSON.stringify({
          country: pass.country,
          countryName: pass.countryName,
          currencyCode: pass.currencyCode,
          currencySymbol: pass.currencySymbol,
          weeklyBudget: pass.weeklyBudget,
          spentThisWeek: pass.spentThisWeek,
          cuisineAnchor: pass.cuisineAnchor,
          cuisineLabel: pass.cuisineLabel,
          cookingGear: pass.cookingGear,
          cookingGearLabel: pass.cookingGearLabel,
          timeLimitMinutes: pass.timeLimitMinutes,
          timeLimitLabel: pass.timeLimitLabel,
          stapleBase: pass.stapleBase,
          stapleBaseLabel: pass.stapleBaseLabel,
          spiceLevel: pass.spiceLevel,
          dietaryRestrictions: pass.dietaryRestrictions,
        }),
      });
    } catch {
      // Offline or unauthenticated — already saved locally
    }
  },

  async fetchFromDb(): Promise<Partial<UserKitchenPass> | null> {
    if (!tokenStore.isLoggedIn()) return null;
    try {
      const data = await apiClient<any>('/api/user/preferences');
      if (!data || !data.id) return null;
      const profile = data.tasteProfile;
      const raw: Partial<UserKitchenPass> = {
        ...(data.country ? { country: data.country } : {}),
        ...(data.countryName ? { countryName: data.countryName } : {}),
        ...(data.currencyCode ? { currencyCode: data.currencyCode } : {}),
        ...(data.currencySymbol ? { currencySymbol: data.currencySymbol } : {}),
        ...(typeof data.weeklyBudget === 'number' ? { weeklyBudget: data.weeklyBudget } : {}),
        ...(typeof data.spentThisWeek === 'number' ? { spentThisWeek: data.spentThisWeek } : {}),
        ...(profile?.cuisineAnchor ? { cuisineAnchor: profile.cuisineAnchor } : {}),
        ...(profile?.cuisineLabel ? { cuisineLabel: profile.cuisineLabel } : {}),
        ...(profile?.cookingGear ? { cookingGear: profile.cookingGear } : {}),
        ...(profile?.cookingGearLabel ? { cookingGearLabel: profile.cookingGearLabel } : {}),
        ...(typeof profile?.timeLimitMinutes === 'number' ? { timeLimitMinutes: profile.timeLimitMinutes } : {}),
        ...(profile?.timeLimitLabel ? { timeLimitLabel: profile.timeLimitLabel } : {}),
        ...(profile?.stapleBase ? { stapleBase: profile.stapleBase } : {}),
        ...(profile?.stapleBaseLabel ? { stapleBaseLabel: profile.stapleBaseLabel } : {}),
        ...(profile?.spiceLevel ? { spiceLevel: profile.spiceLevel } : {}),
        ...(Array.isArray(profile?.dietaryRestrictions) ? { dietaryRestrictions: profile.dietaryRestrictions } : {}),
      };
      return raw;
    } catch {
      return null;
    }
  },
};
