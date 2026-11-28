import { Platform } from 'react-native';
import {
  AndroidImportance,
  SchedulableTriggerInputTypes,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { preferencesStore, formatCurrency } from './preferencesStore';
import { pantryService } from './api/pantryService';
import { tokenStore } from './api/tokenStore';

const MAMA_CHANNEL_ID = 'mama-nudges';

// Configure foreground banner behavior safely on native platforms
if (Platform.OS !== 'web') {
  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Safe fallback if running in an unsupported environment
  }
}

interface NudgeMessage {
  title: string;
  body: string;
}

let previewCursor = 0;

function getLocalDeliveryApp(countryId: string): string {
  switch ((countryId || '').toUpperCase()) {
    case 'NG':
      return 'Chowdeck';
    case 'GB':
    case 'UK':
      return 'Deliveroo';
    case 'US':
    case 'CA':
      return 'DoorDash';
    case 'GH':
      return 'Bolt Food';
    case 'KE':
      return 'Glovo';
    case 'ZA':
      return 'Mr D';
    case 'AU':
    case 'EU':
    default:
      return 'Uber Eats';
  }
}

function getCountryRoastNudge(
  countryId: string,
  item1: string,
  budgetLeft: string,
  hasBudgetLeft: boolean
): NudgeMessage {
  switch ((countryId || '').toUpperCase()) {
    case 'NG':
      return {
        title: 'Mama',
        body: hasBudgetLeft
          ? `You want to spend ₦12,000 on Chowdeck when ${item1} is at home? Close that app right now.`
          : `Abeg come and see what I picked with your ${item1} before you waste money tonight.`,
      };
    case 'GB':
    case 'UK':
      return {
        title: 'Mama',
        body: `£22 on Deliveroo for cold chips? Your ${item1} is literally right there. Come look.`,
      };
    case 'US':
    case 'CA':
      return {
        title: 'Mama',
        body: `$34 on DoorDash after fees?? Your ${item1} is sitting right there looking at you.`,
      };
    case 'GH':
      return {
        title: 'Mama',
        body: `Chale, put Bolt Food down. Your ${item1} is waiting — come see what I picked.`,
      };
    case 'KE':
      return {
        title: 'Mama',
        body: `Glovo again?? Come see what I picked with your ${item1} before your wallet cries.`,
      };
    case 'ZA':
      return {
        title: 'Mama',
        body: `Mr D is robbing you in broad daylight. Your ${item1} is at home — come look.`,
      };
    default:
      return {
        title: 'Mama',
        body: hasBudgetLeft
          ? `You told me you were saving ${budgetLeft} this week. Close Uber Eats right now.`
          : `Don't pay delivery fees for lukewarm food when ${item1} is sitting right there.`,
      };
  }
}

function getPersonalizedContext() {
  const pass = preferencesStore.getKitchenPass();
  const pantry = pantryService
    .getCachedPantry()
    .map((item) => item.name)
    .filter(Boolean);
  const rawName = tokenStore.getUser()?.name?.trim() || '';
  const firstName = rawName ? rawName.split(' ')[0] : '';

  const item1 = (
    pantry[0] || (pass.country === 'NG' || pass.country === 'GH' ? 'plantains' : 'eggs')
  ).toLowerCase();
  const item2 = (pantry[1] || 'rice').toLowerCase();
  const remaining = Math.max(0, (pass.weeklyBudget || 0) - (pass.spentThisWeek || 0));
  const budgetLeft = formatCurrency(remaining, pass.currencySymbol, pass.currencyCode);
  const deliveryApp = getLocalDeliveryApp(pass.country);

  return {
    countryId: pass.country || 'NG',
    firstName,
    item1,
    item2,
    budgetLeft,
    hasBudgetLeft: remaining > 0,
    deliveryApp,
  };
}

/**
 * 7 screenshot-worthy, zero-ad evening hooks — sound like a real text from Mama
 * (curiosity gaps, country-true delivery roasts, and relatable late-evening comedy).
 */
