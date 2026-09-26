import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const STAR_COUNT = 5;
const MIN_RATING = 0.5;

type Props = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  gap?: number;
  accessibilityLabel?: string;
};

/**
 * Star picker in half-star steps. Tap or drag across the row: the left half of a
 * star gives x.5, the right half a whole star.
 */
export function StarRatingInput({ value, onChange, size = 36, gap = 10, accessibilityLabel }: Props) {
  const theme = useTheme();
  // Last value reported during the current gesture, so a drag only fires on changes.
  const lastValueRef = useRef(value);

  // The stars ignore touches, so locationX is always relative to this row.
  const valueAt = (x: number) => {
    const slot = size + gap;
    const index = Math.min(Math.max(Math.floor(x / slot), 0), STAR_COUNT - 1);
    const withinStar = x - index * slot;
    const rating = index + (withinStar <= size / 2 ? 0.5 : 1);
    return Math.min(Math.max(rating, MIN_RATING), STAR_COUNT);
  };

  const handleTouch = (event: GestureResponderEvent) => {
    const next = valueAt(event.nativeEvent.locationX);
    if (next !== lastValueRef.current) {
      lastValueRef.current = next;
      Haptics.selectionAsync();
      onChange(next);
    }
  };

  const step = (delta: number) => {
    const next = Math.min(Math.max(value + delta, MIN_RATING), STAR_COUNT);
    if (next !== value) onChange(next);
  };

  return (
    <View
      style={[styles.row, { gap, width: size * STAR_COUNT + gap * (STAR_COUNT - 1) }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: MIN_RATING, max: STAR_COUNT, now: value, text: `${value} / ${STAR_COUNT}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 0.5 : -0.5)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      // Keep the gesture when the finger drifts vertically, instead of handing it to the ScrollView.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        lastValueRef.current = value;
        handleTouch(event);
      }}
      onResponderMove={handleTouch}>
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const star = i + 1;
        const name = value >= star ? 'star' : value >= star - 0.5 ? 'star-half' : 'star-outline';
        return (
          <View key={star} style={styles.star}>
            <Ionicons name={name} size={size} color={theme.accent} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'center', paddingVertical: 6 },
  star: { pointerEvents: 'none' },
});
