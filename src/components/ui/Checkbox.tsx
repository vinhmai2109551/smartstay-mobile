import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type CheckboxProps = Omit<PressableProps, 'style' | 'onPress'> & {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function Checkbox({ checked, onChange, ...rest }: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      hitSlop={8}
      style={[
        styles.box,
        {
          borderColor: checked ? theme.primary : theme.border,
          backgroundColor: checked ? theme.primary : 'transparent',
        },
      ]}
      {...rest}>
      {checked ? (
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={14} color={theme.primaryText} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
