import { create } from 'zustand';

import { getApiErrorMessage } from '@/api/client';
import { notificationsApi } from '@/api/notifications';
import { AppNotification, NotificationPush } from '@/types/notification';

type NotificationState = {
  items: AppNotification[];
  unreadCount: number;
  // True until the first fetch settles, so screens can show a skeleton instead of "empty".
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  // Latest push, shown as an in-app banner until dismissed.
  toast: NotificationPush | null;
  // Bumped on `booking:updated` so open booking screens know to reload.
  bookingsVersion: number;

  fetch: (options?: { silent?: boolean }) => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => Promise<void>;
  receive: (push: NotificationPush) => void;
  dismissToast: () => void;
  bumpBookings: () => void;
  reset: () => void;
};

const initialState = {
  items: [],
  unreadCount: 0,
  loading: true,
  refreshing: false,
  error: null,
  toast: null,
  bookingsVersion: 0,
};

/**
 * One copy of the notification feed shared by the bell badges, the notifications
 * screen and the realtime socket, so they never disagree about the unread count.
 */
export const useNotificationStore = create<NotificationState>()((set, get) => ({
  ...initialState,

  fetch: async ({ silent = true } = {}) => {
    if (!silent) set({ refreshing: true });
    try {
      const feed = await notificationsApi.feed();
      set({ items: feed.items, unreadCount: feed.unreadCount, error: null });
    } catch (error) {
      set({ error: getApiErrorMessage(error) });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  // Optimistic: the row turns "read" immediately; a failed request is corrected by the next fetch.
  markRead: (id) => {
    const target = get().items.find((item) => item.notificationId === id);
    if (!target || target.isRead) return;
    set((state) => ({
      items: state.items.map((item) => (item.notificationId === id ? { ...item, isRead: true } : item)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    notificationsApi.markRead(id).catch(() => get().fetch());
  },

  markAllRead: async () => {
    const previous = { items: get().items, unreadCount: get().unreadCount };
    set((state) => ({ items: state.items.map((item) => ({ ...item, isRead: true })), unreadCount: 0 }));
    try {
      await notificationsApi.markAllRead();
    } catch (error) {
      set({ ...previous, error: getApiErrorMessage(error) });
    }
  },

  // The push carries no createdAt/bookingId, so bump the badge now and refetch for the full row.
  receive: (push) => {
    set((state) => ({ toast: push, unreadCount: state.unreadCount + 1 }));
    get().fetch();
  },

  dismissToast: () => set({ toast: null }),
  bumpBookings: () => set((state) => ({ bookingsVersion: state.bookingsVersion + 1 })),
  reset: () => set(initialState),
}));
