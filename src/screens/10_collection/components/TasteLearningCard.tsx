import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { preferencesStore, UserKitchenPass } from '../../../services/preferencesStore';
import { MamaCharacter } from '../../../components/common/MamaCharacter';

interface TasteLearningCardProps {
  onReviewTastes?: () => void;
}

export const TasteLearningCard: React.FC<TasteLearningCardProps> = ({
  onReviewTastes,
}) => {
  const [pass, setPass] = useState<UserKitchenPass>(preferencesStore.getKitchenPass());

  useEffect(() => {
    const unsub = preferencesStore.subscribe((updated) => setPass(updated));
    return unsub;
  }, []);

  const likedCount = pass.likedDishes.length;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>MAMA&apos;S TASTE MEMORY</Text>
        <View style={styles.learningBadge}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={styles.learningBadgeText}>
            {likedCount > 0 ? `${likedCount} meals learned` : 'Learning your palate'}
          </Text>
        </View>
      </View>

      <Text style={styles.heading}>Your palate,{'\n'}taking shape.</Text>
      <Text style={styles.supportingCopy}>
        Mama automatically adapts recipe suggestions every time you swipe or cook.
      </Text>

      {/* Mama Note */}
      <View style={styles.mamaRow}>
        <MamaCharacter pose="writing" size={42} isSpeaking={true} />
        <Text style={styles.mamaRowText}>
          &ldquo;I take notes on what you like. When you&apos;re tired, I&apos;ll have the exact right plate ready.&rdquo;
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Flavour Anchor */}
      <View style={styles.featureRow}>
        <Ionicons name="flame-outline" size={18} color={colors.primary} />
        <View style={styles.featureDetail}>
          <Text style={styles.featureTitle}>{pass.cuisineLabel}</Text>
          <Text style={styles.featureCopy}>Your home comfort anchor</Text>
        </View>
      </View>

      {/* Cooking Setup */}
      <View style={styles.featureRow}>
        <Ionicons name="disc-outline" size={18} color={colors.primary} />
        <View style={styles.featureDetail}>
          <Text style={styles.featureTitle}>{pass.cookingGearLabel}</Text>
          <Text style={styles.featureCopy}>Zero extra pots to scrub</Text>
        </View>
      </View>

      {/* Speed & Spice */}
      <View style={styles.featureRow}>
        <Ionicons name="timer-outline" size={18} color={colors.primary} />
        <View style={styles.featureDetail}>
          <Text style={styles.featureTitle}>
            {pass.timeLimitLabel} · {pass.spiceLabel}
          </Text>
          <Text style={styles.featureCopy}>Speed & pepper tolerance</Text>
        </View>
      </View>

      {/* Action Link */}
      {onReviewTastes && (
        <TouchableOpacity onPress={onReviewTastes} activeOpacity={0.7} style={styles.actionBtn}>
          <Text style={styles.actionLink}>Update Culinary DNA →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  learningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.snow200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  learningBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  heading: {
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
  },
  supportingCopy: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  mamaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF6EF',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE4D4',
  },
  mamaRowText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(36, 40, 32, 0.1)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDetail: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.text.primary,
  },
  featureCopy: {
    fontSize: 11,
    color: colors.text.muted,
  },
  actionBtn: {
    paddingTop: 4,
  },
  actionLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default TasteLearningCard;
