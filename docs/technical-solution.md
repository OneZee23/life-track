# LifeTrack — Техническое решение

> **Версия:** 1.0 MVP
> **Стек:** Expo SDK 54 + TypeScript + Zustand + Reanimated 4 + Gesture Handler + expo-haptics + expo-sqlite
> **Контекст:** Соло-разработка, 30 дней, $0 бюджет

---

## 1. Стек и обоснование

| Слой | Технология | Версия | Зачем |
|------|-----------|--------|-------|
| Runtime | Expo SDK | 54+ | Managed workflow, EAS Build, OTA-обновления |
| Язык | TypeScript | 5.x | Типизация, DX, NestJS-бэкграунд |
| Навигация | Expo Router | v4 | File-based routing, deep links из коробки, typed routes |
| Стейт | Zustand | 5.x | Минимальный API, без бойлерплейта, persist middleware |
| Анимации | Reanimated | 4.x | UI-thread анимации, 60fps слайдер, layout animations |
| Жесты | Gesture Handler | 2.x | Нативные жесты для слайдера, drag-and-drop |
| Haptic | expo-haptics | ~14.x | Тактильный фидбек при шагах слайдера |
| БД | expo-sqlite | ~15.x | Синхронный API, SQL-запросы по датам, надёжнее AsyncStorage |
| Иконки | Эмодзи | — | Нулевой размер бандла, нативный рендер |

### Что НЕ входит в стек MVP

| Технология | Причина исключения |
|-----------|-------------------|
| Redux / MobX | Оверкилл для локального стейта 3 экранов |
| React Query / SWR | Нет сетевых запросов в MVP |
| NativeWind / Tailwind | Добавляет сложность, styled components не нужны для 3 экранов |
| Firebase | Нулевая аналитика в MVP по PRD |
| i18n-библиотеки | Только русский в MVP, EN — v1.1 |

---

## 2. Архитектура

### 2.1. Принцип

**Local-first, offline-only.** Приложение не делает сетевых запросов. Все данные живут в SQLite на устройстве. Zustand хранит UI-стейт и гидрируется из SQLite при запуске.

```
┌─────────────────────────────────────────────┐
│                  UI Layer                    │
│  Expo Router (tabs) → Screens → Components  │
├─────────────────────────────────────────────┤
│               State Layer                    │
│         Zustand stores (in-memory)           │
│     habits / checkins / ui preferences       │
├─────────────────────────────────────────────┤
│            Persistence Layer                 │
│          expo-sqlite (on-device)             │
│    habits / checkins / settings tables       │
└─────────────────────────────────────────────┘
```

### 2.2. Поток данных

```
User Action → Zustand action → обновление стейта + запись в SQLite
App Launch  → SQLite read → гидрация Zustand stores → рендер UI
```

Однонаправленный поток. SQLite — источник правды при запуске. Zustand — источник правды в рантайме.

---

## 3. Структура проекта

```
life-track/
├── app/                          # Expo Router — файловый роутинг
│   ├── _layout.tsx               # Root layout (провайдеры, инициализация БД)
│   ├── (tabs)/                   # Tab-навигация
│   │   ├── _layout.tsx           # Tab bar конфигурация
│   │   ├── index.tsx             # Чек-ин (дефолтный таб)
│   │   ├── progress.tsx          # Прогресс
│   │   └── habits.tsx            # Управление привычками
│   └── +not-found.tsx            # 404
├── src/
│   ├── components/               # Переиспользуемые компоненты
│   │   ├── HabitSlider.tsx       # Слайдер 0–10 (Reanimated + GestureHandler)
│   │   ├── ContributionGrid.tsx  # GitHub-style сетка (год)
│   │   ├── MonthCalendar.tsx     # Месячный календарь
│   │   ├── WeekBar.tsx           # Недельные бары по привычкам
│   │   ├── HabitChips.tsx        # Фильтр-чипы по привычкам
│   │   ├── StreakCard.tsx        # Карточка серии
│   │   ├── EmojiPicker.tsx       # Выбор эмодзи из предустановленного набора
│   │   └── ProgressBar.tsx       # Прогресс-бар времени (год/месяц/неделя)
│   ├── stores/                   # Zustand stores
│   │   ├── useHabitStore.ts      # Привычки: CRUD, порядок
│   │   ├── useCheckinStore.ts    # Чек-ины: сохранение, запросы по датам
│   │   └── useUIStore.ts         # UI: активный фильтр, вид прогресса, тема
│   ├── db/                       # SQLite
│   │   ├── schema.ts             # Создание таблиц, миграции
│   │   ├── queries.ts            # Подготовленные SQL-запросы
│   │   └── seed.ts               # Дефолтные привычки при первом запуске
│   ├── lib/                      # Утилиты
│   │   ├── colors.ts             # Градиент value → color, маппинг диапазонов
│   │   ├── dates.ts              # Форматирование дат, вычисление streak
│   │   └── constants.ts          # Лимиты, эмодзи-набор, дефолтные привычки
│   └── types/                    # TypeScript типы
│       └── index.ts              # Habit, Checkin, CheckinEntry, ViewMode
├── assets/                       # Splash, icon
├── app.json                      # Expo конфигурация
├── tsconfig.json
├── package.json
└── docs/                         # Документация
    ├── lifetrack-prd.md
    ├── lifetrack-mvp.jsx
    └── technical-solution.md
```

