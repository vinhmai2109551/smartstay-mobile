import { useEffect, useRef } from 'react';

import { useNotificationStore } from '@/store/notificationStore';

/**
 * Calls `onUpdate` whenever the server reports that the guest's favorites changed
 * (added/removed from another device — web or another session), via `favorite:updated`.
 */
export function useFavoriteUpdates(onUpdate: () => void) {
  const version = useNotificationStore((s) => s.favoritesVersion);
  const initialVersion = useRef(version);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    // Skip the value present at mount — that update was already loaded.
    if (version !== initialVersion.current) onUpdateRef.current();
  }, [version]);
}
