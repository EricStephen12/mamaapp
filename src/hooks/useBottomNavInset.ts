import { Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getAndroidNavDiff(): number {
  if (Platform.OS !== 'android') return 0;
  const screenH = Dimensions.get('screen').height;
  const windowH = Dimensions.get('window').height;
  const statusH = StatusBar.currentHeight || 0;
  const rawDiff = screenH - windowH - statusH;
  return rawDiff >= 20 && rawDiff <= 96 ? rawDiff : 0;
}

/**
 * Reliable bottom inset for docked controls & tab bars.
 * Guards against Android 3-button / gesture navigation bars reporting bottom === 0.
 */
export function useBottomNavInset(minPadding: number = 12): number {
  const insets = useSafeAreaInsets();
  const androidFallback = insets.bottom === 0 ? getAndroidNavDiff() : 0;
  if (Platform.OS === 'android') {
    return Math.max(insets.bottom, androidFallback, minPadding, 18);
  }
  return Math.max(insets.bottom, minPadding);
}

/**
 * Reliable bottom inset for React Native <Modal> sheets, where Android's modal
 * window often draws behind the system navigation bar while reporting insets.bottom === 0.
 */
export function useModalBottomInset(minPadding: number = 22): number {
  const insets = useSafeAreaInsets();
  const navDiff = getAndroidNavDiff();
  if (Platform.OS === 'android') {
    return Math.max(insets.bottom, navDiff > 16 ? navDiff + 8 : 36, minPadding);
  }
  return Math.max(insets.bottom, 24, minPadding);
}

