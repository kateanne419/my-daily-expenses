import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { computeDailyMTD } from '@expense-tracker/shared';

export default function DailyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const daily = useAppStore((s) => s.month.dailySummaries);
  const mtd = computeDailyMTD(daily);
  const rows = daily.filter((d) => !d.is_opening_snapshot);
  const max = Math.max(...rows.map((d) => d.amount), 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.mtdLabel}>Daily spending MTD</Text>
          <Text style={styles.mtdValue}>{formatPhp(mtd)}</Text>
        </Card>
        {rows.map((d) => (
          <View key={d.date} style={styles.row}>
            <Text style={styles.date}>{d.date}</Text>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { width: `${(d.amount / max) * 100}%`, backgroundColor: Colors[scheme].tint }]} />
            </View>
            <Text style={styles.amount}>{formatPhp(d.amount)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  mtdLabel: { fontSize: 13, opacity: 0.6 },
  mtdValue: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  date: { width: 96, fontSize: 13 },
  barWrap: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4 },
  amount: { width: 90, textAlign: 'right', fontSize: 13, fontWeight: '600' },
});
