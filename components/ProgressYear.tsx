import { memo, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';
import { useCheckinsStore } from '@/store/useCheckins';
import { useHabitsStore } from '@/store/useHabits';
import { NavHeader } from '@/components/ui/NavHeader';
import { HeatmapCell } from '@/components/HeatmapCell';
import {
  MONTH_NAMES_RU,
  WEEKDAYS_SHORT_RU,
  dayOfWeek,
  daysInMonth,
  formatDate,
  isToday,
} from '@/utils/dates';
import { DONE_COLOR } from '@/utils/constants';
import type { DayStatus } from '@/types';

interface Props {
  year: number;
  setYear: (y: number) => void;
  habitFilter: string | null;
  goMonth: (month: number) => void;
}

export function ProgressYear({ year, setYear, habitFilter, goMonth }: Props) {
  const C = useThemeStore((s) => s.colors);
  const data = useCheckinsStore((s) => s.data);
  const loadRange = useCheckinsStore((s) => s.loadDateRange);
  const habits = useHabitsStore((s) => s.habits);
  const now = new Date();

  useEffect(() => {
    loadRange(`${year}-01-01`, `${year}-12-31`);
  }, [year]);

  const yearStats = useMemo(() => {
    let totalDone = 0;
    let totalTracked = 0;

    for (let m = 0; m < 12; m++) {
      const dim = daysInMonth(year, m);
      for (let d = 1; d <= dim; d++) {
        const date = new Date(year, m, d);
        if (date > now) continue;
        const dateStr = formatDate(date);
        const dayData = data[dateStr];
        if (!dayData) continue;

        if (habitFilter) {
          if (dayData[habitFilter] !== undefined) {
            totalTracked++;
            if (dayData[habitFilter] === 1) totalDone++;
          }
        } else {
          const values = Object.values(dayData);
          if (values.length) {
            totalTracked++;
            if (values.some((v) => v === 1)) totalDone++;
          }
        }
      }
    }
    return { totalDone, totalTracked };
  }, [year, data, habitFilter]);

  return (
    <View>
      <NavHeader
        title={`${year}`}
        onPrev={() => setYear(year - 1)}
        onNext={() => setYear(year + 1)}
      />

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: C.card }]}>
          <Text style={[styles.summaryLabel, { color: C.text4 }]}>Выполнено</Text>
          <Text style={[styles.summaryValue, { color: C.green }]}>
            {yearStats.totalDone}{' '}
            <Text style={[styles.summaryUnit, { color: C.text4 }]}>дней</Text>
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: C.card }]}>
          <Text style={[styles.summaryLabel, { color: C.text4 }]}>Затрекано</Text>
          <Text style={[styles.summaryValue, { color: C.text0 }]}>
            {yearStats.totalTracked}{' '}
            <Text style={[styles.summaryUnit, { color: C.text4 }]}>дней</Text>
          </Text>
        </View>
      </View>

      {yearStats.totalTracked === 0 && (
        <View style={[styles.emptyHint, { backgroundColor: C.card }]}>
          <Text style={[styles.emptyEmoji]}>📊</Text>
          <Text style={[styles.emptyText, { color: C.text3 }]}>
            Нет данных за {year} год
          </Text>
          <Text style={[styles.emptySubtext, { color: C.text4 }]}>
            Начни с чек-ина на главной
          </Text>
        </View>
      )}

      {/* Month cards */}
      <View style={styles.monthsList}>
        {Array.from({ length: 12 }, (_, m) => (
          <Animated.View key={m} entering={FadeInUp.delay(m * 40).duration(300)}>
            <MonthCard
              year={year}
              month={m}
              habitFilter={habitFilter}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goMonth(m); }}
            />
          </Animated.View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: DONE_COLOR }]} />
          <Text style={[styles.legendText, { color: C.text3 }]}>Выполнено</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.emptyCell }]} />
          <Text style={[styles.legendText, { color: C.text3 }]}>Пропуск</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: DONE_COLOR },
            ]}
          />
          <Text style={[styles.legendText, { color: C.text3 }]}>Сегодня</Text>
        </View>
      </View>
    </View>
  );
}

const MonthCard = memo(function MonthCard({
  year,
  month,
  habitFilter,
  onPress,
}: {
  year: number;
  month: number;
  habitFilter: string | null;
  onPress: () => void;
}) {
  const C = useThemeStore((s) => s.colors);
  const data = useCheckinsStore((s) => s.data);
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth();
  const isPast = year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth());

  const dim = daysInMonth(year, month);
  const firstDow = dayOfWeek(new Date(year, month, 1));

  const { cells, doneCount, trackedCount } = useMemo(() => {
    const cells: Array<{ day: number; status: DayStatus; today: boolean } | null> = [];
    let done = 0;
    let tracked = 0;

    // Empty cells before first day
    for (let i = 0; i < firstDow; i++) cells.push(null);

    for (let d = 1; d <= dim; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDate(date);
      const dayData = data[dateStr];
      const today = isToday(date);
      let status: DayStatus = null;

      if (dayData) {
        if (habitFilter) {
          const v = dayData[habitFilter];
          if (v !== undefined) {
            tracked++;
            status = v === 1 ? 'all' : 'none';
            if (v === 1) done++;
          }
        } else {
          const values = Object.values(dayData);
          if (values.length) {
            tracked++;
            const doneVals = values.filter((v) => v === 1).length;
            if (doneVals === values.length) {
              status = 'all';
              done++;
            } else if (doneVals > 0) {
              status = 'partial';
              done++;
            } else {
              status = 'none';
            }
          }
        }
      }

      cells.push({ day: d, status, today });
    }

    // Pad to complete weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return { cells, doneCount: done, trackedCount: tracked };
  }, [year, month, data, habitFilter]);

  const pct = trackedCount > 0 ? Math.round((doneCount / trackedCount) * 100) : null;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.monthCard,
        {
          backgroundColor: C.card,
          borderColor: isCurrent ? C.green : 'transparent',
          borderWidth: 2,
          opacity: isPast ? 1 : 0.4,
        },
      ]}
    >
      <View style={styles.monthHeader}>
        <View style={styles.monthTitle}>
          <Text style={[styles.monthName, { color: isCurrent ? C.green : C.text0 }]}>
            {MONTH_NAMES_RU[month]}
          </Text>
          {pct !== null && (
            <View
              style={[
                styles.pctBadge,
                {
                  backgroundColor:
                    pct >= 70 ? C.greenLight : pct >= 40 ? 'rgba(232,201,74,0.12)' : C.segBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.pctText,
                  {
                    color: pct >= 70 ? C.green : pct >= 40 ? '#E8C94A' : '#AEAEB2',
                  },
                ]}
              >
                {pct}%
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.text4} />
      </View>

      {/* Mini heatmap */}
      <View style={styles.heatmapGrid}>
        {WEEKDAYS_SHORT_RU.map((d) => (
          <Text key={d} style={[styles.weekdayLabel, { color: C.text5 }]}>
            {d[0]}
          </Text>
        ))}
        {cells.map((c, i) =>
          c ? (
            <HeatmapCell key={i} status={c.status} isToday={c.today} size={14} borderRadius={3} />
          ) : (
            <View key={i} style={styles.emptyCell} />
          )
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 14,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  monthsList: {
    gap: 8,
  },
  monthCard: {
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 14,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthName: {
    fontSize: 15,
    fontWeight: '700',
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  weekdayLabel: {
    width: 14,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '600',
    paddingBottom: 2,
  },
  emptyCell: {
    width: 14,
    height: 14,
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
  emptyHint: {
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
  },
});