---

## 4. Модель данных (SQLite)

### 4.1. Таблицы

```sql
-- Привычки пользователя
CREATE TABLE habits (
  id         TEXT PRIMARY KEY,           -- uuid
  emoji      TEXT NOT NULL,              -- эмодзи-символ
  name       TEXT NOT NULL,              -- название, max 20 chars
  sort_order INTEGER NOT NULL DEFAULT 0, -- порядок отображения
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT                         -- soft delete для сохранения истории
);

-- Ежедневные чек-ины
CREATE TABLE checkins (
  id         TEXT PRIMARY KEY,           -- uuid
  date       TEXT NOT NULL,              -- 'YYYY-MM-DD', всегда вчерашняя дата
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Оценки по каждой привычке в чек-ине
CREATE TABLE checkin_entries (
  id         TEXT PRIMARY KEY,           -- uuid
  checkin_id TEXT NOT NULL REFERENCES checkins(id),
  habit_id   TEXT NOT NULL REFERENCES habits(id),
  value      INTEGER NOT NULL CHECK (value >= 0 AND value <= 10),
  UNIQUE(checkin_id, habit_id)
);

-- Настройки приложения (key-value)
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Индексы для быстрых запросов по датам
CREATE UNIQUE INDEX idx_checkins_date ON checkins(date);
CREATE INDEX idx_entries_checkin ON checkin_entries(checkin_id);
CREATE INDEX idx_entries_habit ON checkin_entries(habit_id);
CREATE INDEX idx_entries_habit_checkin ON checkin_entries(habit_id, checkin_id);
```

### 4.2. Ключевые запросы

```sql
-- Проверка: есть ли чек-ин за вчера?
SELECT id FROM checkins WHERE date = ?;

-- Годовой вид: все оценки за год (одним запросом)
SELECT c.date, ce.habit_id, ce.value
FROM checkins c
JOIN checkin_entries ce ON ce.checkin_id = c.id
WHERE c.date BETWEEN ? AND ?
ORDER BY c.date;

-- Средняя оценка по дням за диапазон (для сетки без фильтра)
SELECT c.date, ROUND(AVG(ce.value), 1) as avg_value
FROM checkins c
JOIN checkin_entries ce ON ce.checkin_id = c.id
WHERE c.date BETWEEN ? AND ?
GROUP BY c.date
ORDER BY c.date;

-- Средняя оценка по дням для конкретной привычки (фильтр)
SELECT c.date, ce.value
FROM checkins c
JOIN checkin_entries ce ON ce.checkin_id = c.id
WHERE c.date BETWEEN ? AND ? AND ce.habit_id = ?
ORDER BY c.date;

-- Streak: непрерывная серия дней со средней >= 4
-- Вычисляется в коде (Zustand / utility), не в SQL
```

### 4.3. Миграции

Версионирование через `settings` таблицу (`key = 'db_version'`). При запуске проверяется текущая версия и применяются новые миграции последовательно.

```typescript
const MIGRATIONS: Record<number, string[]> = {
  1: [
    'CREATE TABLE habits (...)',
    'CREATE TABLE checkins (...)',
    'CREATE TABLE checkin_entries (...)',
    'CREATE TABLE settings (...)',
    // индексы
  ],
  // v2: ALTER TABLE habits ADD COLUMN archived INTEGER DEFAULT 0;
};
```

---

## 5. State Management (Zustand)

### 5.1. useHabitStore

```typescript
interface Habit {
  id: string;
  emoji: string;
  name: string;
  sortOrder: number;
}

interface HabitStore {
  habits: Habit[];

  // Actions
  loadHabits: () => void;       // SQLite → store при запуске
  addHabit: (emoji: string, name: string) => void;
  updateHabit: (id: string, emoji: string, name: string) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (fromIndex: number, toIndex: number) => void;
}
```

### 5.2. useCheckinStore

