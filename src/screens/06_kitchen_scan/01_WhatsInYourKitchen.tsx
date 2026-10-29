import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { MamaCharacter } from '../../components/common/MamaCharacter';
import { preferencesStore } from '../../services/preferencesStore';

import { IngredientViewfinder } from './components/IngredientViewfinder';
import { CaptureControls } from './components/CaptureControls';
import { CaptureGuidanceCard } from './components/CaptureGuidanceCard';
import { ManualEntryAction } from './components/ManualEntryAction';

type Props = NativeStackScreenProps<RootStackParamList, 'WhatsInYourKitchen'>;

const QUICK_STAPLES = [
  'Eggs',
  'Onions',
  'Tomatoes',
  'Plantains',
  'Bread',
  'Rice',
  'Cheddar',
  'Pasta',
  'Garlic',
];

export const WhatsInYourKitchen: React.FC<Props> = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedQuickItems, setSelectedQuickItems] = useState<string[]>(['Eggs', 'Onions', 'Tomatoes']);
  const pass = preferencesStore.getKitchenPass();

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCapture = () => {
    setIsScanning(true);
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.85, duration: 90, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        setIsScanning(false);
        navigation.navigate('ConfirmYourPantry');
      }, 300);
    });
  };

  const toggleQuickStaple = (item: string) => {
    setSelectedQuickItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
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
        <Text style={styles.brandTitle}>Mama Kitchen</Text>
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={() => navigation.navigate('MakeItYours')}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Flash Overlay */}
      <Animated.View pointerEvents="none" style={[styles.flashOverlay, { opacity: flashOpacity }]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { opacity: contentFade, transform: [{ translateY: contentY }] },
          ]}
        >
          {/* Header Title */}
          <View style={styles.introBlock}>
            <Text style={styles.eyebrow}>PANTRY SCAN · {pass.countryName}</Text>
            <Text style={styles.heading}>What’s in your kitchen?</Text>
            <Text style={styles.supportingCopy}>
              Point your camera or tap what you have. Mama makes dinner with anything.
            </Text>
          </View>

          {/* Mama Live Guidance Stage */}
          <View style={styles.mamaGreetingCard}>
            <MamaCharacter pose="thinking" size={48} isSpeaking={true} />
            <View style={styles.mamaBubble}>
              <Text style={styles.mamaBubbleText}>
                &ldquo;Don&apos;t worry if your fridge is almost empty! Even with 2 eggs and sweet onions, I will find you a feast.&rdquo;
              </Text>
            </View>
          </View>

          {/* Camera Viewfinder */}
          <IngredientViewfinder isScanning={isScanning} />

          {/* Quick Staple Chips */}
          <View style={styles.quickStaplesCard}>
            <Text style={styles.quickStaplesLabel}>QUICK SELECT YOUR STAPLES</Text>
            <View style={styles.quickChipsGrid}>
              {QUICK_STAPLES.map((item) => {
                const isSelected = selectedQuickItems.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.stapleChip, isSelected && styles.stapleChipSelected]}
                    onPress={() => toggleQuickStaple(item)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={14}
                      color={isSelected ? colors.snow100 : colors.primary}
                    />
                    <Text style={[styles.stapleChipText, isSelected && styles.stapleChipTextSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Capture Shutter & Controls */}
          <CaptureControls
            onCapture={handleCapture}
            onGalleryPress={handleCapture}
            onFlashToggle={() => {}}
          />

          {/* Capture Guidance Card */}
          <CaptureGuidanceCard />

          {/* Manual Entry Button */}
          <ManualEntryAction onPress={() => navigation.navigate('ConfirmYourPantry')} />
        </Animated.View>
      </ScrollView>
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
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.white,
    zIndex: 99,
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
  quickStaplesCard: {
    backgroundColor: colors.snow100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    padding: 14,
    gap: 8,
  },
  quickStaplesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.6,
  },
  quickChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stapleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.snow200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  stapleChipSelected: {
    backgroundColor: colors.primary,
  },
  stapleChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontWeight: '500',
  },
  stapleChipTextSelected: {
    color: colors.snow100,
    fontWeight: '600',
  },
});

export default WhatsInYourKitchen;
