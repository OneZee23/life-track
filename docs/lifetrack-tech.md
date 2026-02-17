# LifeTrack — Техническое решение

> **Версия:** 2.0 (бинарная система)  
> **К PRD:** v3.0  
> **Обновлено:** Февраль 2026

---

## 1. Архитектура

### 1.1. Обзор

Offline-first мобильное приложение. Бинарный трекинг: value = 0 или 1. Вся логика и данные на устройстве.

```
┌─────────────────────────────────────────────┐
│                 UI Layer                     │
│  CheckIn │ Progress │ Habits │ Settings     │
├─────────────────────────────────────────────┤
│              State (Zustand)                 │
│  habits[] │ checkins{} │ theme              │
├─────────────────────────────────────────────┤
│          Storage (expo-sqlite)               │
│  habits │ checkins │ preferences            │
└─────────────────────────────────────────────┘
```

### 1.2. Стек

| Слой | Технология | Зачем |
|------|-----------|-------|
| Runtime | React Native + Expo SDK 54+ | New Architecture (Fabric, Hermes) |
| Язык | TypeScript | Типизация |
| State | Zustand | Минимальный бойлерплейт, persist |
| Хранение | expo-sqlite | Быстрые запросы по датам |
| Анимации | react-native-reanimated 4 | Spring-easing, layout animations |
| Жесты | react-native-gesture-handler | Tap, drag для reorder |
| Haptic | expo-haptics | Тактильный фидбек при тапе |
| Навигация | Expo Router | File-based routing |
| Сборка | EAS Build | Облачная компиляция |

### 1.3. Структура проекта

```
lifetrack/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab navigator
│   │   ├── checkin.tsx         # Бинарный чек-ин
│   │   ├── progress.tsx        # Прогресс (drill-down)
│   │   └── habits.tsx          # Управление привычками
│   └── _layout.tsx             # Root layout + providers
├── components/
│   ├── HabitToggle.tsx         # Карточка-переключатель ✓/—
│   ├── HeatmapCell.tsx         # Ячейка heatmap
│   ├── ProgressYear.tsx
│   ├── ProgressMonth.tsx
│   ├── ProgressWeek.tsx
│   ├── ProgressDay.tsx
│   ├── Settings.tsx            # Bottom sheet
│   └── ui/
│       ├── Chip.tsx
│       ├── NavHeader.tsx
│       └── BackBtn.tsx
├── store/
│   ├── useHabits.ts
│   ├── useCheckins.ts
│   └── useTheme.ts
├── db/
│   ├── schema.ts
│   ├── migrations.ts
│   └── queries.ts
├── utils/
│   ├── dates.ts
│   └── constants.ts
└── types/
    └── index.ts
```

---

## 2. Модель данных

### 2.1. SQLite Schema

```sql
CREATE TABLE habits (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    emoji       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Бинарные чек-ины: value = 0 (пропуск) или 1 (делал)
CREATE TABLE checkins (
    id          TEXT PRIMARY KEY,
    habit_id    TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,              -- 'YYYY-MM-DD'
    value       INTEGER NOT NULL CHECK (value IN (0, 1)),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(habit_id, date)
);

CREATE TABLE preferences (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL
);

CREATE INDEX idx_checkins_date ON checkins(date);
CREATE INDEX idx_checkins_habit_date ON checkins(habit_id, date);
```

**Примечание:** Схема поддерживает потенциальное расширение до шкалы (CHECK constraint можно изменить), но в MVP value строго 0 или 1.

### 2.2. TypeScript интерфейсы

```typescript
interface Habit {
    id: string;
    name: string;
    emoji: string;
    sortOrder: number;
}

interface Checkin {
    id: string;
    habitId: string;
    date: string;          // 'YYYY-MM-DD'
    value: 0 | 1;          // Бинарный: пропуск или делал
}

interface DayData {
    date: string;
    checkins: Record<string, 0 | 1>;  // habitId → 0|1
    doneCount: number;
    totalCount: number;
}

// Состояние дня для heatmap
type DayStatus = 
    | null              // нет данных / будущее
    | 'all'             // все привычки ✓
    | 'partial'         // часть ✓
    | 'none';           // ничего не делал
```

