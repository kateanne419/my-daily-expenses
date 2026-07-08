import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: Colors[scheme].background, borderColor: Colors[scheme].border }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.message, { color: Colors[scheme].text }]}>{message}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.button, styles.cancelButton, { borderColor: Colors[scheme].border }]}>
              <Text style={[styles.cancelText, { color: Colors[scheme].text }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: destructive ? Colors[scheme].danger : Colors[scheme].tint },
              ]}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dialog: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 15, lineHeight: 22, opacity: 0.85, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { borderWidth: 1 },
  cancelText: { fontSize: 16, fontWeight: '600' },
  confirmButton: {},
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
