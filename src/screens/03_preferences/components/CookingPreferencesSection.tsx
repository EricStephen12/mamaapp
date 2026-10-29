import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { SelectableChip } from '../../../components/common/SelectableChip';

const COOKING_OPTIONS = ['Mostly cook', 'A little of both', 'Mostly out'];
const COOKING_TIMES = ['up to 15 min', 'up to 25 min', 'up to 40 min', 'any time'];

export const CookingPreferencesSection: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('A little of both');
  const [homeMeals, setHomeMeals] = useState(4);
  const [timeIndex, setTimeIndex] = useState(1);
  const totalDays = 7;

  const handleSelectOption = (opt: string) => {
    setSelectedOption(opt);
    if (opt === 'Mostly cook') setHomeMeals(6);
    else if (opt === 'A little of both') setHomeMeals(4);
    else if (opt === 'Mostly out') setHomeMeals(2);
  };

  const handleCycleTime = () => {
    setTimeIndex((prev) => (prev + 1) % COOKING_TIMES.length);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How does your week look?</Text>

      {/* Balance Choices */}
      <View style={styles.chipRow}>
        {COOKING_OPTIONS.map((opt) => (
          <SelectableChip
            key={opt}
            label={opt}
            selected={selectedOption === opt}
            onPress={() => handleSelectOption(opt)}
          />
        ))}
      </View>

      {/* 7-Segment Weekly Mix Visualizer */}
      <View style={styles.mixBar}>
        {Array.from({ length: totalDays }).map((_, index) => {
          const isHomeMeal = index < homeMeals;
          return (
            <View
              key={index}
              style={[
                styles.segment,
                isHomeMeal ? styles.segmentHome : styles.segmentOut,
              ]}
            />
          );
        })}
      </View>

      {/* Mix Labels */}
      <View style={styles.mixLabels}>
        <Text style={styles.homeLabel}>{homeMeals} main meals at home</Text>
        <Text style={styles.outLabel}>{totalDays - homeMeals} bought out</Text>
      </View>

      {/* Supporting Copy */}
      <Text style={styles.supportingCopy}>
        Cooking time:{' '}
        <Text style={styles.timeHighlight}>{COOKING_TIMES[timeIndex]}</Text>{' '}
        <Text style={styles.changeLink} onPress={handleCycleTime}>
          Change
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: '100%',
  },
  heading: {
    fontSize: 27,
    lineHeight: 30,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mixBar: {
    flexDirection: 'row',
    gap: 4,
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  segmentHome: {
    backgroundColor: colors.primary,
  },
  segmentOut: {
    backgroundColor: colors.border,
  },
  mixLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeLabel: {
    fontSize: typography.fontSize.reassurance,
    color: colors.primary,
    fontWeight: '600',
  },
  outLabel: {
    fontSize: typography.fontSize.reassurance,
    color: colors.text.secondary,
  },
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
  },
  timeHighlight: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  changeLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default CookingPreferencesSection;
