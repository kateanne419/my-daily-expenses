import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  addMonths,
  cloneAccountsForNewMonth,
  computeCategorySpent,
  createEmptyMonth,
  createInitialMonths,
  isFutureMonth,
  type Account,
  type AccountType,
  type CreditCardPayment,
  type FixedBudget,
  type IncomeSource,
  type MonthData,
  type PersonalDebt,
  type Transaction,
  type TransactionCategory,
  type Transfer,
  type VariableBudget,
  VARIABLE_CATEGORIES,
} from '@expense-tracker/shared';
import { appStorage } from '@/lib/storage';

const DEMO_USER = 'demo-user';
const initial = createInitialMonths(DEMO_USER);

export interface AppState {
  userId: string;
  months: Record<string, MonthData>;
  activeMonthId: string;
  entryMode: 'expense' | 'transfer' | 'cc_payment';
  hydrated: boolean;
  setEntryMode: (mode: 'expense' | 'transfer' | 'cc_payment') => void;
  setActiveMonth: (year: number, month: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  addTransaction: (input: {
    date: string;
    category: TransactionCategory;
    amount: number;
    accountId: string;
    description?: string;
  }) => void;
  deleteTransaction: (transactionId: string) => void;
  addTransfer: (input: {
    date: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    notes?: string;
  }) => void;
  updateAccountBalance: (accountId: string, balance: number) => void;
  updateAccountName: (accountId: string, name: string) => void;
  addAccount: (input: {
    name: string;
    type: AccountType;
    credit_limit?: number | null;
  }) => void;
  updateFixedBudget: (id: string, patch: Partial<FixedBudget>) => void;
  addFixedBudget: (input: {
    name: string;
    budget_amount: number;
    due_date?: string;
    is_savings?: boolean;
  }) => void;
  deleteFixedBudget: (id: string) => void;
  updateVariableBudget: (id: string, patch: Partial<VariableBudget>) => void;
  addIncomeSource: (name: string, amount: number) => void;
  updateIncomeSource: (id: string, patch: Partial<IncomeSource>) => void;
  addPersonalDebt: (debt: Omit<PersonalDebt, 'id' | 'user_id'>) => void;
  settlePersonalDebt: (id: string) => void;
  addCreditCardPayment: (input: {
    date: string;
    toCardAccountId: string;
    fromAccountId: string;
    amount: number;
  }) => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function bumpDaily(month: MonthData, date: string, amount: number) {
  const existing = month.dailySummaries.find((d) => d.date === date && !d.is_opening_snapshot);
  if (existing) {
    existing.amount += amount;
  } else {
    month.dailySummaries.push({ date, amount });
  }
  month.dailySummaries.sort((a, b) => a.date.localeCompare(b.date));
}

function syncVariableSpentFromTransactions(month: MonthData) {
  const spentByCategory = computeCategorySpent(month.transactions);
  for (const vb of month.variableBudgets) {
    vb.spent_amount = spentByCategory[vb.category] ?? 0;
  }
}

function syncDailyFromTransactions(month: MonthData) {
  const snapshots = month.dailySummaries.filter((d) => d.is_opening_snapshot);
  const totals = new Map<string, number>();
  for (const tx of month.transactions) {
    totals.set(tx.date, (totals.get(tx.date) ?? 0) + tx.amount);
  }
  const fromTransactions = Array.from(totals.entries()).map(([date, amount]) => ({ date, amount }));
  month.dailySummaries = [...snapshots, ...fromTransactions].sort((a, b) => a.date.localeCompare(b.date));
}

function debitAccount(accounts: Account[], accountId: string, amount: number) {
  const acct = accounts.find((a) => a.id === accountId);
  if (acct) acct.current_balance -= amount;
}

function creditAccount(accounts: Account[], accountId: string, amount: number) {
  const acct = accounts.find((a) => a.id === accountId);
  if (acct) acct.current_balance += amount;
}

function patchActiveMonth(
  state: AppState,
  mutator: (month: MonthData) => void
): Pick<AppState, 'months' | 'activeMonthId'> {
  return patchMonthById(state, state.activeMonthId, mutator);
}

function patchMonthById(
  state: AppState,
  monthId: string,
  mutator: (month: MonthData) => void
): Pick<AppState, 'months' | 'activeMonthId'> {
  let targetMonthId = monthId;
  let existing = state.months[targetMonthId];
  if (!existing) {
    const fallback = createInitialMonths(state.userId);
    targetMonthId = fallback.activeMonthId;
    existing = fallback.months[targetMonthId];
  }
  const month = structuredClone(existing);
  mutator(month);
  return {
    months: { ...state.months, [targetMonthId]: month },
    activeMonthId: state.activeMonthId,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: DEMO_USER,
      months: initial.months,
      activeMonthId: initial.activeMonthId,
      entryMode: 'expense',
      hydrated: false,
      setEntryMode: (mode) => set({ entryMode: mode }),
      setActiveMonth: (year, month) => {
        if (isFutureMonth(year, month)) return;
        const id = `${year}-${String(month).padStart(2, '0')}`;
        set((state) => {
          const months = { ...state.months };
          if (!months[id]) {
            const source = state.months[state.activeMonthId];
            const accounts = source ? cloneAccountsForNewMonth(source.accounts, state.userId) : undefined;
            months[id] = createEmptyMonth(year, month, state.userId, accounts);
          }
          return { months, activeMonthId: id };
        });
      },
      goToPreviousMonth: () => {
        const state = get();
        const active = state.months[state.activeMonthId];
        const prev = addMonths(active.year, active.month, -1);
        get().setActiveMonth(prev.year, prev.month);
      },
      goToNextMonth: () => {
        const state = get();
        const active = state.months[state.activeMonthId];
        const next = addMonths(active.year, active.month, 1);
        get().setActiveMonth(next.year, next.month);
      },
      addTransaction: ({ date, category, amount, accountId, description }) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            month.transactions.unshift({
              id: uid(),
              user_id: state.userId,
              month_id: month.monthId,
              date,
              category,
              amount,
              account_id: accountId,
              description,
            });
            debitAccount(month.accounts, accountId, amount);
            const vb = month.variableBudgets.find((v) => v.category === category);
            if (vb) vb.spent_amount += amount;
            bumpDaily(month, date, amount);
          })
        );
      },
      deleteTransaction: (transactionId) => {
        set((state) => {
          for (const monthId of Object.keys(state.months)) {
            const source = state.months[monthId];
            const index = source.transactions.findIndex((tx) => tx.id === transactionId);
            if (index === -1) continue;

            return patchMonthById(state, monthId, (month) => {
              const txIndex = month.transactions.findIndex((tx) => tx.id === transactionId);
              if (txIndex === -1) return;
              const tx = month.transactions[txIndex];
              month.transactions.splice(txIndex, 1);
              creditAccount(month.accounts, tx.account_id, tx.amount);
              syncVariableSpentFromTransactions(month);
              syncDailyFromTransactions(month);
            });
          }
          return {};
        });
      },
      addTransfer: ({ date, fromAccountId, toAccountId, amount, notes }) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            month.transfers.unshift({
              id: uid(),
              user_id: state.userId,
              month_id: month.monthId,
              date,
              from_account_id: fromAccountId,
              to_account_id: toAccountId,
              amount,
              notes,
            });
            debitAccount(month.accounts, fromAccountId, amount);
            creditAccount(month.accounts, toAccountId, amount);
          })
        );
      },
      updateAccountBalance: (accountId, balance) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            const acct = month.accounts.find((a) => a.id === accountId);
            if (acct) acct.current_balance = balance;
          })
        );
      },
      updateAccountName: (accountId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => {
          const months = { ...state.months };
          for (const key of Object.keys(months)) {
            const acct = months[key].accounts.find((a) => a.id === accountId);
            if (acct) acct.name = trimmed;
          }
          return { months };
        });
      },
      addAccount: ({ name, type, credit_limit }) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) =>
          patchActiveMonth(state, (month) => {
            const maxOrder = month.accounts.reduce((max, account) => Math.max(max, account.display_order), 0);
            month.accounts.push({
              id: uid(),
              user_id: state.userId,
              name: trimmed,
              type,
              current_balance: 0,
              credit_limit: type === 'credit_card' ? credit_limit ?? null : null,
              statement_day: null,
              due_day: null,
              display_order: maxOrder + 1,
            });
          })
        );
      },
      updateFixedBudget: (id, patch) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            const item = month.fixedBudgets.find((f) => f.id === id);
            if (item) Object.assign(item, patch);
          })
        );
      },
      addFixedBudget: ({ name, budget_amount, due_date, is_savings }) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) =>
          patchActiveMonth(state, (month) => {
            month.fixedBudgets.push({
              id: uid(),
              user_id: state.userId,
              month_id: month.monthId,
              name: trimmed,
              budget_amount,
              spent_amount: 0,
              is_paid: false,
              due_date: due_date ?? null,
              is_savings: is_savings ?? false,
            });
          })
        );
      },
      deleteFixedBudget: (id) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            month.fixedBudgets = month.fixedBudgets.filter((f) => f.id !== id);
          })
        );
      },
      updateVariableBudget: (id, patch) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            const item = month.variableBudgets.find((v) => v.id === id);
            if (item) Object.assign(item, patch);
          })
        );
      },
      addIncomeSource: (name, amount) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            month.incomeSources.push({
              id: uid(),
              user_id: state.userId,
              month_id: month.monthId,
              name,
              amount,
            });
          })
        );
      },
      updateIncomeSource: (id, patch) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            const item = month.incomeSources.find((i) => i.id === id);
            if (item) Object.assign(item, patch);
          })
        );
      },
      addPersonalDebt: (debt) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            month.personalDebts.push({ ...debt, id: uid(), user_id: state.userId });
          })
        );
      },
      settlePersonalDebt: (id) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            const debt = month.personalDebts.find((d) => d.id === id);
            if (debt) {
              debt.status = 'settled';
              debt.remaining = 0;
            }
          })
        );
      },
      addCreditCardPayment: ({ date, toCardAccountId, fromAccountId, amount }) => {
        set((state) =>
          patchActiveMonth(state, (month) => {
            month.creditCardPayments.unshift({
              id: uid(),
              user_id: state.userId,
              month_id: month.monthId,
              date,
              to_card_account_id: toCardAccountId,
              from_account_id: fromAccountId,
              amount,
            });
            debitAccount(month.accounts, fromAccountId, amount);
            creditAccount(month.accounts, toCardAccountId, amount);
          })
        );
      },
    }),
    {
      name: 'expense-tracker-v2',
      storage: createJSONStorage(() => appStorage),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true });
      },
      partialize: (state) => ({
        months: state.months,
        activeMonthId: state.activeMonthId,
        entryMode: state.entryMode,
      }),
    }
  )
);

export const TRANSACTION_CATEGORIES = VARIABLE_CATEGORIES;

export function selectActiveMonth(state: AppState): MonthData {
  const month = state.months[state.activeMonthId];
  if (month) return month;
  const fallback = createInitialMonths(state.userId);
  return fallback.months[fallback.activeMonthId];
}
