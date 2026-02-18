import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { memo, useEffect } from 'react';
import { useThemeStore } from '@/store/useTheme';
import type { DayStatus } from '@/types';
import { DONE_COLOR } from '@/utils/constants';

interface Props {
  status: DayStatus;
  isToday: boolean;
  size?: number;
  borderRadius?: number;
}

export const HeatmapCell = memo(function HeatmapCell({
  status,
  isToday: today,
  size = 18,
  borderRadius = 3,
}: Props) {
  const C = useThemeStore((s) => s.colors);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (today) {
      pulse.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [today]);

  const pulseStyle = useAnimatedStyle(() => ({
    borderColor: today ? DONE_COLOR : 'transparent',
    opacity: today ? pulse.value : 1,
  }));

  const bg = today
    ? 'transparent'
    : status === 'all'
      ? DONE_COLOR
      : status === 'partial'
        ? `${DONE_COLOR}70`
        : C.emptyCell;

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bg,
          borderWidth: today ? 1.5 : 0,
        },
        pulseStyle,
      ]}
    />
  );
});
