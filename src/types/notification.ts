// Mirrors backend NotificationType (common/enums/notification-type.enum.ts).
export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'PAYMENT_PAID'
  | 'PAYMENT_FAILED'
  | 'REVIEW_REPLIED';

export type AppNotification = {
  notificationId: string;
  // Typed loosely so a type added on the backend still renders (with the default icon).
  type: NotificationType | (string & {});
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  // Related booking/room type — tapping the notification opens it.
  bookingId: string | null;
  roomTypeId: string | null;
};

// GET /notifications returns the 20 most recent plus the total unread count.
export type NotificationFeed = {
  unreadCount: number;
  items: AppNotification[];
};

// Payload of the `notification:new` socket event.
export type NotificationPush = Pick<AppNotification, 'notificationId' | 'type' | 'title' | 'message'>;
