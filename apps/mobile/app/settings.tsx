import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const month = useAppStore((s) => s.month);

  function exportCsv() {
    const rows = [
      ['Date', 'Category', 'Amount', 'Account', 'Description'],
      ...month.transactions.map((t) => [
        t.date,
        t.category,
        String(t.amount),
        month.accounts.find((a) => a.id === t.account_id)?.name ?? '',
        t.description ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    Alert.alert('Export ready', `${month.transactions.length} transactions in CSV buffer.\n\n${csv.slice(0, 200)}…`);
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.label}>Cloud sync</Text>
            <Text style={styles.value}>{isSupabaseConfigured ? 'Supabase configured' : 'Local mode (demo data)'}</Text>
            <Text style={styles.meta}>
              Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to enable sync.
            </Text>
          </Card>

          <Card>
            <Text style={styles.label}>Import status</Text>
            <Text style={styles.value}>June 2026 demo seeded</Text>
            <Text style={styles.meta}>Run scripts/import-google-sheet.ts for full sheet import.</Text>
          </Card>

          <PrimaryButton label="Export transactions CSV" onPress={exportCsv} />
          <PrimaryButton
            label="Sign out"
            onPress={() => Alert.alert('Sign out', 'Connect Supabase auth to enable sign out.')}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 13, opacity: 0.6 },
  value: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  meta: { fontSize: 13, opacity: 0.6, marginTop: 8, lineHeight: 18 },
});
