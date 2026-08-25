import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StepperProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function Stepper({ label, value, min = 1, max = 10, onChange }: StepperProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={[styles.control, { borderColor: theme.border }]}>
        <Pressable
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.button}>
          <Ionicons name="remove" size={18} color={value <= min ? theme.textSecondary : theme.primary} />
        </Pressable>
        <ThemedText type="smallBold" style={styles.value}>
          {value}
        </ThemedText>
        <Pressable
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + 1))}
          style={styles.button}>
          <Ionicons name="add" size={18} color={value >= max ? theme.textSecondary : theme.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  button: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  value: { minWidth: 24, textAlign: 'center' },
});