function buildEveningNudges(): NudgeMessage[] {
  const ctx = getPersonalizedContext();
  const who = ctx.firstName ? `${ctx.firstName}, ` : '';

  return [
    {
      title: 'Mama',
      body: `I already picked what you're eating tonight. Just come look.`,
    },
    getCountryRoastNudge(ctx.countryId, ctx.item1, ctx.budgetLeft, ctx.hasBudgetLeft),
    {
      title: 'Mama',
      body: `Closing the fridge and reopening it won't spawn new food. Tap here.`,
    },
    {
      title: 'Mama',
      body: `Wait... you can actually make something crazy with that ${ctx.item1} right now.`,
    },
    {
      title: 'Your bank account',
      body: ctx.hasBudgetLeft
        ? `${who}we still have ${ctx.budgetLeft} left. Please don't open ${ctx.deliveryApp} tonight.`
        : `Please. Let Mama pick dinner tonight. I am tired.`,
    },
    {
      title: 'Mama',
      body: `Your stomach is making noises and you're still scrolling. Come see tonight's plate.`,
    },
    {
      title: 'Mama',
      body: `Are you really about to eat bread and water again when ${ctx.item1} & ${ctx.item2} are right there?`,
    },
  ];
}

function buildLunchNudges(): NudgeMessage[] {
  const ctx = getPersonalizedContext();
  return [
    {
      title: 'Mama',
      body: `It's 12:37. Coffee is not lunch.`,
    },
    {
      title: 'Your bank account',
      body: `Please. Let Mama pick lunch today. I'm begging you.`,
    },
    {
      title: 'Mama',
      body: `Before you spend ${ctx.deliveryApp} money on lunch... just come look at one thing.`,
    },
  ];
}

/**
 * Escalating Duolingo-style comeback arc if the user ghosts the app.
 * Automatically pushed forward every single time the user opens Mama Dish!
 */
function buildComebackArc(): { hoursFromNow: number; msg: NudgeMessage }[] {
  const ctx = getPersonalizedContext();
  return [
    {
      hoursFromNow: 48,
      msg: {
        title: 'Mama',
        body: `Oh so we don't talk anymore? Just eating biscuits for dinner?`,
      },
    },
    {
      hoursFromNow: 96,
      msg: {
        title: 'Your fridge',
        body: `Day 4. The ${ctx.item1} asked if you're ever coming back.`,
      },
    },
    {
      hoursFromNow: 168,
      msg: {
        title: 'Mama',
        body: `Fine. Order your expensive food. Don't call me when your account hits zero.`,
      },
    },
  ];
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await setNotificationChannelAsync(MAMA_CHANNEL_ID, {
      name: 'Mama Kitchen Nudges',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#58673A',
      sound: 'default',
    });
  } catch {
    // Non-fatal in Expo Go / older Android
  }
}

function getNextWallClockDate(daysFromToday: number, hour: number, minute: number): Date {
  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);
  target.setHours(hour, minute, 0, 0);
  return target;
}