### 2.3. Zustand Stores

```typescript
// useCheckins.ts
interface CheckinsStore {
    data: Record<string, Record<string, 0 | 1>>;  // date → habitId → 0|1
    toggle: (date: string, habitId: string) => void;
    save: (date: string, values: Record<string, boolean>) => void;
    getDay: (date: string) => Record<string, 0 | 1>;
    getDayStatus: (date: string, habitId?: string) => DayStatus;
}

// useHabits.ts
interface HabitsStore {
    habits: Habit[];
    add: (name: string, emoji: string) => void;
    update: (id: string, patch: Partial<Habit>) => void;
    remove: (id: string) => void;
    reorder: (fromIdx: number, toIdx: number) => void;
}

// useTheme.ts
interface ThemeStore {
    dark: boolean;
    toggle: () => void;
}
```

---

## 3. Ключевые компоненты

### 3.1. HabitToggle — карточка-переключатель

Самый важный компонент. Один тап = переключение. Должен ощущаться как iOS switch.

```typescript
const HabitToggle = ({ habit, done, onToggle }: Props) => {
    const scale = useSharedValue(1);
    const bgColor = useSharedValue(done ? DONE_BG : CARD_BG);

    const gesture = Gesture.Tap()
        .onBegin(() => {
            scale.value = withSpring(0.97);
        })
        .onFinalize(() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 200 });
            runOnJS(onToggle)();
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        });

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: withTiming(done ? DONE_BG : CARD_BG, { duration: 250 }),
    }));

    const checkStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(done ? 1 : 0.8) }],
        backgroundColor: withTiming(done ? GREEN : 'transparent', { duration: 200 }),
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={cardStyle}>
                <EmojiIcon emoji={habit.emoji} active={done} />
                <Text>{habit.name}</Text>
                <Animated.View style={checkStyle}>
                    {done ? <CheckIcon /> : <DashText />}
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
};
```

**Ключевые решения:**
- `Gesture.Tap()` — мгновенный отклик, без задержки 300ms
- `withSpring` для bounce-эффекта при отпускании
- `withTiming` 250ms для плавного перехода цвета
- Haptic Light — не перегружает, но ощутим
- Галочка: `entering={ZoomIn}` из Reanimated layout animations

### 3.2. HeatmapCell — ячейка прогресса

```typescript
const HeatmapCell = ({ date, status }: Props) => {
    const today = isToday(date);

    // Бинарная палитра
    const bg = today ? 'transparent'
        : status === 'all' ? GREEN
        : status === 'partial' ? GREEN_70  // 70% opacity
        : EMPTY;

    return (
        <Animated.View style={{
            backgroundColor: bg,
            borderWidth: today ? 1.5 : 0,
            borderColor: GREEN,
        }}>
            {today && <PulseAnimation />}
        </Animated.View>
    );
};
```

### 3.3. Settings — Bottom Sheet

Минималистичный: тема (toggle) + соцсети (Telegram, Threads) + версия.

---

## 4. Работа с данными

### 4.1. Запись чек-ина

```typescript
async function saveCheckin(date: string, values: Record<string, boolean>) {
    const db = await getDB();
    await db.withTransactionAsync(async () => {
        for (const [habitId, done] of Object.entries(values)) {
            await db.runAsync(
                `INSERT OR REPLACE INTO checkins (id, habit_id, date, value)
                 VALUES (?, ?, ?, ?)`,
                [uuid(), habitId, date, done ? 1 : 0]
            );
        }
    });
}
```

### 4.2. Запрос дня

