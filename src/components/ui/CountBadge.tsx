import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Small red pill with a count, e.g. unread notifications. Hidden when count is 0. */
export function CountBadge({ count, style }: { count: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  if (count <= 0) return null;

  return (
    <Animated.View
      entering={ZoomIn.springify()}
      exiting={ZoomOut}
      style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.backgroundElement }, style]}>
      <View>
        <ThemedText style={styles.text}>{count > 99 ? '99+' : count}</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#FFFFFF', fontFamily: FontFamily.bold, fontSize: 11, lineHeight: 14 },
});
