import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StepperProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  hint?: string;
};

export function Stepper({ label, value, min = 1, max = 10, onChange, hint }: StepperProps) {
  const theme = useTheme();

  const renderButton = (kind: 'remove' | 'add') => {
    const disabled = kind === 'remove' ? value <= min : value >= max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={kind === 'remove' ? `Giảm ${label}` : `Tăng ${label}`}
        disabled={disabled}
        onPress={() => onChange(kind === 'remove' ? Math.max(min, value - 1) : Math.min(max, value + 1))}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: disabled ? theme.border : theme.primary,
            backgroundColor: pressed ? theme.primarySoft : 'transparent',
            opacity: disabled ? 0.45 : 1,
          },
        ]}>
        <Ionicons name={kind} size={20} color={disabled ? theme.textSecondary : theme.primary} />
      </Pressable>
    );
  };

  return (
    <View style={styles.row}>
      <View style={styles.label}>
        <ThemedText type="bodyBold">{label}</ThemedText>
        {hint ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.control} accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value }}>
        {renderButton('remove')}
        <ThemedText type="heading" style={styles.value}>
          {value}
        </ThemedText>
        {renderButton('add')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  label: { flex: 1 },
  control: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  button: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 32, textAlign: 'center' },
});
