export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'COMPLETED'
  | 'CANCELLED';

export type GuestInfo = {
  fullName: string;
  phone: string;
  email?: string;
  guests: number;
  note?: string;
};

export type BookingServiceItem = {
  serviceId: string;
  name?: string;
  quantity: number;
  price?: number;
};

export type Booking = {
  id: string;
  roomTypeId: string;
  roomTypeName?: string;
  checkIn: string;
  checkOut: string;
  guestInfo: GuestInfo;
  status: BookingStatus;
  totalAmount?: number;
  qrCode?: string;
  createdAt?: string;
};

export type BookingDetail = Booking & {
  bookingDetail?: Record<string, unknown>;
  paymentInfo?: {
    status: 'PAID' | 'PENDING' | 'FAILED';
    amount?: number;
  };
  services?: BookingServiceItem[];
};

export type CreateBookingDto = {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guestInfo: GuestInfo;
  extraServiceIds?: string[];
  promotionCode?: string;
};

export type AddBookingServiceDto = {
  serviceId: string;
  quantity: number;
};

export type CancelBookingDto = {
  reason: string;
};
