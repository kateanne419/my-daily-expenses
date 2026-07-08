import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import { useActiveMonth } from '@/lib/hooks';

export default function CreditCardsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const cards = month.accounts.filter((a) => a.type === 'credit_card');

  return (
    <>
      <Stack.Screen options={{ title: 'Credit cards' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          {cards.length === 0 ? (
            <Card>
              <Text style={styles.muted}>No credit cards yet. Add one under Accounts, then record payments from Entry.</Text>
            </Card>
          ) : (
            cards.map((c) => {
              const used = Math.abs(Math.min(c.current_balance, 0));
              const pct = c.credit_limit ? Math.round((used / c.credit_limit) * 100) : 0;
              return (
                <Card key={c.id}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={[styles.balance, c.current_balance < 0 && { color: Colors[scheme].danger }]}>
                    {formatPhp(c.current_balance)}
                  </Text>
                  {c.credit_limit ? (
                    <Text style={styles.meta}>
                      Limit {formatPhp(c.credit_limit)} · {pct}% used
                    </Text>
                  ) : null}
                  {c.statement_day || c.due_day ? (
                    <Text style={styles.meta}>
                      Cut-off day {c.statement_day ?? '—'} · Due day {c.due_day ?? '—'}
                    </Text>
                  ) : null}
                </Card>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  name: { fontSize: 16, fontWeight: '700' },
  balance: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  meta: { fontSize: 13, opacity: 0.6, marginTop: 4 },
  muted: { fontSize: 13, opacity: 0.6, lineHeight: 18 },
});
