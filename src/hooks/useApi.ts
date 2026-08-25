import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/api/client';

/**
 * `fetcher` must be a stable reference (wrap it in `useCallback` at the call site
 * with the relevant dependencies) so this hook only re-fetches when those change.
 */
export function useApi<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [fetcher]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run };
}
