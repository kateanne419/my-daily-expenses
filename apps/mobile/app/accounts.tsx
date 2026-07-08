import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
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
import {
  accountKindLabel,
  DEBITING_ACCOUNT_TYPES,
  DEBITING_TYPE_LABELS,
  type AccountType,
} from '@expense-tracker/shared';

type EditMode = 'balance' | 'name' | null;
type AccountKind = 'debiting' | 'credit_card';

export default function AccountsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const accounts = month.accounts;
  const transfers = month.transfers;
  const updateBalance = useAppStore((s) => s.updateAccountBalance);
  const updateName = useAppStore((s) => s.updateAccountName);
  const addAccount = useAppStore((s) => s.addAccount);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [inputValue, setInputValue] = useState('');

  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<AccountKind>('debiting');
  const [newDebitType, setNewDebitType] = useState<AccountType>('bank');
  const [newCreditLimit, setNewCreditLimit] = useState('');

  const sorted = [...accounts].sort((a, b) => a.display_order - b.display_order);

  function startEdit(accountId: string, mode: EditMode, value: string) {
    setEditingId(accountId);
    setEditMode(mode);
    setInputValue(value);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditMode(null);
    setInputValue('');
  }

  function saveEdit() {
    if (!editingId || !editMode) return;
    if (editMode === 'name') {
      if (!inputValue.trim()) {
        Alert.alert('Name required');
        return;
      }
      updateName(editingId, inputValue);
    } else {
      const n = parseFloat(inputValue.replace(/,/g, ''));
      if (!Number.isFinite(n)) {
        Alert.alert('Invalid balance');
        return;
      }
      updateBalance(editingId, n);
    }
    cancelEdit();
  }

  function handleAddAccount() {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Enter an account name.');
      return;
    }
    if (newKind === 'credit_card') {
      const limit = newCreditLimit.trim() ? parseAmount(newCreditLimit) : null;
      addAccount({ name: newName, type: 'credit_card', credit_limit: limit });
    } else {
      addAccount({ name: newName, type: newDebitType });
    }
    setNewName('');
    setNewCreditLimit('');
    setNewKind('debiting');
    setNewDebitType('bank');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Accounts' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          {sorted.length === 0 ? (
            <Card>
              <Text style={styles.muted}>No accounts yet. Add one below to start logging expenses.</Text>
            </Card>
          ) : (
            sorted.map((a) => (
              <Card key={a.id}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{a.name}</Text>
                    <Text style={styles.type}>{accountKindLabel(a.type)}</Text>
                  </View>
                  <Text style={[styles.balance, a.current_balance < 0 && { color: Colors[scheme].danger }]}>
                    {formatPhp(a.current_balance)}
                  </Text>
                </View>
                {editingId === a.id ? (
                  <View style={{ marginTop: 12 }}>
                    <FormField
                      label={editMode === 'name' ? 'Account name' : 'Balance'}
                      value={inputValue}
                      onChangeText={setInputValue}
                      keyboardType={editMode === 'name' ? 'default' : 'decimal-pad'}
                    />
                    <PrimaryButton label="Save" onPress={saveEdit} />
                    <PrimaryButton label="Cancel" onPress={cancelEdit} />
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <PrimaryButton label="Edit name" onPress={() => startEdit(a.id, 'name', a.name)} />
                    <PrimaryButton label="Edit balance" onPress={() => startEdit(a.id, 'balance', String(a.current_balance))} />
                  </View>
                )}
              </Card>
            ))
          )}

          <Text style={styles.section}>Add account</Text>
          <Card>
            <FormField label="Account name" value={newName} onChangeText={setNewName} placeholder="SeaBank, Maya VP, Cash" />
            <Text style={styles.fieldLabel}>Account type</Text>
            <View style={styles.chips}>
              <Chip label="Spending / savings" selected={newKind === 'debiting'} onPress={() => setNewKind('debiting')} />
              <Chip label="Credit card" selected={newKind === 'credit_card'} onPress={() => setNewKind('credit_card')} />
            </View>
            {newKind === 'debiting' ? (
              <>
                <Text style={styles.fieldLabel}>Spending account kind</Text>
                <View style={styles.chips}>
                  {DEBITING_ACCOUNT_TYPES.map((type) => (
                    <Chip
                      key={type}
                      label={DEBITING_TYPE_LABELS[type]}
                      selected={newDebitType === type}
                      onPress={() => setNewDebitType(type)}
                    />
                  ))}
                </View>
              </>
            ) : (
              <FormField
                label="Credit limit (optional)"
                value={newCreditLimit}
                onChangeText={setNewCreditLimit}
                keyboardType="decimal-pad"
                placeholder="50000"
              />
            )}
            <PrimaryButton label="Add account" onPress={handleAddAccount} />
          </Card>

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
  content: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  type: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  balance: { fontSize: 16, fontWeight: '700' },
  actions: { marginTop: 12, gap: 8 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, opacity: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  muted: { opacity: 0.6, fontSize: 13 },
});
