import { View, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';

interface Props {
  label: string;
  active: boolean;
  dimmed?: boolean;
  onPress: () => void;
  onDismiss?: () => void;
}

export function Chip({ label, active, dimmed, onPress, onDismiss }: Props) {
  const C = useThemeStore((s) => s.colors);

  const bg = dimmed
    ? C.segBg
    : active
      ? C.green
      : C.segBg;

  const textColor = dimmed && active
    ? C.green
    : dimmed
      ? C.text3
      : active
        ? '#fff'
        : C.text2;

  const borderStyle = dimmed && active
    ? { borderWidth: 1.5, borderColor: C.green }
    : undefined;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
        style={[
          styles.chip,
          { backgroundColor: bg, opacity: dimmed ? 0.55 : 1 },
          borderStyle,
        ]}
      >
        <Text
          style={[styles.label, { color: textColor }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
      {onDismiss && (
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onDismiss(); }}
          style={[styles.dismiss, { backgroundColor: C.text3 }]}
          hitSlop={6}
        >
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  dismiss: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 14,
  },
});
