import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../../theme/colors';

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
  { key: 'home', label: 'Home kitchen' },
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
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: '#F3F6F1',
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  labelUnselected: {
    color: colors.text.secondary,
  },
});

export default MealFilters;
