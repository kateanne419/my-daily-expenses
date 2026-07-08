import type { AccountType } from './types';

export const DEBITING_ACCOUNT_TYPES: AccountType[] = ['bank', 'ewallet', 'cash', 'splitwise', 'other'];

export const DEBITING_TYPE_LABELS: Record<(typeof DEBITING_ACCOUNT_TYPES)[number], string> = {
  bank: 'Bank / savings',
  ewallet: 'E-wallet',
  cash: 'Cash',
  splitwise: 'Splitwise',
  other: 'Other',
};

export function isCreditCardAccount(type: AccountType) {
  return type === 'credit_card';
}

export function isDebitingAccount(type: AccountType) {
  return !isCreditCardAccount(type);
}

export function accountKindLabel(type: AccountType) {
  if (isCreditCardAccount(type)) return 'Credit card';
  return DEBITING_TYPE_LABELS[type as (typeof DEBITING_ACCOUNT_TYPES)[number]] ?? 'Spending account';
}
