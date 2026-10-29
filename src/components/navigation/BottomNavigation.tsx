import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export type NavTab = 'edit' | 'discover' | 'collection';

interface BottomNavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

interface NavItemProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  activeIconName: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  label,
  iconName,
  activeIconName,
  isActive,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.itemWrapper]}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
      >
        <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
          <Ionicons
            name={isActive ? activeIconName : iconName}
            size={20}
            color={isActive ? colors.primary : colors.text.secondary}
          />
        </View>
        <Text
          style={[
            styles.itemLabel,
            isActive ? styles.itemLabelActive : styles.itemLabelInactive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'edit',
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.tabRow}>
        <NavItem
          label="Your edit"
          iconName="home-outline"
          activeIconName="home"
          isActive={activeTab === 'edit'}
          onPress={() => onTabChange && onTabChange('edit')}
        />
        <NavItem
          label="Discover"
          iconName="compass-outline"
          activeIconName="compass"
          isActive={activeTab === 'discover'}
          onPress={() => onTabChange && onTabChange('discover')}
        />
        <NavItem
          label="Collection"
          iconName="bookmark-outline"
          activeIconName="bookmark"
          isActive={activeTab === 'collection'}
          onPress={() => onTabChange && onTabChange('collection')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.snow100,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 40, 32, 0.06)',
    paddingTop: 12,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 4,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  itemWrapper: {
    flex: 1,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: colors.linen100,
  },
  itemLabel: {
    fontSize: typography.fontSize.label,
    fontFamily: typography.fontFamily.regular,
  },
  itemLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  itemLabelInactive: {
    color: colors.text.secondary,
  },
});

export default BottomNavigation;
