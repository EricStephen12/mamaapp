import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
  StapleAvailabilityRow,
  StapleItemData,
} from './StapleAvailabilityRow';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const DEFAULT_STAPLES: StapleItemData[] = [
  { id: 'st-1', name: 'Olive oil', quantity: 'At least 2 tbsp', isAvailable: true },
  { id: 'st-2', name: 'Salt', quantity: 'A few pinches', isAvailable: true },
  { id: 'st-3', name: 'Ground cumin', quantity: 'At least 1 tsp', isAvailable: true },
];

export const PantryBasicsSection: React.FC = () => {
  const [staples, setStaples] = useState<StapleItemData[]>(DEFAULT_STAPLES);

  const handleToggle = (id: string, isAvailable: boolean) => {
    setStaples((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable } : item))
    );
  };

  const handleAddStaple = () => {
    if (Alert.prompt) {
      Alert.prompt(
        'Add Pantry Basic',
        'Enter staple name and minimum amount:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (text?: string) => {
              if (text && text.trim()) {
                setStaples((prev) => [
                  ...prev,
                  {
                    id: `st-${Date.now()}`,
                    name: text.trim(),
                    quantity: 'In pantry',
                    isAvailable: true,
                  },
                ]);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Edit Basics',
        'You can add or toggle everyday essentials like black pepper, vinegar, soy sauce, and cooking oils.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>And the little essentials</Text>
      <Text style={styles.supportingCopy}>
        Everyday essentials assumed in your kitchen. Tap to adjust.
      </Text>

      {/* Available Staples List */}
      <View style={styles.staplesList}>
        {staples.map((item) => (
          <StapleAvailabilityRow
            key={item.id}
            item={item}
            onToggle={handleToggle}
          />
        ))}
      </View>

      {/* Missing Staple Indicator */}
      <View style={styles.missingStapleRow}>
        <Text style={styles.missingName}>Black pepper</Text>
        <Text style={styles.missingStatus}>Missing · won’t be assumed</Text>
      </View>

      {/* Edit Basics Action Link */}
      <TouchableOpacity onPress={handleAddStaple} activeOpacity={0.7}>
        <Text style={styles.editActionLink}>Edit basics or add another staple</Text>
      </TouchableOpacity>
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
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  staplesList: {
    width: '100%',
  },
  missingStapleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    width: '100%',
  },
  missingName: {
    fontSize: typography.fontSize.reassurance,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  missingStatus: {
    fontSize: typography.fontSize.reassurance,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  editActionLink: {
    fontSize: typography.fontSize.reassurance,
    color: colors.primary,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '500',
    paddingVertical: 4,
  },
});

export default PantryBasicsSection;
