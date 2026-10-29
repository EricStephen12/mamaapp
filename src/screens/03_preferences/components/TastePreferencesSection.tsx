import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { SelectableChip } from '../../../components/common/SelectableChip';

const DEFAULT_TASTES = [
  'Mediterranean',
  'Warm bowls',
  'Pasta',
  'Spicy',
  'Comfort food',
];

const MORE_TASTES = [
  'French bistro',
  'Japanese ramen',
  'Mexican street food',
  'Sourdough & grains',
  'Thai stir-fry',
  'Nordic clean',
];

export const TastePreferencesSection: React.FC = () => {
  const [selectedTastes, setSelectedTastes] = useState<string[]>([
    'Mediterranean',
    'Warm bowls',
  ]);
  const [showMoreTastes, setShowMoreTastes] = useState<boolean>(false);
  const [skipItem, setSkipItem] = useState<string>('mushrooms');

  const toggleTaste = (taste: string) => {
    setSelectedTastes((prev) =>
      prev.includes(taste) ? prev.filter((t) => t !== taste) : [...prev, taste]
    );
  };

  const handleToggleSkip = () => {
    const skips = ['mushrooms', 'cilantro', 'bell peppers', 'none'];
    const nextIdx = (skips.indexOf(skipItem) + 1) % skips.length;
    setSkipItem(skips[nextIdx]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What do you love?</Text>

      <View style={styles.chipGrid}>
        {DEFAULT_TASTES.map((taste) => (
          <SelectableChip
            key={taste}
            label={taste}
            selected={selectedTastes.includes(taste)}
            onPress={() => toggleTaste(taste)}
          />
        ))}

        {showMoreTastes &&
          MORE_TASTES.map((taste) => (
            <SelectableChip
              key={taste}
              label={taste}
              selected={selectedTastes.includes(taste)}
              onPress={() => toggleTaste(taste)}
            />
          ))}

        <SelectableChip
          label={showMoreTastes ? '− Fewer tastes' : '+ Add a taste'}
          onPress={() => setShowMoreTastes(!showMoreTastes)}
          isAddButton={!showMoreTastes}
        />
      </View>

      <View style={styles.skipRow}>
        <Text style={styles.skipNote}>
          Rather skip: <Text style={styles.skipHighlight}>{skipItem}</Text>
        </Text>
        <TouchableOpacity
          onPress={handleToggleSkip}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editLink}>Change</Text>
        </TouchableOpacity>
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
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipNote: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
  },
  skipHighlight: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  editLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
    fontSize: typography.fontSize.reassurance,
  },
});

export default TastePreferencesSection;
