import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { notificationsApi } from '@/api/notifications';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApi } from '@/hooks/useApi';
import { formatDateTime } from '@/utils/date';

export default function NotificationsScreen() {
  const theme = useTheme();
  const fetchNotifications = useCallback(() => notificationsApi.list(), []);
  const { data, loading, error, refetch } = useApi(fetchNotifications);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;

  const notifications = data?.data ?? [];

  if (notifications.length === 0) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          Bạn chưa có thông báo nào.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false} contentContainerStyle={styles.list}>
      {notifications.map((notification) => (
        <Pressable
          key={notification.id}
          onPress={() => {
            if (!notification.isRead) {
              notificationsApi.markRead(notification.id).then(refetch);
            }
          }}>
          <ThemedView
            type={notification.isRead ? 'background' : 'backgroundElement'}
            style={[styles.item, { borderColor: theme.border }]}>
            <View style={styles.itemHeader}>
              <ThemedText type={notification.isRead ? 'default' : 'smallBold'} style={styles.itemTitle}>
                {notification.title}
              </ThemedText>
              {!notification.isRead ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {notification.body}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDateTime(notification.createdAt)}
            </ThemedText>
          </ThemedView>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.two },
  item: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.three, gap: 4 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { textAlign: 'center', marginTop: Spacing.six },
});
