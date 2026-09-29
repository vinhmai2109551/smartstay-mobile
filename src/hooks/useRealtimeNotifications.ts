import { useEffect } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';

import { API_URL } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationPush } from '@/types/notification';

// The socket.io server lives at the API host root, not under /api/v1.
const SOCKET_URL = API_URL.replace(/\/api\/v\d+\/?$/, '');

/**
 * While signed in: loads the notification feed and keeps a socket open so staff
 * actions (confirm, check-in, payment, review reply) reach the guest instantly.
 * Mount once, in the root layout.
 */
export function useRealtimeNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const { fetch, receive, bumpBookings, reset } = useNotificationStore.getState();

    fetch();

    const socket = io(SOCKET_URL, {
      // React Native has no long-polling-friendly XHR cookies; websocket only is also faster.
      transports: ['websocket'],
      // Read at every (re)connect so a refreshed access token is picked up.
      auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    });

    // Anything pushed while disconnected (backgrounded app, flaky network) is only
    // in the database, so reload the feed on every reconnect.
    socket.on('connect', () => {
      if (socket.recovered) return;
      fetch();
    });
    socket.on('notification:new', (push: NotificationPush) => receive(push));
    socket.on('booking:updated', () => bumpBookings());

    // iOS suspends sockets in the background; reconnect and resync on return.
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (socket.connected) fetch();
      else socket.connect();
    });

    return () => {
      appState.remove();
      socket.disconnect();
      // Signing out must not leave the previous user's notifications around.
      reset();
    };
  }, [enabled]);
}
