import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MealOptionRow, MealOptionData } from './MealOptionRow';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface OtherOptionsSectionProps {
  options?: MealOptionData[];
  onSelectOption?: (option: MealOptionData) => void;
}

export const OtherOptionsSection: React.FC<OtherOptionsSectionProps> = ({
  options,
  onSelectOption,
}) => {
  // Only render if options are provided from the API — never show hardcoded meals
  if (!options || options.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>A different direction</Text>

      <View style={styles.list}>
        {options.map((item) => (
          <MealOptionRow
            key={item.id}
            data={item}
            onPress={() => onSelectOption && onSelectOption(item)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '500',
    color: colors.text.primary,
  },
  list: {
    gap: 16,
  },
});

export default OtherOptionsSection;
