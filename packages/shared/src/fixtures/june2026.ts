import type { MonthData } from '../types';

const USER = 'demo-user';
const MONTH = '2026-06';

function acct(
  id: string,
  name: string,
  type: MonthData['accounts'][0]['type'],
  balance: number,
  order: number,
  extra?: Partial<MonthData['accounts'][0]>
) {
  return {
    id,
    user_id: USER,
    name,
    type,
    current_balance: balance,
    display_order: order,
    ...extra,
  };
}

export const june2026Fixture: MonthData = {
  monthId: MONTH,
  year: 2026,
  month: 6,
  label: 'June 2026',
  accounts: [
    acct('bdo', 'BDO', 'bank', 187.2, 1),
    acct('ub', 'UB', 'bank', 0, 2),
    acct('seabank', 'SeaBank', 'bank', 62788.33, 3),
    acct('maya', 'Maya', 'ewallet', 0, 4),
    acct('gcash', 'GCash', 'ewallet', 136.19, 5),
    acct('cash', 'Cash', 'cash', 2000, 6),
    acct('cbc', 'CBC MC Freedom 6003', 'credit_card', 0, 7, { credit_limit: 50000 }),
    acct('bpi', 'BPI MC Rewards 6382', 'credit_card', 0, 8, { credit_limit: 80000 }),
    acct('ub-gold', 'UB V Gold 1781', 'credit_card', -28800, 9, {
      credit_limit: 250000,
      statement_day: 20,
      due_day: 7,
    }),
    acct('maya-landers', 'Maya VP Landers 6683', 'credit_card', -9216.11, 10, {
      credit_limit: 50000,
    }),
    acct('maya-black', 'Maya VP Black 4795', 'credit_card', -5842.1, 11, {
      credit_limit: 100000,
    }),
    acct('splitwise', 'Splitwise', 'splitwise', 357.5, 12),
  ],
  incomeSources: [
    { id: 'inc-1', user_id: USER, month_id: MONTH, name: 'Salary', amount: 35937.5 },
    { id: 'inc-2', user_id: USER, month_id: MONTH, name: 'Bank Interest', amount: 35 },
    { id: 'inc-3', user_id: USER, month_id: MONTH, name: 'B&S/Cashbacks', amount: 2354 },
  ],
  fixedBudgets: [
    { id: 'fb-1', user_id: USER, month_id: MONTH, name: 'Condo Assoc Dues', budget_amount: 8500, spent_amount: 8500, is_paid: true },
    { id: 'fb-2', user_id: USER, month_id: MONTH, name: 'Condo Water', budget_amount: 500, spent_amount: 500, is_paid: false, due_date: '2026-06-14' },
    { id: 'fb-3', user_id: USER, month_id: MONTH, name: 'Internet', budget_amount: 2499, spent_amount: 2499, is_paid: true },
    { id: 'fb-4', user_id: USER, month_id: MONTH, name: 'Netflix', budget_amount: 549, spent_amount: 549, is_paid: true },
    { id: 'fb-5', user_id: USER, month_id: MONTH, name: 'Spotify', budget_amount: 149, spent_amount: 149, is_paid: true },
    { id: 'fb-6', user_id: USER, month_id: MONTH, name: 'Other Fixed', budget_amount: 35554, spent_amount: 35454, is_paid: true },
    { id: 'fb-sav', user_id: USER, month_id: MONTH, name: 'Monthly Savings', budget_amount: 16500, spent_amount: 16500, is_paid: true, is_savings: true },
  ],
  variableBudgets: [
    { id: 'vb-1', user_id: USER, month_id: MONTH, category: 'Food', budget_amount: 8000, spent_amount: 7736.99 },
    { id: 'vb-2', user_id: USER, month_id: MONTH, category: 'Transpo', budget_amount: 3500, spent_amount: 2799 },
    { id: 'vb-3', user_id: USER, month_id: MONTH, category: 'Personal Care', budget_amount: 2000, spent_amount: 1800 },
    { id: 'vb-4', user_id: USER, month_id: MONTH, category: 'Hobbies', budget_amount: 3000, spent_amount: 2500 },
    { id: 'vb-5', user_id: USER, month_id: MONTH, category: 'Shopping', budget_amount: 4190, spent_amount: 4000 },
    { id: 'vb-6', user_id: USER, month_id: MONTH, category: 'Grocery', budget_amount: 2500, spent_amount: 2073.1 },
  ],
  transactions: [],
  transfers: [],
  personalDebts: [],
  creditCardPayments: [],
  dailySummaries: [
    { date: '2026-06-01', amount: 20711, is_opening_snapshot: true },
    { date: '2026-06-02', amount: 1250.5 },
    { date: '2026-06-03', amount: 890 },
    { date: '2026-06-04', amount: 2100 },
    { date: '2026-06-05', amount: 1750 },
    { date: '2026-06-06', amount: 3200 },
    { date: '2026-06-07', amount: 980 },
    { date: '2026-06-08', amount: 1450 },
    { date: '2026-06-09', amount: 2200 },
    { date: '2026-06-10', amount: 1890 },
    { date: '2026-06-11', amount: 2560 },
    { date: '2026-06-12', amount: 1100 },
    { date: '2026-06-13', amount: 1675 },
    { date: '2026-06-14', amount: 2340 },
    { date: '2026-06-15', amount: 1980 },
  ],
};

export const june2026Expected = {
  onHand: 21611.01,
  totalIncome: 38326.5,
  totalExpenses: 52060.09,
  fixedBudgetTotal: 47751,
  fixedSpentTotal: 47651,
  variableBudgetTotal: 23190,
  variableSpentTotal: 20909.09,
  combinedBudget: 70941,
  combinedSpent: 68560.09,
  dailyMTDThroughJune15: 25365.5,
};
