import { apiClient } from './client';
import {
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  LoginResponse,
  RegisterDto,
  RegisterResponse,
  ResendOtpDto,
  ResetPasswordDto,
  User,
  VerifyOtpDto,
  VerifyResetOtpDto,
} from '@/types/auth';

export const authApi = {
  // Step 1/2 of registration — only sends an OTP, the account isn't created yet.
  register: (dto: RegisterDto) =>
    apiClient.post<RegisterResponse>('/auth/register', dto).then((r) => r.data),

  // Step 2/2 — creates the account once the OTP is confirmed.
  verifyOtp: (dto: VerifyOtpDto) =>
    apiClient.post<{ message: string }>('/auth/verify-otp', dto).then((r) => r.data),

  resendOtp: (dto: ResendOtpDto) =>
    apiClient.post<{ message: string }>('/auth/resend-otp', dto).then((r) => r.data),

  // turnstileToken comes from the Turnstile widget running in a WebView (see TurnstileWidget).
  login: (dto: LoginDto) => apiClient.post<LoginResponse>('/auth/login', dto).then((r) => r.data),

  google: (dto: GoogleLoginDto) => apiClient.post<LoginResponse>('/auth/google', dto).then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),

  logout: () => apiClient.post<{ message: string }>('/auth/logout').then((r) => r.data),

  forgotPassword: (dto: ForgotPasswordDto) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', dto).then((r) => r.data),

  verifyResetOtp: (dto: VerifyResetOtpDto) =>
    apiClient.post<{ message: string }>('/auth/verify-reset-otp', dto).then((r) => r.data),

  resetPassword: (dto: ResetPasswordDto) =>
    apiClient.post<{ message: string }>('/auth/reset-password', dto).then((r) => r.data),
};
