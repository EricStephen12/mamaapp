import * as Haptics from 'expo-haptics';

/**
 * Signature Mama Kitchen Tactile Haptics
 * Gives the app an unmistakable physical feel in the user's hand.
 */

const safeImpact = (style: Haptics.ImpactFeedbackStyle) => {
  try {
    Haptics.impactAsync(style).catch(() => {});
  } catch {
    // Haptics unsupported on web / simulator
  }
};

/**
 * Signature 3-tick dice rattle rhythm (like shaking dice in a wooden bowl)
 * Returns a cleanup function to cancel pending ticks if unmounted.
 */
export function playDiceRattleHaptics(): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];

  safeImpact(Haptics.ImpactFeedbackStyle.Light);
  timers.push(setTimeout(() => safeImpact(Haptics.ImpactFeedbackStyle.Light), 150));
  timers.push(setTimeout(() => safeImpact(Haptics.ImpactFeedbackStyle.Medium), 340));
  timers.push(setTimeout(() => safeImpact(Haptics.ImpactFeedbackStyle.Light), 510));

  return () => {
    timers.forEach((t) => clearTimeout(t));
  };
}

/**
 * Deep satisfying counter-thud when a new meal reveals from the dice.
 */
export function playRevealThudHaptics(): void {
  safeImpact(Haptics.ImpactFeedbackStyle.Heavy);
  setTimeout(() => safeImpact(Haptics.ImpactFeedbackStyle.Light), 95);
}

/**
 * Subtle tactile notch when a meal card snaps into the center of the deck.
 */
export function playCardSnapHaptics(): void {
  safeImpact(Haptics.ImpactFeedbackStyle.Light);
}
