import { memo, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(habit.id);
  }, [onToggle, habit.id]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(index * 40).duration(300)}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: done ? C.doneBg : C.card,
              shadowColor: done ? DONE_COLOR : '#000',
              shadowOpacity: done ? 0.15 : 0.04,
            },
            cardStyle,
          ]}
        >
          {/* Emoji */}
          <View
            style={[
              styles.emojiBox,
              { backgroundColor: done ? `${C.green}18` : C.segBg },
            ]}
          >
            <Text style={styles.emoji}>{habit.emoji}</Text>
          </View>

          {/* Name */}
          <Text style={[styles.name, { color: C.text1 }]} numberOfLines={1}>
            {habit.name}
          </Text>

          {/* Toggle circle */}
          <View
            style={[
              styles.toggle,
              done
                ? { backgroundColor: C.green }
                : { backgroundColor: 'transparent', borderWidth: 2, borderColor: C.text5 },
            ]}
          >
            {done ? (
              <CheckIcon />
            ) : (
              <Text style={[styles.dash, { color: C.text5 }]}>—</Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

function CheckIcon() {
  return (
    <View style={styles.checkContainer}>
      <Text style={styles.checkmark}>✓</Text>
    </View>
  );
}

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
  checkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
