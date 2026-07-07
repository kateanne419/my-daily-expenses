export { formatPhp } from '@expense-tracker/shared';

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function parseAmount(value: string): number | null {
  const n = parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}
