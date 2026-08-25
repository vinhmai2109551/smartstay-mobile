import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary' ? theme.primary : variant === 'outline' ? 'transparent' : 'transparent';
  const borderColor = variant === 'outline' ? theme.border : 'transparent';
  const textColor = variant === 'primary' ? theme.primaryText : theme.primary;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, borderColor, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText type="smallBold" style={{ color: textColor }}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
