import type { MonthData, TransactionCategory } from './types';

export const VARIABLE_CATEGORIES: TransactionCategory[] = [
  'Bills',
  'Food',
  'Transpo',
  'Personal Care',
  'Hobbies',
  'Shopping',
  'Grocery',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function monthId(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function currentMonthParts(date = new Date()) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function isFutureMonth(year: number, month: number, now = new Date()) {
  const current = currentMonthParts(now);
  return year > current.year || (year === current.year && month > current.month);
}

function defaultAccounts(_userId: string) {
  return [] as MonthData['accounts'];
}

export function cloneAccountsForNewMonth(source: MonthData['accounts'], userId: string) {
  return source.map((account) => ({
    ...account,
    user_id: userId,
    current_balance: 0,
  }));
}

export function createEmptyMonth(
  year: number,
  month: number,
  userId: string,
  accounts?: MonthData['accounts']
): MonthData {
  const id = monthId(year, month);
  return {
    monthId: id,
    year,
    month,
    label: monthLabel(year, month),
    accounts: accounts ?? defaultAccounts(userId),
    incomeSources: [],
    transactions: [],
    transfers: [],
    fixedBudgets: [],
    variableBudgets: VARIABLE_CATEGORIES.map((category, index) => ({
      id: `${id}-vb-${index}`,
      user_id: userId,
      month_id: id,
      category,
      budget_amount: 0,
      spent_amount: 0,
    })),
    personalDebts: [],
    creditCardPayments: [],
    dailySummaries: [],
  };
}

export function createInitialMonths(userId: string, now = new Date()) {
  const { year, month } = currentMonthParts(now);
  const id = monthId(year, month);
  return {
    activeMonthId: id,
    months: { [id]: createEmptyMonth(year, month, userId) },
  };
}
