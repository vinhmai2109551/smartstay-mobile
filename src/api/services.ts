import { apiClient } from './client';
import { Service } from '@/types/service';

export const servicesApi = {
  list: (search?: string) =>
    apiClient.get<Service[]>('/services', { params: { search } }).then((r) => r.data),
};
