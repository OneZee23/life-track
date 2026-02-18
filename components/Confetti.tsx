import { memo, useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

const GREENS = ['#34C759', '#30B350', '#2AA147', '#48D66A', '#5EDD7E'];
const PARTICLE_COUNT = 20;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleProps {
  index: number;
}

const Particle = memo(function Particle({ index }: ParticleProps) {
  const startX = Math.random() * SCREEN_WIDTH;
  const delay = Math.random() * 400;
  const duration = 1800 + Math.random() * 1200;
  const size = 4 + Math.random() * 5;
  const color = GREENS[index % GREENS.length];
  const drift = (Math.random() - 0.5) * 60;
  const rotation = Math.random() * 360;

  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 50, {
        duration,
        easing: Easing.in(Easing.quad),
      })
    );
    opacity.value = withDelay(
      delay + duration * 0.6,
      withTiming(0, { duration: duration * 0.4 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: drift },
      { rotate: `${rotation}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: -20,
          width: size,
          height: index % 3 === 1 ? size * 2 : size,
          borderRadius: index % 3 === 0 ? 1 : size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
});

export function Confetti({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(100)}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <Particle key={i} index={i} />
      ))}
    </Animated.View>
  );
}