```typescript
interface CheckinEntry {
  habitId: string;
  value: number; // 0–10
}

interface DayData {
  date: string;          // 'YYYY-MM-DD'
  entries: CheckinEntry[];
  avgValue: number;
}

interface CheckinStore {
  // Кэш загруженных данных
  dayCache: Record<string, DayData>;   // key = 'YYYY-MM-DD'
  yesterdayCheckedIn: boolean;

  // Actions
  checkYesterday: () => void;                          // проверка при запуске
  saveCheckin: (entries: CheckinEntry[]) => void;      // сохранение чек-ина
  loadRange: (from: string, to: string) => void;       // загрузка диапазона дат
  loadRangeForHabit: (from: string, to: string, habitId: string) => void;
  getDayValue: (date: string, habitId?: string) => number | null;
}
```

### 5.3. useUIStore

```typescript
type ViewMode = 'year' | 'month' | 'week';

interface UIStore {
  activeFilter: string | null;    // habit id или null = "Все"
  viewMode: ViewMode;
  theme: 'dark' | 'light';       // MVP — только dark, switch в v1.1

  setFilter: (habitId: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}
```

---

## 6. Компоненты — маппинг из прототипа

Прототип (lifetrack-mvp.jsx) написан на web-React. Ниже — маппинг ключевых решений на React Native.

### 6.1. HabitSlider (ключевой компонент)

**Прототип:** `<Slider>` — HTML div с onMouseDown/onTouchMove, CSS transitions.

**React Native реализация:**

```
GestureDetector (Pan gesture)
  └── Animated.View (трек)
       ├── Animated.View (градиентная заливка — animated width)
       ├── Animated.View (thumb — animated translateX)
       └── Animated.Text (значение "N/10")
```

- **Gesture Handler** — `Gesture.Pan()` обрабатывает касание и перетаскивание
- **Reanimated** — `useSharedValue` для позиции, `useAnimatedStyle` для стилей
- **Haptic** — `Haptics.impactAsync(ImpactFeedbackStyle.Light)` вызывается через `runOnJS` при каждом целом шаге
- **Градиент** — `interpolateColor` из Reanimated для плавного перехода red → yellow → green
- Шаг: 1 (целые числа 0–10), snap через `Math.round()`

### 6.2. ContributionGrid (годовой вид)

**Прототип:** CSS Grid 7 колонок, div-квадратики.

**React Native:** `FlatList` или массив `<View>` в `flexWrap: 'wrap'`. 12 месяцев × ~31 день = ~365 элементов. Рендерится за один проход без виртуализации (легковесные View).

### 6.3. MonthCalendar (месячный вид)

**Прототип:** Вложенные div-гриды.

**React Native:** `<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>` с фиксированной шириной ячейки = screenWidth / 7 - gap.

### 6.4. Навигация

**Прототип:** Стейт `tab` + условный рендер + `<TabBar>`.

**React Native (Expo Router):**

```
app/(tabs)/_layout.tsx → <Tabs> с 3 экранами
  screenOptions: tabBarStyle → тёмный фон, blur
  Три вкладки:
    index.tsx      → "Чек-ин"    → CheckBadgeIcon
    progress.tsx   → "Прогресс"  → Squares2X2Icon
    habits.tsx     → "Привычки"  → AdjustmentsHorizontalIcon
```

Иконки — SVG через `react-native-svg` или простые символьные компоненты.

### 6.5. Маппинг стилей

| Web (прототип) | React Native |
|---------------|-------------|
| `div` | `View` |
| `span`, `p`, `h1` | `Text` |
| `button` | `Pressable` |
| `overflow: auto` | `ScrollView` |
| CSS `animation` / `transition` | Reanimated `withTiming`, `withSpring` |
| `position: fixed` (tab bar) | Expo Router Tabs (нативный tab bar) |
| `box-shadow` | `style.shadowColor/Offset/Opacity/Radius` (iOS), `elevation` (Android) |
| `linear-gradient` | `interpolateColor` из Reanimated или `expo-linear-gradient` |
| `border-radius` | `borderRadius` |
| CSS Grid | `flexDirection: 'row'` + `flexWrap: 'wrap'` |
| `cursor: pointer` | Не нужно (тач-интерфейс) |

---

## 7. Дизайн-система (из PRD → код)

### 7.1. Тема

