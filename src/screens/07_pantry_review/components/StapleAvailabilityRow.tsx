import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export interface StapleItemData {
  id: string;
  name: string;
  quantity: string;
  isAvailable?: boolean;
}

interface StapleAvailabilityRowProps {
  item: StapleItemData;
  onToggle?: (id: string, isAvailable: boolean) => void;
}

export const StapleAvailabilityRow: React.FC<StapleAvailabilityRowProps> = ({
  item,
  onToggle,
}) => {
  const [checked, setChecked] = useState(item.isAvailable ?? true);

  const handlePress = () => {
    const nextState = !checked;
    setChecked(nextState);
    if (onToggle) onToggle(item.id, nextState);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Custom Clean Checkbox */}
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color={colors.white} />}
      </View>

      {/* Staple Details */}
      <View style={styles.detailsColumn}>
        <Text style={styles.stapleName}>{item.name}</Text>
        <Text style={styles.quantityHint}>{item.quantity}</Text>
      </View>

      {/* Availability Status Tag */}
      <Text style={[styles.statusTag, !checked && styles.statusTagMissing]}>
        {checked ? 'I have this' : 'Missing'}
      </Text>
    </TouchableOpacity>
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
    gap: 12,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
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
  detailsColumn: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
  },
  stapleName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  quantityHint: {
    fontSize: typography.fontSize.label,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  statusTag: {
    fontSize: typography.fontSize.label,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary,
    fontWeight: '500',
  },
  statusTagMissing: {
    color: colors.text.secondary,
  },
});

export default StapleAvailabilityRow;
