import { apiClient } from './client';
import {
  ChangePasswordDto,
  LoginDto,
  LoginResponse,
  RegisterDto,
  RegisterResponse,
  User,
} from '@/types/auth';

export const authApi = {
  register: (dto: RegisterDto) =>
    apiClient.post<RegisterResponse>('/auth/register', dto).then((r) => r.data),

  login: (dto: LoginDto) => apiClient.post<LoginResponse>('/auth/login', dto).then((r) => r.data),

  me: () => apiClient.get<{ user: User }>('/auth/me').then((r) => r.data.user),

  logout: () => apiClient.post<{ message: string }>('/auth/logout').then((r) => r.data),

  changePassword: (dto: ChangePasswordDto) =>
    apiClient.put<{ message: string }>('/auth/change-password', dto).then((r) => r.data),
};
