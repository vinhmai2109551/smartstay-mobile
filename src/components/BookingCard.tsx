import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Booking } from '@/types/booking';
import { formatVND } from '@/utils/currency';
import { formatDate } from '@/utils/date';

export function BookingCard({ booking, onPress }: { booking: Booking; onPress?: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.header}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
            {booking.roomTypeName ?? 'Đơn đặt phòng'}
          </ThemedText>
          <StatusBadge status={booking.status} />
        </View>

        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
          </ThemedText>
        </View>

        {booking.totalAmount ? (
          <ThemedText type="smallBold" themeColor="primary">
            {formatVND(booking.totalAmount)}
          </ThemedText>
        ) : null}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
