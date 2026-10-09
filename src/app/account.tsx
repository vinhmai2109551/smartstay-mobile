import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { z } from 'zod';

import { getApiErrorMessage } from '@/api/client';
import { usersApi } from '@/api/users';
import { Avatar } from '@/components/Avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { User } from '@/types/auth';
import { formatDate } from '@/utils/date';

type IconName = keyof typeof Ionicons.glyphMap;

// Vietnamese mobile numbers: 0xxxxxxxxx or +84xxxxxxxxx (9–10 digits after the prefix).
const PHONE_PATTERN = /^(0|\+84)\d{9,10}$/;
// CMND (9 digits), CCCD (12 digits) or a passport number.
const ID_NUMBER_PATTERN = /^[A-Za-z0-9]{6,20}$/;

function useSchema() {
  const { t } = useTranslation();
  return z.object({
    fullName: z.string().trim().min(2, t('account.errors.fullName')).max(100, t('account.errors.fullName')),
    phone: z
      .string()
      .trim()
      .refine((v) => v === '' || PHONE_PATTERN.test(v.replace(/[\s.-]/g, '')), t('account.errors.phone')),
    idNumber: z
      .string()
      .trim()
      .refine((v) => v === '' || ID_NUMBER_PATTERN.test(v), t('account.errors.idNumber')),
    address: z.string().trim().max(255, t('account.errors.address')),
  });
}

type FormValues = z.infer<ReturnType<typeof useSchema>>;

const toFormValues = (user: User | null): FormValues => ({
  fullName: user?.fullName ?? '',
  phone: user?.phone ?? '',
  idNumber: user?.idNumber ?? '',
  address: user?.address ?? '',
});

