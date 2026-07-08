export { formatPhp } from '@expense-tracker/shared';

export function todayISO() {
  return dateToISO(new Date());
}

export function dateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (year && month && day) return new Date(year, month - 1, day);
  return new Date();
}

export function formatDisplayDate(value: string): string {
  return parseISODate(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function parseAmount(value: string): number | null {
  const n = parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}
