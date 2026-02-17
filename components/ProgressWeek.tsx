import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';
import { useCheckinsStore } from '@/store/useCheckins';
import { NavHeader } from '@/components/ui/NavHeader';
import {
  WEEKDAYS_SHORT_RU,
  MONTH_NAMES_RU,
  MONTH_SHORT_RU,
  formatDate,
  isToday,
} from '@/utils/dates';
import { DONE_COLOR } from '@/utils/constants';
import type { Habit } from '@/types';

interface Props {
  weekStart: Date;
  setWeekStart: (d: Date) => void;
  habits: Habit[];
  habitFilter: string | null;
  goDay: (date: Date) => void;
}

export function ProgressWeek({ weekStart: ws, setWeekStart, habits, habitFilter, goDay }: Props) {
  const C = useThemeStore((s) => s.colors);
  const data = useCheckinsStore((s) => s.data);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(ws);
        d.setDate(ws.getDate() + i);
        return d;
      }),
    [ws.getTime()]
  );

  const prevWeek = () => {
    const d = new Date(ws);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(ws);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const d0 = days[0];
  const d6 = days[6];
  const title =
    d0.getMonth() === d6.getMonth()
      ? `${d0.getDate()}–${d6.getDate()} ${MONTH_NAMES_RU[d0.getMonth()]}`
      : `${d0.getDate()} ${MONTH_SHORT_RU[d0.getMonth()]} – ${d6.getDate()} ${MONTH_SHORT_RU[d6.getMonth()]}`;

  const visibleHabits = habitFilter ? habits.filter((h) => h.id === habitFilter) : habits;

  return (
    <View>
      <NavHeader
        title={title}
        subtitle={`${d0.getFullYear()}`}
        onPrev={prevWeek}
        onNext={nextWeek}
      />

      {/* Day strip */}
      <View style={styles.dayStrip}>
        {days.map((d, i) => {
          const today = isToday(d);
          const dateStr = formatDate(d);
          const dayData = data[dateStr];
          const isDone = dayData
            ? Object.values(dayData).some((v) => v === 1)
            : false;

          return (
            <Pressable
              key={i}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goDay(d); }}
              style={[
                styles.dayCard,
                {
                  backgroundColor: C.card,
                  borderColor: today ? DONE_COLOR : 'transparent',
                  borderWidth: today ? 2 : 2,
                },
              ]}
            >
              <Text style={[styles.dayLabel, { color: today ? C.green : C.text4 }]}>
                {WEEKDAYS_SHORT_RU[i]}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: today
                      ? 'transparent'
                      : isDone
                        ? C.greenLight
                        : C.segBg,
                  },
                ]}
              >
                {isDone && !today ? (
                  <Ionicons name="checkmark" size={12} color={C.green} />
                ) : (
                  <Text style={[styles.dayNum, { color: today ? C.green : C.text4 }]}>
                    {d.getDate()}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Per-habit cards */}
      <View style={styles.habitCards}>
        {visibleHabits.map((h, idx) => {
          const weekValues = days.map((d) => {
            const dateStr = formatDate(d);
            return data[dateStr]?.[h.id] ?? null;
          });
          const done = weekValues.filter((v) => v === 1).length;
          const total = weekValues.filter((v) => v !== null).length;

          return (
            <Animated.View key={h.id} entering={FadeInUp.delay(idx * 50).duration(300)} style={[styles.habitCard, { backgroundColor: C.card }]}>
              <View style={styles.habitHeader}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitEmoji}>{h.emoji}</Text>
                  <Text style={[styles.habitName, { color: C.text1 }]}>{h.name}</Text>
                </View>
                <Text
                  style={[
                    styles.habitScore,
                    { color: done === total && total > 0 ? C.green : C.text3 },
                  ]}
                >
                  {done}/{total}
                </Text>
              </View>
              <View style={styles.habitBars}>
                {weekValues.map((v, i) => {
                  const today = isToday(days[i]);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.bar,
                        {
                          backgroundColor: today
                            ? 'transparent'
                            : v === 1
                              ? DONE_COLOR
                              : C.emptyCell,
                          borderWidth: today ? 1.5 : 0,
                          borderColor: today ? DONE_COLOR : 'transparent',
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Week total */}
      {(() => {
        const totalDone = days.reduce((acc, d) => {
          const dateStr = formatDate(d);
          const dayData = data[dateStr];
          if (!dayData) return acc;
          return acc + (Object.values(dayData).some((v) => v === 1) ? 1 : 0);
        }, 0);
        const totalDays = days.filter(
          (d) => !isToday(d) && data[formatDate(d)]
        ).length;

        return (
          <View style={[styles.weekTotal, { backgroundColor: C.card }]}>
            <Text style={[styles.weekTotalLabel, { color: C.text2 }]}>
              Итог недели
            </Text>
            <Text style={[styles.weekTotalValue, { color: C.green }]}>
              {totalDone}
              <Text style={[styles.weekTotalSub, { color: C.text4 }]}>
                /{totalDays}
              </Text>
            </Text>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  dayStrip: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 8,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNum: {
    fontSize: 11,
    fontWeight: '600',
  },
  habitCards: {
    gap: 8,
  },
  habitCard: {
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 14,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitEmoji: {
    fontSize: 18,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
  },
  habitScore: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  habitBars: {
    flexDirection: 'row',
    gap: 3,
  },
  bar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  weekTotal: {
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 18,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekTotalLabel: {
    fontSize: 14,
  },
  weekTotalValue: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  weekTotalSub: {
    fontSize: 14,
    fontWeight: '500',
  },
});
