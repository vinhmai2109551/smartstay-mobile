import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { OrDivider } from '@/components/ui/OrDivider';
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
      <BrandMark size={48} />

      <View style={styles.hero}>
        <ThemedText type="title" style={styles.heroTitle}>
          Chào mừng trở lại
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Đăng nhập để tiếp tục kỳ nghỉ của bạn tại SmartStay.
        </ThemedText>
      </View>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Email"
              placeholder="ban@email.com"
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
      </View>

      <ThemedText
        type="link"
        themeColor="primary"
        style={styles.forgotLink}
        onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng quên mật khẩu sẽ sớm được hỗ trợ.')}>
        Quên mật khẩu?
      </ThemedText>

      {serverError ? (
        <ThemedText type="small" themeColor="danger">
          {serverError}
        </ThemedText>
      ) : null}

      <Button label="Đăng nhập" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <OrDivider />

      <Button
        label="Tiếp tục với Google"
        variant="outline"
        icon="logo-google"
        onPress={() => Alert.alert('Sắp ra mắt', 'Đăng nhập bằng Google sẽ sớm được hỗ trợ.')}
      />

      <View style={styles.spacer} />

      <Link href="/(auth)/register" style={styles.link}>
        <ThemedText type="link" themeColor="primary">
          Chưa có tài khoản? Đăng ký ngay
        </ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Spacing.three },
  hero: { gap: Spacing.one },
  heroTitle: { textAlign: 'left' },
  fields: { gap: Spacing.three },
  forgotLink: { alignSelf: 'flex-end' },
  spacer: { flex: 1, minHeight: Spacing.three },
  link: { alignSelf: 'center', paddingBottom: Spacing.three },
});
