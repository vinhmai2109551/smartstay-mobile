import { apiClient } from './client';
import { Paginated } from '@/types/common';
import {
  AddBookingServiceDto,
  Booking,
  BookingDetail,
  BookingStatus,
  CancelBookingDto,
  CreateBookingDto,
} from '@/types/booking';

export type MyBookingsParams = {
  status?: BookingStatus;
  page?: number;
};

export const bookingsApi = {
  create: (dto: CreateBookingDto) =>
    apiClient.post<{ booking: Booking }>('/bookings', dto).then((r) => r.data.booking),

  my: (params?: MyBookingsParams) =>
    apiClient.get<Paginated<Booking>>('/bookings/my', { params }).then((r) => r.data),

  detail: (id: string) => apiClient.get<BookingDetail>(`/bookings/${id}`).then((r) => r.data),

  cancel: (id: string, dto: CancelBookingDto) =>
    apiClient.patch<{ message: string }>(`/bookings/${id}/cancel`, dto).then((r) => r.data),

  addService: (id: string, dto: AddBookingServiceDto) =>
    apiClient.post<{ booking: BookingDetail }>(`/bookings/${id}/services`, dto).then((r) => r.data.booking),
};
