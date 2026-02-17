# LifeTrack — Техническое решение

> **Версия:** 2.1 (бинарная система)
> **К PRD:** v3.0
> **Статус:** v0.1.0 MVP — реализовано
> **Обновлено:** Февраль 2026

---

## 1. Архитектура

### 1.1. Обзор

Offline-first мобильное приложение. Бинарный трекинг: value = 0 или 1. Вся логика и данные на устройстве. Подготовлено к будущей онлайн-синхронизации (updated_at, device_id).

```
┌─────────────────────────────────────────────┐
│                 UI Layer                     │
│  CheckIn │ Progress │ Habits │ Settings     │
├─────────────────────────────────────────────┤
│              State (Zustand v5)              │
│  habits[] │ checkins{} │ theme              │
├─────────────────────────────────────────────┤
│          Storage (expo-sqlite)               │
│  habits │ checkins │ preferences            │
│  Migrations: v1 → v2 → v3                  │
└─────────────────────────────────────────────┘
```

### 1.2. Стек

| Слой | Технология | Зачем |
|------|-----------|-------|
| Runtime | React Native + Expo SDK 52 | New Architecture (Fabric, Hermes) |
| Язык | TypeScript | Типизация |
| State | Zustand v5 | Минимальный бойлерплейт |
| Хранение | expo-sqlite | Быстрые запросы по датам |
| Анимации | react-native-reanimated 3 | Spring-easing, layout animations |
| Жесты | react-native-gesture-handler | Tap, Pan, drag для reorder |
| Haptic | expo-haptics | Тактильный фидбек при тапе |
| Навигация | Expo Router | File-based routing |
| Drag & Drop | react-native-draggable-flatlist | Reorder привычек |
| Сборка | EAS Build | Облачная компиляция |

### 1.3. Структура проекта

```
lifetrack/
├── app/
│   ├── _layout.tsx              # Root layout + SQLite provider + StoreInitializer
│   ├── index.tsx                # Entry → redirect to /(tabs)/checkin
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator (checkin, progress, habits)
│       ├── checkin.tsx          # Бинарный чек-ин + confetti + settings
│       ├── progress.tsx         # Drill-down прогресс + swipe + filters
│       └── habits.tsx           # CRUD + drag & drop reorder
├── components/
│   ├── HabitToggle.tsx          # Карточка-переключатель (tap + spring)
│   ├── HeatmapCell.tsx          # Ячейка heatmap (green/gray/pulse)
│   ├── ProgressYear.tsx         # 12 месячных карточек
│   ├── ProgressMonth.tsx        # Календарная сетка + streaks
│   ├── ProgressWeek.tsx         # Разбивка по привычкам
│   ├── ProgressDay.tsx          # Детальный вид дня
│   ├── Settings.tsx             # О проекте, обратная связь, тема, ссылки
│   ├── Confetti.tsx             # Анимация при сохранении
│   └── ui/
│       ├── Chip.tsx             # Фильтр-чип (dimmed + dismiss для удаленных)
│       ├── NavHeader.tsx        # Заголовок экрана
│       └── BackBtn.tsx          # Кнопка назад
├── store/
│   ├── useHabits.ts             # habits[] + allHabits[] + CRUD + soft-delete
│   ├── useCheckins.ts           # data{} + toggle + saveDay + loadDateRange
│   └── useTheme.ts              # dark/light + colors palette
├── db/
│   ├── schema.ts                # SQL определения таблиц
│   ├── migrations.ts            # Версионные миграции (v1-v3)
│   └── queries.ts               # Все SQL-запросы с updated_at
├── utils/
│   ├── dates.ts                 # Русская локализация дат
│   └── constants.ts             # Цвета, темы, эмодзи, дефолты
└── types/
    └── index.ts                 # Habit, Checkin, DayData, DayStatus
```

---

## 2. Модель данных

### 2.1. SQLite Schema (v3)

