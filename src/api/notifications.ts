import { apiClient } from './client';
import { NotificationFeed } from '@/types/notification';

// Always the signed-in user's own notifications — the backend takes the user from the token.
export const notificationsApi = {
  feed: () => apiClient.get<NotificationFeed>('/notifications').then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch<{ message: string }>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => apiClient.patch<{ message: string }>('/notifications/read-all').then((r) => r.data),
};
