import { useNotificationStore } from '@/store/notificationStore';

/**
 * Unread notification count for the bell badges. Kept current by the realtime
 * socket (see useRealtimeNotifications), so no fetching is needed here.
 */
export function useUnreadNotifications() {
  return useNotificationStore((s) => s.unreadCount);
}
