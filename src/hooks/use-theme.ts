/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettingsStore } from '@/store/settingsStore';

/** System scheme, unless the user picked Light/Dark manually in Tài khoản > Giao diện. */
export function useEffectiveColorScheme() {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  if (themeMode === 'light' || themeMode === 'dark') return themeMode;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useEffectiveColorScheme();
  return Colors[scheme];
}

export function useShadows() {
  const scheme = useEffectiveColorScheme();
  return Shadows[scheme];
}
