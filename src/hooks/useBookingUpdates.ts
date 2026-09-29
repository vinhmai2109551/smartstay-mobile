import { useEffect, useRef } from 'react';

import { useNotificationStore } from '@/store/notificationStore';

/**
 * Calls `onUpdate` whenever the server reports that one of the guest's bookings
 * changed (staff confirmed, checked in, payment settled…), via `booking:updated`.
 */
export function useBookingUpdates(onUpdate: () => void) {
  const version = useNotificationStore((s) => s.bookingsVersion);
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
