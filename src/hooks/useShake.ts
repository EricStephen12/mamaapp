import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

export interface ShakeOptions {
  /**
   * Jerk threshold per directional swing.
   * Default: 1.55 (tuned to ignore walking and jogging bounces).
   */
  threshold?: number;
  /**
   * Minimum number of rapid direction reversals required to count as a deliberate shake.
   * Default: 3 (Left -> Right -> Left). Walking only produces 1-2 slow single-axis peaks.
   */
  minReversals?: number;
  /**
   * Maximum time allowed for all reversals in a shake sequence (in ms).
   * Default: 650ms.
   */
  shakeWindowMs?: number;
  /**
   * Debounce timeout between consecutive triggerings (in ms).
   * Default: 900ms.
   */
  timeout?: number;
  /**
   * Whether shake detection is enabled.
   * Default: true.
   */
  enabled?: boolean;
}

export function useShake(onShake: () => void, options: ShakeOptions = {}) {
  const {
    threshold = 1.55,
    minReversals = 3,
    shakeWindowMs = 650,
    timeout = 900,
    enabled = true,
  } = options;

  const lastShakeTime = useRef(0);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  const prevX = useRef(0);
  const prevY = useRef(0);
  const prevZ = useRef(0);

  // Direction reversal tracking
  const lastDirX = useRef<number>(0);
  const lastDirY = useRef<number>(0);
  const reversalCount = useRef<number>(0);
  const firstReversalTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    let subscription: { remove: () => void } | null = null;

    try {
      // 35ms update interval (~28Hz) captures rapid wrist reversal peaks without battery impact
      Accelerometer.setUpdateInterval(35);

      subscription = Accelerometer.addListener((data) => {
        const { x, y, z } = data;
        const now = Date.now();

        // 1. Calculate delta jerk per axis
        const deltaX = x - prevX.current;
        const deltaY = y - prevY.current;
        const deltaZ = z - prevZ.current;

        const absDx = Math.abs(deltaX);
        const absDy = Math.abs(deltaY);
        const absDz = Math.abs(deltaZ);
        const totalJerk = absDx + absDy + absDz;

        prevX.current = x;
        prevY.current = y;
        prevZ.current = z;

        // Reset reversals if time window expired
        if (firstReversalTime.current > 0 && now - firstReversalTime.current > shakeWindowMs) {
          reversalCount.current = 0;
          firstReversalTime.current = 0;
        }

        // 2. Reject walking & low-energy motions
        // Walking heel-strikes are mostly vertical (Z/Y) and lack rapid horizontal direction changes
        if (totalJerk < threshold) {
          return;
        }

        // 3. Detect rapid direction sign reversal on horizontal X or lateral Y axis
        // A true deliberate wrist shake alternates direction sharply (e.g. + -> - -> +)
        const currentDirX = deltaX > 0.4 ? 1 : deltaX < -0.4 ? -1 : 0;
        const currentDirY = deltaY > 0.4 ? 1 : deltaY < -0.4 ? -1 : 0;

        let reversed = false;
        if (currentDirX !== 0 && lastDirX.current !== 0 && currentDirX !== lastDirX.current) {
          reversed = true;
          lastDirX.current = currentDirX;
        } else if (currentDirX !== 0) {
          lastDirX.current = currentDirX;
        }

        if (currentDirY !== 0 && lastDirY.current !== 0 && currentDirY !== lastDirY.current) {
          reversed = true;
          lastDirY.current = currentDirY;
        } else if (currentDirY !== 0) {
          lastDirY.current = currentDirY;
        }

        if (reversed) {
          if (reversalCount.current === 0) {
            firstReversalTime.current = now;
          }
          reversalCount.current += 1;

          // 4. Verify deliberate shake criteria: at least 3 sharp reversals within the shake window
          if (
            reversalCount.current >= minReversals &&
            now - lastShakeTime.current > timeout
          ) {
            lastShakeTime.current = now;
            reversalCount.current = 0;
            firstReversalTime.current = 0;

            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {
              // Haptics optional
            }

            onShakeRef.current();
          }
        }
      });
    } catch (e) {
      console.warn('[useShake] Accelerometer initialization skipped:', e);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [threshold, minReversals, shakeWindowMs, timeout, enabled]);
}
