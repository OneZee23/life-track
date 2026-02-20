import { memo, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolateColor,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';
import type { Habit } from '@/types';
import { DONE_COLOR } from '@/utils/constants';

interface Props {
  habit: Habit;
  done: boolean;
  onToggle: (id: string) => void;
  index: number;
}

export const HabitToggle = memo(function HabitToggle({ habit, done, onToggle, index }: Props) {
  const C = useThemeStore((s) => s.colors);
  const scale = useSharedValue(1);
  const progress = useSharedValue(done ? 1 : 0);
  const togglePop = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(done ? 1 : 0, {
      duration: 120,
      easing: Easing.out(Easing.cubic),
    });
    if (done) {
      togglePop.value = withSequence(
        withTiming(1.18, { duration: 80, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 100, easing: Easing.out(Easing.cubic) })
      );
    } else {
      togglePop.value = withTiming(1, { duration: 80 });
    }
  }, [done]);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.96, { duration: 60 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 500 });
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(habit.id);
  }, [onToggle, habit.id]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [C.card, C.doneBg]
    ),
    shadowColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#000000', DONE_COLOR]
    ),
    shadowOpacity: 0.04 + progress.value * 0.11,
  }));

  const toggleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: togglePop.value }],
    borderWidth: 1.5,
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [C.text5, C.green]
    ),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', C.green]
    ),
  }));

  const emojiBoxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [C.segBg, `${C.green}18`]
    ),
  }));

  return (
    <Animated.View entering={FadeIn.delay(index * 40).duration(300)}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Emoji */}
          <Animated.View style={[styles.emojiBox, emojiBoxStyle]}>
            <Text style={styles.emoji}>{habit.emoji}</Text>
          </Animated.View>

          {/* Name */}
          <Text style={[styles.name, { color: C.text1 }]} numberOfLines={1}>
            {habit.name}
          </Text>

          {/* Toggle circle */}
          <Animated.View style={[styles.toggle, toggleStyle]}>
            {done ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : (
              <Text style={[styles.dash, { color: C.text5 }]}>—</Text>
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0.5 },
    shadowRadius: 1,
    elevation: 1,
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dash: {
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 20,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