```sql
CREATE TABLE habits (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    emoji       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at  TEXT DEFAULT NULL              -- v2: soft-delete
);

CREATE TABLE checkins (
    id          TEXT PRIMARY KEY,
    habit_id    TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,                 -- 'YYYY-MM-DD'
    value       INTEGER NOT NULL CHECK (value IN (0, 1)),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),  -- v3: sync prep
    UNIQUE(habit_id, date)
);

CREATE TABLE preferences (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL
    -- Хранит: 'theme' (light/dark), 'device_id' (UUID для будущей синхронизации)
);

CREATE INDEX idx_checkins_date ON checkins(date);
CREATE INDEX idx_checkins_habit_date ON checkins(habit_id, date);
```

### 2.2. Миграции

| Версия | Изменения |
|--------|-----------|
| v1 | Создание таблиц (habits, checkins, preferences) + seed 5 дефолтных привычек |
| v2 | `ALTER TABLE habits ADD COLUMN deleted_at` — soft-delete для сохранения истории |
| v3 | `ALTER TABLE checkins ADD COLUMN updated_at` + генерация `device_id` в preferences |

Версионирование через `PRAGMA user_version`. Миграции идемпотентны и последовательны.

**Подготовка к синхронизации (v3):**
- `updated_at` на checkins — для определения последнего изменения (last-write-wins)
- `device_id` — для идентификации устройства при мерже данных
- Все мутации (upsertCheckin, deleteHabit, reorderHabits) устанавливают updated_at

### 2.3. TypeScript интерфейсы

```typescript
interface Habit {
    id: string;
    name: string;
    emoji: string;
    sortOrder: number;
    deleted?: boolean;        // true для soft-deleted привычек
}

interface Checkin {
    id: string;
    habitId: string;
    date: string;             // 'YYYY-MM-DD'
    value: 0 | 1;
}

interface DayData {
    date: string;
    checkins: Record<string, 0 | 1>;  // habitId → 0|1
    doneCount: number;
    totalCount: number;
}

type DayStatus =
    | null              // нет данных / будущее
    | 'all'             // все привычки done
    | 'partial'         // часть done
    | 'none';           // ничего не делал
```

### 2.4. Zustand Stores

```typescript
// useHabits.ts — два списка: активные и все (включая удаленные)
interface HabitsStore {
    habits: Habit[];          // только активные (для чек-ина)
    allHabits: Habit[];       // все включая deleted (для прогресса)
    loadFromDb: () => Promise<void>;
    add: (name: string, emoji: string) => Promise<void>;
    update: (id: string, patch: Partial<Habit>) => Promise<void>;
    remove: (id: string) => Promise<void>;       // soft-delete
    reorder: (from: number, to: number) => void;  // optimistic + revert on error
}

// useCheckins.ts — данные чек-инов с батч-сохранением
interface CheckinsStore {
    data: Record<string, Record<string, 0 | 1>>;
    toggle: (date: string, habitId: string) => void;   // optimistic UI
    saveDay: (date: string, values: Record<string, 0 | 1>) => Promise<void>;  // Promise.all
    loadDate: (date: string) => Promise<void>;
    loadDateRange: (from: string, to: string) => Promise<void>;
    getDayStatus: (date: string, habitId?: string) => DayStatus;
}

// useTheme.ts — тема с персистом в preferences
interface ThemeStore {
    dark: boolean;
    colors: Theme;
    toggle: () => void;
    loadFromDb: () => Promise<void>;
}
```

---

## 3. Ключевые компоненты

### 3.1. HabitToggle — карточка-переключатель

Один тап = переключение. Spring-анимация + haptic.

```typescript
const HabitToggle = ({ habit, done, onToggle }: Props) => {
    // Gesture.Tap() — мгновенный отклик, без задержки 300ms
    // scale(0.97) при нажатии, withSpring при отпускании
    // withTiming 250ms для перехода цвета
    // Haptic Light при каждом тапе
    // Галочка: pop-эффект (scale bounce)
};
```

