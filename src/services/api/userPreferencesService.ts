/**
 * User Preferences Service — syncs KitchenPass to Neon DB
 */
import { apiClient } from './client';
import { UserKitchenPass } from '../preferencesStore';

export const userPreferencesService = {
  async syncToDb(pass: UserKitchenPass): Promise<void> {
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
    } catch (e) {
      console.warn('[userPreferencesService] syncToDb error:', e);
    }
  },

  async fetchFromDb(): Promise<Partial<UserKitchenPass> | null> {
    try {
      const data = await apiClient<any>('/api/user/preferences');
      if (!data || !data.id) return null;
      const profile = data.tasteProfile;
      return {
        country: data.country,
        countryName: data.countryName,
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
        weeklyBudget: data.weeklyBudget,
        spentThisWeek: data.spentThisWeek,
        cuisineAnchor: profile?.cuisineAnchor,
        cuisineLabel: profile?.cuisineLabel,
        cookingGear: profile?.cookingGear,
        cookingGearLabel: profile?.cookingGearLabel,
        timeLimitMinutes: profile?.timeLimitMinutes,
        timeLimitLabel: profile?.timeLimitLabel,
        stapleBase: profile?.stapleBase,
        stapleBaseLabel: profile?.stapleBaseLabel,
        spiceLevel: profile?.spiceLevel,
        dietaryRestrictions: profile?.dietaryRestrictions,
      };
    } catch {
      return null;
    }
  },
};
