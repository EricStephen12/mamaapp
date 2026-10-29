import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const TIME_OPTIONS = [
  { id: '15_min', label: '15 min' },
  { id: '30_min', label: 'Up to 30 min' },
  { id: 'no_rush', label: 'No rush' },
];

interface CookingTimePreferenceSectionProps {
  selectedTime?: string;
  onTimeChange?: (timeId: string) => void;
}

export const CookingTimePreferenceSection: React.FC<
  CookingTimePreferenceSectionProps
> = ({ selectedTime = '30_min', onTimeChange }) => {
  const [activeTime, setActiveTime] = useState(selectedTime);

  const handleSelect = (id: string) => {
    setActiveTime(id);
    if (onTimeChange) onTimeChange(id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How much time tonight?</Text>

      <View style={styles.optionsRow}>
        {TIME_OPTIONS.map((item) => {
          const isSelected = activeTime === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item.id)}
              style={({ pressed }) => [
                styles.chip,
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
                  styles.label,
                  isSelected ? styles.labelSelected : styles.labelUnselected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  heading: {
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 11,
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
    transform: [{ scale: 0.96 }],
  },
  checkIcon: {
    marginRight: 5,
  },
  label: {
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

export default CookingTimePreferenceSection;
