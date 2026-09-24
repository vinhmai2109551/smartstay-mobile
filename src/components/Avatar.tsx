import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function initialsOf(fullName?: string | null) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

type AvatarProps = {
  name?: string | null;
  size?: number;
  tone?: 'primary' | 'soft';
};

/** Circular avatar showing the person's initials (the API has no profile photos). */
export function Avatar({ name, size = 44, tone = 'primary' }: AvatarProps) {
  const theme = useTheme();
  const initials = initialsOf(name);
  const background = tone === 'primary' ? theme.primary : theme.primarySoft;
  const foreground = tone === 'primary' ? theme.primaryText : theme.primary;

  return (
    <View
      accessible={false}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}>
      {initials ? (
        <ThemedText style={{ color: foreground, fontFamily: FontFamily.bold, fontSize: size * 0.36 }}>
          {initials}
        </ThemedText>
      ) : (
        <Ionicons name="person" size={size * 0.45} color={foreground} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
