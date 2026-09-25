import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '@/api/client';

/**
 * `fetcher` must be a stable reference (wrap it in `useCallback` at the call site
 * with the relevant dependencies) so this hook only re-fetches when those change.
 *
 * `refetchOnFocus` silently reloads whenever the screen regains focus, for data
 * that can change server-side while the user is elsewhere (e.g. booking status).
 */
export function useApi<T>(fetcher: () => Promise<T>, { refetchOnFocus = false } = {}) {
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
        })
        .catch((err) => setError(getApiErrorMessage(err)))
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
    load().finally(() => setRefreshing(false));
  }, [load]);

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
