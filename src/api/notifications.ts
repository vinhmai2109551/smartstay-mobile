import { apiClient } from './client';
import { NotificationPage } from '@/types/notification';

// Must match PAGE_SIZE in the backend NotificationService.
export const NOTIFICATION_PAGE_SIZE = 20;

// Always the signed-in user's own notifications — the backend takes the user from the token.
export const notificationsApi = {
  list: (page = 1) => apiClient.get<NotificationPage>('/notifications', { params: { page } }).then((r) => r.data),

  unreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch<{ message: string }>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => apiClient.patch<{ message: string }>('/notifications/read-all').then((r) => r.data),
};
