import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
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

dayjs.extend(relativeTime);

type GroupKey = 'groupToday' | 'groupYesterday' | 'groupThisWeek' | 'groupEarlier';

function groupOf(createdAt: string): GroupKey {
  const days = dayjs().startOf('day').diff(dayjs(createdAt).startOf('day'), 'day');
  if (days <= 0) return 'groupToday';
  if (days === 1) return 'groupYesterday';
  if (days < 7) return 'groupThisWeek';
  return 'groupEarlier';
}

// Clock time plus how long ago, e.g. "14:29 · 23 phút trước". Rows are already grouped
// by day, so older rows show their date instead of the relative part.
function timeLabel(createdAt: string) {
  const date = dayjs(createdAt);
  const clock = date.format('HH:mm');
  return dayjs().diff(date, 'day') < 7 ? `${clock} · ${date.fromNow()}` : `${clock} · ${date.format('DD/MM/YYYY')}`;
}

// Older notifications stored raw ISO dates in their text ("2026-10-08T00:00:00.000Z");
// show them as DD/MM/YYYY. UTC date, matching how the backend formats booking days.
const ISO_DATE_IN_TEXT = /\b(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g;
function formatBody(text: string) {
  return text.replace(ISO_DATE_IN_TEXT, (_, y, m, d) => `${d}/${m}/${y}`);
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styleFor = useNotificationStyle();
  const { items, total, unreadCount, loading, refreshing, loadingMore, error, fetch, loadMore, markRead, markAllRead } =
    useNotificationStore();
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
    markRead(notification.id);
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
        keyExtractor={(item) => item.id}
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
        // The backend pages by 20; fetch the next page as the end comes into view.
        onEndReached={() => {
          if (!loading && items.length < total) loadMore();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : null}
        renderSectionHeader={({ section }) => (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            {section.title}
          </ThemedText>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: notification, index }) => {
          const unread = !notification.isRead;
          const { icon, color } = styleFor(notification.type);
          return (
            <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 40)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('notifications.itemAccessibility', {
                  prefix: unread ? t('notifications.unreadPrefix') : '',
                  title: notification.title,
                  body: formatBody(notification.body),
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
                    {formatBody(notification.body)}
                  </ThemedText>
                  <View style={styles.metaRow}>
                    <View style={styles.time}>
                      <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                      <ThemedText type="caption" themeColor="textSecondary">
                        {timeLabel(notification.createdAt)}
                      </ThemedText>
                    </View>
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
