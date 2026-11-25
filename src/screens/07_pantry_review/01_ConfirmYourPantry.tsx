import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import { KitchenPassModal } from '../../components/common/KitchenPassModal';
import { pantryService } from '../../services/api/pantryService';
import { preferencesStore } from '../../services/preferencesStore';
import { DetectedItemData } from './components/DetectedIngredientItem';

import { DetectedIngredientsSection } from './components/DetectedIngredientsSection';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmYourPantry'>;

export const ConfirmYourPantry: React.FC<Props> = ({ navigation, route }) => {
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;

  const passedItems = route.params?.items;

  // Track confirmed pantry items so we can sync to Neon DB on confirm
  const [confirmedItems, setConfirmedItems] = useState<DetectedItemData[]>(() => {
    if (passedItems && passedItems.length > 0) {
      return passedItems.map((name, idx) => ({
        id: `ing-${idx + 1}`,
        name,
        quantity: '1 portion',
      }));
    }
    const cached = pantryService.getCachedPantry();
    if (cached.length > 0) {
      return cached.map((item, idx) => ({
        id: `ing-${idx + 1}`,
        name: item.name,
        quantity: item.quantity || '1 portion',
      }));
    }
    const pass = preferencesStore.getKitchenPass();
    const isPlantBased = pass.dietaryRestrictions?.some(
      (d) => d.toLowerCase().includes('vegan') || d.toLowerCase().includes('vegetarian')
    );
    return [
      { id: 'ing-1', name: 'Tomatoes', quantity: 'About 4 medium' },
      { id: 'ing-2', name: isPlantBased ? 'Plantains' : 'Eggs', quantity: isPlantBased ? '2 ripe' : '6 large' },
      { id: 'ing-3', name: 'White rice', quantity: '1 cup dry' },
      { id: 'ing-4', name: 'Onions', quantity: '2 yellow' },
    ];
  });
  const [mamaPose] = useState<MamaPose>('writing');
  const [passModalVisible, setPassModalVisible] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [contentFade, contentY]);

  const handlePressIn = () => {
    Animated.spring(confirmScale, { toValue: 0.96, useNativeDriver: true, friction: 5 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(confirmScale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  };

  const handleConfirm = () => {
    // Sync confirmed pantry items to Neon DB (fire-and-forget — never blocks navigation)
    pantryService.syncItems(
      confirmedItems.map((i) => ({ name: i.name, quantity: i.quantity, category: 'pantryStaples' }))
    );
    navigation.navigate('AlreadyInYourKitchen', {
      items: confirmedItems.map((i) => i.name),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Masthead Header */}
      <View style={styles.masthead}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>Mama Dish</Text>
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={() => setPassModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Feed with Keyboard Protection */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.animatedContainer,
            { opacity: contentFade, transform: [{ translateY: contentY }] },
          ]}
        >
          {/* Section 1: Review Introduction */}
          <View style={styles.introBlock}>
            <Text style={styles.eyebrow}>PANTRY REVIEW · ZERO WASTE</Text>
            <Text style={styles.heading}>Confirm your pantry</Text>
            <Text style={styles.supportingCopy}>
              Review your kitchen ingredients before Mama suggests a meal.
            </Text>
          </View>

          {/* Mama Live Review Stage */}
          <View style={styles.mamaGreetingCard}>
            <MamaCharacter pose={mamaPose} size={48} isSpeaking={true} />
            <View style={styles.mamaBubble}>
              <Text style={styles.mamaBubbleText}>
                &ldquo;
                {confirmedItems.length > 0
                  ? `I noted ${confirmedItems
                      .slice(0, 3)
                      .map((i) => i.name)
                      .join(', ')}${
                      confirmedItems.length > 3 ? ' and more' : ''
                    }. Check the list below and tap continue to see your custom meals!`
                  : 'Add or confirm what you have in your kitchen below and tap continue!'}
                &rdquo;
              </Text>
            </View>
          </View>

          {/* Section 2: Detected Ingredients List */}
          <DetectedIngredientsSection
            items={confirmedItems}
            onRetakePhoto={() => navigation.navigate('WhatsInYourKitchen')}
            onItemsChange={(items) => setConfirmedItems(items)}
          />

          {/* Section 3: Confirmation Action & Explanatory Copy */}
          <View style={styles.actionBlock}>
            <Animated.View style={[{ transform: [{ scale: confirmScale }] }]}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.confirmButtonText}>
                    Confirm pantry & find meals
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.disclaimerText}>
              {"Mama will suggest meals based strictly on what's in your house."}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
    {/* Kitchen Pass Modal */}
      <KitchenPassModal
        visible={passModalVisible}
        onClose={() => setPassModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  masthead: {
    height: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(36, 40, 32, 0.08)',
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.6,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  animatedContainer: {
    gap: 16,
  },
  introBlock: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '600',
  },
  supportingCopy: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    lineHeight: 18,
  },
  mamaGreetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF6EF',
    borderWidth: 1,
    borderColor: '#ECE4D4',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mamaBubble: {
    flex: 1,
  },
  mamaBubbleText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  actionBlock: {
    gap: 10,
    width: '100%',
  },
  confirmButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.sub,
    fontWeight: '700',
    color: colors.snow100,
  },
  disclaimerText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    color: colors.text.muted,
  },
});

export default ConfirmYourPantry;
