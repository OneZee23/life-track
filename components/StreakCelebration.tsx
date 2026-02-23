import { useState, useCallback } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeStore } from '@/store/useTheme';
import { Confetti } from '@/components/Confetti';
import { pluralDays } from '@/utils/dates';

interface Props {
  streak: number;
  onDismiss: () => void;
}

function streakMessage(n: number): string {
  if (n >= 30) return 'Легенда! Месяц без пропусков';
  if (n >= 14) return 'Две недели! Привычка закрепляется';
  if (n >= 7) return 'Неделя! Ты на верном пути';
  if (n >= 3) return 'Отличное начало! Так держать';
  return 'Продолжай в том же духе!';
}

function streakEmoji(n: number): string {
  if (n >= 30) return '\u{1F451}'; // crown
  if (n >= 14) return '\u{1F525}'; // fire
  if (n >= 7) return '\u{26A1}';  // lightning
  return '\u{1F525}';              // fire
}

export function StreakCelebration({ streak, onDismiss }: Props) {
  const C = useThemeStore((s) => s.colors);
  const dark = useThemeStore((s) => s.dark);
  const [closing, setClosing] = useState(false);
  const opacity = useSharedValue(1);

  const animatedOverlay = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleDismiss = useCallback(() => {
    if (closing) return;
    setClosing(true);
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  }, [closing, onDismiss]);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { backgroundColor: C.bg }, animatedOverlay]}>
        <Confetti active={!closing} />

        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(350).easing(Easing.out(Easing.back(1.4)))} style={styles.center}>
            <Text style={styles.emoji}>{streakEmoji(streak)}</Text>
            <Text style={[styles.count, { color: C.green }]}>{streak}</Text>
            <Text style={[styles.label, { color: C.text1 }]}>
              {pluralDays(streak)} подряд
            </Text>
            <Animated.Text
              entering={FadeIn.delay(400).duration(300)}
              style={[styles.message, { color: C.text3 }]}
            >
              {streakMessage(streak)}
            </Animated.Text>

            <Animated.View entering={FadeIn.delay(600).duration(300)} style={styles.btnWrap}>
              <Pressable
                style={[styles.btn, { backgroundColor: C.green }]}
                onPress={handleDismiss}
              >
                <Text style={styles.btnText}>Продолжить</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  count: {
    fontSize: 80,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 88,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
  },
  btnWrap: {
    marginTop: 32,
    width: 220,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
