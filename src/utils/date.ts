import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';

// Vietnamese weekday/month names for patterns like 'dddd'; numeric patterns are unaffected.
dayjs.locale('vi');

/** Switches dayjs's weekday/month names (used by patterns like 'dddd') to match the app language. */
export function setDateLocale(language: string) {
  dayjs.locale(language === 'en' ? 'en' : 'vi');
}

export function formatDate(value: string | Date | undefined | null, pattern = 'DD/MM/YYYY') {
  if (!value) return '—';
  return dayjs(value).format(pattern);
}

export function formatDateTime(value: string | Date | undefined | null) {
  return formatDate(value, 'DD/MM/YYYY HH:mm');
}

export function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  return Math.max(1, dayjs(checkOut).diff(dayjs(checkIn), 'day'));
}

export function toIsoDate(value: Date) {
  return dayjs(value).format('YYYY-MM-DD');
}
