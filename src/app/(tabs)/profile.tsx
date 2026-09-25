import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { usersApi } from '@/api/users';
import { Avatar } from '@/components/Avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CountBadge } from '@/components/ui/CountBadge';
import { TextField } from '@/components/ui/TextField';
import { MaxContentWidth, MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useAuthStore } from '@/store/authStore';
import { AppLanguage, ThemeMode, useSettingsStore } from '@/store/settingsStore';

type IconName = keyof typeof Ionicons.glyphMap;

function MenuRow({
  icon,
  label,
  onPress,
  trailing,
  danger,
  last,
  badge = 0,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  trailing?: IconName;
  danger?: boolean;
  last?: boolean;
  badge?: number;
}) {
  const theme = useTheme();
  const color = danger ? theme.danger : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
        { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' },
      ]}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? `${theme.danger}18` : theme.primarySoft }]}>
        <Ionicons name={icon} size={18} color={danger ? theme.danger : theme.primary} />
      </View>
      <ThemedText type="body" style={[styles.menuLabel, { color }]}>
        {label}
      </ThemedText>
      <CountBadge count={badge} />
      {trailing ? <Ionicons name={trailing} size={18} color={theme.textSecondary} /> : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const unreadCount = useUnreadNotifications();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const themeOptions: { key: ThemeMode; label: string; icon: IconName }[] = [
    { key: 'light', label: t('profile.themeLight'), icon: 'sunny-outline' },
    { key: 'dark', label: t('profile.themeDark'), icon: 'moon-outline' },
    { key: 'system', label: t('profile.themeSystem'), icon: 'phone-portrait-outline' },
  ];
  const languageOptions: { key: AppLanguage; label: string }[] = [
    { key: 'vi', label: t('profile.languageVi') },
    { key: 'en', label: t('profile.languageEn') },
  ];

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
      clearSession();
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    setSubmitting(true);
    try {
      await usersApi.changePassword({ oldPassword, newPassword });
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      setPasswordError(getApiErrorMessage(error, t('profile.changePasswordFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.primary, theme.primarySoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + Space.xl }]}>
          <ThemedText type="heading" style={{ color: theme.primaryText }}>
            {t('profile.title')}
          </ThemedText>
        </LinearGradient>

        <View style={styles.content}>
          <Card elevation="floating" style={styles.profileCard}>
            <Avatar name={user?.fullName} size={64} />
            <View style={styles.profileInfo}>
              <ThemedText type="heading" numberOfLines={1}>
                {user?.fullName ?? t('profile.fallbackName')}
              </ThemedText>
              {user?.email ? (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.infoText}>
                    {user.email}
                  </ThemedText>
                </View>
              ) : null}
              {user?.phone ? (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {user.phone}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </Card>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.groupLabel}>
            {t('profile.sectionActivity')}
          </ThemedText>
          <Card padded={false} elevation="none" style={styles.group}>
            <MenuRow
              icon="receipt-outline"
              label={t('profile.myBookings')}
              trailing="chevron-forward"
              onPress={() => router.navigate('/(tabs)/bookings')}
            />
            <MenuRow
              icon="notifications-outline"
              label={t('profile.notifications')}
              badge={unreadCount}
              trailing="chevron-forward"
              onPress={() => router.push('/notifications')}
            />
            <MenuRow
              icon="sparkles-outline"
              label={t('profile.aiAssistant')}
              trailing="chevron-forward"
              onPress={() => router.navigate('/(tabs)/chat')}
              last
            />
          </Card>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.groupLabel}>
            {t('profile.sectionAppearance')}
          </ThemedText>
          <Card style={styles.optionRow}>
            {themeOptions.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                icon={option.icon}
                selected={themeMode === option.key}
                onPress={() => setThemeMode(option.key)}
              />
            ))}
          </Card>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.groupLabel}>
            {t('profile.sectionLanguage')}
          </ThemedText>
          <Card style={styles.optionRow}>
            {languageOptions.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                selected={language === option.key}
                onPress={() => setLanguage(option.key)}
              />
            ))}
          </Card>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.groupLabel}>
            {t('profile.sectionSecurity')}
          </ThemedText>
          <Card padded={false} elevation="none" style={styles.group}>
            <MenuRow
              icon="lock-closed-outline"
              label={t('profile.changePassword')}
              trailing={showChangePassword ? 'chevron-up' : 'chevron-down'}
              onPress={() => setShowChangePassword((v) => !v)}
              last={!showChangePassword}
            />
            {showChangePassword ? (
              <View style={styles.passwordForm}>
                <TextField
                  label={t('profile.currentPassword')}
                  leftIcon="key-outline"
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TextField
                  label={t('profile.newPassword')}
                  leftIcon="lock-closed-outline"
                  hint={t('profile.newPasswordHint')}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                {passwordError ? (
                  <ThemedText type="small" themeColor="danger">
                    {passwordError}
                  </ThemedText>
                ) : null}
                {passwordSuccess ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                    <ThemedText type="small" themeColor="success">
                      {t('profile.changePasswordSuccess')}
                    </ThemedText>
                  </View>
                ) : null}
                <Button
                  label={t('profile.updatePassword')}
                  onPress={handleChangePassword}
                  loading={submitting}
                  disabled={!oldPassword || newPassword.length < 8}
                />
              </View>
            ) : null}
          </Card>

          <Card padded={false} elevation="none" style={[styles.group, styles.logoutGroup]}>
            <MenuRow
              icon="log-out-outline"
              label={t('profile.logout')}
              onPress={() => setShowLogoutConfirm(true)}
              danger
              last
            />
          </Card>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.version}>
            {t('profile.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
          </ThemedText>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title={t('profile.logout')}
        message={t('profile.logoutMessage')}
        confirmLabel={t('profile.logout')}
        destructive
        animated={false}
        loading={loggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: Space['3xl'] },
  hero: {
    paddingHorizontal: Space.lg,
    paddingBottom: Space['4xl'] + Space.xl,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Space.lg,
    marginTop: -(Space['4xl'] + Space.sm),
  },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Space.lg, padding: Space.xl },
  profileInfo: { flex: 1, gap: Space.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  infoText: { flexShrink: 1 },
  groupLabel: { marginTop: Space['2xl'], marginBottom: Space.sm, marginLeft: Space.xs, letterSpacing: 1 },
  group: { overflow: 'hidden', borderRadius: Radius.lg },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  logoutGroup: { marginTop: Space['2xl'] },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    minHeight: MinTouch + Space.md,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
  },
  menuIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1 },
  passwordForm: { gap: Space.lg, padding: Space.lg, paddingTop: Space.sm },
  version: { textAlign: 'center', marginTop: Space['2xl'] },
});
