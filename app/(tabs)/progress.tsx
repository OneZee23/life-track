import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInLeft, FadeInRight, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';
import { useHabitsStore } from '@/store/useHabits';
import { Chip } from '@/components/ui/Chip';
import { BackBtn } from '@/components/ui/BackBtn';
import { ProgressYear } from '@/components/ProgressYear';
import { ProgressMonth } from '@/components/ProgressMonth';
import { ProgressWeek } from '@/components/ProgressWeek';
import { ProgressDay } from '@/components/ProgressDay';
import { weekStart, formatDate, MONTH_NAMES_RU } from '@/utils/dates';
import { useTabBarOverlap } from '@/hooks/useTabBarOverlap';

type Level = 'year' | 'month' | 'week' | 'day';
type TopLevel = 'month' | 'year';

export default function ProgressScreen() {
  const C = useThemeStore((s) => s.colors);
  const allHabits = useHabitsStore((s) => s.allHabits);
  const insets = useSafeAreaInsets();
  const tabOverlap = useTabBarOverlap();
  const now = new Date();

  const navigation = useNavigation<any>();
  const lastDateRef = useRef(formatDate(now));

  const [level, setLevel] = useState<Level>('month');
  const [topLevel, setTopLevel] = useState<TopLevel>('month');
  const [habitFilter, setHabitFilter] = useState<string | null>(null);
  const [navYear, setNavYear] = useState(now.getFullYear());
  const [navMonth, setNavMonth] = useState(now.getMonth());
  const [navWeekStart, setNavWeekStart] = useState(weekStart(now));
  const [navDay, setNavDay] = useState<Date>(now);

  // Refresh to current month when day changes (handles midnight)
  useFocusEffect(
    useCallback(() => {
      const today = new Date();
      const todayStr = formatDate(today);
      if (todayStr !== lastDateRef.current) {
        lastDateRef.current = todayStr;
        setLevel('month');
        setTopLevel('month');
        setNavYear(today.getFullYear());
        setNavMonth(today.getMonth());
      }
    }, [])
  );

  // Tap tab again → reset to current month (home)
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      const today = new Date();
      const isHome = level === 'month' && navYear === today.getFullYear() && navMonth === today.getMonth();
      if (!isHome) {
        e.preventDefault();
        setLevel('month');
        setTopLevel('month');
        setNavYear(today.getFullYear());
        setNavMonth(today.getMonth());
      }
    });
    return unsubscribe;
  }, [navigation, level, navYear, navMonth]);

  const switchTopLevel = (t: TopLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTopLevel(t);
    setLevel(t);
  };

  const goMonth = (m: number) => {
    setNavMonth(m);
    setTopLevel('month');
    setLevel('month');
  };

  const goWeek = (d: Date) => {
    setNavWeekStart(weekStart(d));
    setLevel('week');
  };

  const goDay = (d: Date) => {
    setNavDay(d);
    setLevel('day');
  };

  const goBack = () => {
    if (level === 'day') setLevel('week');
    else if (level === 'week') setLevel('month');
  };

  const handleSetMonth = (m: number) => {
    if (m < 0) {
      setNavMonth(11);
      setNavYear(navYear - 1);
    } else if (m > 11) {
      setNavMonth(0);
      setNavYear(navYear + 1);
    } else {
      setNavMonth(m);
    }
  };

  // Only show active habits in filter chips
  const activeHabits = useMemo(() => {
    return allHabits.filter((h) => !h.deleted);
  }, [allHabits]);

  // Swipe animation direction
  const [swipeKey, setSwipeKey] = useState(0);
  const swipeDirRef = useRef<'left' | 'right'>('right');

  // Swipe prev/next for current level
  const swipePrev = useCallback(() => {
    swipeDirRef.current = 'right';
    setSwipeKey((k) => k + 1);
    if (level === 'year') {
      setNavYear((y) => y - 1);
    } else if (level === 'month') {
      handleSetMonth(navMonth - 1);
    } else if (level === 'week') {
      setNavWeekStart((ws) => {
        const prev = new Date(ws);
        prev.setDate(prev.getDate() - 7);
        return prev;
      });
    } else {
      setNavDay((d) => {
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 1);
        return prev;
      });
    }
  }, [level, navMonth, navYear]);

  const swipeNext = useCallback(() => {
    swipeDirRef.current = 'left';
    setSwipeKey((k) => k + 1);
    if (level === 'year') {
      setNavYear((y) => y + 1);
    } else if (level === 'month') {
      handleSetMonth(navMonth + 1);
    } else if (level === 'week') {
      setNavWeekStart((ws) => {
        const next = new Date(ws);
        next.setDate(next.getDate() + 7);
        return next;
      });
    } else {
      setNavDay((d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        return next;
      });
    }
  }, [level, navMonth, navYear]);

  const handleSwipeEnd = useCallback((translationX: number) => {
    if (Math.abs(translationX) < 50) return;
    if (translationX > 0) {
      swipePrev();
    } else {
      swipeNext();
    }
  }, [swipePrev, swipeNext]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      runOnJS(handleSwipeEnd)(e.translationX);
    });

  const isTopLevel = level === 'month' || level === 'year';
  const backLabel = level === 'week' ? MONTH_NAMES_RU[navMonth] : 'Неделя';

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      {/* Header */}
      {isTopLevel ? (
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text0 }]}>Прогресс</Text>

          {/* Segmented control: Месяц / Год */}
          <View style={[styles.segment, { backgroundColor: C.segBg }]}>
            <Pressable
              onPress={() => switchTopLevel('month')}
              style={[
                styles.segBtn,
                topLevel === 'month' && { backgroundColor: C.segActive },
              ]}
            >
              <Text
                style={[
                  styles.segLabel,
                  { color: topLevel === 'month' ? C.text0 : C.text3 },
                ]}
              >
                Месяц
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchTopLevel('year')}
              style={[
                styles.segBtn,
                topLevel === 'year' && { backgroundColor: C.segActive },
              ]}
            >
              <Text
                style={[
                  styles.segLabel,
                  { color: topLevel === 'year' ? C.text0 : C.text3 },
                ]}
              >
                Год
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.backHeader}>
          <BackBtn label={backLabel} onPress={goBack} />
        </View>
      )}

      {/* Habit filter chips */}
      <View style={styles.chipBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip
            label="Все"
            active={!habitFilter}
            onPress={() => setHabitFilter(null)}
          />
          {activeHabits.map((h) => (
            <Chip
              key={h.id}
              label={`${h.emoji} ${h.name}`}
              active={habitFilter === h.id}
              onPress={() => setHabitFilter(habitFilter === h.id ? null : h.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Content with swipe navigation */}
      <GestureDetector gesture={swipeGesture}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabOverlap + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            key={`${level}-${swipeKey}`}
            entering={swipeDirRef.current === 'left' ? FadeInRight.duration(200) : FadeInLeft.duration(200)}
          >
            {level === 'year' && (
              <ProgressYear
                year={navYear}
                setYear={setNavYear}
                habitFilter={habitFilter}
                goMonth={goMonth}
              />
            )}
            {level === 'month' && (
              <ProgressMonth
                year={navYear}
                month={navMonth}
                setMonth={handleSetMonth}
                habitFilter={habitFilter}
                goWeek={goWeek}
              />
            )}
            {level === 'week' && (
              <ProgressWeek
                weekStart={navWeekStart}
                setWeekStart={setNavWeekStart}
                habits={allHabits}
                habitFilter={habitFilter}
                goDay={goDay}
              />
            )}
            {level === 'day' && (
              <ProgressDay
                date={navDay}
                habits={allHabits}
                habitFilter={habitFilter}
              />
            )}
          </Animated.View>
        </ScrollView>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: 'center',
  },
  segLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  backHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  chipBar: {
    marginBottom: 10,
  },
  chipRow: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
});
