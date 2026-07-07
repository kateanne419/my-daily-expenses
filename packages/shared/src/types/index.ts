import { z } from 'zod';

export const AccountTypeSchema = z.enum([
  'bank',
  'ewallet',
  'cash',
  'credit_card',
  'splitwise',
  'other',
]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const TransactionCategorySchema = z.enum([
  'Bills',
  'Food',
  'Transpo',
  'Personal Care',
  'Hobbies',
  'Shopping',
  'Grocery',
]);
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;

export const DebtDirectionSchema = z.enum(['they_owe_me', 'i_owe_them']);
export type DebtDirection = z.infer<typeof DebtDirectionSchema>;

export const AccountSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  type: AccountTypeSchema,
  current_balance: z.number(),
  credit_limit: z.number().nullable().optional(),
  statement_day: z.number().nullable().optional(),
  due_day: z.number().nullable().optional(),
  display_order: z.number(),
});
export type Account = z.infer<typeof AccountSchema>;

export const IncomeSourceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  month_id: z.string(),
  name: z.string(),
  amount: z.number(),
  linked_account_id: z.string().nullable().optional(),
});
export type IncomeSource = z.infer<typeof IncomeSourceSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  month_id: z.string(),
  date: z.string(),
  category: TransactionCategorySchema,
  amount: z.number(),
  account_id: z.string(),
  description: z.string().nullable().optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const TransferSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  month_id: z.string(),
  date: z.string(),
  from_account_id: z.string(),
  to_account_id: z.string(),
  amount: z.number(),
  notes: z.string().nullable().optional(),
});
export type Transfer = z.infer<typeof TransferSchema>;

export const FixedBudgetSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  month_id: z.string(),
  name: z.string(),
  budget_amount: z.number(),
  spent_amount: z.number(),
  is_paid: z.boolean(),
  due_date: z.string().nullable().optional(),
  is_savings: z.boolean().optional(),
});
export type FixedBudget = z.infer<typeof FixedBudgetSchema>;

export const VariableBudgetSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  month_id: z.string(),
  category: TransactionCategorySchema,
  budget_amount: z.number(),
  spent_amount: z.number(),
});
export type VariableBudget = z.infer<typeof VariableBudgetSchema>;

export const PersonalDebtSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  counterparty_name: z.string(),
  direction: DebtDirectionSchema,
  amount: z.number(),
  remaining: z.number(),
  notes: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: z.enum(['open', 'settled']),
});
export type PersonalDebt = z.infer<typeof PersonalDebtSchema>;

export const CreditCardPaymentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  month_id: z.string(),
  date: z.string(),
  to_card_account_id: z.string(),
  from_account_id: z.string(),
  amount: z.number(),
});
export type CreditCardPayment = z.infer<typeof CreditCardPaymentSchema>;

export const MonthSnapshotSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  year: z.number(),
  month: z.number(),
  label: z.string(),
  total_income: z.number(),
  total_expenses: z.number(),
  total_savings: z.number(),
  on_hand: z.number(),
});
export type MonthSnapshot = z.infer<typeof MonthSnapshotSchema>;

export const DailySummarySchema = z.object({
  date: z.string(),
  amount: z.number(),
  is_opening_snapshot: z.boolean().optional(),
});
export type DailySummary = z.infer<typeof DailySummarySchema>;

export interface MonthData {
  monthId: string;
  year: number;
  month: number;
  label: string;
  accounts: Account[];
  incomeSources: IncomeSource[];
  transactions: Transaction[];
  transfers: Transfer[];
  fixedBudgets: FixedBudget[];
  variableBudgets: VariableBudget[];
  personalDebts: PersonalDebt[];
  creditCardPayments: CreditCardPayment[];
  dailySummaries: DailySummary[];
}

export interface Tip {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface Prediction {
  id: string;
  label: string;
  value: string;
  detail?: string;
}

export interface Insight {
  id: string;
  label: string;
  value: string;
  detail?: string;
}
