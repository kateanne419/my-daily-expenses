import type {
  Account,
  DailySummary,
  FixedBudget,
  IncomeSource,
  MonthData,
  Prediction,
  Tip,
  Transaction,
  VariableBudget,
  PersonalDebt,
} from '../types';

export function computeOnHand(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.current_balance, 0);
}

export function computeTotalIncome(sources: IncomeSource[]): number {
  return sources.reduce((sum, s) => sum + s.amount, 0);
}

export function computeFixedTotals(fixed: FixedBudget[]) {
  const savings = fixed.filter((f) => f.is_savings);
  const nonSavings = fixed.filter((f) => !f.is_savings);
  const fixedBudgetTotal = nonSavings.reduce((s, f) => s + f.budget_amount, 0);
  const fixedSpentTotal = nonSavings.reduce((s, f) => s + f.spent_amount, 0);
  const savingsSpent = savings.reduce((s, f) => s + f.spent_amount, 0);
  const savingsBudget = savings.reduce((s, f) => s + f.budget_amount, 0);
  return { fixedBudgetTotal, fixedSpentTotal, savingsSpent, savingsBudget };
}

export function computeVariableTotals(variable: VariableBudget[]) {
  const variableBudgetTotal = variable.reduce((s, v) => s + v.budget_amount, 0);
  const variableSpentTotal = variable.reduce((s, v) => s + v.spent_amount, 0);
  return { variableBudgetTotal, variableSpentTotal };
}

export function computeTotalExpenses(fixed: FixedBudget[], variable: VariableBudget[]): number {
  const { fixedSpentTotal, savingsSpent } = computeFixedTotals(fixed);
  const { variableSpentTotal } = computeVariableTotals(variable);
  return fixedSpentTotal + variableSpentTotal - savingsSpent;
}

export function computeVariableRemaining(variable: VariableBudget[]) {
  return variable.map((v) => ({
    category: v.category,
    budget: v.budget_amount,
    spent: v.spent_amount,
    remaining: v.budget_amount - v.spent_amount,
  }));
}

export function computeDailyMTD(daily: DailySummary[], throughDate?: string): number {
  const filtered = daily.filter((d) => !d.is_opening_snapshot);
  if (!throughDate) {
    return filtered.reduce((s, d) => s + d.amount, 0);
  }
  return filtered
    .filter((d) => d.date <= throughDate)
    .reduce((s, d) => s + d.amount, 0);
}

export function computeMonthlySummary(data: Pick<MonthData, 'accounts' | 'incomeSources' | 'fixedBudgets' | 'variableBudgets'>) {
  const onHand = computeOnHand(data.accounts);
  const totalIncome = computeTotalIncome(data.incomeSources);
  const totalExpenses = computeTotalExpenses(data.fixedBudgets, data.variableBudgets);
  const { savingsSpent } = computeFixedTotals(data.fixedBudgets);
  const { fixedBudgetTotal, fixedSpentTotal } = computeFixedTotals(data.fixedBudgets);
  const { variableBudgetTotal, variableSpentTotal } = computeVariableTotals(data.variableBudgets);

  return {
    onHand,
    totalIncome,
    totalExpenses,
    totalSavings: savingsSpent,
    fixedBudgetTotal,
    fixedSpentTotal,
    variableBudgetTotal,
    variableSpentTotal,
    combinedBudget: fixedBudgetTotal + variableBudgetTotal,
    combinedSpent: fixedSpentTotal + variableSpentTotal,
  };
}

export function computeCategorySpent(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {});
}

