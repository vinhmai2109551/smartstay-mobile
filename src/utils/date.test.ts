import dayjs from 'dayjs';
import { formatDate, formatDateTime, getRebookDates, nightsBetween, toIsoDate } from './date';

describe('formatDate', () => {
  it('formats a Date with the default DD/MM/YYYY pattern', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('15/01/2026');
  });

  it('formats an ISO date string with a custom pattern', () => {
    expect(formatDate('2026-03-05', 'DD/MM')).toBe('05/03');
  });

  it('returns a dash for null or undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('includes the time, local to the given string', () => {
    expect(formatDateTime('2026-03-05T14:30:00')).toBe('05/03/2026 14:30');
  });
});

describe('nightsBetween', () => {
  it('counts whole nights between two dates', () => {
    expect(nightsBetween('2026-03-01', '2026-03-04')).toBe(3);
  });

  it('floors at 1 night for a same-day or inverted range', () => {
    expect(nightsBetween('2026-03-01', '2026-03-01')).toBe(1);
    expect(nightsBetween('2026-03-04', '2026-03-01')).toBe(1);
  });
});

describe('toIsoDate', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

describe('getRebookDates', () => {
  const TODAY = dayjs('2026-03-10');

  it.each<[string, string, string, string]>([
    ['old check-in is still in the future', '2026-03-20', '2026-03-23', '2026-03-20'],
    ['old check-in is exactly today', '2026-03-10', '2026-03-13', '2026-03-10'],
  ])('%s -> keeps the original check-in (%s)', (_label, checkIn, checkOut, expectedCheckIn) => {
    expect(getRebookDates(checkIn, checkOut, TODAY)).toEqual({
      checkIn: expectedCheckIn,
      checkOut,
    });
  });

  it.each<[string, string, string, number, string, string]>([
    ['1 night, already past', '2026-03-01', '2026-03-02', 1, '2026-03-11', '2026-03-12'],
    ['3 nights, already past', '2026-02-20', '2026-02-23', 3, '2026-03-11', '2026-03-14'],
    ['crosses a month boundary', '2026-01-25', '2026-01-27', 2, '2026-03-11', '2026-03-13'],
    ['crosses a year boundary', '2025-12-28', '2025-12-30', 2, '2026-03-11', '2026-03-13'],
  ])(
    '%s -> shifts to tomorrow keeping %i night(s)',
    (_label, checkIn, checkOut, _nights, expectedCheckIn, expectedCheckOut) => {
      expect(getRebookDates(checkIn, checkOut, TODAY)).toEqual({
        checkIn: expectedCheckIn,
        checkOut: expectedCheckOut,
      });
    },
  );
});
