import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { roomImageSource } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { Booking } from '@/types/booking';
import { formatVND } from '@/utils/currency';
import { formatDate, nightsBetween } from '@/utils/date';

type BookingCardProps = {
  booking: Booking;
  onPress?: () => void;
  /** Rating the guest gave this booking, or null when it has not been reviewed yet. */
  reviewRating?: number | null;
  /** Shown as a "Write a review" button on checked-out bookings that have no review. */
  onReview?: () => void;
};

export function BookingCard({ booking, onPress, reviewRating, onReview }: BookingCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const shadows = useShadows();
  const image = roomImageSource(booking.roomType);
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('booking.cardAccessibility', {
        name: booking.roomType.name,
        checkIn: formatDate(booking.checkInDate),
        checkOut: formatDate(booking.checkOutDate),
      })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.94 : 1 },
      ]}>
      <View style={styles.top}>
        <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
          {image ? (
            <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Ionicons name="bed-outline" size={24} color={theme.textSecondary} />
          )}
        </View>
        <View style={styles.info}>
          <StatusBadge status={booking.status} />
          <ThemedText type="bodyBold" numberOfLines={1}>
            {booking.roomType.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('booking.orderCode', { code: booking.bookingId.slice(0, 8).toUpperCase() })}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.bottom}>
        <View style={styles.dates}>
          <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            {t('booking.cardDates', {
              checkIn: formatDate(booking.checkInDate, 'DD/MM'),
              checkOut: formatDate(booking.checkOutDate, 'DD/MM/YYYY'),
              nights,
            })}
          </ThemedText>
        </View>
        <ThemedText style={[styles.total, { color: theme.primary }]}>{formatVND(booking.totalAmount)}</ThemedText>
      </View>

      {booking.status === 'CHECKED_OUT' && reviewRating != null ? (
        <View style={[styles.reviewed, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="star" size={14} color={theme.warning} />
          <ThemedText type="smallBold">{reviewRating.toFixed(1)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            · {t('booking.reviewedBadge')}
          </ThemedText>
        </View>
      ) : booking.status === 'CHECKED_OUT' && onReview ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('booking.reviewAction')}
          onPress={onReview}
          hitSlop={4}
          style={({ pressed }) => [
            styles.reviewButton,
            { borderColor: theme.primary, backgroundColor: pressed ? theme.primarySoft : 'transparent' },
          ]}>
          <Ionicons name="star-outline" size={16} color={theme.primary} />
          <ThemedText type="smallBold" themeColor="primary">
            {t('booking.reviewAction')}
          </ThemedText>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Space.lg,
    gap: Space.md,
  },
  top: { flexDirection: 'row', gap: Space.md },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: Space.xs, justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Space.sm,
    flexWrap: 'wrap',
  },
  dates: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, flexShrink: 1 },
  reviewed: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Space.xs,
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs,
    borderRadius: Radius.full,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: Radius.full,
  },
  total: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22 },
});
