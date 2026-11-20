import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
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
> = ({ onRetakePhoto, items, onItemsChange }) => {
  const [localFallbackList, setLocalFallbackList] = useState<DetectedItemData[]>(INITIAL_ITEMS);
  const [newItemName, setNewItemName] = useState('');

  const ingredientList = items ?? localFallbackList;

  const handleQuantityChange = (id: string, newQuantity: string) => {
    const updated = ingredientList.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    if (!items) {
      setLocalFallbackList(updated);
    }
    if (onItemsChange) onItemsChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = ingredientList.filter((item) => item.id !== id);
    if (!items) {
      setLocalFallbackList(updated);
    }
    if (onItemsChange) onItemsChange(updated);
  };

  const handleAddInlineItem = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (ingredientList.some((i) => i.name.toLowerCase() === formatted.toLowerCase())) {
      setNewItemName('');
      Keyboard.dismiss();
      return;
    }
    const updated: DetectedItemData[] = [
      ...ingredientList,
      { id: `ing-${Date.now()}`, name: formatted, quantity: '1 portion' },
    ];
    if (!items) {
      setLocalFallbackList(updated);
    }
    if (onItemsChange) onItemsChange(updated);
    setNewItemName('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* Section Header Row */}
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.title}>In your kitchen</Text>
        <TouchableOpacity onPress={onRetakePhoto} activeOpacity={0.7}>
          <Text style={styles.retakeAction}>Full kitchen studio</Text>
        </TouchableOpacity>
      </View>

      {/* Instructional Copy */}
      <Text style={styles.supportingCopy}>
        Tap to adjust quantities, remove items, or add anything else on hand.
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

      {/* Inline Add Missed Ingredient Input */}
      <View style={styles.inlineAddRow}>
        <TextInput
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={handleAddInlineItem}
          returnKeyType="done"
          placeholder="Add another ingredient (e.g. Plantains, Garlic)..."
          placeholderTextColor={colors.text.muted}
          style={styles.inlineAddInput}
        />
        <TouchableOpacity
          style={styles.inlineAddBtn}
          onPress={handleAddInlineItem}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={colors.snow100} />
        </TouchableOpacity>
      </View>
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
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  inlineAddInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.1)',
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.text.primary,
  },
  inlineAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DetectedIngredientsSection;
