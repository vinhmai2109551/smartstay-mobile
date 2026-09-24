import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { usersApi } from '@/api/users';
import { Avatar } from '@/components/Avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CountBadge } from '@/components/ui/CountBadge';
import { TextField } from '@/components/ui/TextField';
import { MaxContentWidth, MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useAuthStore } from '@/store/authStore';

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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const unreadCount = useUnreadNotifications();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await authApi.logout();
          } catch {
            // ignore network errors on logout
          }
          clearSession();
        },
      },
    ]);
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
      setPasswordError(getApiErrorMessage(error, 'Đổi mật khẩu thất bại.'));
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
            Tài khoản
          </ThemedText>
        </LinearGradient>

        <View style={styles.content}>
          <Card elevation="floating" style={styles.profileCard}>
            <Avatar name={user?.fullName} size={64} />
            <View style={styles.profileInfo}>
              <ThemedText type="heading" numberOfLines={1}>
                {user?.fullName ?? 'Khách hàng'}
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
            HOẠT ĐỘNG
          </ThemedText>
          <Card padded={false} elevation="none" style={styles.group}>
            <MenuRow
              icon="receipt-outline"
              label="Đơn đặt phòng"
              trailing="chevron-forward"
              onPress={() => router.navigate('/(tabs)/bookings')}
            />
            <MenuRow
              icon="notifications-outline"
              label="Thông báo"
              badge={unreadCount}
              trailing="chevron-forward"
              onPress={() => router.push('/notifications')}
            />
            <MenuRow
              icon="sparkles-outline"
              label="Trợ lý AI"
              trailing="chevron-forward"
              onPress={() => router.navigate('/(tabs)/chat')}
              last
            />
          </Card>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.groupLabel}>
            BẢO MẬT
          </ThemedText>
          <Card padded={false} elevation="none" style={styles.group}>
            <MenuRow
              icon="lock-closed-outline"
              label="Đổi mật khẩu"
              trailing={showChangePassword ? 'chevron-up' : 'chevron-down'}
              onPress={() => setShowChangePassword((v) => !v)}
              last={!showChangePassword}
            />
            {showChangePassword ? (
              <View style={styles.passwordForm}>
                <TextField
                  label="Mật khẩu hiện tại"
                  leftIcon="key-outline"
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TextField
                  label="Mật khẩu mới"
                  leftIcon="lock-closed-outline"
                  hint="Tối thiểu 8 ký tự, có cả chữ và số"
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
                      Đổi mật khẩu thành công.
                    </ThemedText>
                  </View>
                ) : null}
                <Button
                  label="Cập nhật mật khẩu"
                  onPress={handleChangePassword}
                  loading={submitting}
                  disabled={!oldPassword || newPassword.length < 8}
                />
              </View>
            ) : null}
          </Card>

          <Card padded={false} elevation="none" style={[styles.group, styles.logoutGroup]}>
            <MenuRow icon="log-out-outline" label="Đăng xuất" onPress={handleLogout} danger last />
          </Card>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.version}>
            Vika Hotel · phiên bản {Constants.expoConfig?.version ?? '1.0.0'}
          </ThemedText>
        </View>
      </ScrollView>
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
