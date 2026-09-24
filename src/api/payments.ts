import { apiClient } from './client';
import { Booking } from '@/types/booking';
import { CreatePayosLinkResponse } from '@/types/payment';

export const paymentsApi = {
  createPayosLink: (bookingId: string) =>
    apiClient.post<CreatePayosLinkResponse>(`/payments/payos/${bookingId}/link`).then((r) => r.data),

  // Actively asks PayOS for the latest status; returns the full (possibly
  // updated) Booking, not a bare status field.
  syncPayosStatus: (bookingId: string) =>
    apiClient.get<Booking>(`/payments/payos/${bookingId}/sync`).then((r) => r.data),
};
