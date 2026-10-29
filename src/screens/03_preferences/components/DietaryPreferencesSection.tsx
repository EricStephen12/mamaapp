import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { SelectableChip } from '../../../components/common/SelectableChip';

const DIETARY_CHOICES = ['Vegetarian', 'Vegan', 'No preference'];

const ALLERGEN_OPTIONS = ['Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Tree nuts'];

export const DietaryPreferencesSection: React.FC = () => {
  const [selectedDiet, setSelectedDiet] = useState<string>('Vegetarian');
  const [allergies, setAllergies] = useState<string[]>(['Peanuts']);
  const [showAllergenPicker, setShowAllergenPicker] = useState<boolean>(false);

  const toggleAllergy = (allergen: string) => {
    setAllergies((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>A little care, built in.</Text>

      {/* Dietary Choices */}
      <View style={styles.chipGrid}>
        {DIETARY_CHOICES.map((diet) => (
          <SelectableChip
            key={diet}
            label={diet}
            selected={selectedDiet === diet}
            onPress={() => setSelectedDiet(diet)}
          />
        ))}
      </View>

      {/* Allergies & Intolerances Field */}
      <TouchableOpacity
        style={styles.allergyCard}
        activeOpacity={0.75}
        onPress={() => setShowAllergenPicker(!showAllergenPicker)}
      >
        <View style={styles.allergyInfo}>
          <Text style={styles.eyebrow}>ALLERGIES & INTOLERANCES</Text>
          <Text style={styles.allergyValue}>
            {allergies.length > 0 ? allergies.join(', ') : 'None specified'}
          </Text>
        </View>
        <Ionicons
          name={showAllergenPicker ? 'chevron-up' : 'add'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* Allergen Quick Picker */}
      {showAllergenPicker && (
        <View style={styles.allergenPickerRow}>
          {ALLERGEN_OPTIONS.map((item) => (
            <SelectableChip
              key={item}
              label={item}
              selected={allergies.includes(item)}
              onPress={() => toggleAllergy(item)}
            />
          ))}
        </View>
      )}

      {/* Supporting Copy */}
      <Text style={styles.supportingCopy}>
        {"We'll flag ingredients. Please confirm labels and cross-contact."}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  heading: {
    fontSize: 27,
    lineHeight: 30,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    backgroundColor: colors.snow100,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  allergyInfo: {
    gap: 4,
  },
  eyebrow: {
    fontSize: typography.fontSize.label,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  allergyValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  allergenPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
  },
});

export default DietaryPreferencesSection;
