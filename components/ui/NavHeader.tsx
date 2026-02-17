import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  onPrev: () => void;
  onNext: () => void;
}

export function NavHeader({ title, subtitle, onPrev, onNext }: Props) {
  const C = useThemeStore((s) => s.colors);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPrev(); }}
        style={[styles.arrow, { backgroundColor: C.segBg }]}
      >
        <Ionicons name="chevron-back" size={16} color={C.text0} />
      </Pressable>
      <View style={styles.center}>
        <Text style={[styles.title, { color: C.text0 }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: C.text3 }]}>{subtitle}</Text>
        )}
      </View>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNext(); }}
        style={[styles.arrow, { backgroundColor: C.segBg }]}
      >
        <Ionicons name="chevron-forward" size={16} color={C.text0} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
});
