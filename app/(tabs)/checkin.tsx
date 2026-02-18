import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';
import { useHabitsStore } from '@/store/useHabits';
import { useCheckinsStore } from '@/store/useCheckins';
import { HabitToggle } from '@/components/HabitToggle';
import { Confetti } from '@/components/Confetti';
import { StreakCelebration } from '@/components/StreakCelebration';
import { Settings } from '@/components/Settings';
import { yesterday, monthGenitive, formatDate, WEEKDAYS_FULL_RU, dayOfWeek } from '@/utils/dates';

export default function CheckInScreen() {
  const C = useThemeStore((s) => s.colors);
  const habits = useHabitsStore((s) => s.habits);
  const loadDate = useCheckinsStore((s) => s.loadDate);
  const saveDay = useCheckinsStore((s) => s.saveDay);
  const getStreak = useCheckinsStore((s) => s.getStreak);
  const insets = useSafeAreaInsets();

  const [dateStr, setDateStr] = useState(() => formatDate(yesterday()));
  const y = yesterday();

  const [vals, setVals] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const streakShownRef = useRef(false);

  // Refresh date when tab gains focus (handles midnight / new day)
  useFocusEffect(
    useCallback(() => {
      const fresh = formatDate(yesterday());
      if (fresh !== dateStr) {
        setDateStr(fresh);
        setSaved(false);
        setLoaded(false);
      }
    }, [dateStr])
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const existing = await loadDate(dateStr);
        if (!mounted) return;
        const hasExisting = Object.keys(existing).length > 0;
        const initial: Record<string, boolean> = {};
        habits.forEach((h) => {
          initial[h.id] = hasExisting ? existing[h.id] === 1 : false;
        });
        setVals(initial);
        if (hasExisting) setSaved(true);
        setLoaded(true);
      } catch (e) {
        console.error('Failed to load checkins:', e);
      }
    })();
    return () => { mounted = false; };
  }, [dateStr, habits]);

  // Load streak on first mount and show celebration
  useEffect(() => {
    if (streakShownRef.current || !loaded) return;
    (async () => {
      const s = await getStreak();
      if (s >= 2 && !streakShownRef.current) {
        setStreak(s);
        setShowStreak(true);
        streakShownRef.current = true;
      } else {
        streakShownRef.current = true;
      }
    })();
  }, [loaded]);

  const toggle = useCallback((id: string) => {
    setVals((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const save = async () => {
    try {
      await saveDay(dateStr, vals);
      setSaved(true);
      setConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setConfetti(false), 3000);
    } catch (e) {
      console.error('Failed to save checkins:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const doneCount = Object.values(vals).filter(Boolean).length;
  const total = habits.length;
  const dayLabel = `${y.getDate()} ${monthGenitive(y.getMonth())}, ${WEEKDAYS_FULL_RU[dayOfWeek(y)].toLowerCase()}`;

  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withTiming(total > 0 ? (doneCount / total) * 100 : 0, { duration: 300 });
  }, [doneCount, total]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!loaded) return null;

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <Confetti active={confetti} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text0 }]}>Чек-ин</Text>
          <Text style={[styles.subtitle, { color: C.text3 }]}>{dayLabel}</Text>
        </View>
        <Pressable
          style={[styles.gearBtn, { backgroundColor: C.segBg }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSettingsOpen(true); }}
        >
          <Ionicons name="settings-outline" size={20} color={C.text3} />
        </Pressable>
      </View>

      {saved ? (
        /* ─── Saved state ─── */
        <ScrollView
          contentContainerStyle={styles.savedContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.savedCenter}>
            <View style={[styles.partyCircle, { backgroundColor: C.greenLight }]}>
              <Text style={styles.partyEmoji}>🎉</Text>
            </View>
            <Text style={[styles.savedTitle, { color: C.text0 }]}>
              День записан!
            </Text>
            <Text style={[styles.savedSub, { color: C.text4 }]}>
              Возвращайся завтра
            </Text>
          </Animated.View>

          {/* Score */}
          <View style={[styles.scoreCard, { backgroundColor: C.bg }]}>
            <Text style={[styles.scoreNum, { color: C.green }]}>
              {doneCount}
              <Text style={[styles.scoreTotal, { color: C.text4 }]}>
                /{total}
              </Text>
            </Text>
            <Text style={[styles.scoreLabel, { color: C.text3 }]}>
              привычек выполнено
            </Text>
          </View>

          {/* Habit chips */}
          <View style={styles.chips}>
            {habits.map((h) => {
              const d = vals[h.id];
              return (
                <View
                  key={h.id}
                  style={[
                    styles.chip,
                    { backgroundColor: d ? C.greenLight : C.segBg },
                  ]}
                >
                  <Text style={styles.chipEmoji}>{h.emoji}</Text>
                  <Text
                    style={[
                      styles.chipStatus,
                      { color: d ? C.green : C.text4 },
                    ]}
                  >
                    {d ? '✓' : '—'}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Edit button */}
          <Pressable
            style={styles.editBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSaved(false);
              setConfetti(false);
            }}
          >
            <Ionicons name="refresh-outline" size={14} color={C.text4} />
            <Text style={[styles.editLabel, { color: C.text4 }]}>
              Изменить
            </Text>
          </Pressable>
        </ScrollView>
      ) : (
        /* ─── Check-in state ─── */
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.habitsList}>
            {habits.map((h, i) => (
              <HabitToggle
                key={h.id}
                habit={h}
                done={vals[h.id] ?? false}
                onToggle={() => toggle(h.id)}
                index={i}
              />
            ))}
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: C.segBg }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { backgroundColor: C.green },
                  progressStyle,
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                { color: doneCount === total ? C.green : C.text3 },
              ]}
            >
              {doneCount}/{total}
            </Text>
          </View>

          {/* Done button */}
          <Pressable
            style={[styles.doneBtn, { backgroundColor: C.green }]}
            onPress={save}
          >
            <Text style={styles.doneBtnText}>Готово ✓</Text>
          </Pressable>
        </ScrollView>
      )}

      <Settings visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {showStreak && (
        <StreakCelebration streak={streak} onDismiss={() => setShowStreak(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  habitsList: {
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  doneBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  savedContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    alignItems: 'center',
  },
  savedCenter: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 8,
  },
  partyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  partyEmoji: {
    fontSize: 40,
  },
  savedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  savedSub: {
    fontSize: 13,
    marginBottom: 28,
  },
  scoreCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  scoreNum: {
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 56,
  },
  scoreTotal: {
    fontSize: 20,
    fontWeight: '600',
  },
  scoreLabel: {
    fontSize: 14,
    marginTop: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 24,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
