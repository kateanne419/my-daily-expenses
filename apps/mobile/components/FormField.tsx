import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';

interface Props extends TextInputProps {
  label: string;
}

export function FormField({ label, style, ...props }: Props) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors[scheme].tabIconDefault}
        style={[
          styles.input,
          {
            color: Colors[scheme].text,
            backgroundColor: Colors[scheme].card,
            borderColor: Colors[scheme].border,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? Colors[scheme].tint : Colors[scheme].card,
          borderColor: Colors[scheme].border,
        },
      ]}>
      <Text style={[styles.chipText, { color: selected ? '#fff' : Colors[scheme].text }]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { backgroundColor: Colors[scheme].tint, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
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
    fontSize: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
