# LifeTrack — Техническое решение

> **Версия:** 1.0  
> **Автор:** OneZee  
> **К PRD:** v2.0  
> **Обновлено:** Февраль 2026

---

## 1. Архитектура

### 1.1. Обзор

Приложение строится как **offline-first mobile app** на React Native + Expo. Вся логика и данные — на устройстве. Бэкенд появится в v2 исключительно для синхронизации.

```
┌─────────────────────────────────────────────┐
│                 UI Layer                     │
│  CheckIn │ Progress │ Habits │ Settings     │
├─────────────────────────────────────────────┤
│              State (Zustand)                 │
│  habits[] │ checkins{} │ theme │ settings   │
├─────────────────────────────────────────────┤
│          Storage (expo-sqlite)               │
│  habits │ checkins │ preferences            │
└─────────────────────────────────────────────┘
```

### 1.2. Стек

| Слой | Технология | Версия | Зачем |
|------|-----------|--------|-------|
| Runtime | React Native + Expo | SDK 54+ | New Architecture: Fabric, TurboModules, Hermes |
| Язык | TypeScript | 5.x | Типизация, DX |
| State | Zustand | 5.x | Минимальный бойлерплейт, persist middleware |
| Хранение | expo-sqlite | — | Структурированные данные, быстрые запросы по датам |
| Анимации | react-native-reanimated | 4.x | 60fps слайдер, snap-spring, layout animations |
| Жесты | react-native-gesture-handler | 2.x | Pan для слайдера, drag для reorder |
| Haptic | expo-haptics | — | Тактильный snap-фидбек |
| Навигация | React Navigation | 7.x | Tab + Stack навигация |
| Сборка | EAS Build | — | Облачная компиляция iOS/Android |

### 1.3. Структура проекта

```
lifetrack/
├── app/                        # Expo Router (file-based routing)
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab navigator
│   │   ├── checkin.tsx         # Экран чек-ина
│   │   ├── progress.tsx        # Экран прогресса
│   │   └── habits.tsx          # Управление привычками
│   └── _layout.tsx             # Root layout + providers
├── components/
│   ├── SegSlider.tsx           # Сегментированный слайдер 0–5
│   ├── HeatmapCell.tsx         # Ячейка heatmap (pulse для today)
│   ├── HabitCard.tsx           # Карточка привычки в чек-ине
│   ├── ProgressYear.tsx        # Годовой вид
│   ├── ProgressMonth.tsx       # Месячный вид
│   ├── ProgressWeek.tsx        # Недельный вид
│   ├── ProgressDay.tsx         # Детальный вид дня
│   ├── Settings.tsx            # Bottom sheet настроек
│   ├── Confetti.tsx            # Конфетти-анимация
│   └── ui/                     # Базовые компоненты
│       ├── Chip.tsx
│       ├── NavHeader.tsx
│       └── BackBtn.tsx
├── store/
│   ├── useHabits.ts            # Zustand store: привычки
│   ├── useCheckins.ts          # Zustand store: чек-ины
│   └── useTheme.ts             # Zustand store: тема
├── db/
│   ├── schema.ts               # SQLite таблицы
│   ├── migrations.ts           # Миграции
│   └── queries.ts              # CRUD-операции
├── utils/
│   ├── colors.ts               # 6-уровневая система цветов
│   ├── dates.ts                # Хелперы дат (склонение, week start)
│   └── constants.ts            # Дефолтные привычки, лейблы
└── types/
    └── index.ts                # TypeScript интерфейсы
```

---

## 2. Модель данных

### 2.1. SQLite Schema

```sql
-- Привычки пользователя
CREATE TABLE habits (
    id          TEXT PRIMARY KEY,           -- UUID
    name        TEXT NOT NULL,              -- Название (max 20 символов)
    emoji       TEXT NOT NULL,              -- Эмодзи
    sort_order  INTEGER NOT NULL DEFAULT 0, -- Порядок отображения
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ежедневные оценки
CREATE TABLE checkins (
    id          TEXT PRIMARY KEY,           -- UUID
    habit_id    TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,              -- ISO date: '2026-02-15'
    value       INTEGER NOT NULL CHECK (value >= 0 AND value <= 5),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(habit_id, date)                 -- Одна оценка на привычку в день
);

-- Пользовательские настройки
CREATE TABLE preferences (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL
);

-- Индексы для быстрых запросов по прогрессу
CREATE INDEX idx_checkins_date ON checkins(date);
CREATE INDEX idx_checkins_habit_date ON checkins(habit_id, date);
```