```typescript
async function getDayStatus(
    date: string, habitId?: string
): Promise<DayStatus> {
    const db = await getDB();

    const rows = habitId
        ? await db.getAllAsync(
            'SELECT value FROM checkins WHERE date = ? AND habit_id = ?',
            [date, habitId]
          )
        : await db.getAllAsync(
            'SELECT value FROM checkins WHERE date = ?', [date]
          );

    if (!rows.length) return null;

    const done = rows.filter(r => r.value === 1).length;
    if (done === rows.length) return 'all';
    if (done > 0) return 'partial';
    return 'none';
}
```

### 4.3. Streak-подсчёт

```typescript
function calculateStreak(days: DayData[]): { current: number; best: number } {
    let current = 0, best = 0, streak = 0;

    for (const day of days.reverse()) {
        if (isToday(day.date)) continue; // Сегодня не считаем
        if (day.doneCount > 0) {
            streak++;
            best = Math.max(best, streak);
        } else {
            streak = 0;
        }
    }
    current = streak;
    return { current, best };
}
```

---

## 5. Навигация

Expo Router (file-based). Drill-down в прогрессе — через внутренний state.

```typescript
// app/(tabs)/_layout.tsx
export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="checkin" options={{ title: "Чек-ин" }} />
            <Tabs.Screen name="progress" options={{ title: "Прогресс" }} />
            <Tabs.Screen name="habits" options={{ title: "Привычки" }} />
        </Tabs>
    );
}
```

---

## 6. Темизация

Бинарная палитра: один акцентный цвет (iOS Green #34C759) + серый для пропуска.

```typescript
const themes = {
    light: {
        bg: '#F2F2F7', card: '#FFFFFF',
        text0: '#000000', text3: '#8E8E93',
        green: '#34C759', greenLight: '#E8F9ED',
        emptyCell: '#EBEBF0',
        // ...
    },
    dark: {
        bg: '#000000', card: '#1C1C1E',
        text0: '#FFFFFF', text3: '#8E8E93',
        green: '#34C759', greenLight: 'rgba(52,199,89,0.15)',
        emptyCell: '#2C2C2E',
        // ...
    }
};
```

---

## 7. Миграция с прототипа

### Что упростилось (vs v7 слайдер)

| Было (v7) | Стало (v8) |
|-----------|-----------|
| SegSlider — 150 строк, Pan gesture, snap, spring | HabitToggle — 40 строк, Tap gesture |
| 6 цветов × 2 темы = 12 палитр | 1 зелёный + 1 серый |
| Градиент с 6 стопами | Нет градиента |
| Лейблы в треке (—/BAD/MEH/OK/GOOD/MAX) | Нет |
| 6-уровневая система + маппинг | Boolean true/false |
| Average-вычисления (float) | Count done / total (int) |

### Оценка трудозатрат

| Задача | Оценка | Неделя |
|--------|--------|--------|
| Expo + TS + навигация | 2ч | 1 |
| SQLite: схема, CRUD | 3ч | 1 |
| Zustand stores | 2ч | 1 |
| HabitToggle (Reanimated + tap) | 3ч | 1 |
| CheckIn экран | 3ч | 2 |
| Progress: Year + heatmap | 5ч | 2 |
| Progress: Month + calendar | 4ч | 2 |
| Progress: Week + Day | 3ч | 3 |
| Habits: CRUD + drag & drop | 4ч | 3 |
| Settings + theme | 2ч | 3 |
| Haptic + polish + тесты | 6ч | 4 |
| EAS Build + submit | 4ч | 4 |
| **Итого** | **~41ч** | **4 недели** |

Бинарная система сократила оценку с ~55ч до ~41ч за счёт простоты слайдера и отсутствия градиентов.

---

## 8. Открытые вопросы

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | Apple Developer Account из РФ | Google Play параллельно |
| 2 | Редактирование прошлых дней | v1.1 — за последние 7 дней |
| 3 | Расширение до шкалы | v2 — опциональный «продвинутый режим» |
| 4 | Sync при потере телефона | v2 — онлайн-синхронизация |

---

> Документ описывает архитектуру MVP. Обновляется по мере реализации.
