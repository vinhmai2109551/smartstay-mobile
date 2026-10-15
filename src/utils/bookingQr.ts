import { Booking } from '@/types/booking';

/**
 * What the check-in QR encodes: just the bookingId (a UUID), the same as the web
 * (frontend/src/utils/bookingQrPayload.js). Reception scans it with the web's
 * QRScannerModal, which checks the UUID shape and loads GET /bookings/:id — so the
 * payload must stay exactly the id, no extra text.
 */
export function getBookingQrPayload(booking: Pick<Booking, 'bookingId'>) {
  return booking.bookingId;
}

/** Short human-readable code, e.g. "0DB33CEC" — read out at the desk if scanning fails. */
export function getBookingCode(bookingId: string) {
  return bookingId.slice(0, 8).toUpperCase();
}

/**
 * Whether the check-in QR should be shown: the booking must be staff-confirmed
 * (CONFIRMED) or already mid-stay (CHECKED_IN), and either payable at the desk (CASH)
 * or already settled (PAYOS + PAID). False for PENDING (not yet confirmed), CANCELLED,
 * CHECKED_OUT, or an unpaid PAYOS booking.
 */
export function canShowCheckInPass(booking: Pick<Booking, 'status' | 'paymentMethod' | 'paymentStatus'>): boolean {
  const isConfirmedOrStaying = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN';
  const isPayable = booking.paymentMethod === 'CASH' || booking.paymentStatus === 'PAID';
  return isConfirmedOrStaying && isPayable;
}
