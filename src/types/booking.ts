import { RoomType } from './room';
import { Service } from './service';
import { Promotion } from './promotion';
import { User } from './auth';
import { BookingRefundRequest } from './refund';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'PAYOS';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED';

// Guest actually staying — may differ from the account holder (booking on
// someone else's behalf). Note there is no "guests" head-count field on the
// backend booking; room capacity implicitly bounds it.
export type GuestInfo = {
  fullName: string;
  phone: string;
  email?: string;
};

export type BookingServiceItem = {
  bookingServiceId: string;
  service: Service;
  quantity: number;
  unitPrice: number;
  createdAt?: string;
};

// Full shape returned by every booking endpoint (BookingService) — the backend
// sends the raw entity with nested relations, not a slimmed-down DTO.
export type Booking = {
  bookingId: string;
  user: User;
  staff: User | null;
  roomType: RoomType;
  room: { roomId: string; roomNumber: string } | null;
  checkInDate: string;
  checkOutDate: string;
  guestInfo: GuestInfo;
  promotion: Promotion | null;
  discountAmount: number;
  roomAmount: number;
  lateNights: number;
  lateCheckoutFee: number;
  paidAmount: number;
  status: BookingStatus;
  cancelReason: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  payosOrderCode: string | null;
  serviceItems: BookingServiceItem[];
  createdAt: string;
  updatedAt: string;
  serviceAmount: number;
  vatAmount: number;
  totalAmount: number;
  dueAmount: number;
  // Only present on GET /bookings/:id (BookingService.findById) — null if the booking
  // was never cancelled-while-paid (no RefundRequest ever created for it).
  refundRequest?: BookingRefundRequest | null;
};

export type BookingDetail = Booking;

export type CreateBookingDto = {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guestInfo: GuestInfo;
  extraServiceIds?: string[];
  promotionCode?: string;
  paymentMethod?: PaymentMethod;
  // No guest-count field on purpose: the backend's CreateBookingDto has none and its global
  // ValidationPipe uses `whitelist: true`, so an extra property would be silently dropped
  // (never persisted, never a 400). Add it here only together with a backend DTO field.
};

export type AddBookingServiceDto = {
  serviceId: string;
  quantity: number;
};

export type CancelBookingDto = {
  reason: string;
};
