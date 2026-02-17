import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';

interface Props {
  label: string;
  onPress: () => void;
}

export function BackBtn({ label, onPress }: Props) {
  const C = useThemeStore((s) => s.colors);

  return (
    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} style={styles.btn}>
      <Ionicons name="chevron-back" size={18} color={C.blue} />
      <Text style={[styles.label, { color: C.blue }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
});
