import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Chip, FormField, PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp, parseAmount } from '@/lib/format';
import { useActiveMonth } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import { computeDebtNet } from '@expense-tracker/shared';

export default function DebtsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const addDebt = useAppStore((s) => s.addPersonalDebt);
  const settleDebt = useAppStore((s) => s.settlePersonalDebt);
  const splitwise = month.accounts.find((a) => a.type === 'splitwise');
  const debtNet = computeDebtNet(month.accounts, month.personalDebts);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'they_owe_me' | 'i_owe_them'>('they_owe_me');

  function addNewDebt() {
    const parsed = parseAmount(amount);
    if (!parsed || !name.trim()) {
      Alert.alert('Fill name and amount');
      return;
    }
    addDebt({
      counterparty_name: name.trim(),
      direction,
      amount: parsed,
      remaining: parsed,
      status: 'open',
    });
    setName('');
    setAmount('');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Debts' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.label}>Splitwise balance</Text>
            <Text style={styles.value}>{formatPhp(splitwise?.current_balance ?? 0)}</Text>
            <Text style={styles.meta}>Net debt position: {formatPhp(debtNet)}</Text>
          </Card>

          <Text style={styles.section}>Personal debts</Text>
          {month.personalDebts.length === 0 ? (
            <Text style={styles.muted}>No personal debts tracked yet.</Text>
          ) : (
            month.personalDebts.map((d) => (
              <Card key={d.id}>
                <Text style={styles.name}>{d.counterparty_name}</Text>
                <Text style={styles.meta}>
                  {d.direction === 'they_owe_me' ? 'Owes you' : 'You owe'} · {d.status}
                </Text>
                <Text style={styles.value}>{formatPhp(d.remaining)}</Text>
                {d.status === 'open' ? (
                  <PrimaryButton label="Mark settled" onPress={() => settleDebt(d.id)} />
                ) : null}
              </Card>
            ))
          )}

          <Text style={styles.section}>Add debt</Text>
          <Card>
            <FormField label="Person" value={name} onChangeText={setName} placeholder="Name" />
            <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={styles.label}>Direction</Text>
            <Chip label="They owe me" selected={direction === 'they_owe_me'} onPress={() => setDirection('they_owe_me')} />
            <Chip label="I owe them" selected={direction === 'i_owe_them'} onPress={() => setDirection('i_owe_them')} />
            <PrimaryButton label="Add" onPress={addNewDebt} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 13, opacity: 0.6 },
  value: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  meta: { fontSize: 13, opacity: 0.6, marginTop: 4 },
  section: { fontSize: 18, fontWeight: '700', marginVertical: 12 },
  name: { fontSize: 16, fontWeight: '700' },
  muted: { opacity: 0.6 },
});
