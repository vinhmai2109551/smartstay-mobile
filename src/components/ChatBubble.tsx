import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RoomTypeCard } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ChatMessage } from '@/types/chat';
import { formatVND } from '@/utils/currency';
import { formatDate } from '@/utils/date';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.alignEnd : styles.alignStart]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: isUser ? theme.primary : theme.backgroundElement },
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}>
        <ThemedText style={{ color: isUser ? theme.primaryText : theme.text }}>{message.message}</ThemedText>
      </View>

      {message.dataCard?.roomTypes?.length ? (
        <View style={styles.cards}>
          {message.dataCard.roomTypes.map((roomType) => (
            <RoomTypeCard
              key={roomType.id}
              roomType={roomType}
              onPress={() => router.push(`/room/${roomType.id}`)}
            />
          ))}
        </View>
      ) : null}

      {message.dataCard?.booking ? (
        <View style={[styles.bookingCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <View style={styles.bookingHeader}>
            <ThemedText type="smallBold">Đơn đặt phòng</ThemedText>
            <StatusBadge status={message.dataCard.booking.status} />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(message.dataCard.booking.checkIn)} - {formatDate(message.dataCard.booking.checkOut)}
          </ThemedText>
          {message.dataCard.booking.totalAmount ? (
            <ThemedText type="smallBold" themeColor="primary">
              {formatVND(message.dataCard.booking.totalAmount)}
            </ThemedText>
          ) : null}
          <ThemedText
            type="link"
            themeColor="primary"
            onPress={() => router.push(`/booking/${message.dataCard!.booking!.id}`)}>
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
  bookingCard: {
    width: 240,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
