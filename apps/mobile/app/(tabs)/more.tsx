import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const LINKS = [
  { href: '/daily', title: 'Daily spending', subtitle: 'Day-by-day chart + MTD' },
  { href: '/accounts', title: 'Accounts', subtitle: 'Balances and transfers' },
  { href: '/credit-cards', title: 'Credit cards', subtitle: 'Limits, payments, due dates' },
  { href: '/debts', title: 'Debts', subtitle: 'Splitwise + personal debts' },
  { href: '/budgets', title: 'Budgets', subtitle: 'Fixed and variable' },
  { href: '/income', title: 'Income', subtitle: 'Monthly income sources' },
  { href: '/settings', title: 'Settings', subtitle: 'Export, import, sign out' },
] as const;

export default function MoreScreen() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {LINKS.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <Pressable>
              <Card>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </Card>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13, opacity: 0.6, marginTop: 4 },
});
