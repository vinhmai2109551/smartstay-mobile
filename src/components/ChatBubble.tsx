import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { RoomTypeCard } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FontFamily, MaxContentWidth, Radius, Space } from '@/constants/theme';
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
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isUser = message.role === 'USER';
  // Rich cards take ~3/4 of the screen, capped for tablets.
  const cardWidth = Math.round(Math.min(Math.min(width, MaxContentWidth) * 0.74, 320));

  return (
    <View style={[styles.container, isUser ? styles.alignEnd : styles.alignStart]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: theme.primary }]
            : [styles.bubbleAssistant, { backgroundColor: theme.backgroundElement, borderColor: theme.border }],
        ]}>
        <ThemedText type="body" style={{ color: isUser ? theme.primaryText : theme.text }}>
          {message.content}
        </ThemedText>
      </View>

      {message.rooms?.length ? (
        <View style={[styles.cards, { width: cardWidth }]}>
          {message.rooms.map((roomType) => (
            <RoomTypeCard
              key={roomType.roomTypeId}
              roomType={roomType}
              imageHeight={140}
              onPress={() => router.push(`/room/${roomType.roomTypeId}`)}
            />
          ))}
        </View>
      ) : null}

      {message.pendingBooking ? (
        <Card style={[styles.card, { width: cardWidth }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="calendar" size={16} color={theme.primary} />
            </View>
            <ThemedText type="smallBold">{t('chat.confirmBookingCard')}</ThemedText>
          </View>
          <ThemedText type="bodyBold">{message.pendingBooking.roomTypeName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('chat.pendingBookingDates', {
              checkIn: formatDate(message.pendingBooking.checkIn),
              checkOut: formatDate(message.pendingBooking.checkOut),
              nights: message.pendingBooking.nights,
            })}
          </ThemedText>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.totalRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('booking.total')}
            </ThemedText>
            <ThemedText style={[styles.total, { color: theme.primary }]}>
              {formatVND(message.pendingBooking.totalAmount)}
            </ThemedText>
          </View>
          <Button
            label={t('chat.confirmBookingCard')}
            size="sm"
            icon="checkmark"
            loading={confirming}
            onPress={() => onConfirmBooking?.(message.pendingBooking!.proposalId)}
          />
        </Card>
      ) : null}

      {message.booking ? (
        <Card style={[styles.card, { width: cardWidth }]}>
          <View style={styles.bookingHeader}>
            <ThemedText type="smallBold">{t('chat.bookingCard')}</ThemedText>
            <StatusBadge status={message.booking.status} />
          </View>
          <ThemedText style={[styles.total, { color: theme.primary }]}>
            {formatVND(message.booking.totalAmount)}
          </ThemedText>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/booking/${message.booking!.bookingId}`)}
            hitSlop={8}
            style={styles.link}>
            <ThemedText type="smallBold" themeColor="primary">
              {t('chat.viewBookingDetail')}
            </ThemedText>
            <Ionicons name="arrow-forward" size={16} color={theme.primary} />
          </Pressable>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Space.sm, maxWidth: '86%' },
  alignEnd: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignStart: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
  },
  bubbleUser: { borderBottomRightRadius: Space.xs },
  bubbleAssistant: { borderBottomLeftRadius: Space.xs, borderWidth: StyleSheet.hairlineWidth },
  cards: { gap: Space.md },
  card: { gap: Space.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  cardIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Space.xs },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 24 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Space.sm },
  link: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, minHeight: 28 },
});
