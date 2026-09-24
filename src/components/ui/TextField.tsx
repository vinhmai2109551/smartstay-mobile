import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Label rendered inside the field above the text, with the icon in a round badge. */
  inlineLabel?: boolean;
};

export function TextField({
  label,
  error,
  hint,
  leftIcon,
  inlineLabel = false,
  style,
  onFocus,
  onBlur,
  multiline,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  // Password fields get a show/hide toggle.
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;
  const iconColor = error ? theme.danger : focused ? theme.primary : theme.textSecondary;

  const input = (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      multiline={multiline}
      secureTextEntry={secureTextEntry && !revealed}
      accessibilityLabel={label}
      style={[
        styles.input,
        inlineLabel && styles.inputInline,
        multiline && styles.inputMultiline,
        { color: theme.text },
        style,
      ]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
    />
  );

  return (
    <View style={styles.container}>
      {label && !inlineLabel ? <ThemedText type="smallBold">{label}</ThemedText> : null}
      <View
        style={[
          styles.field,
          inlineLabel && styles.fieldInline,
          multiline && styles.fieldMultiline,
          {
            borderColor,
            // Thicker border on focus/error so the state isn't conveyed by colour alone.
            borderWidth: focused || error ? 1.5 : 1,
            backgroundColor: theme.backgroundElement,
          },
        ]}>
        {leftIcon && inlineLabel ? (
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: focused ? theme.primarySoft : theme.backgroundSelected },
            ]}>
            <Ionicons name={leftIcon} size={20} color={error ? theme.danger : focused ? theme.primary : theme.text} />
          </View>
        ) : leftIcon ? (
          <Ionicons name={leftIcon} size={20} color={iconColor} style={styles.icon} />
        ) : null}

        {inlineLabel ? (
          <View style={styles.inlineColumn}>
            {label ? (
              <ThemedText type="caption" themeColor={error ? 'danger' : focused ? 'primary' : 'textSecondary'}>
                {label}
              </ThemedText>
            ) : null}
            {input}
          </View>
        ) : (
          input
        )}

        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={styles.trailing}>
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={revealed ? theme.primary : theme.text}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={14} color={theme.danger} />
          <ThemedText type="caption" themeColor="danger" style={styles.message}>
            {error}
          </ThemedText>
        </View>
      ) : hint ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Space.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Space.lg,
  },
  fieldInline: {
    minHeight: 66,
    borderRadius: Radius.lg,
    paddingLeft: Space.md,
    paddingVertical: Space.sm,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    minHeight: 110,
    paddingVertical: Space.md,
  },
  icon: {
    marginRight: Space.md,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Space.md,
  },
  inlineColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  trailing: {
    minWidth: MinTouch,
    minHeight: MinTouch,
    marginRight: -Space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Space.sm,
  },
  input: {
    flex: 1,
    minHeight: MinTouch,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    paddingVertical: Space.md,
  },
  inputInline: {
    flex: 0,
    minHeight: 28,
    paddingVertical: 2,
  },
  inputMultiline: {
    minHeight: 86,
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },
  message: {
    flex: 1,
  },
});
