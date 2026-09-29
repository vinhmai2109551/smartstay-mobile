import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { AppNotification } from '@/types/notification';

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

const TYPE_STYLE: Record<string, { icon: IconName; tone: Tone }> = {
  BOOKING_CONFIRMED: { icon: 'checkmark-circle', tone: 'primary' },
  BOOKING_CANCELLED: { icon: 'close-circle', tone: 'danger' },
  CHECKED_IN: { icon: 'key', tone: 'success' },
  CHECKED_OUT: { icon: 'exit', tone: 'neutral' },
  PAYMENT_PAID: { icon: 'wallet', tone: 'success' },
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
 * Where tapping a notification leads: a review reply opens the room page (where the
 * reply is shown), everything else is about a booking.
 */
export function openNotificationTarget(notification: Pick<AppNotification, 'type' | 'bookingId' | 'roomTypeId'>) {
  if (notification.type === 'REVIEW_REPLIED' && notification.roomTypeId) {
    router.push(`/room/${notification.roomTypeId}`);
  } else if (notification.bookingId) {
    router.push(`/booking/${notification.bookingId}`);
  } else {
    router.navigate('/(tabs)/bookings');
  }
}
