import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import { useActiveMonth } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import { computeVariableRemaining } from '@expense-tracker/shared';

export default function BudgetsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const fixed = month.fixedBudgets;
  const variable = month.variableBudgets;
  const updateFixed = useAppStore((s) => s.updateFixedBudget);
  const remaining = computeVariableRemaining(variable);

  return (
    <>
      <Stack.Screen options={{ title: 'Budgets' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>Fixed budgets</Text>
          {fixed.map((f) => (
            <Card key={f.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {f.name}
                    {f.is_savings ? ' (savings)' : ''}
                  </Text>
                  <Text style={styles.meta}>
                    {formatPhp(f.spent_amount)} / {formatPhp(f.budget_amount)}
                    {f.due_date ? ` · due ${f.due_date}` : ''}
                  </Text>
                </View>
                {!f.is_savings ? (
                  <Switch value={f.is_paid} onValueChange={(v) => updateFixed(f.id, { is_paid: v })} />
                ) : null}
              </View>
            </Card>
          ))}

          <Text style={styles.section}>Variable budgets</Text>
          {remaining.map((v) => {
            const pct = v.budget > 0 ? v.spent / v.budget : 0;
            return (
              <Card key={v.category}>
                <Text style={styles.name}>{v.category}</Text>
                <Text style={styles.meta}>
                  {formatPhp(v.spent)} / {formatPhp(v.budget)} · {formatPhp(v.remaining)} left
                </Text>
                <View style={styles.barWrap}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${Math.min(pct * 100, 100)}%`,
                        backgroundColor: pct > 0.9 ? Colors[scheme].danger : Colors[scheme].tint,
                      },
                    ]}
                  />
                </View>
              </Card>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, opacity: 0.6, marginTop: 4 },
  barWrap: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  bar: { height: '100%' },
});
