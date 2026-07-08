import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Chip, FormField, PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import { useActiveMonth } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import { computeVariableRemaining } from '@expense-tracker/shared';

type FixedEditMode = 'name' | 'budget' | 'spent' | 'due_date' | null;
type VariableEditMode = 'budget' | null;

export default function BudgetsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useActiveMonth();
  const fixed = month.fixedBudgets;
  const variable = month.variableBudgets;
  const updateFixed = useAppStore((s) => s.updateFixedBudget);
  const addFixedBudget = useAppStore((s) => s.addFixedBudget);
  const deleteFixedBudget = useAppStore((s) => s.deleteFixedBudget);
  const updateVariableBudget = useAppStore((s) => s.updateVariableBudget);
  const remaining = computeVariableRemaining(variable);

  const [editingFixedId, setEditingFixedId] = useState<string | null>(null);
  const [fixedEditMode, setFixedEditMode] = useState<FixedEditMode>(null);
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const [variableEditMode, setVariableEditMode] = useState<VariableEditMode>(null);
  const [inputValue, setInputValue] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newIsSavings, setNewIsSavings] = useState(false);

  const pendingDelete = fixed.find((f) => f.id === pendingDeleteId);

  function cancelFixedEdit() {
    setEditingFixedId(null);
    setFixedEditMode(null);
    setInputValue('');
  }

  function cancelVariableEdit() {
    setEditingVariableId(null);
    setVariableEditMode(null);
    setInputValue('');
  }

  function startFixedEdit(id: string, mode: FixedEditMode, value: string) {
    cancelVariableEdit();
    setEditingFixedId(id);
    setFixedEditMode(mode);
    setInputValue(value);
  }

  function startVariableEdit(id: string, value: string) {
    cancelFixedEdit();
    setEditingVariableId(id);
    setVariableEditMode('budget');
    setInputValue(value);
  }

  function saveFixedEdit() {
    if (!editingFixedId || !fixedEditMode) return;
    const item = fixed.find((f) => f.id === editingFixedId);
    if (!item) return;

    if (fixedEditMode === 'name') {
      if (!inputValue.trim()) {
        Alert.alert('Name required');
        return;
      }
      updateFixed(editingFixedId, { name: inputValue.trim() });
    } else if (fixedEditMode === 'due_date') {
      updateFixed(editingFixedId, { due_date: inputValue.trim() || null });
    } else {
      const parsed = parseFloat(inputValue.replace(/,/g, ''));
      if (!Number.isFinite(parsed) || parsed < 0) {
        Alert.alert('Invalid amount');
        return;
      }
      if (fixedEditMode === 'budget') {
        updateFixed(editingFixedId, { budget_amount: parsed });
      } else {
        updateFixed(editingFixedId, { spent_amount: parsed });
      }
    }
    cancelFixedEdit();
  }

  function saveVariableEdit() {
    if (!editingVariableId) return;
    const parsed = parseFloat(inputValue.replace(/,/g, ''));
    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert('Invalid amount');
      return;
    }
    updateVariableBudget(editingVariableId, { budget_amount: parsed });
    cancelVariableEdit();
  }

  function handleAddFixed() {
    const parsed = parseFloat(newBudget.replace(/,/g, ''));
    if (!newName.trim()) {
      Alert.alert('Name required', 'Enter a budget name.');
      return;
    }
    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert('Invalid budget', 'Enter a budget amount of zero or more.');
      return;
    }
    addFixedBudget({
      name: newName,
      budget_amount: parsed,
      due_date: newDueDate.trim() || undefined,
      is_savings: newIsSavings,
    });
    setNewName('');
    setNewBudget('');
    setNewDueDate('');
    setNewIsSavings(false);
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Budgets' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.monthLabel}>{month.label}</Text>

          <Text style={styles.section}>Fixed budgets</Text>
          {fixed.length === 0 ? (
            <Card>
              <Text style={styles.muted}>No fixed budgets yet. Add one below.</Text>
            </Card>
          ) : (
            fixed.map((f) => (
              <Card key={f.id}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>
                      {f.name}
                      {f.is_savings ? ' (savings)' : ''}
                    </Text>
                    <Text style={styles.meta}>
                      {formatPhp(f.spent_amount)} / {formatPhp(f.budget_amount)}
                      {f.due_date ? ` · due ${f.due_date}` : ''}
                    </Text>
                  </View>
                  {!f.is_savings ? (
                    <Switch value={f.is_paid} onValueChange={(v) => updateFixed(f.id, { is_paid: v })} />
                  ) : null}
                </View>

                {editingFixedId === f.id ? (
                  <View style={styles.editBlock}>
                    <FormField
                      label={
                        fixedEditMode === 'name'
                          ? 'Name'
                          : fixedEditMode === 'budget'
                            ? 'Budget amount'
                            : fixedEditMode === 'spent'
                              ? 'Spent amount'
                              : 'Due date (YYYY-MM-DD)'
                      }
                      value={inputValue}
                      onChangeText={setInputValue}
                      keyboardType={fixedEditMode === 'name' || fixedEditMode === 'due_date' ? 'default' : 'decimal-pad'}
                      placeholder={fixedEditMode === 'due_date' ? 'Optional' : undefined}
                    />
                    <PrimaryButton label="Save" onPress={saveFixedEdit} />
                    <PrimaryButton label="Cancel" onPress={cancelFixedEdit} />
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <PrimaryButton label="Edit name" onPress={() => startFixedEdit(f.id, 'name', f.name)} />
                    <PrimaryButton label="Edit budget" onPress={() => startFixedEdit(f.id, 'budget', String(f.budget_amount))} />
                    <PrimaryButton label="Edit spent" onPress={() => startFixedEdit(f.id, 'spent', String(f.spent_amount))} />
                    <PrimaryButton
                      label="Edit due date"
                      onPress={() => startFixedEdit(f.id, 'due_date', f.due_date ?? '')}
                    />
                    <Pressable onPress={() => setPendingDeleteId(f.id)} style={styles.deleteButton}>
                      <Text style={[styles.deleteText, { color: Colors[scheme].danger }]}>Delete</Text>
                    </Pressable>
                  </View>
                )}
              </Card>
            ))
          )}

          <Text style={styles.section}>Add fixed budget</Text>
          <Card>
            <FormField label="Name" value={newName} onChangeText={setNewName} placeholder="Internet, Rent" />
            <FormField
              label="Budget amount (PHP)"
              value={newBudget}
              onChangeText={setNewBudget}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            <FormField
              label="Due date (optional)"
              value={newDueDate}
              onChangeText={setNewDueDate}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.chips}>
              <Chip label="Regular bill" selected={!newIsSavings} onPress={() => setNewIsSavings(false)} />
              <Chip label="Savings goal" selected={newIsSavings} onPress={() => setNewIsSavings(true)} />
            </View>
            <PrimaryButton label="Add fixed budget" onPress={handleAddFixed} />
          </Card>

          <Text style={styles.section}>Variable budgets</Text>
          {remaining.map((v) => {
            const item = variable.find((b) => b.category === v.category);
            if (!item) return null;
            const pct = v.budget > 0 ? v.spent / v.budget : 0;

            return (
              <Card key={v.category}>
                <Text style={styles.name}>{v.category}</Text>
                <Text style={styles.meta}>
                  {formatPhp(v.spent)} / {formatPhp(v.budget)} · {formatPhp(v.remaining)} left
                </Text>
                <View style={styles.barWrap}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${Math.min(pct * 100, 100)}%`,
                        backgroundColor: pct > 0.9 ? Colors[scheme].danger : Colors[scheme].tint,
                      },
                    ]}
                  />
                </View>

                {editingVariableId === item.id ? (
                  <View style={styles.editBlock}>
                    <FormField
                      label="Monthly budget (PHP)"
                      value={inputValue}
                      onChangeText={setInputValue}
                      keyboardType="decimal-pad"
                    />
                    <PrimaryButton label="Save" onPress={saveVariableEdit} />
                    <PrimaryButton label="Cancel" onPress={cancelVariableEdit} />
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <PrimaryButton label="Edit budget" onPress={() => startVariableEdit(item.id, String(item.budget_amount))} />
                  </View>
                )}
              </Card>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ConfirmDialog
        visible={pendingDeleteId !== null}
        title="Delete budget"
        message={
          pendingDelete
            ? `Remove "${pendingDelete.name}" from fixed budgets?`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (pendingDeleteId) deleteFixedBudget(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  monthLabel: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, opacity: 0.6, marginTop: 4 },
  barWrap: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  bar: { height: '100%' },
  actions: { marginTop: 12, gap: 8 },
  editBlock: { marginTop: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, opacity: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  deleteButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  deleteText: { fontSize: 14, fontWeight: '600' },
  muted: { opacity: 0.6, fontSize: 13 },
});
