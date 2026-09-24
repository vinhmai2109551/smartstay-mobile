import { apiClient } from './client';
import { ChangePasswordDto, UpdateProfileDto, User } from '@/types/auth';

export const usersApi = {
  me: () => apiClient.get<User>('/users/me').then((r) => r.data),

  updateMe: (dto: UpdateProfileDto) => apiClient.patch<User>('/users/me', dto).then((r) => r.data),

  changePassword: (dto: ChangePasswordDto) =>
    apiClient.patch<{ message: string }>('/users/me/password', dto).then((r) => r.data),
};
