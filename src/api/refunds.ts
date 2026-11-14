import { apiClient } from './client';
import { MyRefundRequest } from '@/types/refund';

export const refundsApi = {
  mine: () => apiClient.get<MyRefundRequest[]>('/refund-requests/mine').then((r) => r.data),
};
