import { apiClient } from './client';
import { Promotion, ValidatePromotionResponse } from '@/types/promotion';

export const promotionsApi = {
  listActive: () =>
    apiClient.get<Promotion[]>('/promotions', { params: { active: true } }).then((r) => r.data),

  validate: (code: string, bookingAmount: number) =>
    apiClient
      .get<ValidatePromotionResponse>(`/promotions/${code}/validate`, { params: { bookingAmount } })
      .then((r) => r.data),
};