export const notificationService = {
  /** Check OS notification permission without prompting */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const { status } = await getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  /** Request OS permission, persist preference, and schedule 7 days of personalized Mama nudges */
  async enableNotifications(): Promise<'granted' | 'denied'> {
    if (Platform.OS === 'web') return 'denied';
    try {
      await ensureAndroidChannel();
      const { status: existing } = await getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const req = await requestPermissionsAsync();
        finalStatus = req.status;
      }

      if (finalStatus !== 'granted') {
        preferencesStore.setNotificationsEnabled(false);
        return 'denied';
      }

      preferencesStore.setNotificationsEnabled(true);
      await this.syncSchedule();
      return 'granted';
    } catch (err) {
      if (__DEV__) console.warn('[notificationService] Enable error:', err);
      return 'denied';
    }
  },

  /** Turn off all Mama nudges cleanly */
  async disableNotifications(): Promise<void> {
    preferencesStore.setNotificationsEnabled(false);
    if (Platform.OS === 'web') return;
    try {
      await cancelAllScheduledNotificationsAsync();
    } catch {
      // Ignore
    }
  },

  /** Quietly refresh the 7-day rolling schedule + reset the comeback arc whenever user opens the app */
  async syncScheduleIfEnabled(): Promise<void> {
    if (Platform.OS === 'web') return;
    const pass = preferencesStore.getKitchenPass();
    if (!pass.notificationsEnabled) return;
    const permitted = await this.hasPermission();
    if (!permitted) return;
    await this.syncSchedule();
  },

  /**
   * Cancels old scheduled nudges and schedules:
   * - 7 unique evening hooks (7:17 PM / 7:47 PM — odd human minutes, never repeating!)
   * - 3 light lunch texts (Mon / Wed / Fri at 12:37 PM)
   * - Escalating Day 2 -> Day 4 -> Day 7 comeback drama (resets every time user opens app!)
   */
  async syncSchedule(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await ensureAndroidChannel();
      await cancelAllScheduledNotificationsAsync();

      const now = Date.now();
      const eveningPool = buildEveningNudges();
      const lunchPool = buildLunchNudges();
      const dayOffsetSeed = new Date().getDay();

      // 1. Next 7 unique evening dinner texts
      for (let d = 0; d < 7; d++) {
        const msg = eveningPool[(dayOffsetSeed + d) % eveningPool.length];
        const minute = d % 2 === 0 ? 17 : 47;
        const fireDate = getNextWallClockDate(d, 19, minute);
        if (fireDate.getTime() <= now + 60_000) continue;

        await scheduleNotificationAsync({
          content: {
            title: msg.title,
            body: msg.body,
            sound: 'default',
            data: { kind: 'evening_nudge' },
          },
          trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: fireDate,
            channelId: MAMA_CHANNEL_ID,
          },
        });
      }

      // 2. Light midday lunch texts on Mon / Wed / Fri
      let lunchIdx = 0;
      for (let d = 0; d < 7; d++) {
        const fireDate = getNextWallClockDate(d, 12, 37);
        const dow = fireDate.getDay();
        if (![1, 3, 5].includes(dow)) continue;
        if (fireDate.getTime() <= now + 60_000) continue;

        const msg = lunchPool[lunchIdx % lunchPool.length];
        lunchIdx += 1;

        await scheduleNotificationAsync({
          content: {
            title: msg.title,
            body: msg.body,
            sound: 'default',
            data: { kind: 'lunch_nudge' },
          },
          trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: fireDate,
            channelId: MAMA_CHANNEL_ID,
          },
        });
      }

      // 3. Escalating comeback arc (48h -> Day 4 -> Day 7) — pushed forward on every app open!
      const comebackArc = buildComebackArc();
      for (const beat of comebackArc) {
        const fireDate = new Date(now + beat.hoursFromNow * 60 * 60 * 1000);
        await scheduleNotificationAsync({
          content: {
            title: beat.msg.title,
            body: beat.msg.body,
            sound: 'default',
            data: { kind: `comeback_${beat.hoursFromNow}h` },
          },
          trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: fireDate,
            channelId: MAMA_CHANNEL_ID,
          },
        });
      }
    } catch (err) {
      if (__DEV__) console.warn('[notificationService] Schedule error:', err);
    }
  },

  /** Fires a real personalized Mama text in 5 seconds, rotating through different bangers each tap */
  async sendTestNudge(): Promise<'scheduled' | 'denied'> {
    if (Platform.OS === 'web') return 'denied';
    const permitted = await this.hasPermission();
    if (!permitted) {
      const req = await this.enableNotifications();
      if (req !== 'granted') return 'denied';
    }

    try {
      await ensureAndroidChannel();
      const pool = [...buildEveningNudges(), ...buildLunchNudges(), ...buildComebackArc().map((b) => b.msg)];
      const pick = pool[previewCursor % pool.length];
      previewCursor += 1;

      await scheduleNotificationAsync({
        content: {
          title: pick.title,
          body: pick.body,
          sound: 'default',
          data: { kind: 'test_nudge' },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          repeats: false,
          channelId: MAMA_CHANNEL_ID,
        },
      });
      return 'scheduled';
    } catch (err) {
      if (__DEV__) console.warn('[notificationService] Test nudge error:', err);
      return 'denied';
    }
  },
};
