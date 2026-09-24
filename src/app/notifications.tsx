import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { notificationsApi } from '@/api/notifications';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/utils/date';

export default function NotificationsScreen() {
  const theme = useTheme();
  const fetchNotifications = useCallback(() => notificationsApi.list(), []);
  const { data, loading, error, refetch, refreshing, refresh } = useApi(fetchNotifications);

  if (error && !data) return <ErrorView message={error} onRetry={refetch} />;

  const notifications = data?.data ?? [];

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
          loading ? (
            <View style={styles.skeletons}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={84} radius={Radius.lg} />
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="notifications-off-outline"
              title="Chưa có thông báo"
              description="Cập nhật về đơn đặt phòng và ưu đãi sẽ xuất hiện ở đây."
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: notification }) => {
          const unread = !notification.isRead;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${unread ? 'Chưa đọc. ' : ''}${notification.title}`}
              onPress={() => {
                if (unread) {
                  notificationsApi.markRead(notification.id).then(refetch);
                }
              }}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: unread ? theme.primarySoft : theme.backgroundElement,
                  borderColor: unread ? 'transparent' : theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View style={[styles.iconCircle, { backgroundColor: unread ? theme.primary : theme.backgroundSelected }]}>
                <Ionicons
                  name={unread ? 'notifications' : 'notifications-outline'}
                  size={18}
                  color={unread ? theme.primaryText : theme.textSecondary}
                />
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
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatDateTime(notification.createdAt)}
                </ThemedText>
              </View>
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: Space.lg, paddingBottom: Space['3xl'] },
  skeletons: { gap: Space.md },
  separator: { height: Space.md },
  item: {
    flexDirection: 'row',
    gap: Space.md,
    padding: Space.lg,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: Space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  title: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
