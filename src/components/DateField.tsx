import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/date';

type DateFieldProps = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
};

export function DateField({ label, value, onChange, minimumDate }: DateFieldProps) {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value)}`}
        onPress={() => setShow(true)}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor: show ? theme.primary : theme.border,
            backgroundColor: theme.backgroundElement,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Ionicons name="calendar-outline" size={20} color={show ? theme.primary : theme.textSecondary} />
        <View style={styles.text}>
          <ThemedText type="caption" themeColor="textSecondary">
            {label}
          </ThemedText>
          <ThemedText type="bodyBold">{formatDate(value, 'DD/MM/YYYY')}</ThemedText>
        </View>
      </Pressable>

      {show ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
          accentColor={theme.primary}
          onChange={(_event, selectedDate) => {
            setShow(false);
            if (selectedDate) onChange(selectedDate);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Space.sm, flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    minHeight: 60,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
  },
  text: { flex: 1 },
});
