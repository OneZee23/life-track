import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/useTheme';
import { useCheckinsStore } from '@/store/useCheckins';
import { WEEKDAYS_FULL_RU, dayOfWeek, monthGenitive, formatDate, isToday } from '@/utils/dates';
import { DONE_COLOR } from '@/utils/constants';
import type { Habit } from '@/types';

interface Props {
  date: Date;
  habits: Habit[];
  habitFilter: string | null;
}

export function ProgressDay({ date, habits, habitFilter }: Props) {
  const C = useThemeStore((s) => s.colors);
  const data = useCheckinsStore((s) => s.data);
  const loadDate = useCheckinsStore((s) => s.loadDate);
  const today = isToday(date);

  // Load day data from SQLite
  useEffect(() => {
    loadDate(formatDate(date));
  }, [date.getTime()]);
  const dateStr = formatDate(date);
  const dayData = data[dateStr];

  const visibleHabits = useMemo(() => {
    const filtered = habitFilter ? habits.filter((h) => h.id === habitFilter) : habits;
    // Only show deleted habits if they have data for this day
    return filtered.filter((h) => {
      if (!h.deleted) return true;
      return dayData?.[h.id] !== undefined;
    });
  }, [habits, habitFilter, dayData]);

  const { doneCount, total } = useMemo(() => {
    let done = 0;
    let counted = 0;
    for (const h of visibleHabits) {
      const v = dayData?.[h.id];
      if (v !== undefined) {
        counted++;
        if (v === 1) done++;
      }
    }
    return { doneCount: done, total: counted };
  }, [dateStr, dayData, visibleHabits]);

  return (
    <View>
      {/* Date header */}
      <View style={styles.dateHeader}>
        <Text style={[styles.dayName, { color: C.text0 }]}>
          {WEEKDAYS_FULL_RU[dayOfWeek(date)]}
        </Text>
        <Text style={[styles.dateText, { color: C.text3 }]}>
          {date.getDate()} {monthGenitive(date.getMonth())} {date.getFullYear()}
        </Text>
        {today && (
          <Text style={[styles.todayLabel, { color: C.green }]}>
            Сегодня — ещё не затрекан
          </Text>
        )}
      </View>

      {/* Score circle */}
      {!today && total > 0 && (
        <View style={styles.scoreSection}>
          <View
            style={[
              styles.scoreCircle,
              { backgroundColor: doneCount === total ? C.greenLight : C.segBg },
            ]}
          >
            <Text
              style={[
                styles.scoreText,
                { color: doneCount === total ? C.green : C.text3 },
              ]}
            >
              {doneCount}/{total}
            </Text>
          </View>
          <Text
            style={[
              styles.scoreLabel,
              { color: doneCount === total ? C.green : C.text3 },
            ]}
          >
            {doneCount === total ? 'Все выполнено!' : 'Частично'}
          </Text>
        </View>
      )}

      {today && (
        <View style={styles.scoreSection}>
          <View
            style={[
              styles.scoreCircle,
              { backgroundColor: C.emptyCell, borderWidth: 2, borderColor: C.green },
            ]}
          >
            <Text style={[styles.questionMark, { color: C.text4 }]}>?</Text>
          </View>
          <Text style={[styles.todayWaiting, { color: C.text4 }]}>Ожидает чек-ина</Text>
        </View>
      )}

      {/* Habit list */}
      <View style={styles.habitList}>
        {visibleHabits.map((h) => {
          const v = dayData?.[h.id];
          const done = v === 1;

          return (
            <View key={h.id} style={[styles.habitRow, { backgroundColor: C.card }]}>
              <View
                style={[
                  styles.habitEmoji,
                  { backgroundColor: done ? C.greenLight : C.segBg },
                ]}
              >
                <Text style={styles.emojiText}>{h.emoji}</Text>
              </View>
              <Text style={[styles.habitName, { color: C.text1 }]} numberOfLines={1}>
                {h.name}
              </Text>
              {v !== undefined ? (
                <View
                  style={[
                    styles.statusCircle,
                    { backgroundColor: done ? DONE_COLOR : C.emptyCell },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={[styles.dashText, { color: C.text4 }]}>—</Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.noData, { color: C.text5 }]}>—</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dayName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 14,
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  questionMark: {
    fontSize: 24,
  },
  todayWaiting: {
    fontSize: 13,
  },
  habitList: {
    gap: 6,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  habitEmoji: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 18,
  },
  habitName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  statusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashText: {
    fontSize: 14,
  },
  noData: {
    fontSize: 13,
  },
});