### 2.2. TypeScript интерфейсы

```typescript
interface Habit {
    id: string;
    name: string;
    emoji: string;
    sortOrder: number;
    createdAt: string;
}

interface Checkin {
    id: string;
    habitId: string;
    date: string;          // 'YYYY-MM-DD'
    value: 0 | 1 | 2 | 3 | 4 | 5;
    createdAt: string;
}

interface DayData {
    date: string;
    checkins: Record<string, number>;   // habitId → value
    average: number | null;
}

// 6-уровневая система
interface Level {
    value: number;
    label: string;         // Пропуск, Слабо, Так себе, Норм, Хорошо, Огонь
    zoneLabel: string;     // —, BAD, MEH, OK, GOOD, MAX
    color: string;
    bg: string;
}
```

### 2.3. Zustand Stores

```typescript
// useCheckins.ts — persist to SQLite
interface CheckinsStore {
    data: Record<string, Record<string, number>>;  // date → habitId → value
    save: (date: string, habitId: string, value: number) => void;
    getDay: (date: string) => Record<string, number>;
    getRange: (from: string, to: string) => DayData[];
    getAvg: (date: string, habitId?: string) => number | null;
}

// useHabits.ts — persist to SQLite
interface HabitsStore {
    habits: Habit[];
    add: (name: string, emoji: string) => void;
    update: (id: string, patch: Partial<Habit>) => void;
    remove: (id: string) => void;
    reorder: (fromIdx: number, toIdx: number) => void;
}

// useTheme.ts — persist to AsyncStorage
interface ThemeStore {
    dark: boolean;
    toggle: () => void;
}
```

---

## 3. Ключевые компоненты

### 3.1. SegSlider — Сегментированный слайдер

Самый критичный компонент по UX. Требует 60fps.

**Реализация (Reanimated + Gesture Handler):**

```typescript
// Архитектурный скелет — не финальный код
const SegSlider = ({ value, onChange }: Props) => {
    const translateX = useSharedValue(0);
    const isDragging = useSharedValue(false);

    const gesture = Gesture.Pan()
        .onStart(() => { isDragging.value = true; })
        .onUpdate((e) => {
            // Вычисление snap-позиции на UI thread
            const raw = e.x / trackWidth;
            const snapped = Math.round(raw * 5);
            translateX.value = (snapped / 5) * (trackWidth - thumbW);
            runOnJS(onChange)(snapped);
            runOnJS(triggerHaptic)();
        })
        .onEnd(() => {
            // Spring-easing при отпускании
            isDragging.value = false;
            translateX.value = withSpring(translateX.value, {
                damping: 15, stiffness: 200
            });
        });

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <View>
                {/* Gradient track */}
                <LinearGradient colors={GRADIENT_STOPS} />
                {/* Zone labels */}
                {ZONE_LABELS.map((label, i) => (
                    <Animated.Text key={i} /* fade when thumb overlaps */ />
                ))}
                {/* Thumb */}
                <Animated.View style={thumbStyle}>
                    <Text>{value}</Text>
                </Animated.View>
            </View>
        </GestureDetector>
    );
};
```

**Ключевые решения:**
- Все вычисления snap-позиции — на UI thread (worklet) через Reanimated
- `withSpring` для easing при snap (damping: 15, stiffness: 200 — лёгкий overshoot)
- Haptic через `runOnJS` на каждый snap
- Лейблы прячутся через `opacity` animated value, не через re-render

### 3.2. HeatmapCell — Ячейка прогресса

```typescript
const HeatmapCell = ({ date, value }: Props) => {
    const today = isToday(date);
    const level = value != null ? getLevel(value) : null;

    return (
        <Animated.View style={{
            backgroundColor: today ? emptyColor : (level?.color ?? emptyColor),
            borderWidth: today ? 2 : 0,
            borderColor: today ? GREEN : 'transparent',
        }}>
            {/* Pulse animation for today */}
            {today && <PulseAnimation />}
        </Animated.View>
    );
};
```

