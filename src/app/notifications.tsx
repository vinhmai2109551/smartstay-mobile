import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { openNotificationTarget, useNotificationStyle } from '@/constants/notificationTypes';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotificationStore } from '@/store/notificationStore';
import { AppNotification } from '@/types/notification';
import { formatDateTime } from '@/utils/date';

dayjs.extend(relativeTime);

// Matches the backend's RECENT_LIMIT — the feed never returns more than this.
const FEED_LIMIT = 20;

type GroupKey = 'groupToday' | 'groupYesterday' | 'groupThisWeek' | 'groupEarlier';

function groupOf(createdAt: string): GroupKey {
  const days = dayjs().startOf('day').diff(dayjs(createdAt).startOf('day'), 'day');
  if (days <= 0) return 'groupToday';
  if (days === 1) return 'groupYesterday';
  if (days < 7) return 'groupThisWeek';
  return 'groupEarlier';
}

// Relative time within a week ("5 phút trước"), a full date beyond that.
function timeLabel(createdAt: string) {
  const date = dayjs(createdAt);
  return dayjs().diff(date, 'day') < 7 ? date.fromNow() : formatDateTime(createdAt);
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styleFor = useNotificationStyle();
  const { items, unreadCount, loading, refreshing, error, fetch, markRead, markAllRead } = useNotificationStore();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const canMarkAll = unreadCount > 0 && !markingAll;

  // Same action as the web bell's "Đánh dấu đã đọc hết"; the store updates the list optimistically.
  const handleMarkAll = async () => {
    if (!canMarkAll) return;
    setMarkingAll(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await markAllRead();
    } finally {
      setMarkingAll(false);
    }
  };

  // The socket keeps the feed live; this just catches anything missed while it was down.
  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch]),
  );

  const sections = useMemo(() => {
    const visible = onlyUnread ? items.filter((item) => !item.isRead) : items;
    const groups = new Map<GroupKey, AppNotification[]>();
    for (const item of visible) {
      const key = groupOf(item.createdAt);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups].map(([key, data]) => ({ key, title: t(`notifications.${key}`), data }));
  }, [items, onlyUnread, t]);

  if (error && !loading && items.length === 0) {
    return <ErrorView message={error} onRetry={() => fetch({ silent: false })} />;
  }

  const handlePress = (notification: AppNotification) => {
    markRead(notification.notificationId);
    openNotificationTarget(notification);
  };

  const header = (
    <View style={styles.header}>
      {/* Only while something is unread — once caught up, the dimmed rows already say so. */}
      {unreadCount > 0 ? (
        <View style={[styles.summary, { backgroundColor: theme.primarySoft }]}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="notifications" size={20} color={theme.primaryText} />
            </View>
            <ThemedText type="bodyBold" style={styles.summaryText}>
              {t('notifications.unreadSummary', { count: unreadCount })}
            </ThemedText>
          </View>
          <Button
            label={t('notifications.markAllRead')}
            icon="checkmark-done"
            variant="secondary"
            size="sm"
            onPress={handleMarkAll}
            loading={markingAll}
          />
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <View style={styles.filters}>
          <Chip label={t('notifications.filterAll')} selected={!onlyUnread} onPress={() => setOnlyUnread(false)} />
          <Chip
            label={unreadCount > 0 ? `${t('notifications.filterUnread')} (${unreadCount})` : t('notifications.filterUnread')}
            selected={onlyUnread}
            onPress={() => setOnlyUnread(true)}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={92} radius={Radius.lg} />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('notifications.markAllRead')}
              accessibilityState={{ disabled: !canMarkAll }}
              onPress={handleMarkAll}
              disabled={!canMarkAll}
              hitSlop={10}
              style={({ pressed }) => [styles.headerAction, { opacity: !canMarkAll ? 0.35 : pressed ? 0.6 : 1 }]}>
              <Ionicons name="checkmark-done" size={24} color={theme.primary} />
            </Pressable>
          ),
        }}
      />
      <SectionList
        sections={loading ? [] : sections}
        keyExtractor={(item) => item.notificationId}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetch({ silent: false })}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={header}
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
        ListFooterComponent={
          !loading && !onlyUnread && items.length >= FEED_LIMIT ? (
            <ThemedText type="caption" themeColor="textSecondary" style={styles.footer}>
              {t('notifications.recentLimitNote', { count: FEED_LIMIT })}
            </ThemedText>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            {section.title}
          </ThemedText>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: notification, index }) => {
          const unread = !notification.isRead;
          const { icon, color } = styleFor(notification.type);
          const opensRoom = notification.type === 'REVIEW_REPLIED' && !!notification.roomTypeId;
          const hasTarget = opensRoom || !!notification.bookingId;
          return (
            <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 40)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('notifications.itemAccessibility', {
                  prefix: unread ? t('notifications.unreadPrefix') : '',
                  title: notification.title,
                  body: notification.message,
                })}
                onPress={() => handlePress(notification)}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: unread ? theme.primarySoft : theme.backgroundElement,
                    borderColor: unread ? theme.primary : theme.border,
                    borderLeftWidth: unread ? 3 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.iconCircle,
                    unread ? { backgroundColor: color } : { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <Ionicons name={icon} size={20} color={unread ? theme.primaryText : theme.textSecondary} />
                </View>
                {/* Read rows are dimmed so unread ones stand out at a glance. */}
                <View style={[styles.body, !unread && styles.readBody]}>
                  <View style={styles.titleRow}>
                    <ThemedText type={unread ? 'smallBold' : 'small'} style={styles.title}>
                      {notification.title}
                    </ThemedText>
                    {unread ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {notification.message}
                  </ThemedText>
                  <View style={styles.metaRow}>
                    <View style={styles.time}>
                      <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                      <ThemedText type="caption" themeColor="textSecondary">
                        {timeLabel(notification.createdAt)}
                      </ThemedText>
                    </View>
                    {hasTarget ? (
                      <View style={styles.link}>
                        <ThemedText type="caption" themeColor="primary">
                          {opensRoom ? t('notifications.viewRoom') : t('notifications.viewBooking')}
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
  header: { gap: Space.lg },
  summary: { gap: Space.md, padding: Space.lg, borderRadius: Radius.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1 },
  readBody: { opacity: 0.6 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  filters: { flexDirection: 'row', gap: Space.sm },
  headerAction: { padding: Space.xs },
  skeletons: { gap: Space.md },
  sectionTitle: { marginTop: Space.xl, marginBottom: Space.sm, textTransform: 'uppercase', letterSpacing: 0.6 },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  footer: { textAlign: 'center', marginTop: Space.xl },
});
