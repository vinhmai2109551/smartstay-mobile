import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Radius, Space } from '@/constants/theme';
import { useEffectiveColorScheme, useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/date';

type DateFieldProps = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
};

export function DateField({ label, value, onChange, minimumDate }: DateFieldProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const scheme = useEffectiveColorScheme();
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);
  // iOS: the calendar edits a draft inside a bottom sheet and applies it on "Xong".
  const [draft, setDraft] = useState(value);

  const open = () => {
    setDraft(value);
    setShow(true);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value)}`}
        onPress={open}
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

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <Pressable
            accessibilityLabel={t('common.close')}
            style={styles.backdrop}
            onPress={() => setShow(false)}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.backgroundElement, paddingBottom: Math.max(insets.bottom, Space.lg) },
            ]}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <View style={styles.sheetHeader}>
              <ThemedText type="heading">{label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(draft, 'dddd, DD/MM/YYYY')}
              </ThemedText>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="inline"
              minimumDate={minimumDate}
              accentColor={theme.primary}
              themeVariant={scheme === 'dark' ? 'dark' : 'light'}
              locale={i18n.language === 'en' ? 'en-US' : 'vi-VN'}
              onChange={(_event, selectedDate) => {
                if (selectedDate) setDraft(selectedDate);
              }}
            />
            <Button
              label={t('common.done')}
              onPress={() => {
                onChange(draft);
                setShow(false);
              }}
            />
          </View>
        </Modal>
      ) : show ? (
        // Android shows its own modal date dialog.
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
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
  container: { flex: 1 },
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    gap: Space.md,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: Space.xs },
  sheetHeader: { gap: 2 },
});