```typescript
const theme = {
  colors: {
    bg: '#060606',
    card: '#0c0c0c',
    cardBorder: '#141414',
    text: '#ffffff',
    textSecondary: '#888888',
    textTertiary: '#444444',
    green: '#34d399',
    yellow: '#fbbf24',
    red: '#f87171',
    emptyCell: '#161616',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    card: 14,
    button: 12,
    cellYear: 2,
    cellMonth: 8,
    chip: 100,
    slider: 16,
  },
  typography: {
    title: { fontSize: 26, fontWeight: '700' as const },
    subtitle: { fontSize: 15, fontWeight: '600' as const },
    label: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 1.5 },
    body: { fontSize: 16, fontWeight: '400' as const },
    number: { fontVariant: ['tabular-nums'] as const },
  },
} as const;
```

### 7.2. Цветовой маппинг value → color

```typescript
// Из прототипа: функция v2c
function valueToColor(value: number | null): string {
  if (value === null) return theme.colors.emptyCell;
  const t = value / 10;
  // 0 = red (#f87171), 5 = yellow (#fbbf24), 10 = green (#34d399)
  // Плавная интерполяция через RGB
  if (t <= 0.5) {
    const p = t / 0.5;
    return interpolateColor(p, [0, 1], ['#f87171', '#fbbf24']);
  } else {
    const p = (t - 0.5) / 0.5;
    return interpolateColor(p, [0, 1], ['#fbbf24', '#34d399']);
  }
}

// Семантические диапазоны для ячеек
function valueToCategory(value: number | null): 'red' | 'yellow' | 'green' | 'empty' {
  if (value === null) return 'empty';
  if (value <= 3) return 'red';
  if (value <= 6) return 'yellow';
  return 'green';
}
```

---

## 8. Экраны — детализация

### 8.1. Чек-ин (`app/(tabs)/index.tsx`)

**Состояния экрана:**

1. **Нет привычек** → текст + кнопка «Создай первую привычку» → навигация на таб «Привычки»
2. **Вчера не затрекан** → список слайдеров + кнопка «Затрекать»
3. **Вчера затрекан** → экран подтверждения «День затрекан!» с саммари

**Данные:**
- `useHabitStore.habits` — список привычек
- `useCheckinStore.yesterdayCheckedIn` — проверка при монтировании
- Локальный стейт: `values: Record<string, number>` — текущие значения слайдеров

**Действие «Затрекать»:**
1. Создать запись в `checkins` (date = вчера)
2. Создать записи в `checkin_entries` для каждой привычки
3. Обновить `checkinStore.yesterdayCheckedIn = true`
4. Показать экран подтверждения с конфетти (Reanimated layout animation)

### 8.2. Прогресс (`app/(tabs)/progress.tsx`)

**Вложенная навигация уровней:** Стейт в `useUIStore` — `viewMode: 'year' | 'month' | 'week'`. Нет вложенного роутера — переключение через условный рендер (как в прототипе).

**Каждый уровень:**

| Уровень | Компонент | Данные | Навигация |
|---------|----------|--------|-----------|
| Год | `ContributionGrid` | `loadRange('2026-01-01', '2026-12-31')` | Тап на месяц → месяц |
| Месяц | `MonthCalendar` + `StreakCard` | `loadRange('2026-02-01', '2026-02-28')` | Тап на день → неделя |
| Неделя | `WeekBar` (по привычкам) | `loadRange('2026-02-10', '2026-02-16')` | — |

**Фильтрация:** `HabitChips` вверху. При выборе привычки — `useUIStore.setFilter(habitId)`. Все виды реагируют на `activeFilter` и показывают данные по одной привычке или по всем.

**День:** Дополнительный drill-down вид при тапе на день в неделе. Показывает все привычки с оценками за конкретный день.

### 8.3. Привычки (`app/(tabs)/habits.tsx`)

**Функции:**
- Список с drag-and-drop через `Gesture.Pan()` + Reanimated `useAnimatedReaction` для перетаскивания
- Добавление: модалка или inline-форма (как в прототипе) с `EmojiPicker` + текстовое поле (лимит 20 символов)
- Редактирование: inline (как в прототипе) — тап на карандаш
- Удаление: `Alert.alert()` с подтверждением → soft delete (`deleted_at`)
- Лимит: 10 привычек, UI показывает «N из 10»

**Для MVP:** Стрелки вверх/вниз вместо drag-and-drop (проще реализация). Drag-and-drop — v1.1.

---

## 9. Вычисление streak

Streak считается в коде, не в SQL. Алгоритм:

```typescript
function calculateStreak(
  days: DayData[],   // отсортированы по дате DESC
  threshold: number = 4  // средняя >= 4 = "день засчитан"
): { current: number; best: number } {
  let current = 0;
  let best = 0;
  let counting = true; // для current streak — только непрерывная серия от сегодня

  for (const day of days) {
    if (day.avgValue >= threshold) {
      if (counting) current++;
      best = Math.max(best, /* длина текущего непрерывного блока */);
    } else {
      counting = false;
      // для best — продолжаем считать блоки
    }
  }

  return { current, best };
}
```

