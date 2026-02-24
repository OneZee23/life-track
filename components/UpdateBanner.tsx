import { Linking, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useTheme';

interface Props {
  storeUrl: string;
}

export function UpdateBanner({ storeUrl }: Props) {
  const C = useThemeStore((s) => s.colors);

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <Pressable
        style={[styles.btn, { backgroundColor: C.blue + '18' }]}
        onPress={() => Linking.openURL(storeUrl)}
      >
        <Ionicons name="cloud-download-outline" size={16} color={C.blue} />
        <Text style={[styles.label, { color: C.blue }]}>
          Доступно обновление
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
