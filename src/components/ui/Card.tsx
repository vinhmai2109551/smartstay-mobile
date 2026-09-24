import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

type CardProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevation?: 'card' | 'floating' | 'none';
};

/** Surface with rounded corners and a soft shadow. Pressable only when `onPress` is given. */
export function Card({ style, padded = true, elevation = 'card', onPress, children, ...rest }: CardProps) {
  const theme = useTheme();
  const shadows = useShadows();

  const cardStyle = [
    styles.card,
    padded && styles.padded,
    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
    elevation !== 'none' && shadows[elevation],
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children as React.ReactNode}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      {...rest}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: Space.lg,
  },
  pressed: {
    opacity: 0.92,
  },
});
