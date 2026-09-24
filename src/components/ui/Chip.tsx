import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
};

export function Chip({ label, selected = false, onPress, icon, disabled }: ChipProps) {
  const theme = useTheme();
  const textColor = selected ? theme.primaryText : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {icon ? <Ionicons name={icon} size={16} color={textColor} /> : null}
      <ThemedText type="small" style={{ color: textColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    minHeight: MinTouch - 8, // + hitSlop keeps the touch target ≥ 44pt
    paddingHorizontal: Space.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});
