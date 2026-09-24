export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CHECKED_IN'
  | 'BOOKING_CHECKED_OUT'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: NotificationType | string;
  // Related booking, if any — tapping the notification opens it.
  bookingId?: string | null;
};
