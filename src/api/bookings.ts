import { apiClient } from './client';
import { Paginated } from '@/types/common';
import { AddBookingServiceDto, Booking, BookingStatus, CancelBookingDto, CreateBookingDto } from '@/types/booking';

export type MyBookingsParams = {
  status?: BookingStatus;
  page?: number;
};

export const bookingsApi = {
  // Backend returns the created Booking directly (201), not wrapped.
  create: (dto: CreateBookingDto) => apiClient.post<Booking>('/bookings', dto).then((r) => r.data),

  my: (params?: MyBookingsParams) =>
    apiClient.get<Paginated<Booking>>('/bookings/my', { params }).then((r) => r.data),

  detail: (id: string) => apiClient.get<Booking>(`/bookings/${id}`).then((r) => r.data),

  // Only returns { message } — refetch detail() if you need the updated Booking.
  cancel: (id: string, dto: CancelBookingDto) =>
    apiClient.patch<{ message: string }>(`/bookings/${id}/cancel`, dto).then((r) => r.data),

  addService: (id: string, dto: AddBookingServiceDto) =>
    apiClient.post<Booking>(`/bookings/${id}/services`, dto).then((r) => r.data),
};
