import { apiClient } from './client';
import { Paginated } from '@/types/common';
import { AppNotification } from '@/types/notification';

export const notificationsApi = {
  list: (isRead?: boolean, page = 1) =>
    apiClient
      .get<Paginated<AppNotification>>('/notifications', { params: { isRead, page } })
      .then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch<{ message: string }>(`/notifications/${id}/read`).then((r) => r.data),
};
