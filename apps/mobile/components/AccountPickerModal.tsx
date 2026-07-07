import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPhp } from '@/lib/format';
import type { Account } from '@expense-tracker/shared';

interface Props {
  visible: boolean;
  title: string;
  accounts: Account[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function AccountPickerModal({ visible, title, accounts, selectedId, onSelect, onClose }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const sorted = [...accounts].sort((a, b) => a.display_order - b.display_order);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: Colors[scheme].background }]}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView>
            {sorted.map((acct) => (
              <Pressable
                key={acct.id}
                style={[styles.row, selectedId === acct.id && { backgroundColor: Colors[scheme].card }]}
                onPress={() => {
                  onSelect(acct.id);
                  onClose();
                }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{acct.name}</Text>
                  <Text style={[styles.balance, acct.current_balance < 0 && styles.negative]}>
                    {formatPhp(acct.current_balance)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={{ color: Colors[scheme].tint, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },
  name: { fontSize: 16, fontWeight: '600' },
  balance: { fontSize: 14, opacity: 0.7, marginTop: 2 },
  negative: { color: '#dc2626' },
  cancel: { alignItems: 'center', paddingVertical: 14 },
});
