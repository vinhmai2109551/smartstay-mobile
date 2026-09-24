import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type CheckboxProps = Omit<PressableProps, 'style' | 'onPress'> & {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function Checkbox({ checked, onChange, ...rest }: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      // 24pt box + 10pt hitSlop on each side = 44pt touch target.
      hitSlop={10}
      style={[
        styles.box,
        {
          borderColor: checked ? theme.primary : theme.textSecondary,
          backgroundColor: checked ? theme.primary : theme.backgroundElement,
        },
      ]}
      {...rest}>
      {checked ? <Ionicons name="checkmark" size={16} color={theme.primaryText} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
