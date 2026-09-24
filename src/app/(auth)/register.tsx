import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { GoogleLogo } from '@/components/GoogleLogo';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { OrDivider } from '@/components/ui/OrDivider';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { MinTouch, Radius, Space } from '@/constants/theme';
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
      // Step 1/2: this only sends an OTP to the email — the account is not
      // created yet (doc/API.md 1.1). Verification happens on the next screen.
      await authApi.register({ fullName, email, phone, password });
      router.push({ pathname: '/(auth)/verify-otp', params: { email } });
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Đăng ký thất bại, vui lòng thử lại.'));
    }
  };

  return (
    <Screen decorated contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <ThemedText type="bodyBold">Tạo tài khoản</ThemedText>
      </View>

      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <BrandMark size={64} />
        <ThemedText type="title">Bắt đầu kỳ nghỉ của bạn</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          Chỉ mất một phút để tạo tài khoản và nhận ưu đãi dành riêng cho bạn.
        </ThemedText>
      </Animated.View>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Họ và tên"
              leftIcon="person-outline"
              textContentType="name"
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
              leftIcon="mail-outline"
              placeholder="ban@email.com"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
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
              leftIcon="call-outline"
              textContentType="telephoneNumber"
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
              leftIcon="lock-closed-outline"
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
              textContentType="newPassword"
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
                của Vika Hotel.
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
        <View style={[styles.errorBox, { backgroundColor: `${theme.danger}14` }]}>
          <Ionicons name="alert-circle" size={18} color={theme.danger} />
          <ThemedText type="small" themeColor="danger" style={styles.agreeText}>
            {serverError}
          </ThemedText>
        </View>
      ) : null}

      <Button label="Đăng ký" size="lg" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <OrDivider />

      <Button
        label="Tiếp tục với Google"
        variant="outline"
        size="lg"
        leading={<GoogleLogo size={20} />}
        onPress={() =>
          Alert.alert(
            'Dùng Google ở màn Đăng nhập',
            'Google tự tạo tài khoản cho bạn nếu email chưa tồn tại — quay lại màn Đăng nhập và bấm "Tiếp tục với Google".',
            [
              { text: 'Để sau', style: 'cancel' },
              { text: 'Đến Đăng nhập', onPress: () => router.replace('/(auth)/login') },
            ],
          )
        }
      />

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          Đã có tài khoản?
        </ThemedText>
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <ThemedText type="smallBold" themeColor="primary">
              Đăng nhập
            </ThemedText>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Space.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  backButton: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: MinTouch / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { gap: Space.sm },
  fields: { gap: Space.lg },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.md },
  agreeText: { flex: 1, flexShrink: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, padding: Space.md, borderRadius: Radius.md },
  spacer: { flex: 1, minHeight: Space.lg },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space.xs,
    paddingBottom: Space.lg,
  },
});
