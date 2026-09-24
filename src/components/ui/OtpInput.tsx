import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
};

/**
 * One-time-code input rendered as separate boxes. A single hidden TextInput
 * holds the value so paste and SMS/email autofill keep working.
 */
export function OtpInput({ value, onChange, length = 6, error }: OtpInputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => inputRef.current?.focus()}
      style={styles.row}>
      {Array.from({ length }).map((_, index) => {
        const char = value[index] ?? '';
        const active = focused && index === Math.min(value.length, length - 1);
        const borderColor = error ? theme.danger : active ? theme.primary : char ? theme.text : theme.border;
        return (
          <View
            key={index}
            style={[
              styles.box,
              {
                borderColor,
                borderWidth: active || error ? 2 : 1,
                backgroundColor: theme.backgroundElement,
              },
            ]}>
            <ThemedText style={styles.char}>{char}</ThemedText>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus
        accessibilityLabel={`Mã xác minh ${length} chữ số`}
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Space.sm },
  box: {
    flex: 1,
    maxWidth: 56,
    aspectRatio: 0.86,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  char: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30 },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