**Pulse-анимация для сегодняшнего дня:**
- Reanimated `withRepeat(withSequence(...))` — плавная пульсация border opacity
- Частота: 2 секунды, бесконечный repeat
- Цвет: зелёный акцент (#3BAA6B)

### 3.3. Settings — Bottom Sheet

```typescript
// Используем @gorhom/bottom-sheet или нативную реализацию
const Settings = () => {
    const { dark, toggle } = useTheme();

    return (
        <BottomSheet>
            {/* Тёмная тема */}
            <SettingsRow
                icon={dark ? "🌙" : "☀️"}
                label="Тёмная тема"
                right={<Switch value={dark} onValueChange={toggle} />}
            />
            {/* Соцсети */}
            <SectionHeader>Мы в соцсетях</SectionHeader>
            <LinkRow icon="✈️" label="Telegram" sub="@lifetrack_app" />
            <LinkRow icon="📷" label="Threads" sub="@lifetrack" />
            {/* Версия */}
            <VersionLabel>LifeTrack v1.0</VersionLabel>
        </BottomSheet>
    );
};
```

---

## 4. Навигация

```typescript
// app/(tabs)/_layout.tsx — Expo Router
export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="checkin" options={{
                title: "Чек-ин",
                tabBarIcon: CheckinIcon,
            }} />
            <Tabs.Screen name="progress" options={{
                title: "Прогресс",
                tabBarIcon: ProgressIcon,
            }} />
            <Tabs.Screen name="habits" options={{
                title: "Привычки",
                tabBarIcon: HabitsIcon,
            }} />
        </Tabs>
    );
}
```

Drill-down в прогрессе — через внутренний state (не через роутинг), как в текущем прототипе. Это проще и быстрее, чем stack-навигация для каждого уровня.

---

## 5. Работа с данными

### 5.1. Запись чек-ина

```typescript
async function saveCheckin(date: string, values: Record<string, number>) {
    const db = await getDB();
    await db.withTransactionAsync(async () => {
        for (const [habitId, value] of Object.entries(values)) {
            await db.runAsync(
                `INSERT OR REPLACE INTO checkins (id, habit_id, date, value)
                 VALUES (?, ?, ?, ?)`,
                [uuid(), habitId, date, value]
            );
        }
    });
}
```

### 5.2. Запрос прогресса за год

```typescript
async function getYearData(year: number, habitId?: string) {
    const db = await getDB();
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;

    if (habitId) {
        return db.getAllAsync(
            `SELECT date, value FROM checkins
             WHERE habit_id = ? AND date BETWEEN ? AND ?
             ORDER BY date`,
            [habitId, from, to]
        );
    }

    // Средняя по всем привычкам
    return db.getAllAsync(
        `SELECT date, ROUND(AVG(value)) as value FROM checkins
         WHERE date BETWEEN ? AND ?
         GROUP BY date ORDER BY date`,
        [from, to]
    );
}
```

### 5.3. Streak-подсчёт

```typescript
function calculateStreak(days: DayData[]): { current: number; best: number } {
    let current = 0, best = 0, streak = 0;
    const today = formatDate(new Date());

    for (const day of days.reverse()) {
        if (day.average !== null && day.average >= 2) {
            streak++;
            best = Math.max(best, streak);
        } else {
            if (day.date === today) continue; // Сегодня — не считаем пропуском
            streak = 0;
        }
    }
    current = streak;
    return { current, best };
}
```

---

## 6. Темизация

### 6.1. Подход

React Context + Zustand persist. Тема переключается в настройках.

```typescript
const themes = {
    light: {
        bg: '#F2F2F7',
        card: '#FFFFFF',
        text0: '#000000',
        text1: '#1C1C1E',
        text2: '#3C3C43',
        text3: '#8E8E93',
        green: '#3BAA6B',
        blue: '#007AFF',
        sep: '#E5E5EA',
        gradient: 'linear-gradient(...)', // см. PRD Приложение А
        // ...
    },
    dark: {
        bg: '#000000',
        card: '#1C1C1E',
        text0: '#FFFFFF',
        text1: '#F2F2F7',
        text2: '#D1D1D6',
        text3: '#8E8E93',
        green: '#3BAA6B',
        blue: '#0A84FF',
        sep: '#2C2C2E',
        gradient: 'linear-gradient(...)',
        // ...
    }
};
```

### 6.2. Цветовая система — 6 уровней

```typescript
const LEVELS = [
    { value: 0, label: 'Пропуск',  zone: '—',    color: '#B0B8C1', bg: '#F0F1F3' },
    { value: 1, label: 'Слабо',    zone: 'BAD',   color: '#E8685A', bg: '#FDECEB' },
    { value: 2, label: 'Так себе', zone: 'MEH',   color: '#ED9A5A', bg: '#FDF2E9' },
    { value: 3, label: 'Норм',     zone: 'OK',    color: '#E8C94A', bg: '#FDF8E8' },
    { value: 4, label: 'Хорошо',   zone: 'GOOD',  color: '#6DC76D', bg: '#EBF7EB' },
    { value: 5, label: 'Огонь',    zone: 'MAX',   color: '#3BAA6B', bg: '#E6F5ED' },
];
```

---

## 7. Сборка и деплой

### 7.1. EAS Build

```json
// eas.json
{
    "build": {
        "development": {
            "developmentClient": true,
            "distribution": "internal"
        },
        "preview": {
            "distribution": "internal"
        },
        "production": {
            "autoIncrement": true
        }
    }
}
```

### 7.2. Команды

```bash
# Разработка
npx expo start --dev-client

# Preview build (тестирование)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production
eas build --platform all --profile production

# Публикация
eas submit --platform ios
eas submit --platform android
```

### 7.3. CI/CD

MVP: ручной запуск `eas build` + `eas submit`.

v1.1: GitHub Actions → автоматический build на push в main.

---

## 8. Миграция с прототипа

### 8.1. Что переносится 1:1

- Вся бизнес-логика (хуки, стейт, вычисления)
- 6-уровневая цветовая система
- Лейблы и текстовые константы
- User flows и навигационная структура

### 8.2. Что переписывается

| Прототип (React JSX) | Продакшен (React Native) |
|----------------------|--------------------------|
| `<div>` | `<View>` |
| `<span>` | `<Text>` |
| CSS `style={{...}}` | `StyleSheet.create()` |
| CSS `overflow: auto` | `<ScrollView>` / `<FlatList>` |
| CSS `linear-gradient` | `expo-linear-gradient` |
| Mouse events | Gesture Handler |
| CSS `@keyframes` | Reanimated animated values |
| `localStorage` | SQLite (expo-sqlite) |
| Drag HTML5 API | `react-native-gesture-handler` + Reanimated |

### 8.3. Оценка трудозатрат

| Задача | Оценка | Приоритет |
|--------|--------|-----------|
| Инициализация Expo + TypeScript + навигация | 2ч | Неделя 1 |
| SQLite: схема, миграции, CRUD | 4ч | Неделя 1 |
| Zustand stores (habits, checkins, theme) | 3ч | Неделя 1 |
| SegSlider (Reanimated + GestureHandler) | 8ч | Неделя 1-2 |
| CheckIn экран | 4ч | Неделя 2 |
| Progress: Year view + heatmap | 6ч | Неделя 2 |
| Progress: Month view + calendar | 4ч | Неделя 2-3 |
| Progress: Week + Day views | 4ч | Неделя 3 |
| Habits: CRUD + drag & drop | 4ч | Неделя 3 |
| Settings bottom sheet + theme | 3ч | Неделя 3 |
| Haptic feedback | 1ч | Неделя 3 |
| Polish, тестирование, баг-фиксы | 8ч | Неделя 4 |
| EAS Build + submit | 4ч | Неделя 4 |
| **Итого** | **~55ч** | **4 недели** |

При 2–4 часах в день → укладывается в 30-дневный Proof of Work Challenge.

---

## 9. Открытые вопросы

| # | Вопрос | Влияние | Решение |
|---|--------|---------|---------|
| 1 | Apple Developer Account из РФ | Блокирует iOS публикацию | Google Play параллельно, повторные заявки |
| 2 | Редактирование прошлых дней | Пока нельзя, только вчера | v1.1 — разрешить за последние 7 дней |
| 3 | Бэкап при удалении приложения | Данные теряются | v2 — онлайн-синхронизация |
| 4 | Offline-first sync в v2 | Конфликты при merge | CRDT или last-write-wins |

---

> Документ описывает архитектуру MVP. Обновляется по мере реализации.
