import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '@/api/client';
import { toast } from '@/store/toastStore';

/**
 * `fetcher` must be a stable reference (wrap it in `useCallback` at the call site
 * with the relevant dependencies) so this hook only re-fetches when those change.
 *
 * `refetchOnFocus` silently reloads whenever the screen regains focus, for data
 * that can change server-side while the user is elsewhere (e.g. booking status).
 *
 * `toastOnRefreshError` surfaces a toast when a pull-to-refresh (`refresh()`, not
 * the initial load) fails while stale data is still on screen — otherwise that
 * failure has no visible sign at all. Off by default for callers that treat a
 * refresh failure as fine to stay silent (e.g. a decorative rating lookup).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  { refetchOnFocus = false, toastOnRefreshError = false } = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to the loading state when the fetcher changes — done during render
  // rather than in the effect to avoid a cascading re-render.
  const [prevFetcher, setPrevFetcher] = useState(() => fetcher);
  if (fetcher !== prevFetcher) {
    setPrevFetcher(() => fetcher);
    setLoading(true);
    setError(null);
  }

  const load = useCallback(
    () =>
      fetcher()
        .then((result) => {
          setData(result);
          setError(null);
          return null;
        })
        .catch((err) => {
          const message = getApiErrorMessage(err);
          setError(message);
          return message;
        })
        .finally(() => setLoading(false)),
    [fetcher],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    load();
  }, [load]);

  // Pull-to-refresh: keeps the current data on screen instead of the loading state.
  const refresh = useCallback(() => {
    setRefreshing(true);
    load()
      .then((errorMessage) => {
        if (errorMessage && toastOnRefreshError) toast.error(errorMessage);
      })
      .finally(() => setRefreshing(false));
  }, [load, toastOnRefreshError]);

  // The initial load already covers the first focus, so only later focuses reload.
  const hasFocusedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedRef.current) {
        hasFocusedRef.current = true;
        return;
      }
      if (refetchOnFocus) load();
    }, [refetchOnFocus, load]),
  );

  return { data, loading, error, refetch, refreshing, refresh };
}
