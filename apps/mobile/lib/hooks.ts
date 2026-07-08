import { useMemo } from 'react';
import {
  computeMonthlySummary,
  createInitialMonths,
  generatePredictions,
  generateTips,
} from '@expense-tracker/shared';
import { useAppStore } from '@/lib/store';

export function useActiveMonth() {
  return useAppStore((state) => {
    const month = state.months[state.activeMonthId];
    if (month) return month;
    const fallback = createInitialMonths(state.userId);
    return fallback.months[fallback.activeMonthId];
  });
}

export function useCanGoToNextMonth() {
  const activeMonthId = useAppStore((s) => s.activeMonthId);
  const active = useActiveMonth();
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return active.year < currentYear || (active.year === currentYear && active.month < currentMonth);
  }, [active.year, active.month, activeMonthId]);
}

export function useMonthSummary() {
  const month = useActiveMonth();
  return useMemo(() => computeMonthlySummary(month), [month]);
}

export function useMonthTips() {
  const month = useActiveMonth();
  const summary = useMonthSummary();
  return useMemo(() => generateTips(month, summary), [month, summary]);
}

export function useMonthPredictions() {
  const month = useActiveMonth();
  const summary = useMonthSummary();
  return useMemo(() => generatePredictions(month, summary), [month, summary]);
}
