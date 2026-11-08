import { canShowCheckInPass } from './bookingQr';
import { BookingStatus, PaymentMethod, PaymentStatus } from '@/types/booking';

type Case = [status: BookingStatus, paymentMethod: PaymentMethod, paymentStatus: PaymentStatus, expected: boolean];

// Mirrors the status × paymentMethod × paymentStatus table in docs/IMPROVEMENT_LOG.md (A1).
const cases: Case[] = [
  ['PENDING', 'CASH', 'UNPAID', false],
  ['PENDING', 'CASH', 'PAID', false],
  ['PENDING', 'PAYOS', 'UNPAID', false],
  ['PENDING', 'PAYOS', 'PAID', false],
  ['CONFIRMED', 'CASH', 'UNPAID', true],
  ['CONFIRMED', 'CASH', 'PAID', true],
  ['CONFIRMED', 'CASH', 'FAILED', true],
  ['CONFIRMED', 'PAYOS', 'PAID', true],
  ['CONFIRMED', 'PAYOS', 'UNPAID', false],
  ['CONFIRMED', 'PAYOS', 'FAILED', false],
  ['CHECKED_IN', 'CASH', 'UNPAID', true],
  ['CHECKED_IN', 'PAYOS', 'PAID', true],
  ['CHECKED_IN', 'PAYOS', 'UNPAID', false],
  ['CHECKED_IN', 'PAYOS', 'FAILED', false],
  ['CHECKED_OUT', 'CASH', 'PAID', false],
  ['CHECKED_OUT', 'PAYOS', 'PAID', false],
  ['CANCELLED', 'CASH', 'PAID', false],
  ['CANCELLED', 'PAYOS', 'PAID', false],
];

describe('canShowCheckInPass', () => {
  test.each(cases)('status=%s paymentMethod=%s paymentStatus=%s -> %s', (status, paymentMethod, paymentStatus, expected) => {
    expect(canShowCheckInPass({ status, paymentMethod, paymentStatus })).toBe(expected);
  });
});
