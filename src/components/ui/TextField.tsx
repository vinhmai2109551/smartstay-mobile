import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label ? <ThemedText type="smallBold">{label}</ThemedText> : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: error ? theme.danger : theme.border,
            backgroundColor: theme.backgroundElement,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
});
