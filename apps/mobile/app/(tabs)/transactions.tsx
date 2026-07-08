import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatDisplayDate, formatPhp } from '@/lib/format';
import { useActiveMonth } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';

interface PendingDelete {
  id: string;
  amount: number;
  category: string;
}

export default function TransactionsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const transactions = month.transactions;
  const accounts = month.accounts;
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteTransaction(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.monthLabel}>{month.label}</Text>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions yet. Use Entry to log expenses.</Text>
        ) : (
          transactions.map((tx) => (
            <Card key={tx.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.category}>{tx.category}</Text>
                  <Text style={styles.meta}>
                    {formatDisplayDate(tx.date)} · {accountName(tx.account_id)}
                  </Text>
                  {tx.description ? <Text style={styles.desc}>{tx.description}</Text> : null}
                </View>
                <Text style={styles.amount}>{formatPhp(tx.amount)}</Text>
              </View>
              <Pressable
                onPress={() => setPendingDelete({ id: tx.id, amount: tx.amount, category: tx.category })}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${tx.category} expense`}
                style={styles.deleteButton}>
                <Text style={[styles.deleteText, { color: Colors[scheme].danger }]}>Delete</Text>
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete transaction"
        message={
          pendingDelete
            ? `Remove this ${formatPhp(pendingDelete.amount)} ${pendingDelete.category} expense? Account balances and budgets will be updated.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  monthLabel: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  category: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, opacity: 0.6, marginTop: 4 },
  desc: { fontSize: 14, marginTop: 4 },
  amount: { fontSize: 16, fontWeight: '700' },
  deleteButton: { marginTop: 12, alignSelf: 'flex-start' },
  deleteText: { fontSize: 14, fontWeight: '600' },
});
