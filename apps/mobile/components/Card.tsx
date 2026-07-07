import { StyleSheet, View, ViewProps } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function Card({ style, ...props }: ViewProps) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <View
      style={[styles.card, { backgroundColor: Colors[scheme].card, borderColor: Colors[scheme].border }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
});