---

## 10. Производительность

### 10.1. Целевые метрики (из PRD NFR)

| Метрика | Цель | Подход |
|---------|------|--------|
| Холодный запуск | < 2 сек | Минимум зависимостей, lazy loading экранов Progress/Habits |
| Слайдер | 60 fps | Reanimated UI-thread, нет JS-bridge для анимаций |
| Годовой вид (~365 ячеек) | < 500 мс | Один SQL-запрос, мемоизация через `useMemo`, нет FlatList — простой View |
| Сохранение чек-ина | < 200 мс | SQLite transaction, batch INSERT |

### 10.2. Оптимизации

- **Слайдер на UI-thread:** `useAnimatedStyle` + `useSharedValue` — вся анимация на native thread, JS не блокируется
- **SQL batch:** Чек-ин сохраняется в одной транзакции (`db.withTransactionAsync`)
- **Мемоизация:** `useMemo` для вычисления сеток, streak, средних. Пересчёт только при изменении `dayCache` или `activeFilter`
- **Lazy load:** Годовой вид загружает данные за текущий год. При переключении года — новый запрос

---

## 11. Инициализация и первый запуск

```
App Launch
  → app/_layout.tsx
    → Открытие SQLite базы
    → Проверка db_version в settings
    → Применение миграций (если нужно)
    → Если habits пустая → seed дефолтных привычек
    → Гидрация Zustand stores из SQLite
    → Рендер Tabs
      → Чек-ин таб (дефолтный)
        → checkYesterday() → показ нужного состояния
```

Дефолтные привычки (из PRD):

| Эмодзи | Название |
|--------|---------|
| 🛌 | Сон |
| 🚴 | Активность |
| 🥗 | Питание |
| 🧠 | Ментальное |
| 💻 | Проекты |

---

## 12. Сборка и деплой

### 12.1. EAS Build

```json
// eas.json
{
  "build": {
    "development": {
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "...", "ascAppId": "..." },
      "android": { "serviceAccountKeyPath": "./play-store-key.json" }
    }
  }
}
```

### 12.2. Поддерживаемые платформы

| Платформа | Минимальная версия |
|-----------|-------------------|
| iOS | 15.0+ |
| Android | 10+ (API 29) |

### 12.3. OTA-обновления

`expo-updates` — JS-бандл обновляется без ревью в сторах. Полезно для багфиксов после релиза.

---

## 13. Подготовка к v2 (бэкенд)

Архитектура MVP спроектирована с учётом будущей синхронизации:

- **UUID для всех id** — нет auto-increment, можно мерджить данные с сервером без конфликтов
- **Timestamps** (`created_at`) — для conflict resolution при синхронизации
- **Soft delete** (`deleted_at`) — удалённые привычки можно синхронизировать
- **Чистый data layer** — SQL-запросы изолированы в `db/queries.ts`, при добавлении API меняется только persistence layer
- **Zustand middleware** — в v2 можно добавить middleware для sync queue (записывать действия, отправлять при наличии сети)

---

## 14. Зависимости (package.json)

```
expo                     ~54.x
expo-router              ~4.x
expo-sqlite              ~15.x
expo-haptics             ~14.x
react-native-reanimated  ~4.x
react-native-gesture-handler ~2.x
zustand                  ^5.x
uuid                     ^11.x  (генерация id)
```

Dev-зависимости:

```
typescript               ~5.x
@types/react             ~19.x
eslint + prettier        (стандартная Expo конфигурация)
```

Итого: **8 runtime-зависимостей** (включая Expo SDK). Минимальный бандл.

---

## 15. Чеклист перед разработкой

- [ ] `npx create-expo-app life-track --template tabs` (TypeScript шаблон с табами)
- [ ] Настроить `app.json`: name, slug, icon, splash, ios.bundleIdentifier, android.package
- [ ] Установить зависимости: `npx expo install expo-sqlite expo-haptics react-native-reanimated react-native-gesture-handler zustand uuid`
- [ ] Настроить `babel.config.js` для Reanimated
- [ ] Создать SQLite схему и миграции
- [ ] Создать Zustand stores
- [ ] Реализовать HabitSlider (ключевой компонент)
- [ ] Экран чек-ина
- [ ] Экран прогресса (год → месяц → неделя)
- [ ] Экран привычек (CRUD)
- [ ] Тестирование на iOS Simulator + Android Emulator
- [ ] EAS Build: dev → preview → production
- [ ] Публикация: Google Play → App Store (при наличии аккаунта)
