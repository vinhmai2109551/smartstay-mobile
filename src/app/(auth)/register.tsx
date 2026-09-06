import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { OrDivider } from '@/components/ui/OrDivider';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const schema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  agree: z.boolean().refine((v) => v === true, 'Bạn cần đồng ý điều khoản để tiếp tục'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const theme = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', agree: false },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { fullName, email, phone, password } = values;
      await authApi.register({ fullName, email, phone, password });
      setSuccess(true);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Đăng ký thất bại, vui lòng thử lại.'));
    }
  };

  if (success) {
    return (
      <Screen contentContainerStyle={styles.successContent}>
        <View style={[styles.successBadge, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
        </View>
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
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.backButton, { borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText type="smallBold">Tạo tài khoản</ThemedText>
      </View>

      <View style={styles.hero}>
        <ThemedText type="title" style={styles.heroTitle}>
          Bắt đầu với SmartStay
        </ThemedText>
        <ThemedText themeColor="textSecondary">Chỉ mất một phút để tạo tài khoản.</ThemedText>
      </View>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
            />
          )}
        />

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
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Số điện thoại"
              placeholder="09xx xxx xxx"
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
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Mật khẩu"
              placeholder="Tối thiểu 6 ký tự"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="agree"
        render={({ field: { onChange, value } }) => (
          <View style={styles.agreeRow}>
            <Checkbox checked={value} onChange={onChange} />
            <Text style={styles.agreeText}>
              <ThemedText type="small" themeColor="textSecondary">
                Tôi đồng ý với{' '}
              </ThemedText>
              <ThemedText type="small" themeColor="primary">
                Điều khoản sử dụng
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {' '}
                và{' '}
              </ThemedText>
              <ThemedText type="small" themeColor="primary">
                Chính sách bảo mật
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {' '}
                của SmartStay.
              </ThemedText>
            </Text>
          </View>
        )}
      />
      {errors.agree ? (
        <ThemedText type="small" themeColor="danger">
          {errors.agree.message}
        </ThemedText>
      ) : null}

      {serverError ? (
        <ThemedText type="small" themeColor="danger">
          {serverError}
        </ThemedText>
      ) : null}

      <Button label="Đăng ký" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <OrDivider />

      <Button
        label="Tiếp tục với Google"
        variant="outline"
        icon="logo-google"
        onPress={() => Alert.alert('Sắp ra mắt', 'Đăng nhập bằng Google sẽ sớm được hỗ trợ.')}
      />

      <View style={styles.spacer} />

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText type="link" themeColor="primary">
          Đã có tài khoản? Đăng nhập
        </ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { gap: Spacing.one },
  heroTitle: { textAlign: 'left' },
  fields: { gap: Spacing.three },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  agreeText: { flex: 1, flexShrink: 1 },
  spacer: { flex: 1, minHeight: Spacing.three },
  link: { alignSelf: 'center', paddingBottom: Spacing.three },
  successContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three },
  successBadge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
});