function InfoRow({ icon, label, value, last }: { icon: IconName; label: string; value?: string | null; last?: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="caption" themeColor="textSecondary">
          {label}
        </ThemedText>
        {value ? (
          <ThemedText type="body">{value}</ThemedText>
        ) : (
          <ThemedText type="body" themeColor="textSecondary" style={styles.italic}>
            {t('account.notProvided')}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

/**
 * The signed-in guest's account: view the full profile (GET /users/me) and edit the
 * fields the backend lets a guest change (PATCH /users/me — name, phone, ID number,
 * address). Email and role are shown read-only.
 */
export default function AccountScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const schema = useSchema();

  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(user) });

  // Always show the server's copy (another device may have changed it).
  const reload = useCallback(async () => {
    try {
      const fresh = await usersApi.me();
      updateUser({ ...user, ...fresh } as User);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('account.loadFailed')));
    }
    // user is merged in, not a trigger — reloading on every store change would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, updateUser]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep the form in sync with the profile while not editing.
  useEffect(() => {
    if (!editing) reset(toFormValues(user));
  }, [user, editing, reset]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const startEditing = () => {
    reset(toFormValues(user));
    setEditing(true);
  };

  const cancelEditing = () => {
    reset(toFormValues(user));
    setEditing(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      // Empty optional fields are cleared with null — an empty string would clash with
      // the unique phone column across users.
      const updated = await usersApi.updateMe({
        fullName: values.fullName.trim(),
        phone: values.phone.trim() ? values.phone.replace(/[\s.-]/g, '') : null,
        idNumber: values.idNumber.trim() || null,
        address: values.address.trim() || null,
      });
      updateUser({ ...user, ...updated } as User);
      setEditing(false);
      toast.success(t('account.saved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('account.saveFailed')));
    }
  };

  const roleLabel = user?.role ? t(`account.roles.${user.role}`) : '';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () =>
            editing ? null : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('account.edit')}
                onPress={startEditing}
                hitSlop={10}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: Space.xs })}>
                <Ionicons name="create-outline" size={22} color={theme.primary} />
              </Pressable>
            ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          editing ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
          )
        }>
        <Animated.View entering={FadeIn.duration(300)} style={styles.hero}>
          <Avatar name={user?.fullName} size={84} />
          <ThemedText type="heading" style={styles.center}>
            {user?.fullName}
          </ThemedText>
          <View style={styles.badges}>
            {roleLabel ? (
              <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="person" size={12} color={theme.primary} />
                <ThemedText type="caption" themeColor="primary">
                  {roleLabel}
                </ThemedText>
              </View>
            ) : null}
            {user?.status ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${user.status === 'Active' ? theme.success : theme.danger}1A` },
                ]}>
                <View
                  style={[styles.dot, { backgroundColor: user.status === 'Active' ? theme.success : theme.danger }]}
                />
                <ThemedText
                  type="caption"
                  style={{ color: user.status === 'Active' ? theme.success : theme.danger }}>
                  {t(`account.status.${user.status}`)}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {editing ? (
          <Card style={styles.form}>
            <ThemedText type="bodyBold">{t('account.editTitle')}</ThemedText>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label={t('account.fullName')}
                  leftIcon="person-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoComplete="name"
                  textContentType="name"
                  error={errors.fullName?.message}
                />
              )}
            />
            <TextField
              label={t('account.email')}
              leftIcon="mail-outline"
              value={user?.email ?? ''}
              editable={false}
              hint={t('account.emailLocked')}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label={t('account.phone')}
                  leftIcon="call-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  placeholder="09xx xxx xxx"
                  error={errors.phone?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="idNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label={t('account.idNumber')}
                  leftIcon="card-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="characters"
                  hint={t('account.idNumberHint')}
                  error={errors.idNumber?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label={t('account.address')}
                  leftIcon="location-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  textContentType="fullStreetAddress"
                  error={errors.address?.message}
                />
              )}
            />
            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button label={t('common.cancel')} variant="outline" onPress={cancelEditing} disabled={isSubmitting} />
              </View>
              <View style={styles.flex}>
                <Button
                  label={t('account.save')}
                  icon="checkmark"
                  onPress={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  disabled={!isDirty}
                />
              </View>
            </View>
          </Card>
        ) : (
          <>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.groupLabel}>
              {t('account.sectionPersonal')}
            </ThemedText>
            <Card padded={false} style={styles.group}>
              <InfoRow icon="person-outline" label={t('account.fullName')} value={user?.fullName} />
              <InfoRow icon="call-outline" label={t('account.phone')} value={user?.phone} />
              <InfoRow icon="card-outline" label={t('account.idNumber')} value={user?.idNumber} />
              <InfoRow icon="location-outline" label={t('account.address')} value={user?.address} last />
            </Card>

            <ThemedText type="caption" themeColor="textSecondary" style={styles.groupLabel}>
              {t('account.sectionAccount')}
            </ThemedText>
            <Card padded={false} style={styles.group}>
              <InfoRow icon="mail-outline" label={t('account.email')} value={user?.email} />
              <InfoRow
                icon="calendar-outline"
                label={t('account.memberSince')}
                value={user?.createdAt ? formatDate(user.createdAt) : null}
              />
              <InfoRow
                icon="time-outline"
                label={t('account.updatedAt')}
                value={user?.updatedAt ? formatDate(user.updatedAt, 'DD/MM/YYYY HH:mm') : null}
                last
              />
            </Card>

            <Button label={t('account.edit')} icon="create-outline" onPress={startEditing} />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Space.lg,
    paddingBottom: Space['3xl'],
    gap: Space.md,
  },
  // Extra top room so the avatar never sits under the native header's edge.
  hero: { alignItems: 'center', gap: Space.sm, paddingTop: Space.xl, paddingBottom: Space.md, overflow: 'visible' },
  center: { textAlign: 'center' },
  badges: { flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Space.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Space.sm, marginLeft: Space.xs },
  group: { overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.lg },
  infoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  italic: { fontStyle: 'italic' },
  form: { gap: Space.md },
  actions: { flexDirection: 'row', gap: Space.sm, marginTop: Space.sm },
});
