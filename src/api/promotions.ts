import { apiClient } from './client';
import { Promotion, ValidatePromotionParams, ValidatePromotionResponse } from '@/types/promotion';

export const promotionsApi = {
  listActive: () =>
    apiClient.get<Promotion[]>('/promotions', { params: { active: true } }).then((r) => r.data),

  // The server recomputes the room amount from roomTypeId + dates; serviceAmount
  // only counts toward the minimum-order condition.
  validate: (code: string, params: ValidatePromotionParams) =>
    apiClient
      .get<ValidatePromotionResponse>(`/promotions/${encodeURIComponent(code)}/validate`, { params })
      .then((r) => r.data),
};
