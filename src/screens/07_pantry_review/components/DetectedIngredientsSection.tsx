import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DetectedIngredientItem,
  DetectedItemData,
} from './DetectedIngredientItem';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const INITIAL_ITEMS: DetectedItemData[] = [
  { id: 'ing-1', name: 'Tomatoes', quantity: 'About 4 medium' },
  { id: 'ing-2', name: 'Eggs', quantity: '6 large' },
  { id: 'ing-3', name: 'White rice', quantity: '1 cup dry' },
  { id: 'ing-4', name: 'Onions', quantity: '2 yellow' },
];

interface DetectedIngredientsSectionProps {
  onRetakePhoto?: () => void;
  items?: DetectedItemData[];
  onItemsChange?: (items: DetectedItemData[]) => void;
}

export const DetectedIngredientsSection: React.FC<
  DetectedIngredientsSectionProps
> = ({ onRetakePhoto, items = INITIAL_ITEMS, onItemsChange }) => {
  const [ingredientList, setIngredientList] = useState<DetectedItemData[]>(items);

  const handleQuantityChange = (id: string, newQuantity: string) => {
    const updated = ingredientList.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setIngredientList(updated);
    if (onItemsChange) onItemsChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = ingredientList.filter((item) => item.id !== id);
    setIngredientList(updated);
    if (onItemsChange) onItemsChange(updated);
  };

  const handleAddMissed = () => {
    if (Alert.prompt) {
      Alert.prompt(
        'Add Missed Ingredient',
        'Enter ingredient name and quantity:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (name?: string) => {
              if (name && name.trim()) {
                const newItem: DetectedItemData = {
                  id: `ing-${Date.now()}`,
                  name: name.trim(),
                  quantity: '1 portion',
                };
                const updated = [...ingredientList, newItem];
                setIngredientList(updated);
                if (onItemsChange) onItemsChange(updated);
              }
            },
          },
        ]
      );
    } else {
      const newItem: DetectedItemData = {
        id: `ing-${Date.now()}`,
        name: 'Garlic cloves',
        quantity: '3 cloves',
      };
      const updated = [...ingredientList, newItem];
      setIngredientList(updated);
      if (onItemsChange) onItemsChange(updated);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header Row */}
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.title}>We think we see</Text>
        <TouchableOpacity onPress={onRetakePhoto} activeOpacity={0.7}>
          <Text style={styles.retakeAction}>Retake photo</Text>
        </TouchableOpacity>
      </View>

      {/* Instructional Copy */}
      <Text style={styles.supportingCopy}>
        Tap to edit quantities or remove items.
      </Text>

      {/* Ingredients List */}
      <View style={styles.list}>
        {ingredientList.map((item) => (
          <DetectedIngredientItem
            key={item.id}
            item={item}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
          />
        ))}
      </View>

      {/* Add Missed Ingredient Action */}
      <TouchableOpacity
        style={styles.addMissedRow}
        onPress={handleAddMissed}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={styles.addMissedLabel}>Add a missed ingredient</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  retakeAction: {
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary,
    fontWeight: '500',
  },
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  list: {
    width: '100%',
  },
  addMissedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  addMissedLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
});

export default DetectedIngredientsSection;
