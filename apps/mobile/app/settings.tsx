import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors[scheme].background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.label}>Cloud sync</Text>
            <Text style={styles.value}>{isSupabaseConfigured ? 'Supabase configured' : 'Local mode'}</Text>
            <Text style={styles.meta}>
              Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to enable sync.
            </Text>
          </Card>

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
