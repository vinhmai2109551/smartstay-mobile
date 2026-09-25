import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { notificationsApi } from '@/api/notifications';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { AppNotification } from '@/types/notification';
import { formatDateTime } from '@/utils/date';

dayjs.extend(relativeTime);

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'primary' | 'success' | 'danger' | 'warning';

const TYPE_STYLE: Record<string, { icon: IconName; tone: Tone }> = {
  BOOKING_CREATED: { icon: 'calendar', tone: 'primary' },
  BOOKING_CONFIRMED: { icon: 'checkmark-circle', tone: 'success' },
  BOOKING_CHECKED_IN: { icon: 'key', tone: 'primary' },
  BOOKING_CHECKED_OUT: { icon: 'star', tone: 'warning' },
  BOOKING_CANCELLED: { icon: 'close-circle', tone: 'danger' },
  PAYMENT_SUCCESS: { icon: 'wallet', tone: 'success' },
  PAYMENT_FAILED: { icon: 'alert-circle', tone: 'danger' },
};
const DEFAULT_STYLE = { icon: 'notifications' as IconName, tone: 'primary' as Tone };

// Relative time for the last week ("5 phút trước"), a full date beyond that.
function timeLabel(createdAt: string) {
  const date = dayjs(createdAt);
  return dayjs().diff(date, 'day') < 7 ? date.fromNow() : formatDateTime(createdAt);
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const fetchNotifications = useCallback(() => notificationsApi.list(onlyUnread ? false : undefined), [onlyUnread]);
  const { data, loading, error, refetch, refreshing, refresh } = useApi(fetchNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  if (error && !data) return <ErrorView message={error} onRetry={refetch} />;

  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const handlePress = async (notification: AppNotification) => {
    if (!notification.isRead) {
      // Fire and forget: navigation shouldn't wait on the read receipt.
      notificationsApi.markRead(notification.id).then(refresh).catch(() => {});
    }
    if (notification.bookingId) {
      router.push(`/booking/${notification.bookingId}`);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      refresh();
    } catch {
      // Keep the list as is; the user can retry.
    } finally {
      setMarkingAll(false);
    }
  };

  const toneColor = (tone: Tone) =>
    ({ primary: theme.primary, success: theme.success, danger: theme.danger, warning: theme.accent })[tone];

  return (
    <ThemedView style={styles.flex}>
      <FlatList
        data={loading ? [] : notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.toolbar}>
              <View style={styles.filters}>
                <Chip label={t('notifications.filterAll')} selected={!onlyUnread} onPress={() => setOnlyUnread(false)} />
                <Chip label={t('notifications.filterUnread')} selected={onlyUnread} onPress={() => setOnlyUnread(true)} />
              </View>
              {hasUnread ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleMarkAll}
                  disabled={markingAll}
                  hitSlop={10}
                  style={({ pressed }) => [styles.markAll, { opacity: pressed || markingAll ? 0.6 : 1 }]}>
                  <Ionicons name="checkmark-done" size={18} color={theme.primary} />
                  <ThemedText type="smallBold" themeColor="primary">
                    {t('notifications.markAllRead')}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            {loading ? (
              <View style={styles.skeletons}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={88} radius={Radius.lg} />
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon={onlyUnread ? 'checkmark-done-outline' : 'notifications-off-outline'}
              title={onlyUnread ? t('notifications.emptyUnreadTitle') : t('notifications.emptyAllTitle')}
              description={
                onlyUnread ? t('notifications.emptyUnreadDescription') : t('notifications.emptyAllDescription')
              }
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: notification, index }) => {
          const unread = !notification.isRead;
          const { icon, tone } = TYPE_STYLE[notification.type ?? ''] ?? DEFAULT_STYLE;
          const color = toneColor(tone);
          return (
            <Animated.View entering={FadeInDown.duration(400).delay(Math.min(index, 6) * 50)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('notifications.itemAccessibility', {
                  prefix: unread ? t('notifications.unreadPrefix') : '',
                  title: notification.title,
                  body: notification.body,
                })}
                onPress={() => handlePress(notification)}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: unread ? theme.primarySoft : theme.backgroundElement,
                    borderColor: unread ? 'transparent' : theme.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <View style={[styles.iconCircle, { backgroundColor: `${color}1F` }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <ThemedText type={unread ? 'smallBold' : 'small'} style={styles.title}>
                      {notification.title}
                    </ThemedText>
                    {unread ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {notification.body}
                  </ThemedText>
                  <View style={styles.metaRow}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {timeLabel(notification.createdAt)}
                    </ThemedText>
                    {notification.bookingId ? (
                      <View style={styles.link}>
                        <ThemedText type="caption" themeColor="primary">
                          {t('notifications.viewBooking')}
                        </ThemedText>
                        <Ionicons name="chevron-forward" size={12} color={theme.primary} />
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Space.lg,
    paddingBottom: Space['3xl'],
  },
  header: { gap: Space.lg, marginBottom: Space.lg },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  filters: { flexDirection: 'row', gap: Space.sm },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, minHeight: 32 },
  skeletons: { gap: Space.md },
  separator: { height: Space.md },
  item: {
    flexDirection: 'row',
    gap: Space.md,
    padding: Space.lg,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: Space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  title: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
