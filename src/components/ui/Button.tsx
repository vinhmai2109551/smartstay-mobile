import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  /** Custom leading element (e.g. a brand logo) instead of an Ionicons glyph. */
  leading?: ReactNode;
  /** Icon after the label, e.g. an arrow. */
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SIZES = {
  // sm stays at the 44pt minimum touch target; the visual is compact via padding/text.
  sm: { minHeight: MinTouch, paddingHorizontal: Space.lg, iconSize: 16, text: 'small' },
  md: { minHeight: 52, paddingHorizontal: Space['2xl'], iconSize: 18, text: 'smallBold' },
  lg: { minHeight: 58, paddingHorizontal: Space['3xl'], iconSize: 20, text: 'bodyBold' },
} as const;

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  iconColor,
  leading,
  trailingIcon,
  fullWidth = true,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const colors = {
    primary: { background: theme.primary, border: theme.primary, text: theme.primaryText },
    secondary: { background: theme.primarySoft, border: theme.primarySoft, text: theme.primary },
    outline: { background: 'transparent', border: theme.border, text: theme.primary },
    ghost: { background: 'transparent', border: 'transparent', text: theme.primary },
    // Fixed white label: readable on both the light and dark danger reds.
    danger: { background: theme.danger, border: theme.danger, text: '#FFFFFF' },
  }[variant];
  const sizing = SIZES[size];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPressIn={(e) => {
        scale.set(withSpring(0.97, PRESS_SPRING));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, PRESS_SPRING));
        onPressOut?.(e);
      }}
      style={[
        styles.base,
        {
          minHeight: sizing.minHeight,
          paddingHorizontal: sizing.paddingHorizontal,
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        animatedStyle,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View style={styles.row}>
          {leading ?? (icon ? <Ionicons name={icon} size={sizing.iconSize} color={iconColor ?? colors.text} /> : null)}
          <ThemedText type={sizing.text} style={{ color: colors.text }}>
            {label}
          </ThemedText>
          {trailingIcon ? <Ionicons name={trailingIcon} size={sizing.iconSize} color={colors.text} /> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
});
