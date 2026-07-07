import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountPickerModal } from '@/components/AccountPickerModal';
import { Chip, FormField, PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp, parseAmount, todayISO } from '@/lib/format';
import { TRANSACTION_CATEGORIES, useAppStore } from '@/lib/store';

type PickerTarget = 'account' | 'from' | 'to' | null;

export default function EntryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useAppStore((s) => s.month);
  const mode = useAppStore((s) => s.entryMode);
  const setMode = useAppStore((s) => s.setEntryMode);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const addTransfer = useAppStore((s) => s.addTransfer);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [category, setCategory] = useState<(typeof TRANSACTION_CATEGORIES)[number]>('Food');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [showDesc, setShowDesc] = useState(false);
  const [picker, setPicker] = useState<PickerTarget>(null);

  const accountName = (id: string) => month.accounts.find((a) => a.id === id)?.name ?? 'Select account';

  function resetFields() {
    setAmount('');
    setDescription('');
    setNotes('');
  }

  function handleSave() {
    const parsed = parseAmount(amount);
    if (!parsed) {
      Alert.alert('Invalid amount', 'Enter an amount greater than zero.');
      return;
    }

    if (mode === 'expense') {
      if (!accountId) {
        Alert.alert('Account required', 'Choose which account to deduct from.');
        return;
      }
      addTransaction({
        date,
        category,
        amount: parsed,
        accountId,
        description: description || undefined,
      });
      Alert.alert('Saved', `Expense ${formatPhp(parsed)} recorded.`, [
        { text: 'Add another', onPress: resetFields },
        { text: 'OK', onPress: resetFields },
      ]);
      return;
    }

    if (!fromId || !toId) {
      Alert.alert('Accounts required', 'Choose both source and target accounts.');
      return;
    }
    if (fromId === toId) {
      Alert.alert('Invalid transfer', 'Source and target must differ.');
      return;
    }
    addTransfer({ date, fromAccountId: fromId, toAccountId: toId, amount: parsed, notes: notes || undefined });
    Alert.alert('Saved', `Transfer ${formatPhp(parsed)} recorded.`, [
      { text: 'Add another', onPress: resetFields },
      { text: 'OK', onPress: resetFields },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.toggle}>
          <Chip label="Expense" selected={mode === 'expense'} onPress={() => setMode('expense')} />
          <Chip label="Transfer" selected={mode === 'transfer'} onPress={() => setMode('transfer')} />
        </View>

        <FormField
          label="Amount (PHP)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

        {mode === 'expense' ? (
          <>
            <FormField
              label="Deducted from"
              value={accountId ? accountName(accountId) : ''}
              editable={false}
              onPressIn={() => setPicker('account')}
              placeholder="Tap to select account"
            />
            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {TRANSACTION_CATEGORIES.map((c) => (
                <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>
            {!showDesc ? (
              <PrimaryButton label="Add description" onPress={() => setShowDesc(true)} />
            ) : (
              <FormField
                label="Description (optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for?"
              />
            )}
          </>
        ) : (
          <>
            <FormField
              label="From account"
              value={fromId ? accountName(fromId) : ''}
              editable={false}
              onPressIn={() => setPicker('from')}
              placeholder="Tap to select source"
            />
            <FormField
              label="To account"
              value={toId ? accountName(toId) : ''}
              editable={false}
              onPressIn={() => setPicker('to')}
              placeholder="Tap to select target"
            />
            <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. salary move" />
          </>
        )}

        <PrimaryButton label="Save" onPress={handleSave} />
      </ScrollView>

      <AccountPickerModal
        visible={picker === 'account'}
        title="Deducted from"
        accounts={month.accounts}
        selectedId={accountId}
        onSelect={setAccountId}
        onClose={() => setPicker(null)}
      />
      <AccountPickerModal
        visible={picker === 'from'}
        title="From account"
        accounts={month.accounts}
        selectedId={fromId}
        onSelect={setFromId}
        onClose={() => setPicker(null)}
      />
      <AccountPickerModal
        visible={picker === 'to'}
        title="To account"
        accounts={month.accounts}
        selectedId={toId}
        onSelect={setToId}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  toggle: { flexDirection: 'row', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, opacity: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
});
