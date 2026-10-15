// Mirrors backend NotificationType (notifications/notification.service.ts).
export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CHECKED_IN'
  | 'BOOKING_CHECKED_OUT'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REVIEW_REPLIED'
  | 'STAFF_NEW_BOOKING';

// Same shape for REST rows and the `notification:new` socket payload (toResponse on the backend).
export type AppNotification = {
  id: string;
  // Typed loosely so a type added on the backend still renders (with the default icon).
  type: NotificationType | (string & {});
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  // Related booking — tapping the notification opens it.
  bookingId: string | null;
};

// GET /notifications: one page (20 rows, newest first) plus the total row count.
export type NotificationPage = {
  data: AppNotification[];
  total: number;
};
