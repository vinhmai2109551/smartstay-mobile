import dayjs, { type Dayjs } from 'dayjs';
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

// Đặt lại đúng ngày cũ nếu check-in cũ chưa qua; nếu đã qua, dời sang ngày mai và giữ
// nguyên số đêm, để room/[id].tsx luôn nhận được một khoảng ngày còn đặt được.
export function getRebookDates(checkInDate: string, checkOutDate: string, today: Dayjs = dayjs()) {
  const todayStart = today.startOf('day');
  if (!dayjs(checkInDate).startOf('day').isBefore(todayStart)) {
    return {
      checkIn: toIsoDate(dayjs(checkInDate).toDate()),
      checkOut: toIsoDate(dayjs(checkOutDate).toDate()),
    };
  }
  const nights = nightsBetween(checkInDate, checkOutDate);
  const newCheckIn = todayStart.add(1, 'day');
  return {
    checkIn: toIsoDate(newCheckIn.toDate()),
    checkOut: toIsoDate(newCheckIn.add(nights, 'day').toDate()),
  };
}
