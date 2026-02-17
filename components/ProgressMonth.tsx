import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';
import { useCheckinsStore } from '@/store/useCheckins';
import { NavHeader } from '@/components/ui/NavHeader';
import { MONTH_NAMES_RU, WEEKDAYS_SHORT_RU, dayOfWeek, daysInMonth, formatDate, isToday } from '@/utils/dates';
import { DONE_COLOR } from '@/utils/constants';
import type { DayStatus } from '@/types';

interface Props {
  year: number;
  month: number;
  setMonth: (m: number) => void;
  habitFilter: string | null;
  goWeek: (date: Date) => void;
}

export function ProgressMonth({ year, month, setMonth, habitFilter, goWeek }: Props) {
  const C = useThemeStore((s) => s.colors);
  const data = useCheckinsStore((s) => s.data);

  const dim = daysInMonth(year, month);
  const firstDow = dayOfWeek(new Date(year, month, 1));

  const { cells, bestStreak, currentStreak } = useMemo(() => {
    const cells: Array<{ day: number; status: DayStatus; today: boolean; date: Date } | null> = [];
    let best = 0;
    let cur = 0;

    for (let i = 0; i < firstDow; i++) cells.push(null);

    for (let d = 1; d <= dim; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDate(date);
      const dayData = data[dateStr];
      const today = isToday(date);
      let status: DayStatus = null;
      let isDone = false;

      if (dayData) {
        if (habitFilter) {
          const v = dayData[habitFilter];
          if (v !== undefined) {
            status = v === 1 ? 'all' : 'none';
            isDone = v === 1;
          }
        } else {
          const values = Object.values(dayData);
          if (values.length) {
            const doneVals = values.filter((v) => v === 1).length;
            status = doneVals === values.length ? 'all' : doneVals > 0 ? 'partial' : 'none';
            isDone = doneVals > 0;
          }
        }
      }

      if (isDone) {
        cur++;
        best = Math.max(best, cur);
      } else if (!today) {
        cur = 0;
      }

      cells.push({ day: d, status, today, date });
    }

    // Pad to complete rows
    while (cells.length % 7 !== 0) cells.push(null);

    return { cells, bestStreak: best, currentStreak: cur };
  }, [year, month, data, habitFilter]);

  // Group into rows of 7
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View>
      <NavHeader
        title={`${MONTH_NAMES_RU[month]} ${year}`}
        onPrev={() => setMonth(month - 1)}
        onNext={() => setMonth(month + 1)}
      />

      {/* Calendar grid */}
      <View style={[styles.calendarCard, { backgroundColor: C.card }]}>
        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS_SHORT_RU.map((d) => (
            <View key={d} style={styles.dayCell}>
              <Text style={[styles.weekdayText, { color: C.text4 }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Day cells */}
        {rows.map((row, ri) => (
          <View key={ri} style={styles.weekRow}>
            {row.map((c, ci) => {
              if (!c) return <View key={ci} style={styles.dayCell} />;
              const isDone = c.status === 'all' || c.status === 'partial';
              return (
                <Pressable
                  key={ci}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goWeek(c.date); }}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: c.today
                        ? 'transparent'
                        : isDone
                          ? DONE_COLOR
                          : C.emptyCell,
                      borderRadius: 10,
                      borderWidth: c.today ? 2 : 0,
                      borderColor: c.today ? DONE_COLOR : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isDone && !c.today ? '#fff' : C.text4,
                        fontWeight: c.today ? '700' : '500',
                      },
                    ]}
                  >
                    {c.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Streak cards */}
      <View style={styles.streakRow}>
        <View style={[styles.streakCard, { backgroundColor: C.card }]}>
          <Text style={[styles.streakLabel, { color: C.text3 }]}>ЛУЧШАЯ СЕРИЯ</Text>
          <View style={styles.streakValueRow}>
            <Text style={[styles.streakValue, { color: C.green }]}>{bestStreak}</Text>
            <Text style={[styles.streakUnit, { color: C.text4 }]}>дней</Text>
          </View>
        </View>
        <View style={[styles.streakCard, { backgroundColor: C.card }]}>
          <Text style={[styles.streakLabel, { color: C.text3 }]}>ТЕКУЩАЯ СЕРИЯ</Text>
          <View style={styles.streakValueRow}>
            <Text style={[styles.streakValue, { color: C.green }]}>{currentStreak}</Text>
            <Text style={[styles.streakUnit, { color: C.text4 }]}>дней</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  dayText: {
    fontSize: 12,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 8,
  },
  streakCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 16,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  streakUnit: {
    fontSize: 13,
  },
});
