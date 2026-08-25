import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
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
      <ThemedText type="smallBold">{label}</ThemedText>
      <Pressable
        onPress={() => setShow(true)}
        style={[styles.field, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <ThemedText>{formatDate(value)}</ThemedText>
      </Pressable>

      {show ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
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
  container: { gap: Spacing.one, flex: 1 },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
});
