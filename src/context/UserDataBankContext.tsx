import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { tokenStore, AuthUser } from '../services/api/tokenStore';
import { authService } from '../services/api/authService';
import { preferencesStore, UserKitchenPass } from '../services/preferencesStore';
import { pantryService, ApiPantryItem } from '../services/api/pantryService';
import { savedMealsService, ApiSavedMeal } from '../services/api/savedMealsService';

export interface UserDataBankContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isGuest: boolean;
  userBankScope: string;
  kitchenPass: UserKitchenPass;
  pantryItems: ApiPantryItem[];
  savedMeals: ApiSavedMeal[];
  refreshUserBank: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserDataBankContext = createContext<UserDataBankContextValue | null>(null);

export const UserDataBankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => tokenStore.getUser());
  const [kitchenPass, setKitchenPass] = useState<UserKitchenPass>(() =>
    preferencesStore.getKitchenPass()
  );
  const [pantryItems, setPantryItems] = useState<ApiPantryItem[]>(() =>
    pantryService.getCachedPantry()
  );
  const [savedMeals, setSavedMeals] = useState<ApiSavedMeal[]>(() =>
    savedMealsService.getCachedMeals()
  );

  const refreshUserBank = useCallback(async () => {
    setUser(tokenStore.getUser());
    await Promise.all([
      preferencesStore.init(),
      pantryService.fetchAll(),
      savedMealsService.fetchAll(),
    ]).catch(() => {});
    setKitchenPass(preferencesStore.getKitchenPass());
    setPantryItems(pantryService.getCachedPantry());
    setSavedMeals(savedMealsService.getCachedMeals());
  }, []);

  useEffect(() => {
    const unsubAuth = tokenStore.subscribe((nextUser) => {
      setUser(nextUser);
      // Hydrate the active user's isolated data bank whenever auth state changes
      Promise.all([
        preferencesStore.init(),
        pantryService.fetchAll(),
        savedMealsService.fetchAll(),
      ]).catch(() => {});
    });

    const unsubPrefs = preferencesStore.subscribe((nextPass) => {
      setKitchenPass(nextPass);
    });

    const unsubPantry = pantryService.subscribe((nextPantry) => {
      setPantryItems(nextPantry);
    });

    const unsubSaved = savedMealsService.subscribe((nextSaved) => {
      setSavedMeals(nextSaved);
    });

    return () => {
      unsubAuth();
      unsubPrefs();
      unsubPantry();
      unsubSaved();
    };
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const value = useMemo<UserDataBankContextValue>(
    () => {
      const activeUser = user || tokenStore.getUser();
      const hasAuth = !!activeUser && (tokenStore.isLoggedIn() || !!activeUser.id);
      return {
        user: activeUser,
        isLoggedIn: hasAuth,
        isGuest: !hasAuth,
        userBankScope: tokenStore.getActiveScope(),
        kitchenPass,
        pantryItems,
        savedMeals,
        refreshUserBank,
        signOut,
      };
    },
    [user, kitchenPass, pantryItems, savedMeals, refreshUserBank, signOut]
  );

  return (
    <UserDataBankContext.Provider value={value}>
      {children}
    </UserDataBankContext.Provider>
  );
};

export function useUserDataBank(): UserDataBankContextValue {
  const ctx = useContext(UserDataBankContext);
  if (!ctx) {
    const curUser = tokenStore.getUser();
    const hasAuth = !!curUser && (tokenStore.isLoggedIn() || !!curUser.id);
    return {
      user: curUser,
      isLoggedIn: hasAuth,
      isGuest: !hasAuth,
      userBankScope: tokenStore.getActiveScope(),
      kitchenPass: preferencesStore.getKitchenPass(),
      pantryItems: pantryService.getCachedPantry(),
      savedMeals: savedMealsService.getCachedMeals(),
      refreshUserBank: async () => {},
      signOut: () => authService.signOut(),
    };
  }
  return ctx;
}

