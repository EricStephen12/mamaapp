import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MealOptionRow, MealOptionData } from './MealOptionRow';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const OTHER_OPTIONS: MealOptionData[] = [
  {
    id: 'opt-1',
    eyebrow: 'EATING OUT · EXAMPLE',
    mealName: 'Roasted veg & hummus pita',
    estimatedCost: '$8.50 est. / meal',
    imageUrl:
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'opt-2',
    eyebrow: 'AT HOME · 25 MIN',
    mealName: 'Tomato & white bean pasta',
    estimatedCost: '$2.40 est. / serving',
    imageUrl:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80',
  },
];

interface OtherOptionsSectionProps {
  options?: MealOptionData[];
  onSelectOption?: (option: MealOptionData) => void;
}

export const OtherOptionsSection: React.FC<OtherOptionsSectionProps> = ({
  options,
  onSelectOption,
}) => {
  const displayOptions = options || OTHER_OPTIONS;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>A different direction</Text>

      <View style={styles.list}>
        {displayOptions.map((item) => (
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
