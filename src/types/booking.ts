import { RoomType } from './room';
import { Service } from './service';
import { Promotion } from './promotion';
import { User } from './auth';

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

// Full shape returned by every booking endpoint (doc/API.md 5.6) — the
// backend sends the raw entity with nested relations, not a slimmed-down DTO.
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
  // TODO: not confirmed with backend yet — POST /bookings currently has no guest-count
  // field in its body (see docs/API.md 5.1). The guest count collected in booking/new.tsx
  // is only ever shown to the user, never sent. Do NOT start sending this until backend
  // confirms a field name and that an extra unknown field won't 400 under DTO whitelisting.
  numberOfGuests?: number;
};

export type AddBookingServiceDto = {
  serviceId: string;
  quantity: number;
};

export type CancelBookingDto = {
  reason: string;
};
