import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  /** Small grey label with an icon and small round buttons, for chat cards. */
  dense?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Stepper({ label, value, min = 1, max = 10, onChange, hint, dense = false, icon }: StepperProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const renderButton = (kind: 'remove' | 'add') => {
    const disabled = kind === 'remove' ? value <= min : value >= max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          kind === 'remove' ? t('common.decreaseLabel', { label }) : t('common.increaseLabel', { label })
        }
        disabled={disabled}
        onPress={() => onChange(kind === 'remove' ? Math.max(min, value - 1) : Math.min(max, value + 1))}
        // Dense buttons are drawn at 28pt; the slop keeps the 44pt touch target.
        hitSlop={dense ? 8 : undefined}
        style={({ pressed }) =>
          dense
            ? [
                styles.buttonDense,
                {
                  borderColor: theme.border,
                  backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                  opacity: disabled ? 0.45 : 1,
                },
              ]
            : [
                styles.button,
                {
                  borderColor: disabled ? theme.border : theme.primary,
                  backgroundColor: pressed ? theme.primarySoft : 'transparent',
                  opacity: disabled ? 0.45 : 1,
                },
              ]
        }>
        <Ionicons
          name={kind}
          size={dense ? 16 : 20}
          color={dense || disabled ? theme.textSecondary : theme.primary}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.row}>
      <View style={[styles.label, dense && styles.labelDense]}>
        {dense && icon ? <Ionicons name={icon} size={16} color={theme.textSecondary} /> : null}
        <ThemedText type={dense ? 'caption' : 'bodyBold'} themeColor={dense ? 'textSecondary' : undefined}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.control} accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value }}>
        {renderButton('remove')}
        <ThemedText type={dense ? 'smallBold' : 'heading'} style={dense ? styles.valueDense : styles.value}>
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
  labelDense: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  buttonDense: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueDense: { minWidth: 20, textAlign: 'center' },
});
