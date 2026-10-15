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
