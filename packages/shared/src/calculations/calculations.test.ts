import { describe, expect, it } from 'vitest';
import {
  computeDailyMTD,
  computeMonthlySummary,
  computeOnHand,
  computeTotalExpenses,
  computeTotalIncome,
  computeVariableRemaining,
} from './index';
import { june2026Expected, june2026Fixture } from '../fixtures/june2026';

describe('June 2026 calculations', () => {
  it('computes on-hand from account balances', () => {
    expect(computeOnHand(june2026Fixture.accounts)).toBeCloseTo(june2026Expected.onHand, 2);
  });

  it('computes total income', () => {
    expect(computeTotalIncome(june2026Fixture.incomeSources)).toBeCloseTo(
      june2026Expected.totalIncome,
      2
    );
  });

  it('computes total expenses (fixed + variable - savings)', () => {
    expect(
      computeTotalExpenses(june2026Fixture.fixedBudgets, june2026Fixture.variableBudgets)
    ).toBeCloseTo(june2026Expected.totalExpenses, 2);
  });

  it('computes monthly summary roll-ups', () => {
    const summary = computeMonthlySummary(june2026Fixture);
    expect(summary.onHand).toBeCloseTo(june2026Expected.onHand, 2);
    expect(summary.totalIncome).toBeCloseTo(june2026Expected.totalIncome, 2);
    expect(summary.totalExpenses).toBeCloseTo(june2026Expected.totalExpenses, 2);
    expect(summary.fixedBudgetTotal).toBeCloseTo(june2026Expected.fixedBudgetTotal, 2);
    expect(summary.fixedSpentTotal).toBeCloseTo(june2026Expected.fixedSpentTotal, 2);
    expect(summary.variableBudgetTotal).toBeCloseTo(june2026Expected.variableBudgetTotal, 2);
    expect(summary.variableSpentTotal).toBeCloseTo(june2026Expected.variableSpentTotal, 2);
    expect(summary.combinedBudget).toBeCloseTo(june2026Expected.combinedBudget, 2);
    expect(summary.combinedSpent).toBeCloseTo(june2026Expected.combinedSpent, 2);
  });

  it('computes variable remaining per category', () => {
    const remaining = computeVariableRemaining(june2026Fixture.variableBudgets);
    const food = remaining.find((r) => r.category === 'Food');
    expect(food?.remaining).toBeCloseTo(263.01, 2);
    const transpo = remaining.find((r) => r.category === 'Transpo');
    expect(transpo?.remaining).toBeCloseTo(701, 2);
  });

  it('computes daily MTD excluding opening snapshot', () => {
    const mtd = computeDailyMTD(june2026Fixture.dailySummaries, '2026-06-15');
    expect(mtd).toBeCloseTo(june2026Expected.dailyMTDThroughJune15, 2);
  });
});
