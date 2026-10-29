import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

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
    { key: 'home' as const, label: 'At home', count: counts.home },
    { key: 'eating_out' as const, label: 'Eating out', count: counts.eating_out },
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
            activeOpacity={0.7}
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
                styles.label,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
            >
              {option.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                isSelected ? styles.countBadgeSelected : styles.countBadgeUnselected,
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  isSelected ? styles.countTextSelected : styles.countTextUnselected,
                ]}
              >
                {option.count}
              </Text>
            </View>
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
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 99,
    borderWidth: 1,
    gap: 6,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: colors.linen100,
    borderColor: 'rgba(102, 112, 74, 0.4)',
  },
  chipUnselected: {
    backgroundColor: colors.snow100,
    borderColor: 'rgba(36, 40, 32, 0.1)',
  },
  checkIcon: {
    marginRight: 2,
  },
  label: {
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.medium,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  labelUnselected: {
    color: colors.text.secondary,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(102, 112, 74, 0.18)',
  },
  countBadgeUnselected: {
    backgroundColor: 'rgba(36, 40, 32, 0.06)',
  },
  countText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '600',
  },
  countTextSelected: {
    color: colors.primary,
  },
  countTextUnselected: {
    color: colors.text.secondary,
  },
});

export default CollectionFilters;
