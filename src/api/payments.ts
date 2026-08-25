import { apiClient } from './client';
import { CreatePaymentLinkDto, CreatePaymentLinkResponse, PaymentStatusResponse } from '@/types/payment';

export const paymentsApi = {
  createLink: (dto: CreatePaymentLinkDto) =>
    apiClient.post<CreatePaymentLinkResponse>('/payments/createlink', dto).then((r) => r.data),

  status: (bookingId: string) =>
    apiClient.get<PaymentStatusResponse>(`/payments/${bookingId}/status`).then((r) => r.data),
};
