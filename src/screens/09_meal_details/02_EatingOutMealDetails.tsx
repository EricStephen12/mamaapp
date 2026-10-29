import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
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
import { TactileToast } from '../../components/common/TactileToast';
import { preferencesStore, convertMealCost } from '../../services/preferencesStore';

type Props = NativeStackScreenProps<RootStackParamList, 'EatingOutMealDetails'>;

export const EatingOutMealDetails: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params || {};
  const pass = preferencesStore.getKitchenPass();

  const dishName = params.dishName || 'Smoked Garlic Paitan Ramen';
  const spotName = params.spotName || 'Koyo Izakaya & Bowls';
  const distance = params.distance || '0.4 mi away';
  const price = params.price || convertMealCost(14, pass.currencyCode, pass.currencySymbol);
  const vibe = params.vibe || 'Warm timber counter, zero wait';
  const image =
    params.image ||
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80';

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleChooseForToday = () => {
    preferencesStore.recordMealDecision(dishName, 'cooked', 14);
    setToastMessage(`Mama: "Enjoy your dinner at ${spotName}! Rest your feet."`);
    setTimeout(() => {
      navigation.navigate('YourDailyEdit');
    }, 900);
  };

  const handleSaveToggle = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    setToastMessage(nextState ? 'Saved spot to your collection!' : 'Removed from collection');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Masthead */}
      <View style={styles.masthead}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Takeout Spot</Text>

        <TouchableOpacity
          onPress={handleSaveToggle}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isBookmarked ? colors.primary : colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, { opacity: contentFade, transform: [{ translateY: contentY }] }]}>
          {/* Hero Image */}
          <View style={styles.heroWrap}>
            <Image source={{ uri: image }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.distanceTag}>
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Text style={styles.distanceTagText}>{distance}</Text>
            </View>
          </View>

          {/* Title & Price */}
          <View style={styles.titleRow}>
            <View style={styles.titleTextWrap}>
              <Text style={styles.dishHeading}>{dishName}</Text>
              <Text style={styles.spotSub}>{spotName}</Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.priceVal}>{price}</Text>
              <Text style={styles.priceSub}>est. takeout</Text>
            </View>
          </View>

          {/* Mama Reassurance Note */}
          <View style={styles.mamaCard}>
            <MamaCharacter pose="welcoming" size={54} isSpeaking={true} />
            <View style={styles.mamaTextWrap}>
              <Text style={styles.mamaTitle}>MAMA&apos;S NOTE</Text>
              <Text style={styles.mamaQuote}>
                &ldquo;You worked all day, my child. Tonight, zero guilt! Let someone else wash the pots.&rdquo;
              </Text>
            </View>
          </View>

          {/* Vibe & Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsHeading}>Neighborhood Vibe</Text>
            <Text style={styles.vibeText}>&ldquo;{vibe}&rdquo;</Text>
            <View style={styles.detailsRow}>
              <View style={styles.detailBadge}>
                <Ionicons name="walk-outline" size={14} color={colors.primary} />
                <Text style={styles.detailBadgeText}>{distance}</Text>
              </View>
              <View style={styles.detailBadge}>
                <Ionicons name="bag-handle-outline" size={14} color={colors.primary} />
                <Text style={styles.detailBadgeText}>Quick Pickup</Text>
              </View>
            </View>
          </View>

          {/* Action Button: "Eat Out Tonight" */}
          <TouchableOpacity
            style={styles.eatOutBtn}
            onPress={handleChooseForToday}
            activeOpacity={0.88}
          >
            <Ionicons name="restaurant-outline" size={18} color={colors.snow100} />
            <Text style={styles.eatOutBtnText}>Choose for Tonight</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Floating In-App Toast */}
      <TactileToast
        visible={!!toastMessage}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
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
  headerTitle: {
    fontSize: typography.fontSize.sub,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  backButton: {
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
    paddingBottom: 32,
  },
  container: {
    gap: 16,
  },
  heroWrap: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.snow200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  distanceTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  distanceTagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleTextWrap: {
    flex: 1,
  },
  dishHeading: {
    fontSize: 22,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 28,
  },
  spotSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  pricePill: {
    alignItems: 'flex-end',
    backgroundColor: colors.snow200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  priceSub: {
    fontSize: 10,
    color: colors.text.muted,
  },
  mamaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FAF6EF',
    borderWidth: 1,
    borderColor: '#ECE4D4',
    borderRadius: 18,
    padding: 14,
  },
  mamaTextWrap: {
    flex: 1,
    gap: 2,
  },
  mamaTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  mamaQuote: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  detailsCard: {
    backgroundColor: colors.snow100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    padding: 18,
    gap: 10,
  },
  detailsHeading: {
    fontSize: 16,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
  },
  vibeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.snow200,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  detailBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  eatOutBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  eatOutBtnText: {
    fontSize: typography.fontSize.sub,
    fontWeight: '700',
    color: colors.snow100,
  },
});

export default EatingOutMealDetails;
