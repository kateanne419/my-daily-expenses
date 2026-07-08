import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { PrimaryButton } from '@/components/FormField';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { dateToISO, formatDisplayDate, parseISODate } from '@/lib/format';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function DateField({ label, value, onChange }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseISODate(value));

  function openPicker() {
    setDraft(parseISODate(value));
    setOpen(true);
  }

  function applyDate(date: Date) {
    onChange(dateToISO(date));
  }

  function handleAndroidChange(event: DateTimePickerEvent, selected?: Date) {
    setOpen(false);
    if (event.type === 'set' && selected) {
      applyDate(selected);
    }
  }

  function handleIOSChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setDraft(selected);
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-expect-error web date input */}
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: Colors[scheme].border,
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 16,
            width: '100%',
            boxSizing: 'border-box',
            color: Colors[scheme].text,
            backgroundColor: Colors[scheme].card,
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel={`${label}, ${formatDisplayDate(value)}`}>
        <View
          style={[
            styles.input,
            {
              borderColor: Colors[scheme].border,
              backgroundColor: Colors[scheme].card,
            },
          ]}>
          <Text style={{ color: Colors[scheme].text, fontSize: 16 }}>{formatDisplayDate(value)}</Text>
        </View>
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={parseISODate(value)} mode="date" onChange={handleAndroidChange} />
      ) : null}

      {open && Platform.OS === 'ios' ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />
            <View style={[styles.sheet, { backgroundColor: Colors[scheme].background }]}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                onChange={handleIOSChange}
                themeVariant={scheme}
              />
              <PrimaryButton
                label="Done"
                onPress={() => {
                  applyDate(draft);
                  setOpen(false);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, opacity: 0.8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 24 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
});
