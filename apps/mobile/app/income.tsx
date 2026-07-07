import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { FormField, PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp, parseAmount } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { computeTotalIncome } from '@expense-tracker/shared';

export default function IncomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const sources = useAppStore((s) => s.month.incomeSources);
  const addSource = useAppStore((s) => s.addIncomeSource);
  const total = computeTotalIncome(sources);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  function handleAdd() {
    const parsed = parseAmount(amount);
    if (!parsed || !name.trim()) {
      Alert.alert('Fill name and amount');
      return;
    }
    addSource(name.trim(), parsed);
    setName('');
    setAmount('');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Income' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.label}>Total income this month</Text>
            <Text style={styles.total}>{formatPhp(total)}</Text>
          </Card>

          {sources.map((s) => (
            <Card key={s.id}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.amount}>{formatPhp(s.amount)}</Text>
            </Card>
          ))}

          <Text style={styles.section}>Add source</Text>
          <Card>
            <FormField label="Name" value={name} onChangeText={setName} placeholder="Salary" />
            <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <PrimaryButton label="Add income" onPress={handleAdd} />
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
  total: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  amount: { fontSize: 16, marginTop: 4 },
  section: { fontSize: 18, fontWeight: '700', marginVertical: 12 },
});
