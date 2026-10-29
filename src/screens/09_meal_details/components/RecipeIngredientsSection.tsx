import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface RecipeIngredient {
  id: string;
  name: string;
  baseQuantity: string;
  baseCost: number;
  inKitchen?: boolean;
}

const DEFAULT_INGREDIENTS: RecipeIngredient[] = [
  { id: '1', name: 'Chickpeas', baseQuantity: '1 can, drained', baseCost: 1.2, inKitchen: true },
  { id: '2', name: 'Couscous', baseQuantity: '120g dry', baseCost: 1.0, inKitchen: true },
  { id: '3', name: 'Carrots', baseQuantity: '2 medium', baseCost: 0.7, inKitchen: true },
  { id: '4', name: 'Plain yogurt', baseQuantity: '80g', baseCost: 0.6, inKitchen: true },
  { id: '5', name: 'Lemon', baseQuantity: '1', baseCost: 0.6, inKitchen: false },
  { id: '6', name: 'Baby spinach', baseQuantity: '60g', baseCost: 0.9, inKitchen: false },
];

export const RecipeIngredientsSection: React.FC = () => {
  const [servings, setServings] = useState(2);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAllKitchen = () => {
    const kitchenIds = DEFAULT_INGREDIENTS.filter((item) => item.inKitchen).map((i) => i.id);
    const allKitchenChecked = kitchenIds.every((id) => checkedIds.includes(id));

    if (allKitchenChecked) {
      setCheckedIds((prev) => prev.filter((id) => !kitchenIds.includes(id)));
    } else {
      setCheckedIds((prev) => Array.from(new Set([...prev, ...kitchenIds])));
    }
  };

  const handleMinus = () => {
    if (servings > 1) setServings((prev) => prev - 1);
  };

  const handlePlus = () => {
    if (servings < 8) setServings((prev) => prev + 1);
  };

  const kitchenItemCount = DEFAULT_INGREDIENTS.filter((i) => i.inKitchen).length;
  const allKitchenChecked = DEFAULT_INGREDIENTS.filter((i) => i.inKitchen).every((i) =>
    checkedIds.includes(i.id)
  );

  return (
    <View style={styles.container}>
      {/* Section Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>What you’ll need</Text>
        <View style={styles.servingsControl}>
          <Text style={styles.servingsText}>{servings} servings</Text>
          <TouchableOpacity
            onPress={handleMinus}
            style={styles.counterBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.counterBtnText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePlus}
            style={styles.counterBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.counterBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Est. cost of the amount used, not full packs.
      </Text>

      {/* Mental Relief: Quick Kitchen Check Row */}
      <View style={styles.mentalReliefRow}>
        <View style={styles.kitchenCountBadge}>
          <Ionicons name="checkmark-circle-outline" size={13} color={colors.primary} />
          <Text style={styles.kitchenCountText}>
            {kitchenItemCount} items ready in kitchen
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleToggleAllKitchen}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.quickCheckLink}>
            {allKitchenChecked ? 'Reset checks' : `Check all ${kitchenItemCount} on hand`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ingredients List */}
      <View style={styles.list}>
        {DEFAULT_INGREDIENTS.map((item) => {
          const isChecked = checkedIds.includes(item.id);
          const scaledCost = (item.baseCost * (servings / 2)).toFixed(2);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.ingredientRow}
              onPress={() => toggleCheck(item.id)}
              activeOpacity={0.7}
            >
              {/* Checkbox */}
              <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                {isChecked && (
                  <Ionicons name="checkmark" size={13} color={colors.white} />
                )}
              </View>

              {/* Name & Pantry Status Badge */}
              <View style={styles.nameBlock}>
                <Text
                  style={[
                    styles.ingredientName,
                    isChecked && styles.ingredientNameChecked,
                  ]}
                >
                  {item.name}
                </Text>
                {item.inKitchen && (
                  <View style={styles.inKitchenBadge}>
                    <Text style={styles.inKitchenBadgeText}>In kitchen</Text>
                  </View>
                )}
              </View>

              {/* Quantity */}
              <Text style={styles.quantityText}>{item.baseQuantity}</Text>

              {/* Cost */}
              <Text style={styles.costText}>${scaledCost}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pantry Awareness Card */}
      <View style={styles.pantryCard}>
        <Ionicons
          name="checkmark-done"
          size={20}
          color={colors.primary}
          style={styles.pantryIcon}
        />
        <View style={styles.pantryInfo}>
          <Text style={styles.pantryStatus}>
            In your pantry · confirm before cooking
          </Text>
          <Text style={styles.pantryDetails}>
            {`Olive oil, cumin & salt · $0.60 used\nNot included in the checkout estimate.`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 13,
    width: '100%',
  },
  headerRow: {
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
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.snow100,
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 6,
  },
  servingsText: {
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  counterBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.linen100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 15,
    lineHeight: 17,
    color: colors.primary,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  mentalReliefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.snow100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  kitchenCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kitchenCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  quickCheckLink: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  list: {
    width: '100%',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.snow100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.05)',
    marginBottom: 6,
    gap: 10,
    width: '100%',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(36, 40, 32, 0.2)',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nameBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inKitchenBadge: {
    backgroundColor: colors.linen100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inKitchenBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  ingredientName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  ingredientNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  quantityText: {
    fontSize: typography.fontSize.label,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  costText: {
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
    width: 44,
    textAlign: 'right',
  },
  pantryCard: {
    borderRadius: 16,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  pantryIcon: {
    marginTop: 2,
  },
  pantryInfo: {
    flex: 1,
    gap: 4,
  },
  pantryStatus: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    color: colors.primary,
  },
  pantryDetails: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});

export default RecipeIngredientsSection;
