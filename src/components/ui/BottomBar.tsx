import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

/** Sticky action bar pinned to the bottom of a screen, respecting the home-indicator inset. */
export function BottomBar({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        shadows.floating,
        {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, Space.lg),
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.lg,
    paddingTop: Space.md,
    paddingHorizontal: Space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
