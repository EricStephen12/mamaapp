import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export interface DetectedItemData {
  id: string;
  name: string;
  quantity: string;
}

interface DetectedIngredientItemProps {
  item: DetectedItemData;
  onQuantityChange: (id: string, newQuantity: string) => void;
  onRemove: (id: string) => void;
}

export const DetectedIngredientItem: React.FC<DetectedIngredientItemProps> = ({
  item,
  onQuantityChange,
  onRemove,
}) => {
  return (
    <View style={styles.container}>
      {/* Ingredient Details Column */}
      <View style={styles.detailsColumn}>
        <Text style={styles.ingredientName}>{item.name}</Text>
        <Text style={styles.detectionStatus}>Possible match · please check</Text>
      </View>

      {/* Editable Quantity Input */}
      <TextInput
        style={styles.quantityInput}
        value={item.quantity}
        onChangeText={(text) => onQuantityChange(item.id, text)}
        placeholder="Quantity"
        placeholderTextColor={colors.text.secondary}
      />

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={18} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.snow100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    marginBottom: 8,
    gap: 10,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  detailsColumn: {
    flex: 1,
    gap: 3,
    alignItems: 'flex-start',
  },
  ingredientName: {
    fontSize: typography.fontSize.sub,
    fontWeight: '500',
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  detectionStatus: {
    fontSize: typography.fontSize.label,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  quantityInput: {
    width: 126,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.1)',
    paddingHorizontal: 12,
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  removeButton: {
    width: 30,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DetectedIngredientItem;
