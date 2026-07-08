import { useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountPickerModal } from '@/components/AccountPickerModal';
import { DateField } from '@/components/DateField';
import { Chip, FormField, PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp, parseAmount, todayISO } from '@/lib/format';
import { useActiveMonth } from '@/lib/hooks';
import { TRANSACTION_CATEGORIES, useAppStore } from '@/lib/store';

type PickerTarget = 'account' | 'from' | 'to' | 'toCard' | 'fromLiquid' | null;

export default function EntryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const mode = useAppStore((s) => s.entryMode);
  const setMode = useAppStore((s) => s.setEntryMode);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const addTransfer = useAppStore((s) => s.addTransfer);
  const addCreditCardPayment = useAppStore((s) => s.addCreditCardPayment);

  const cards = month.accounts.filter((a) => a.type === 'credit_card');
  const liquidAccounts = month.accounts.filter((a) => a.type !== 'credit_card');

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [toCardId, setToCardId] = useState('');
  const [fromLiquidId, setFromLiquidId] = useState('');
  const [category, setCategory] = useState<(typeof TRANSACTION_CATEGORIES)[number]>('Food');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [showDesc, setShowDesc] = useState(false);
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accountName = (id: string) => month.accounts.find((a) => a.id === id)?.name ?? 'Select account';

  function resetFields() {
    setAmount('');
    setDescription('');
    setNotes('');
  }

  function showValidationError(title: string, message: string) {
    setSuccess(null);
    setError(message);
    Alert.alert(title, message);
  }

  function showSuccessMessage(message: string) {
    setError(null);
    setSuccess(message);
    Alert.alert('Saved', message, [
      { text: 'Add another', onPress: resetFields },
      { text: 'OK', onPress: resetFields },
    ]);
  }

  function handleSave() {
    Keyboard.dismiss();
    setError(null);
    setSuccess(null);

    const parsed = parseAmount(amount);
    if (!parsed) {
      showValidationError('Invalid amount', 'Enter an amount greater than zero.');
      return;
    }

    if (mode === 'expense') {
      if (!accountId) {
        showValidationError('Account required', 'Choose which account to deduct from.');
        return;
      }
      addTransaction({
        date,
        category,
        amount: parsed,
        accountId,
        description: description || undefined,
      });
      showSuccessMessage(`Expense ${formatPhp(parsed)} recorded.`);
      resetFields();
      return;
    }

    if (mode === 'transfer') {
      if (!fromId || !toId) {
        showValidationError('Accounts required', 'Choose both source and target accounts.');
        return;
      }
      if (fromId === toId) {
        showValidationError('Invalid transfer', 'Source and target must differ.');
        return;
      }
      addTransfer({ date, fromAccountId: fromId, toAccountId: toId, amount: parsed, notes: notes || undefined });
      showSuccessMessage(`Transfer ${formatPhp(parsed)} recorded.`);
      resetFields();
      return;
    }

    if (!toCardId || !fromLiquidId) {
      showValidationError('Missing fields', 'Choose the card and source account.');
      return;
    }
    addCreditCardPayment({
      date,
      toCardAccountId: toCardId,
      fromAccountId: fromLiquidId,
      amount: parsed,
    });
    showSuccessMessage(`Card payment ${formatPhp(parsed)} recorded.`);
    resetFields();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always">
        <View style={styles.toggle}>
          <Chip label="Expense" selected={mode === 'expense'} onPress={() => setMode('expense')} />
          <Chip label="Transfer" selected={mode === 'transfer'} onPress={() => setMode('transfer')} />
          <Chip label="CC Payment" selected={mode === 'cc_payment'} onPress={() => setMode('cc_payment')} />
        </View>

        <FormField
          label="Amount (PHP)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <DateField label="Date" value={date} onChange={setDate} />

        {mode === 'expense' ? (
          <>
            <FormField
              label="Deducted from"
              value={accountId ? accountName(accountId) : ''}
              editable={false}
              onPress={() => setPicker('account')}
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
        ) : null}

        {mode === 'transfer' ? (
          <>
            <FormField
              label="From account"
              value={fromId ? accountName(fromId) : ''}
              editable={false}
              onPress={() => setPicker('from')}
              placeholder="Tap to select source"
            />
            <FormField
              label="To account"
              value={toId ? accountName(toId) : ''}
              editable={false}
              onPress={() => setPicker('to')}
              placeholder="Tap to select target"
            />
            <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. salary move" />
          </>
        ) : null}

        {mode === 'cc_payment' ? (
          <>
            <FormField
              label="Pay to card"
              value={toCardId ? accountName(toCardId) : ''}
              editable={false}
              onPress={() => setPicker('toCard')}
              placeholder="Tap to select card"
            />
            <FormField
              label="Pay from"
              value={fromLiquidId ? accountName(fromLiquidId) : ''}
              editable={false}
              onPress={() => setPicker('fromLiquid')}
              placeholder="Tap to select source account"
            />
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: Colors[scheme].border, backgroundColor: Colors[scheme].background }]}>
        {error ? <Text style={[styles.feedback, { color: Colors[scheme].danger }]}>{error}</Text> : null}
        {success ? <Text style={[styles.feedback, { color: Colors[scheme].success }]}>{success}</Text> : null}
        <PrimaryButton label="Save" onPress={handleSave} />
      </View>

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
      <AccountPickerModal
        visible={picker === 'toCard'}
        title="Pay to card"
        accounts={cards}
        selectedId={toCardId}
        onSelect={setToCardId}
        onClose={() => setPicker(null)}
      />
      <AccountPickerModal
        visible={picker === 'fromLiquid'}
        title="Pay from"
        accounts={liquidAccounts}
        selectedId={fromLiquidId}
        onSelect={setFromLiquidId}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
  feedback: { fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  toggle: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, opacity: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
});
