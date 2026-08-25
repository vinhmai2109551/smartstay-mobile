import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
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

const schema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', phone: '', email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await authApi.register(values);
      setSuccess(true);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Đăng ký thất bại, vui lòng thử lại.'));
    }
  };

  if (success) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Đăng ký thành công
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Hãy đăng nhập bằng tài khoản vừa tạo.
        </ThemedText>
        <Button label="Đến trang đăng nhập" onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <ThemedText type="title" style={styles.title}>
        Tạo tài khoản
      </ThemedText>

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Họ và tên"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.fullName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Số điện thoại"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
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

      <Button label="Đăng ký" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText type="link" themeColor="primary">
          Đã có tài khoản? Đăng nhập
        </ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: Spacing.three },
  title: { textAlign: 'center', fontSize: 28, lineHeight: 34 },
  subtitle: { textAlign: 'center' },
  link: { alignSelf: 'center', marginTop: Spacing.two },
});
