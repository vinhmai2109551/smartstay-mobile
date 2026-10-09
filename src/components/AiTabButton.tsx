import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BotMessageSquare, Sparkles } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 48;
// How far the circle rises above the tab bar's top edge. Screens with content pinned to
// the bottom (the chat input) pad by this so the button doesn't cover it.
export const AI_TAB_LIFT = 14;
// Same launcher as the web chatbot (AiChatbot.jsx): BotMessageSquare on a
// blue-500 → violet-500 → blue-600 gradient, with an amber-400 sparkle badge.
const AI_GRADIENT = ['#3B82F6', '#8B5CF6', '#2563EB'] as const;
const AI_VIOLET = '#8B5CF6';
const BADGE_AMBER = '#FBBF24';
const BADGE_ICON = '#1E3A8A';

type Props = {
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  'aria-selected'?: boolean;
  testID?: string;
};

/**
 * Centre tab for the AI concierge: a raised gradient circle with a soft "breathing"
 * halo, so the assistant is the one obvious entry point (it replaces the old floating
 * "Ask AI" button on the home screen).
 */
export function AiTabButton({ onPress, onLongPress, testID, ...rest }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const focused = !!rest['aria-selected'];
  const halo = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // The halo only breathes while the tab is not open — once inside, it would just distract.
  useEffect(() => {
    if (focused) {
      cancelAnimation(halo);
      halo.set(withTiming(0, { duration: 200 }));
      return;
    }
    halo.set(withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: 3200 }),
      ),
      -1,
    ));
    return () => cancelAnimation(halo);
  }, [focused, halo]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.18 * (1 - halo.get()),
    transform: [{ scale: 1 + halo.get() * 0.2 }],
  }));
  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.get() }] }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={t('tabs.chat')}
      accessibilityState={{ selected: focused }}
      testID={testID}
      onPress={(event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      onLongPress={onLongPress ?? undefined}
      onPressIn={() => {
        pressScale.set(withSpring(0.92, { damping: 15, stiffness: 300 }));
      }}
      onPressOut={() => {
        pressScale.set(withSpring(1, { damping: 12, stiffness: 220 }));
      }}
      style={styles.container}>
      <View style={styles.circleSlot}>
        <Animated.View style={[styles.halo, { backgroundColor: theme.primary }, haloStyle]} />
        <Animated.View
          style={[
            styles.ring,
            { backgroundColor: theme.backgroundElement, shadowColor: AI_VIOLET },
            circleStyle,
          ]}>
          <LinearGradient
            colors={AI_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.circle}>
            <BotMessageSquare size={24} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
          <View style={[styles.badge, { borderColor: theme.backgroundElement }]}>
            <Sparkles size={10} color={BADGE_ICON} strokeWidth={2.5} />
          </View>
        </Animated.View>
      </View>
      <ThemedText
        numberOfLines={1}
        style={[
          styles.label,
          { color: focused ? theme.primary : theme.textSecondary, fontFamily: FontFamily.medium },
        ]}>
        {t('tabs.chat')}
      </ThemedText>
    </Pressable>
  );
}

const RING = 4;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  circleSlot: {
    width: SIZE + RING * 2,
    height: SIZE + RING * 2,
    marginTop: -AI_TAB_LIFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  // A ring in the tab bar colour makes the circle look cut into the bar.
  ring: {
    width: SIZE + RING * 2,
    height: SIZE + RING * 2,
    borderRadius: (SIZE + RING * 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  circle: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BADGE_AMBER,
  },
  label: { fontSize: 11, lineHeight: 14 },
});
