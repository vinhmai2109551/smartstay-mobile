import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Whether the device currently has network connectivity. NetInfo's own `isConnected`
 * is `null` until its first report lands (and occasionally stays ambiguous after) —
 * treated as online here, since flashing an offline banner on a false positive is
 * worse than briefly missing a real one.
 */
export function useNetworkStatus(): boolean {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
  }, []);

  return isConnected ?? true;
}
