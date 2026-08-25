import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { z } from 'zod';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { accessToken, refreshToken, user } = await authApi.login(values);
      setSession({ accessToken, refreshToken }, user);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Sai email hoặc mật khẩu.'));
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <ThemedText type="title" style={styles.title}>
        SmartStay
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
        Đăng nhập để tìm và đặt phòng
      </ThemedText>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Mật khẩu"
            placeholder="••••••••"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      {serverError ? (
        <ThemedText type="small" themeColor="danger">
          {serverError}
        </ThemedText>
      ) : null}

      <Button label="Đăng nhập" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <Link href="/(auth)/register" style={styles.link}>
        <ThemedText type="link" themeColor="primary">
          Chưa có tài khoản? Đăng ký ngay
        </ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: Spacing.three },
  title: { textAlign: 'center', fontSize: 34, lineHeight: 40 },
  subtitle: { textAlign: 'center', marginBottom: Spacing.three },
  link: { alignSelf: 'center', marginTop: Spacing.two },
});
