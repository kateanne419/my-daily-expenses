import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { computeDailyMTD, computeDebtNet, computeVariableRemaining } from '@expense-tracker/shared';

export default function DashboardScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useAppStore((s) => s.month);
  const summary = useAppStore((s) => s.getSummary());
  const tips = useAppStore((s) => s.getTips());
  const predictions = useAppStore((s) => s.getPredictions());
  const variableRemaining = computeVariableRemaining(month.variableBudgets);
  const dailyMTD = computeDailyMTD(month.dailySummaries);
  const debtNet = computeDebtNet(month.accounts, month.personalDebts);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.monthLabel}>{month.label}</Text>

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

        <Section title="Account breakdown">
          {[...month.accounts]
            .sort((a, b) => a.display_order - b.display_order)
            .map((a) => (
              <View key={a.id} style={styles.row}>
                <Text style={styles.rowLabel}>{a.name}</Text>
                <Text style={[styles.rowValue, a.current_balance < 0 && { color: Colors[scheme].danger }]}>
                  {formatPhp(a.current_balance)}
                </Text>
              </View>
            ))}
        </Section>

        <Section title="Budget vs actual">
          <Text style={styles.subhead}>Fixed — {formatPhp(summary.fixedSpentTotal)} / {formatPhp(summary.fixedBudgetTotal)}</Text>
          {month.fixedBudgets
            .filter((f) => !f.is_savings)
            .map((f) => (
              <View key={f.id} style={styles.row}>
                <Text style={styles.rowLabel}>
                  {f.name} {f.is_paid ? '✓' : '✗'}
                </Text>
                <Text style={styles.rowValue}>
                  {formatPhp(f.spent_amount)} / {formatPhp(f.budget_amount)}
                </Text>
              </View>
            ))}
          <Text style={[styles.subhead, { marginTop: 12 }]}>
            Variable — {formatPhp(summary.variableSpentTotal)} / {formatPhp(summary.variableBudgetTotal)}
          </Text>
          {variableRemaining.map((v) => (
            <View key={v.category} style={styles.row}>
              <Text style={styles.rowLabel}>{v.category}</Text>
              <Text style={styles.rowValue}>{formatPhp(v.remaining)} left</Text>
            </View>
          ))}
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
          {predictions.map((p) => (
            <View key={p.id} style={styles.tipRow}>
              <Text style={styles.tipTitle}>{p.label}</Text>
              <Text style={styles.tipValue}>{p.value}</Text>
              {p.detail ? <Text style={styles.tipDetail}>{p.detail}</Text> : null}
            </View>
          ))}
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

function Metric({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Card style={[styles.metric, { flex: 1 }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: Colors[scheme].text }]}>{value}</Text>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
  monthLabel: { fontSize: 14, opacity: 0.6, marginBottom: 8 },
  hero: { marginBottom: 12 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  heroValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 4 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  strip: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  metric: { marginBottom: 0 },
  metricLabel: { fontSize: 12, opacity: 0.6 },
  metricValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  subhead: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
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
