import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NavTab } from '../components/navigation/BottomNavigation';

interface TabNavigationContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isInsideTabs: boolean;
  injectedDailyMeal: any | null;
  setInjectedDailyMeal: (meal: any | null) => void;
}

const TabNavigationContext = createContext<TabNavigationContextType>({
  activeTab: 'edit',
  setActiveTab: () => {},
  isInsideTabs: false,
  injectedDailyMeal: null,
  setInjectedDailyMeal: () => {},
});

export const TabNavigationProvider: React.FC<{
  children: ReactNode;
  initialTab?: NavTab;
}> = ({ children, initialTab = 'edit' }) => {
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);
  const [injectedDailyMeal, setInjectedDailyMeal] = useState<any | null>(null);

  return (
    <TabNavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isInsideTabs: true,
        injectedDailyMeal,
        setInjectedDailyMeal,
      }}
    >
      {children}
    </TabNavigationContext.Provider>
  );
};

export const useTabNavigation = () => useContext(TabNavigationContext);

