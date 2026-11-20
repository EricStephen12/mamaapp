import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors';

export type CollectionFilterType = 'all' | 'home' | 'eating_out';

interface CollectionFiltersProps {
  selectedFilter: CollectionFilterType;
  onSelectFilter: (filter: CollectionFilterType) => void;
  counts: {
    all: number;
    home: number;
    eating_out: number;
  };
}

export const CollectionFilters: React.FC<CollectionFiltersProps> = ({
  selectedFilter,
  onSelectFilter,
  counts,
}) => {
  const options = [
    { key: 'all' as const, label: 'All saved', count: counts.all },
    { key: 'home' as const, label: 'Home kitchen', count: counts.home },
  ];

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selectedFilter === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
            ]}
            onPress={() => onSelectFilter(option.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
            >
              {option.label}
            </Text>
            <Text
              style={[
                styles.countText,
                isSelected ? styles.countTextSelected : styles.countTextUnselected,
              ]}
            >
              {option.count}
            </Text>
          </TouchableOpacity>
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
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#F3F6F1',
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  label: {
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
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  countTextSelected: {
    color: colors.primary,
  },
  countTextUnselected: {
    color: colors.text.muted,
  },
});

export default CollectionFilters;
