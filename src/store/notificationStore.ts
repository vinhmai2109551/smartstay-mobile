import { create } from 'zustand';

import { getApiErrorMessage } from '@/api/client';
import { notificationsApi } from '@/api/notifications';
import { AppNotification } from '@/types/notification';

type NotificationState = {
  items: AppNotification[];
  total: number;
  page: number;
  unreadCount: number;
  // True until the first fetch settles, so screens can show a skeleton instead of "empty".
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  // Latest push, shown as an in-app banner until dismissed.
  toast: AppNotification | null;
  // Bumped on `booking:updated` so open booking screens know to reload.
  bookingsVersion: number;

  fetch: (options?: { silent?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => Promise<void>;
  receive: (notification: AppNotification) => void;
  dismissToast: () => void;
  bumpBookings: () => void;
  reset: () => void;
};

const initialState = {
  items: [],
  total: 0,
  page: 1,
  unreadCount: 0,
  loading: true,
  refreshing: false,
  loadingMore: false,
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

  // Reloads the first page and the unread count (a separate endpoint on the backend).
  fetch: async ({ silent = true } = {}) => {
    if (!silent) set({ refreshing: true });
    try {
      const [page, unread] = await Promise.all([notificationsApi.list(1), notificationsApi.unreadCount()]);
      set({ items: page.data, total: page.total, page: 1, unreadCount: unread.count, error: null });
    } catch (error) {
      set({ error: getApiErrorMessage(error) });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  loadMore: async () => {
    const { items, total, page, loadingMore } = get();
    if (loadingMore || items.length >= total) return;
    set({ loadingMore: true });
    try {
      const next = await notificationsApi.list(page + 1);
      // A push may have shifted rows between pages — skip any already shown.
      const seen = new Set(get().items.map((item) => item.id));
      set((state) => ({
        items: [...state.items, ...next.data.filter((item) => !seen.has(item.id))],
        total: next.total,
        page: page + 1,
      }));
    } catch {
      // Leave the list as is; scrolling again retries.
    } finally {
      set({ loadingMore: false });
    }
  },

  // Optimistic: the row turns "read" immediately; a failed request is corrected by the next fetch.
  markRead: (id) => {
    const target = get().items.find((item) => item.id === id);
    if (!target || target.isRead) return;
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
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

  // The socket payload is a full row, so it can go straight to the top of the list.
  receive: (notification) => {
    set((state) => {
      if (state.items.some((item) => item.id === notification.id)) return state;
      return {
        toast: notification,
        items: [notification, ...state.items],
        total: state.total + 1,
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      };
    });
  },

  dismissToast: () => set({ toast: null }),
  bumpBookings: () => set((state) => ({ bookingsVersion: state.bookingsVersion + 1 })),
  reset: () => set(initialState),
}));
