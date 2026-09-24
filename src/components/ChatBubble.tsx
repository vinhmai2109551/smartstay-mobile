import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RoomTypeCard } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ChatMessage } from '@/types/chat';
import { formatVND } from '@/utils/currency';
import { formatDate } from '@/utils/date';

export function ChatBubble({
  message,
  onConfirmBooking,
  confirming,
}: {
  message: ChatMessage;
  onConfirmBooking?: (proposalId: string) => void;
  confirming?: boolean;
}) {
  const theme = useTheme();
  const isUser = message.role === 'USER';

  return (
    <View style={[styles.container, isUser ? styles.alignEnd : styles.alignStart]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: isUser ? theme.primary : theme.backgroundElement },
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}>
        <ThemedText style={{ color: isUser ? theme.primaryText : theme.text }}>{message.content}</ThemedText>
      </View>

      {message.rooms?.length ? (
        <View style={styles.cards}>
          {message.rooms.map((roomType) => (
            <RoomTypeCard
              key={roomType.roomTypeId}
              roomType={roomType}
              onPress={() => router.push(`/room/${roomType.roomTypeId}`)}
            />
          ))}
        </View>
      ) : null}

      {message.pendingBooking ? (
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Xác nhận đặt phòng</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {message.pendingBooking.roomTypeName}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(message.pendingBooking.checkIn)} - {formatDate(message.pendingBooking.checkOut)} ·{' '}
            {message.pendingBooking.nights} đêm
          </ThemedText>
          <ThemedText type="smallBold" themeColor="primary">
            {formatVND(message.pendingBooking.totalAmount)}
          </ThemedText>
          <Button
            label="Xác nhận đặt phòng"
            loading={confirming}
            onPress={() => onConfirmBooking?.(message.pendingBooking!.proposalId)}
          />
        </View>
      ) : null}

      {message.booking ? (
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <View style={styles.bookingHeader}>
            <ThemedText type="smallBold">Đơn đặt phòng</ThemedText>
            <StatusBadge status={message.booking.status} />
          </View>
          <ThemedText type="smallBold" themeColor="primary">
            {formatVND(message.booking.totalAmount)}
          </ThemedText>
          <ThemedText
            type="link"
            themeColor="primary"
            onPress={() => router.push(`/booking/${message.booking!.bookingId}`)}>
            Xem chi tiết đơn →
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, maxWidth: '90%' },
  alignEnd: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignStart: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderBottomLeftRadius: 4 },
  cards: { gap: Spacing.two, width: 240 },
  card: {
    width: 240,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
