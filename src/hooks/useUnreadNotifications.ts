import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { notificationsApi } from '@/api/notifications';

/** Unread notification count, refreshed every time the calling screen gains focus. */
export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      notificationsApi
        .unreadCount()
        .then((result) => {
          if (active) setCount(result.count);
        })
        // The badge is decorative — a failed request just leaves it hidden.
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  return count;
}
