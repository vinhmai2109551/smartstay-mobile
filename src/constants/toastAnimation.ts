import { Easing, withTiming } from 'react-native-reanimated';

// Shared by the feedback toast and the realtime notification banner: a short fade with
// a small drift from above, no spring — calm enough not to pull focus from the screen.
const OFFSET = 12;
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

export function toastEntering() {
  'worklet';
  const config = { duration: 250, easing: EASE_OUT };
  return {
    initialValues: { opacity: 0, transform: [{ translateY: -OFFSET }] },
    animations: {
      opacity: withTiming(1, config),
      transform: [{ translateY: withTiming(0, config) }],
    },
  };
}

export function toastExiting() {
  'worklet';
  const config = { duration: 180, easing: EASE_IN };
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withTiming(0, config),
      transform: [{ translateY: withTiming(-OFFSET, config) }],
    },
  };
}
