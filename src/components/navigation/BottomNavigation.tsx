import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export type NavTab = 'edit' | 'kitchen' | 'discover' | 'collection';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NavItem: React.FC<NavItemProps> = ({
  label,
  iconName,
  activeIconName,
  isActive,
  onPress,
}) => {
  // Spring animations for the liquid bubble elevation & scale
  const translateY = useRef(new Animated.Value(isActive ? -14 : 0)).current;
  const scale = useRef(new Animated.Value(isActive ? 1.08 : 1)).current;
  const dotOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: isActive ? -14 : 0,
        tension: 130,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: isActive ? 1.08 : 1,
        tension: 140,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(dotOpacity, {
        toValue: isActive ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, translateY, scale, dotOpacity]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={handlePress}
      activeOpacity={0.88}
      hitSlop={{ top: 12, bottom: 8, left: 10, right: 10 }}
    >
      {/* Floating Liquid Bubble (Elevates out of the straight line when active) */}
      <Animated.View
        style={[
          styles.iconBubble,
          isActive ? styles.iconBubbleActive : styles.iconBubbleInactive,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <Ionicons
          name={isActive ? activeIconName : iconName}
          size={isActive ? 22 : 20}
          color={isActive ? '#FFFFFF' : colors.text.secondary}
        />
      </Animated.View>

      {/* Liquid Bead Dot (Anchor below the elevated bubble) */}
      <Animated.View
        style={[
          styles.liquidDot,
          {
            opacity: dotOpacity,
            transform: [{ scale: dotOpacity }],
          },
        ]}
      />

      {/* Label */}
      <Text
        style={[
          styles.itemLabel,
          isActive ? styles.itemLabelActive : styles.itemLabelInactive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'edit',
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();
  const bottomMargin = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.outerWrapper, { paddingBottom: bottomMargin }]}>
      {/* Floating Organic Island Bar (Not a straight flat edge) */}
      <View style={styles.floatingCapsule}>
        <NavItem
          label="Home"
          iconName="restaurant-outline"
          activeIconName="restaurant"
          isActive={activeTab === 'edit'}
          onPress={() => onTabChange && onTabChange('edit')}
        />
        <NavItem
          label="Kitchen"
          iconName="basket-outline"
          activeIconName="basket"
          isActive={activeTab === 'kitchen'}
          onPress={() => onTabChange && onTabChange('kitchen')}
        />
        <NavItem
          label="Discover"
          iconName="compass-outline"
          activeIconName="compass"
          isActive={activeTab === 'discover'}
          onPress={() => onTabChange && onTabChange('discover')}
        />
        <NavItem
          label="Saved"
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
  outerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  floatingCapsule: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: Math.min(SCREEN_WIDTH - 32, 420),
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1.2,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    shadowColor: '#242820',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingTop: 4,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  iconBubbleActive: {
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 9,
  },
  iconBubbleInactive: {
    backgroundColor: 'transparent',
  },
  liquidDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginBottom: 2,
    marginTop: -2,
  },
  itemLabel: {
    fontSize: 10.5,
    fontFamily: typography.fontFamily.regular,
    letterSpacing: -0.2,
  },
  itemLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  itemLabelInactive: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
});

export default BottomNavigation;
