import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  computeMonthlySummary,
  generatePredictions,
  generateTips,
  june2026Fixture,
  type Account,
  type CreditCardPayment,
  type FixedBudget,
  type IncomeSource,
  type MonthData,
  type PersonalDebt,
  type Transaction,
  type TransactionCategory,
  type Transfer,
  type VariableBudget,
} from '@expense-tracker/shared';
import { appStorage } from '@/lib/storage';

const DEMO_USER = 'demo-user';

export interface AppState {
  userId: string;
  month: MonthData;
  entryMode: 'expense' | 'transfer';
  hydrated: boolean;
  setEntryMode: (mode: 'expense' | 'transfer') => void;
  addTransaction: (input: {
    date: string;
    category: TransactionCategory;
    amount: number;
    accountId: string;
    description?: string;
  }) => void;
  addTransfer: (input: {
    date: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    notes?: string;
  }) => void;
  updateAccountBalance: (accountId: string, balance: number) => void;
  updateFixedBudget: (id: string, patch: Partial<FixedBudget>) => void;
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
  getSummary: () => ReturnType<typeof computeMonthlySummary>;
  getTips: () => ReturnType<typeof generateTips>;
  getPredictions: () => ReturnType<typeof generatePredictions>;
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

function debitAccount(accounts: Account[], accountId: string, amount: number) {
  const acct = accounts.find((a) => a.id === accountId);
  if (acct) acct.current_balance -= amount;
}

function creditAccount(accounts: Account[], accountId: string, amount: number) {
  const acct = accounts.find((a) => a.id === accountId);
  if (acct) acct.current_balance += amount;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: DEMO_USER,
      month: structuredClone(june2026Fixture),
      entryMode: 'expense',
      hydrated: false,
      setEntryMode: (mode) => set({ entryMode: mode }),
      addTransaction: ({ date, category, amount, accountId, description }) => {
        set((state) => {
          const month = structuredClone(state.month);
          const tx: Transaction = {
            id: uid(),
            user_id: state.userId,
            month_id: month.monthId,
            date,
            category,
            amount,
            account_id: accountId,
            description,
          };
          month.transactions.unshift(tx);
          debitAccount(month.accounts, accountId, amount);
          const vb = month.variableBudgets.find((v) => v.category === category);
          if (vb) vb.spent_amount += amount;
          bumpDaily(month, date, amount);
          return { month };
        });
      },
      addTransfer: ({ date, fromAccountId, toAccountId, amount, notes }) => {
        set((state) => {
          const month = structuredClone(state.month);
          const transfer: Transfer = {
            id: uid(),
            user_id: state.userId,
            month_id: month.monthId,
            date,
            from_account_id: fromAccountId,
            to_account_id: toAccountId,
            amount,
            notes,
          };
          month.transfers.unshift(transfer);
          debitAccount(month.accounts, fromAccountId, amount);
          creditAccount(month.accounts, toAccountId, amount);
          return { month };
        });
      },
      updateAccountBalance: (accountId, balance) => {
        set((state) => {
          const month = structuredClone(state.month);
          const acct = month.accounts.find((a) => a.id === accountId);
          if (acct) acct.current_balance = balance;
          return { month };
        });
      },
      updateFixedBudget: (id, patch) => {
        set((state) => {
          const month = structuredClone(state.month);
          const item = month.fixedBudgets.find((f) => f.id === id);
          if (item) Object.assign(item, patch);
          return { month };
        });
      },
      updateVariableBudget: (id, patch) => {
        set((state) => {
          const month = structuredClone(state.month);
          const item = month.variableBudgets.find((v) => v.id === id);
          if (item) Object.assign(item, patch);
          return { month };
        });
      },
      addIncomeSource: (name, amount) => {
        set((state) => {
          const month = structuredClone(state.month);
          month.incomeSources.push({
            id: uid(),
            user_id: state.userId,
            month_id: month.monthId,
            name,
            amount,
          });
          return { month };
        });
      },
      updateIncomeSource: (id, patch) => {
        set((state) => {
          const month = structuredClone(state.month);
          const item = month.incomeSources.find((i) => i.id === id);
          if (item) Object.assign(item, patch);
          return { month };
        });
      },
      addPersonalDebt: (debt) => {
        set((state) => {
          const month = structuredClone(state.month);
          month.personalDebts.push({ ...debt, id: uid(), user_id: state.userId });
          return { month };
        });
      },
      settlePersonalDebt: (id) => {
        set((state) => {
          const month = structuredClone(state.month);
          const debt = month.personalDebts.find((d) => d.id === id);
          if (debt) {
            debt.status = 'settled';
            debt.remaining = 0;
          }
          return { month };
        });
      },
      addCreditCardPayment: ({ date, toCardAccountId, fromAccountId, amount }) => {
        set((state) => {
          const month = structuredClone(state.month);
          const payment: CreditCardPayment = {
            id: uid(),
            user_id: state.userId,
            month_id: month.monthId,
            date,
            to_card_account_id: toCardAccountId,
            from_account_id: fromAccountId,
            amount,
          };
          month.creditCardPayments.unshift(payment);
          debitAccount(month.accounts, fromAccountId, amount);
          creditAccount(month.accounts, toCardAccountId, amount);
          return { month };
        });
      },
      getSummary: () => computeMonthlySummary(get().month),
      getTips: () => generateTips(get().month, computeMonthlySummary(get().month)),
      getPredictions: () => generatePredictions(get().month, computeMonthlySummary(get().month)),
    }),
    {
      name: 'expense-tracker-storage',
      storage: createJSONStorage(() => appStorage),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true });
      },
      partialize: (state) => ({
        month: state.month,
        entryMode: state.entryMode,
      }),
    }
  )
);

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'Bills',
  'Food',
  'Transpo',
  'Personal Care',
  'Hobbies',
  'Shopping',
  'Grocery',
];
