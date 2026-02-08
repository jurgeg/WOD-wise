import { Platform } from 'react-native';

/**
 * Haptic feedback utilities. Falls back to no-op on web/unsupported platforms.
 */

let Haptics: typeof import('expo-haptics') | null = null;

// Lazy-load expo-haptics (only on native platforms)
async function getHaptics() {
  if (Platform.OS === 'web') return null;
  if (!Haptics) {
    try {
      Haptics = await import('expo-haptics');
    } catch {
      return null;
    }
  }
  return Haptics;
}

export const haptics = {
  /** Light tap — for button presses, selections. */
  async light() {
    const h = await getHaptics();
    h?.impactAsync(h.ImpactFeedbackStyle.Light);
  },

  /** Medium tap — for toggles, confirmations. */
  async medium() {
    const h = await getHaptics();
    h?.impactAsync(h.ImpactFeedbackStyle.Medium);
  },

  /** Heavy tap — for significant actions. */
  async heavy() {
    const h = await getHaptics();
    h?.impactAsync(h.ImpactFeedbackStyle.Heavy);
  },

  /** Success notification — for completed actions. */
  async success() {
    const h = await getHaptics();
    h?.notificationAsync(h.NotificationFeedbackType.Success);
  },

  /** Error notification — for failed actions. */
  async error() {
    const h = await getHaptics();
    h?.notificationAsync(h.NotificationFeedbackType.Error);
  },

  /** Warning notification. */
  async warning() {
    const h = await getHaptics();
    h?.notificationAsync(h.NotificationFeedbackType.Warning);
  },

  /** Selection change — for tab switches, picker changes. */
  async selection() {
    const h = await getHaptics();
    h?.selectionAsync();
  },
};
