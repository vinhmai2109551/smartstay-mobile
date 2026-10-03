import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

/**
 * Hosts banners that must sit above everything. On iOS, screens opened with
 * `presentation: 'modal'` live in a native layer above the root React view, so a
 * plain absolutely-positioned view ends up hidden behind them; FullWindowOverlay
 * renders into its own window on top. Touches outside the children pass through.
 * Android modals stay in the same view tree, so nothing extra is needed there.
 */
export function TopOverlay({ children }: { children: ReactNode }) {
  if (Platform.OS === 'ios') return <FullWindowOverlay>{children}</FullWindowOverlay>;
  return <>{children}</>;
}
