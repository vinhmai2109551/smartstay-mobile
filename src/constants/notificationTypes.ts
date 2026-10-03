import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { AppNotification } from '@/types/notification';

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

const TYPE_STYLE: Record<string, { icon: IconName; tone: Tone }> = {
  BOOKING_CREATED: { icon: 'calendar', tone: 'primary' },
  BOOKING_CONFIRMED: { icon: 'checkmark-circle', tone: 'primary' },
  BOOKING_CANCELLED: { icon: 'close-circle', tone: 'danger' },
  BOOKING_CHECKED_IN: { icon: 'key', tone: 'success' },
  BOOKING_CHECKED_OUT: { icon: 'exit', tone: 'neutral' },
  PAYMENT_SUCCESS: { icon: 'wallet', tone: 'success' },
  PAYMENT_FAILED: { icon: 'alert-circle', tone: 'danger' },
  REVIEW_REPLIED: { icon: 'chatbubble-ellipses', tone: 'warning' },
};
const DEFAULT_STYLE: { icon: IconName; tone: Tone } = { icon: 'notifications', tone: 'primary' };

/** Icon and accent colour for a notification type, matching the web bell's colour dots. */
export function useNotificationStyle() {
  const theme = useTheme();
  const toneColor: Record<Tone, string> = {
    primary: theme.primary,
    success: theme.success,
    danger: theme.danger,
    warning: theme.accent,
    neutral: theme.textSecondary,
  };
  return (type: string) => {
    const { icon, tone } = TYPE_STYLE[type] ?? DEFAULT_STYLE;
    return { icon, color: toneColor[tone] };
  };
}

/**
 * Where tapping a notification leads: its booking. For a review reply that's also
 * right — the booking screen shows the guest's review together with the hotel's reply.
 */
export function openNotificationTarget(notification: Pick<AppNotification, 'bookingId'>) {
  if (notification.bookingId) {
    router.push(`/booking/${notification.bookingId}`);
  } else {
    router.navigate('/(tabs)/bookings');
  }
}
