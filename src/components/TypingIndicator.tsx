import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function Dot({ delay }: { delay: number }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    offset.set(
      withDelay(
        delay,
        withRepeat(withSequence(withTiming(-4, { duration: 280 }), withTiming(0, { duration: 280 })), -1),
      ),
    );
    return () => cancelAnimation(offset);
  }, [delay, offset, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));

  return <Animated.View style={[styles.dot, { backgroundColor: theme.textSecondary }, style]} />;
}

/** Three bouncing dots shown while the AI assistant is composing a reply. */
export function TypingIndicator() {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Trợ lý đang soạn trả lời"
      style={[styles.bubble, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Dot delay={0} />
      <Dot delay={140} />
      <Dot delay={280} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md + 2,
    borderRadius: Radius.lg,
    borderBottomLeftRadius: Space.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
