import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import { useActiveMonth } from '@/lib/hooks';

export default function TransactionsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const transactions = month.transactions;
  const accounts = month.accounts;

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions yet. Use Entry to log expenses.</Text>
        ) : (
          transactions.map((tx) => (
            <Card key={tx.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.category}>{tx.category}</Text>
                  <Text style={styles.meta}>
                    {tx.date} · {accountName(tx.account_id)}
                  </Text>
                  {tx.description ? <Text style={styles.desc}>{tx.description}</Text> : null}
                </View>
                <Text style={styles.amount}>{formatPhp(tx.amount)}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  category: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, opacity: 0.6, marginTop: 4 },
  desc: { fontSize: 14, marginTop: 4 },
  amount: { fontSize: 16, fontWeight: '700' },
});
