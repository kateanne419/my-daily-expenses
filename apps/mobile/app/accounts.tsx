import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { FormField, PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import { useAppStore } from '@/lib/store';

export default function AccountsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const accounts = useAppStore((s) => s.month.accounts);
  const transfers = useAppStore((s) => s.month.transfers);
  const updateBalance = useAppStore((s) => s.updateAccountBalance);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [balanceInput, setBalanceInput] = useState('');

  const sorted = [...accounts].sort((a, b) => a.display_order - b.display_order);

  function saveBalance() {
    if (!editingId) return;
    const n = parseFloat(balanceInput.replace(/,/g, ''));
    if (!Number.isFinite(n)) {
      Alert.alert('Invalid balance');
      return;
    }
    updateBalance(editingId, n);
    setEditingId(null);
    setBalanceInput('');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Accounts' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          {sorted.map((a) => (
            <Card key={a.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{a.name}</Text>
                  <Text style={styles.type}>{a.type.replace('_', ' ')}</Text>
                </View>
                <Text style={[styles.balance, a.current_balance < 0 && { color: Colors[scheme].danger }]}>
                  {formatPhp(a.current_balance)}
                </Text>
              </View>
              {editingId === a.id ? (
                <View style={{ marginTop: 12 }}>
                  <FormField label="New balance" value={balanceInput} onChangeText={setBalanceInput} keyboardType="decimal-pad" />
                  <PrimaryButton label="Update balance" onPress={saveBalance} />
                </View>
              ) : (
                <PrimaryButton
                  label="Edit balance"
                  onPress={() => {
                    setEditingId(a.id);
                    setBalanceInput(String(a.current_balance));
                  }}
                />
              )}
            </Card>
          ))}

          <Text style={styles.section}>Recent transfers</Text>
          {transfers.length === 0 ? (
            <Text style={styles.muted}>No transfers yet.</Text>
          ) : (
            transfers.slice(0, 10).map((t) => (
              <Card key={t.id}>
                <Text style={styles.name}>{formatPhp(t.amount)}</Text>
                <Text style={styles.muted}>{t.date}</Text>
              </Card>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  type: { fontSize: 12, opacity: 0.5, textTransform: 'capitalize', marginTop: 2 },
  balance: { fontSize: 16, fontWeight: '700' },
  section: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  muted: { opacity: 0.6, fontSize: 13 },
});
