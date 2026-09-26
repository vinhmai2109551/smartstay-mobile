import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { RatingStars } from '@/components/RatingStars';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Review } from '@/types/review';
import { formatDate } from '@/utils/date';

/** One review with its author, stars, comment and — when the hotel answered — its reply. */
export function ReviewCard({ review }: { review: Review }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Card style={styles.card} elevation="none">
      <View style={styles.header}>
        <Avatar name={review.authorName} size={36} tone="soft" />
        <View style={styles.author}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {review.authorName}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {formatDate(review.reviewDate)}
          </ThemedText>
        </View>
        <RatingStars rating={review.rating} size={12} />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {review.comment}
      </ThemedText>

      {review.reply ? (
        <View style={[styles.reply, { backgroundColor: theme.primarySoft, borderLeftColor: theme.primary }]}>
          <View style={styles.replyTitle}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.primary} />
            <ThemedText type="caption" themeColor="primary">
              {t('booking.reviewHotelReply')}
            </ThemedText>
          </View>
          <ThemedText type="small">{review.reply}</ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Space.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  author: { flex: 1 },
  reply: {
    gap: Space.xs,
    padding: Space.md,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
  },
  replyTitle: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
});
