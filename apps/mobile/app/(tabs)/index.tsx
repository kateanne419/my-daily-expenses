import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import { useActiveMonth, useCanGoToNextMonth, useMonthPredictions, useMonthSummary, useMonthTips } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import { computeDailyMTD, computeDebtNet, computeVariableRemaining } from '@expense-tracker/shared';

interface BudgetRow {
  id: string;
  label: string;
  budget: number;
  spent: number;
  remaining: number;
}

export default function DashboardScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const goToPreviousMonth = useAppStore((s) => s.goToPreviousMonth);
  const goToNextMonth = useAppStore((s) => s.goToNextMonth);
  const canGoNext = useCanGoToNextMonth();
  const summary = useMonthSummary();
  const tips = useMonthTips();
  const predictions = useMonthPredictions();
  const variableRemaining = computeVariableRemaining(month.variableBudgets);
  const dailyMTD = computeDailyMTD(month.dailySummaries);
  const debtNet = computeDebtNet(month.accounts, month.personalDebts);

  const fixedRows: BudgetRow[] = month.fixedBudgets
    .filter((f) => !f.is_savings)
    .map((f) => ({
      id: f.id,
      label: f.name,
      budget: f.budget_amount,
      spent: f.spent_amount,
      remaining: f.budget_amount - f.spent_amount,
    }));

  const variableRows: BudgetRow[] = variableRemaining.map((v) => ({
    id: v.category,
    label: v.category,
    budget: v.budget,
    spent: v.spent,
    remaining: v.remaining,
  }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.monthRow}>
          <Pressable onPress={goToPreviousMonth} style={styles.monthNav} accessibilityLabel="Previous month">
            <Text style={[styles.monthNavText, { color: Colors[scheme].tint }]}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{month.label}</Text>
          <Pressable
            onPress={goToNextMonth}
            disabled={!canGoNext}
            style={[styles.monthNav, !canGoNext && styles.monthNavDisabled]}
            accessibilityLabel="Next month">
            <Text style={[styles.monthNavText, { color: canGoNext ? Colors[scheme].tint : Colors[scheme].tabIconDefault }]}>
              ›
            </Text>
          </Pressable>
        </View>

        <Card style={[styles.hero, { backgroundColor: Colors[scheme].tint }]}>
          <Text style={styles.heroLabel}>On-hand</Text>
          <Text style={styles.heroValue}>{formatPhp(summary.onHand)}</Text>
          <Text style={styles.heroSub}>Spendable across all accounts</Text>
        </Card>

        <View style={styles.strip}>
          <Metric label="Income" value={formatPhp(summary.totalIncome)} />
          <Metric label="Expenses" value={formatPhp(summary.totalExpenses)} />
          <Metric label="Savings" value={formatPhp(summary.totalSavings)} />
        </View>

        <Section title="Budget vs actual">
          <BudgetTable
            title="Fixed"
            rows={fixedRows}
            emptyMessage="No fixed budgets yet."
            scheme={scheme}
          />
          <BudgetTable
            title="Variable"
            rows={variableRows}
            emptyMessage="Set variable budgets to track categories."
            scheme={scheme}
          />
        </Section>

        <Section title="Account breakdown" href="/accounts" linkLabel="Manage">
          {month.accounts.length === 0 ? (
            <Text style={styles.muted}>No accounts yet. Tap Manage to add one.</Text>
          ) : (
            [...month.accounts]
              .sort((a, b) => a.display_order - b.display_order)
              .map((a) => (
                <View key={a.id} style={styles.row}>
                  <Text style={styles.rowLabel}>{a.name}</Text>
                  <Text style={[styles.rowValue, a.current_balance < 0 && { color: Colors[scheme].danger }]}>
                    {formatPhp(a.current_balance)}
                  </Text>
                </View>
              ))
          )}
        </Section>

        <Section title="Insights">
          <InsightRow label="Daily burn MTD" value={formatPhp(dailyMTD)} />
          <InsightRow label="Debt net" value={formatPhp(debtNet)} />
          {month.accounts
            .filter((a) => a.type === 'credit_card' && a.credit_limit)
            .map((a) => {
              const used = Math.abs(Math.min(a.current_balance, 0));
              const pct = Math.round((used / (a.credit_limit ?? 1)) * 100);
              return (
                <InsightRow
                  key={a.id}
                  label={`${a.name} utilization`}
                  value={`${pct}%`}
                  detail={formatPhp(a.current_balance)}
                />
              );
            })}
        </Section>

        <Section title="Predictions">
          {predictions.length === 0 ? (
            <Text style={styles.muted}>Add spending to see projections.</Text>
          ) : (
            predictions.map((p) => (
              <View key={p.id} style={styles.tipRow}>
                <Text style={styles.tipTitle}>{p.label}</Text>
                <Text style={styles.tipValue}>{p.value}</Text>
                {p.detail ? <Text style={styles.tipDetail}>{p.detail}</Text> : null}
              </View>
            ))
          )}
        </Section>

        <Section title="Tips">
          {tips.length === 0 ? (
            <Text style={styles.muted}>All clear this month.</Text>
          ) : (
            tips.map((t) => (
              <View key={t.id} style={styles.tipRow}>
                <Text style={[styles.tipBadge, t.severity === 'critical' && styles.critical]}>{t.severity}</Text>
                <Text style={styles.tipMessage}>{t.message}</Text>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function BudgetTable({
  title,
  rows,
  emptyMessage,
  scheme,
}: {
  title: string;
  rows: BudgetRow[];
  emptyMessage: string;
  scheme: 'light' | 'dark';
}) {
  return (
    <View style={styles.tableBlock}>
      <Text style={styles.tableTitle}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.muted}>{emptyMessage}</Text>
      ) : (
        <>
          <View style={[styles.tableHeader, { borderBottomColor: Colors[scheme].border }]}>
            <Text style={[styles.tableCellName, styles.tableHeaderText]}>Item</Text>
            <Text style={[styles.tableCellNum, styles.tableHeaderText]}>Budget</Text>
            <Text style={[styles.tableCellNum, styles.tableHeaderText]}>Spent</Text>
            <Text style={[styles.tableCellNum, styles.tableHeaderText]}>Left</Text>
          </View>
          {rows.map((row) => (
            <View key={row.id} style={[styles.tableRow, { borderBottomColor: Colors[scheme].border }]}>
              <Text style={styles.tableCellName} numberOfLines={2}>
                {row.label}
              </Text>
              <Text style={styles.tableCellNum}>{formatPhp(row.budget)}</Text>
              <Text style={styles.tableCellNum}>{formatPhp(row.spent)}</Text>
              <Text style={[styles.tableCellNum, row.remaining < 0 && { color: Colors[scheme].danger }]}>
                {formatPhp(row.remaining)}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Card style={[styles.metric, { flex: 1 }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: Colors[scheme].text }]}>{value}</Text>
    </Card>
  );
}

function Section({
  title,
  children,
  href,
  linkLabel,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  const scheme = useColorScheme() ?? 'light';

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {href ? (
          <Link href={href} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={linkLabel ?? 'Manage'}>
              <Text style={[styles.sectionLink, { color: Colors[scheme].tint }]}>{linkLabel ?? 'Manage'}</Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
      <Card>{children}</Card>
    </View>
  );
}

function InsightRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.muted}>{detail}</Text> : null}
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthNav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthNavDisabled: { opacity: 0.35 },
  monthNavText: { fontSize: 28, fontWeight: '600', lineHeight: 32 },
  monthLabel: { fontSize: 18, fontWeight: '700' },
  hero: { marginBottom: 12 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  heroValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 4 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  strip: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  metric: { marginBottom: 0 },
  metricLabel: { fontSize: 12, opacity: 0.6 },
  metricValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionLink: { fontSize: 14, fontWeight: '600' },
  tableBlock: { marginBottom: 16 },
  tableTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  tableHeaderText: { fontSize: 11, fontWeight: '700', opacity: 0.55, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableCellName: { flex: 1.4, fontSize: 13, paddingRight: 8 },
  tableCellNum: { flex: 1, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { fontSize: 14, flex: 1, paddingRight: 8 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  tipRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  tipTitle: { fontSize: 14, fontWeight: '600' },
  tipValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  tipDetail: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  tipBadge: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: '#2563eb', marginBottom: 4 },
  critical: { color: '#dc2626' },
  tipMessage: { fontSize: 14, lineHeight: 20 },
  muted: { fontSize: 13, opacity: 0.6 },
});