### 3.2. Progress — drill-down + свайп

Навигация: Год → Месяц → Неделя → День. Реализована через внутренний state (level + выбранные period).

```typescript
// Свайп между периодами через Gesture.Pan
const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])     // порог горизонтального свайпа
    .failOffsetY([-15, 15])       // не конфликтует с вертикальным скроллом
    .onEnd((e) => {
        runOnJS(handleSwipeEnd)(e.translationX);  // UI thread → JS thread
    });
```

Фильтрация по привычкам:
- Активные привычки — обычные чипы
- Удаленные привычки — серые чипы (dimmed) с кнопкой dismiss
- Сортировка: активные первые, удаленные последние

### 3.3. Settings

ScrollView с секциями: "О проекте" (about card), "Обратная связь" (ссылка на @onezee123), "Ссылки" (TG канал, YouTube), версия.

---

## 4. Инициализация приложения

Трехэтапная загрузка в `_layout.tsx`:

```
1. SQLite Provider → runMigrations (v1 → v2 → v3)
2. StoreInitializer → theme.loadFromDb + habits.loadFromDb + checkins.loadDate
3. UI Ready → показываем экран чек-ина
```

StoreInitializer имеет:
- mounted guard (предотвращает повторную инициализацию)
- try-catch с логированием ошибок

---

## 5. Паттерны и решения

### 5.1. Optimistic Updates

- **toggle:** Немедленно обновляет UI, сохраняет в БД асинхронно
- **reorder:** Оптимистично переставляет, при ошибке — revert к предыдущему состоянию
- **saveDay:** `Promise.all` вместо последовательных awaits (fix N+1)

### 5.2. Soft-Delete

Привычки не удаляются из БД — ставится `deleted_at`. Это позволяет:
- Сохранять историю чек-инов удаленных привычек
- Показывать удаленные привычки в прогрессе (серые фильтр-чипы)
- Восстанавливать привычки в будущем

### 5.3. Подготовка к синхронизации

MVP полностью оффлайн, но схема готова к online-first синхронизации:
- `updated_at` на всех мутациях — last-write-wins при конфликтах
- `device_id` — идентификация устройства для мерж-логики
- Все мутации проходят через единые query-функции

---

## 6. Темизация

Бинарная палитра: один акцентный цвет (iOS Green #34C759) + серый для пропуска.

```typescript
const themes = {
    light: {
        bg: '#F2F2F7', card: '#FFFFFF',
        text0: '#000000', text3: '#8E8E93',
        green: '#34C759', greenBg: '#E8F9ED',
        emptyCell: '#EBEBF0',
    },
    dark: {
        bg: '#000000', card: '#1C1C1E',
        text0: '#FFFFFF', text3: '#8E8E93',
        green: '#34C759', greenBg: 'rgba(52,199,89,0.15)',
        emptyCell: '#2C2C2E',
    }
};
```

---

## 7. Сборка и деплой

```
EAS Build (cloud) → .ipa → EAS Submit → App Store Connect → App Review
```

| Конфиг | Значение |
|--------|----------|
| Bundle ID | co.onezee.lifetrack |
| EAS Project ID | a3e65c3b-1458-40e3-a543-87e45802fab3 |
| ASC App ID | 6759284836 |
| Build profile | production (autoIncrement) |
| Min iOS | 15.0 |

---

## 8. Открытые вопросы

| # | Вопрос | Статус |
|---|--------|--------|
| 1 | Онлайн-синхронизация | Схема готова (updated_at, device_id). Реализация в v0.2.0 |
| 2 | Редактирование прошлых дней | v0.2.0 — за последние 7 дней |
| 3 | Расширение до шкалы | v0.3.0 — опциональный "продвинутый режим" |
| 4 | Android | Билд и деплой в Google Play |

---

> MVP реализован и отправлен на ревью в App Store (февраль 2026).
