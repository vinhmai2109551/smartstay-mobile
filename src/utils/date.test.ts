import { formatDate, formatDateTime, nightsBetween, toIsoDate } from './date';

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
