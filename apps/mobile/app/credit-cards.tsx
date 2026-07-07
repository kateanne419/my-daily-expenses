import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountPickerModal } from '@/components/AccountPickerModal';
import { Card } from '@/components/Card';
import { FormField, PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp, parseAmount, todayISO } from '@/lib/format';
import { useAppStore } from '@/lib/store';

export default function CreditCardsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useAppStore((s) => s.month);
  const addPayment = useAppStore((s) => s.addCreditCardPayment);
  const cards = month.accounts.filter((a) => a.type === 'credit_card');
  const liquid = month.accounts.filter((a) => a.type !== 'credit_card');

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [toCardId, setToCardId] = useState('');
  const [fromId, setFromId] = useState('');
  const [picker, setPicker] = useState<'to' | 'from' | null>(null);

  function handlePayment() {
    const parsed = parseAmount(amount);
    if (!parsed || !toCardId || !fromId) {
      Alert.alert('Missing fields', 'Fill amount, card, and source account.');
      return;
    }
    addPayment({ date, toCardAccountId: toCardId, fromAccountId: fromId, amount: parsed });
    Alert.alert('Payment recorded', formatPhp(parsed));
    setAmount('');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Credit cards' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          {cards.map((c) => {
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
          })}

          <Text style={styles.section}>Record payment</Text>
          <Card>
            <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <FormField label="Date" value={date} onChangeText={setDate} />
            <FormField
              label="To card"
              editable={false}
              value={cards.find((c) => c.id === toCardId)?.name ?? ''}
              onPressIn={() => setPicker('to')}
              placeholder="Select card"
            />
            <FormField
              label="From account"
              editable={false}
              value={liquid.find((a) => a.id === fromId)?.name ?? ''}
              onPressIn={() => setPicker('from')}
              placeholder="Select source"
            />
            <PrimaryButton label="Save payment" onPress={handlePayment} />
          </Card>
        </ScrollView>
      </SafeAreaView>

      <AccountPickerModal
        visible={picker === 'to'}
        title="Pay to card"
        accounts={cards}
        selectedId={toCardId}
        onSelect={setToCardId}
        onClose={() => setPicker(null)}
      />
      <AccountPickerModal
        visible={picker === 'from'}
        title="Pay from"
        accounts={liquid}
        selectedId={fromId}
        onSelect={setFromId}
        onClose={() => setPicker(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  name: { fontSize: 16, fontWeight: '700' },
  balance: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  meta: { fontSize: 13, opacity: 0.6, marginTop: 4 },
  section: { fontSize: 18, fontWeight: '700', marginVertical: 12 },
});
