import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export type MealFilterType = 'all' | 'home' | 'eating_out';

interface MealFiltersProps {
  activeFilter: MealFilterType;
  onSelectFilter: (filter: MealFilterType) => void;
}

interface FilterOption {
  key: MealFilterType;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'All ideas' },
  { key: 'home', label: 'At home' },
  { key: 'eating_out', label: 'Eating out' },
];

export const MealFilters: React.FC<MealFiltersProps> = ({
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <View style={styles.container}>
      {FILTER_OPTIONS.map((item) => {
        const isSelected = activeFilter === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelectFilter(item.key)}
            style={({ pressed }) => [
              styles.filterChip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
              pressed && styles.chipPressed,
            ]}
          >
            {isSelected && (
              <Ionicons
                name="checkmark"
                size={12}
                color={colors.primary}
                style={styles.checkIcon}
              />
            )}
            <Text
              style={[
                styles.filterLabel,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.linen100,
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  checkIcon: {
    marginRight: 5,
  },
  filterLabel: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 14,
    fontFamily: typography.fontFamily.regular,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  labelUnselected: {
    color: colors.text.secondary,
  },
});

export default MealFilters;
