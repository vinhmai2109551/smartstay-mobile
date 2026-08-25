export function formatVND(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
