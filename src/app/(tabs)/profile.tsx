import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

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
      await authApi.changePassword({ oldPassword, newPassword });
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
    <Screen>
      <ThemedText type="title" style={styles.title}>
        Tài khoản
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText type="title" style={{ color: theme.primaryText, fontSize: 24 }}>
            {(user?.fullName ?? '?').charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="smallBold">{user?.fullName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user?.email}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user?.phone}
          </ThemedText>
        </View>
      </ThemedView>

      <Pressable
        style={[styles.menuItem, { borderColor: theme.border }]}
        onPress={() => router.push('/notifications')}>
        <Ionicons name="notifications-outline" size={20} color={theme.text} />
        <ThemedText style={styles.menuLabel}>Thông báo</ThemedText>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </Pressable>

      <Pressable
        style={[styles.menuItem, { borderColor: theme.border }]}
        onPress={() => setShowChangePassword((v) => !v)}>
        <Ionicons name="lock-closed-outline" size={20} color={theme.text} />
        <ThemedText style={styles.menuLabel}>Đổi mật khẩu</ThemedText>
        <Ionicons name={showChangePassword ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
      </Pressable>

      {showChangePassword ? (
        <ThemedView type="backgroundElement" style={styles.passwordForm}>
          <TextField
            label="Mật khẩu hiện tại"
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TextField label="Mật khẩu mới" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
          {passwordError ? (
            <ThemedText type="small" themeColor="danger">
              {passwordError}
            </ThemedText>
          ) : null}
          {passwordSuccess ? (
            <ThemedText type="small" themeColor="success">
              Đổi mật khẩu thành công.
            </ThemedText>
          ) : null}
          <Button
            label="Cập nhật mật khẩu"
            onPress={handleChangePassword}
            loading={submitting}
            disabled={!oldPassword || newPassword.length < 6}
          />
        </ThemedView>
      ) : null}

      <Button label="Đăng xuất" variant="outline" onPress={handleLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { gap: 2, flex: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  menuLabel: { flex: 1 },
  passwordForm: { gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
});