export function generateTips(
  data: MonthData,
  summary: ReturnType<typeof computeMonthlySummary>,
  today: Date = new Date()
): Tip[] {
  const tips: Tip[] = [];
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  for (const v of data.variableBudgets) {
    const pct = v.budget_amount > 0 ? v.spent_amount / v.budget_amount : 0;
    if (pct >= 0.9 && monthProgress < 0.85) {
      tips.push({
        id: `var-${v.category}`,
        severity: pct >= 0.96 ? 'critical' : 'warning',
        message: `${v.category} budget ${Math.round(pct * 100)}% used, ${Math.round((1 - monthProgress) * 100)}% of month left`,
      });
    }
  }

  for (const f of data.fixedBudgets.filter((x) => !x.is_savings && !x.is_paid && x.due_date)) {
    const due = new Date(f.due_date!);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && diffDays >= -3) {
      tips.push({
        id: `fixed-${f.id}`,
        severity: diffDays < 0 ? 'critical' : 'warning',
        message: `${f.name} unpaid${diffDays >= 0 ? `, due ${f.due_date}` : ', overdue'}`,
      });
    }
  }

  for (const a of data.accounts.filter((x) => x.type === 'credit_card' && x.credit_limit)) {
    const used = Math.abs(Math.min(a.current_balance, 0));
    const pct = used / (a.credit_limit ?? 1);
    if (pct > 0) {
      tips.push({
        id: `cc-${a.id}`,
        severity: pct > 0.8 ? 'warning' : 'info',
        message: `${a.name} at ${formatPhp(a.current_balance)} — ${Math.round(pct * 100)}% of credit limit used`,
      });
    }
  }

  const splitwise = data.accounts.find((a) => a.type === 'splitwise');
  if (splitwise && splitwise.current_balance > 0) {
    tips.push({
      id: 'splitwise',
      severity: 'info',
      message: `Splitwise receivable ${formatPhp(splitwise.current_balance)} — consider collecting`,
    });
  }

  if (summary.onHand < 5000) {
    tips.push({
      id: 'low-on-hand',
      severity: 'warning',
      message: `On-hand is ${formatPhp(summary.onHand)} — monitor cash runway`,
    });
  }

  return tips;
}

export function generatePredictions(
  data: MonthData,
  summary: ReturnType<typeof computeMonthlySummary>,
  today: Date = new Date()
): Prediction[] {
  const predictions: Prediction[] = [];
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  if (dayOfMonth > 0) {
    const projectedVariable =
      (summary.variableSpentTotal / dayOfMonth) * daysInMonth;
    predictions.push({
      id: 'eom-variable',
      label: 'End-of-month variable spend',
      value: formatPhp(projectedVariable),
      detail: `Based on ${formatPhp(summary.variableSpentTotal)} over ${dayOfMonth} days`,
    });
  }

  const dailyMTD = computeDailyMTD(data.dailySummaries, today.toISOString().slice(0, 10));
  if (dailyMTD > 0 && dayOfMonth > 0) {
    const avgDaily = dailyMTD / dayOfMonth;
    const runway = summary.onHand / avgDaily;
    predictions.push({
      id: 'cash-runway',
      label: 'Cash runway (daily spend pace)',
      value: `${Math.round(runway)} days`,
      detail: `On-hand ${formatPhp(summary.onHand)} ÷ ${formatPhp(avgDaily)}/day`,
    });
  }

  for (const v of data.variableBudgets) {
    const remaining = v.budget_amount - v.spent_amount;
    const catTxns = data.transactions.filter((t) => t.category === v.category);
    const daysWithSpend = new Set(catTxns.map((t) => t.date)).size || dayOfMonth;
    const avgDaily = v.spent_amount / Math.max(daysWithSpend, 1);
    if (remaining > 0 && avgDaily > 0) {
      predictions.push({
        id: `runway-${v.category}`,
        label: `${v.category} budget runway`,
        value: `${Math.round(remaining / avgDaily)} days`,
        detail: `${formatPhp(remaining)} remaining`,
      });
    }
  }

  const upcoming = data.fixedBudgets.filter(
    (f) =>
      !f.is_savings &&
      !f.is_paid &&
      f.due_date &&
      new Date(f.due_date) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  );
  if (upcoming.length) {
    predictions.push({
      id: 'upcoming-bills',
      label: 'Upcoming fixed bills (7 days)',
      value: String(upcoming.length),
      detail: upcoming.map((f) => f.name).join(', '),
    });
  }

  return predictions;
}

export function computeDebtNet(accounts: Account[], debts: PersonalDebt[]): number {
  const splitwise = accounts.find((a) => a.type === 'splitwise')?.current_balance ?? 0;
  const personalReceivable = debts
    .filter((d) => d.status === 'open' && d.direction === 'they_owe_me')
    .reduce((s, d) => s + d.remaining, 0);
  const personalPayable = debts
    .filter((d) => d.status === 'open' && d.direction === 'i_owe_them')
    .reduce((s, d) => s + d.remaining, 0);
  return splitwise + personalReceivable - personalPayable;
}

export function formatPhp(amount: number): string {
  const prefix = amount < 0 ? '-₱' : '₱';
  return `${prefix}${Math.abs(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export * from '../types';
