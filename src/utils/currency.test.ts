import { formatVND } from './currency';

describe('formatVND', () => {
  // Intl.NumberFormat('vi-VN', { style: 'currency' }) separates the amount from the "₫"
  // symbol with a NO-BREAK SPACE (U+00A0), not a regular space — verified against the
  // actual output in this test environment rather than assumed.
  const NBSP = ' ';

  it('formats a positive amount as VND currency', () => {
    expect(formatVND(1800000)).toBe(`1.800.000${NBSP}₫`);
  });

  it('formats zero', () => {
    expect(formatVND(0)).toBe(`0${NBSP}₫`);
  });

  it('returns an em dash for null or undefined', () => {
    expect(formatVND(null)).toBe('—');
    expect(formatVND(undefined)).toBe('—');
  });
});
