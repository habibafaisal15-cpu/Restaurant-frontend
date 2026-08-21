import { format, parseISO, isValid } from 'date-fns';

const PKR_FORMATTER = new Intl.NumberFormat('en-PK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(parsed) ? parsed : null;
}

export function formatPKR(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return 'PKR 0';
  return `PKR ${PKR_FORMATTER.format(num)}`;
}

export function formatDate(date) {
  const d = toDate(date);
  if (!d) return '—';
  return format(d, 'dd MMM yyyy');
}

export function formatDateTime(date) {
  const d = toDate(date);
  if (!d) return '—';
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function formatTime(date) {
  const d = toDate(date);
  if (!d) return '—';
  return format(d, 'hh:mm a');
}

export function truncate(str, n = 50) {
  if (str == null) return '';
  const text = String(str);
  if (text.length <= n) return text;
  return `${text.slice(0, n).trimEnd()}…`;
}
