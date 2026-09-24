import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { roomImageSource } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { Booking } from '@/types/booking';
import { formatVND } from '@/utils/currency';
import { formatDate, nightsBetween } from '@/utils/date';

export function BookingCard({ booking, onPress }: { booking: Booking; onPress?: () => void }) {
  const theme = useTheme();
  const shadows = useShadows();
  const image = roomImageSource(booking.roomType);
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Đơn ${booking.roomType.name}, ${formatDate(booking.checkInDate)} đến ${formatDate(booking.checkOutDate)}`}
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
            Mã đơn #{booking.bookingId.slice(0, 8).toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.bottom}>
        <View style={styles.dates}>
          <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(booking.checkInDate, 'DD/MM')} – {formatDate(booking.checkOutDate, 'DD/MM/YYYY')} · {nights}{' '}
            đêm
          </ThemedText>
        </View>
        <ThemedText style={[styles.total, { color: theme.primary }]}>{formatVND(booking.totalAmount)}</ThemedText>
      </View>
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
  total: { fontFamily: FontFamily.bold, fontSize: 16, lineHeight: 22 },
});
