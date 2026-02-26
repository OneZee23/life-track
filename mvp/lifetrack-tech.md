# LifeTrack — Техническое решение

> **Версия:** 2.2
> **К PRD:** v3.1
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
| Runtime | React Native + Expo SDK 54 | New Architecture (Fabric, Hermes) |
| Язык | TypeScript 5.9 | Типизация |
| State | Zustand v5 | Минимальный бойлерплейт |
| Хранение | expo-sqlite | Быстрые запросы по датам |
| Анимации | react-native-reanimated 4 | Spring-easing, layout animations, Worklets |
| Жесты | react-native-gesture-handler 2 | Tap, Pan, drag для reorder |
| Haptic | expo-haptics | Тактильный фидбек при тапе |
| Навигация | Expo Router 6 | File-based routing |
| Drag & Drop | react-native-reorderable-list | Reorder привычек (long-press) |
| Иконки | @expo/vector-icons (Ionicons) | UI иконки |
| Blur | expo-blur | iOS tab bar blur effect |
| Сборка | EAS Build | Облачная компиляция |

### 1.3. Структура проекта

```
lifetrack/
├── app/
│   ├── _layout.tsx              # Root layout + SQLite provider + StoreInitializer
│   ├── index.tsx                # Entry → redirect to /(tabs)/checkin
│   ├── settings.tsx             # Настройки (отдельный экран, slide_from_right)
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator (checkin, progress, habits)
│       ├── checkin.tsx          # Бинарный чек-ин + confetti + update banner
│       ├── progress.tsx         # Drill-down прогресс + swipe + filters
│       └── habits.tsx           # CRUD + drag & drop reorder
├── components/
│   ├── HabitToggle.tsx          # Карточка-переключатель (tap + spring)
│   ├── HeatmapCell.tsx          # Ячейка heatmap (green/gray/pulse)
│   ├── ProgressYear.tsx         # 12 месячных карточек
│   ├── ProgressMonth.tsx        # Календарная сетка + streaks
│   ├── ProgressWeek.tsx         # Разбивка по привычкам
│   ├── ProgressDay.tsx          # Детальный вид дня
│   ├── UpdateBanner.tsx         # Баннер обновления (голубой, full-width)
│   ├── Confetti.tsx             # Анимация при сохранении
│   ├── StreakCelebration.tsx     # Модалка при достижении серии
│   └── ui/
│       ├── Chip.tsx             # Фильтр-чип (dimmed + dismiss для удалённых)
│       ├── NavHeader.tsx        # Заголовок с навигацией ←/→
│       └── BackBtn.tsx          # Кнопка назад
├── store/
│   ├── useHabits.ts             # habits[] + allHabits[] + CRUD + soft-delete
│   ├── useCheckins.ts           # data{} + saveDay + loadDateRange + getStreak
│   └── useTheme.ts              # dark/light + colors palette
├── hooks/
│   ├── useTabBarOverlap.ts      # Padding для iOS tab bar (absolute positioned)
│   └── useUpdateAvailable.ts    # Проверка версии в App Store / Play Store
├── db/
│   ├── schema.ts                # SQL определения таблиц
│   ├── migrations.ts            # Версионные миграции (v1-v3)
│   └── queries.ts               # Все SQL-запросы
├── utils/
│   ├── dates.ts                 # Русская локализация дат + pluralDays()
│   └── constants.ts             # Цвета, темы, эмодзи
└── types/
    └── index.ts                 # Habit, Checkin, DayStatus
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

// DayStatus используется для цветовой кодировки ячеек прогресса
type DayStatus =
    | null              // нет данных / будущее
    | 'all'             // все привычки done
    | 'partial'         // часть done
    | 'none';           // ничего не делал
```

### 2.4. Zustand Stores

```typescript
// useHabits.ts — два списка: активные и все (включая удалённые)
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
    data: Record<string, Record<string, 0 | 1>>;  // date → habitId → 0|1
    saveDay: (date: string, values: Record<string, boolean>) => Promise<void>;
    loadDate: (date: string) => Promise<Record<string, 0 | 1>>;
    loadDateRange: (from: string, to: string) => Promise<void>;
    getStreak: () => Promise<number>;
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
// scale(0.97) при нажатии, withSpring при отпускании
// interpolateColor для плавного перехода фона серый → зелёный
// Haptic Light при каждом тапе
// Стагированный FadeInUp.delay(index * 50) при первом рендере
```

### 3.2. Progress — drill-down + свайп

Навигация: Год → Месяц → Неделя → День. Реализована через внутренний state (level + выбранный period).

```typescript
// Свайп между периодами через Gesture.Pan
const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])     // порог горизонтального свайпа
    .failOffsetY([-15, 15])       // не конфликтует с вертикальным скроллом
    .onEnd((e) => {
        runOnJS(handleSwipeEnd)(e.translationX);
    });
```

Фильтрация по привычкам:
- Активные привычки — обычные чипы
- Удалённые привычки — серые чипы (dimmed) с кнопкой dismiss
- Сортировка: активные первые, удалённые последние

### 3.3. UpdateBanner — баннер обновления

Показывается на главном экране (чекин) если в App Store / Google Play доступна более новая версия.

```typescript
// hooks/useUpdateAvailable.ts
// - Запрашивает iTunes Search API раз за сессию приложения
// - Кэш на уровне модуля (не AsyncStorage) — сбрасывается при перезапуске
// - Сравнивает semver: compareVersions(current, store)
// - Таймаут 5 сек через AbortController
// - При ошибке сети — молча { available: false }
// - iOS: trackViewUrl из API; Android: Play Store URL

// components/UpdateBanner.tsx
// - FadeIn анимация при появлении
// - Голубой фон (C.blue + '18' = ~9% opacity)
// - Ionicons 'cloud-download-outline' + текст "Доступно обновление"
// - onPress → Linking.openURL(storeUrl)
// - Рендерится в двух местах: активный чекин (bottomBar) и saved state (ScrollView)
```

### 3.4. pluralDays — русское склонение

```typescript
// utils/dates.ts
export function pluralDays(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
    return 'дней';
}
// 1 → день, 2 → дня, 5 → дней, 11 → дней, 21 → день, 31 → день
// Используется: ProgressYear (summary), ProgressYear (MonthCard), ProgressMonth (streaks), StreakCelebration
```

---

## 4. Инициализация приложения

Трехэтапная загрузка в `_layout.tsx`:

```
1. SQLite Provider → runMigrations (v1 → v2 → v3)
2. StoreInitializer → theme.loadFromDb + habits.loadFromDb + checkins._db init
3. UI Ready → показываем экран чек-ина
```

StoreInitializer имеет:
- mounted guard (предотвращает повторную инициализацию)
- try-catch с логированием ошибок

---

## 5. Паттерны и решения

### 5.1. Optimistic Updates

- **reorder:** Оптимистично переставляет, при ошибке — revert к предыдущему состоянию
- **saveDay:** `Promise.all` вместо последовательных awaits (fix N+1)

### 5.2. Soft-Delete

Привычки не удаляются из БД — ставится `deleted_at`. Это позволяет:
- Сохранять историю чек-инов удалённых привычек
- Показывать удалённые привычки в прогрессе (серые фильтр-чипы)
- Восстанавливать привычки в будущем

### 5.3. Подготовка к синхронизации

MVP полностью оффлайн, но схема готова к online-first синхронизации:
- `updated_at` на всех мутациях — last-write-wins при конфликтах
- `device_id` — идентификация устройства для мерж-логики
- Все мутации проходят через единые query-функции

### 5.4. Platform-специфика

```typescript
// iOS: tab bar absolute positioned + blur (expo-blur)
// Android: tab bar в layout flow, без blur
// iOS: KeyboardAvoidingView inline при добавлении привычки
// Android: Modal overlay при добавлении привычки
// useTabBarOverlap() — хук для расчёта нижнего padding под таббар на iOS
```

---

## 6. Темизация

Бинарная палитра: один акцентный цвет (iOS Green #34C759) + голубой для системных действий (обновление).

```typescript
const themes = {
    light: {
        bg: '#F2F2F7',    card: '#FFFFFF',
        text0: '#000000', text3: '#8E8E93',
        green: '#34C759', greenLight: '#E8F9ED',
        blue: '#007AFF',
        emptyCell: '#EBEBF0',
        segBg: 'rgba(118,118,128,0.12)',
    },
    dark: {
        bg: '#000000',    card: '#1C1C1E',
        text0: '#FFFFFF', text3: '#8E8E93',
        green: '#34C759', greenLight: 'rgba(52,199,89,0.15)',
        blue: '#0A84FF',
        emptyCell: '#2C2C2E',
        segBg: 'rgba(118,118,128,0.24)',
    }
};
```

---

## 7. Сборка и деплой

```
EAS Build (cloud) → .ipa / .aab → EAS Submit → App Store Connect / Google Play → Review
```

| Конфиг | Значение |
|--------|----------|
| Bundle ID | co.onezee.lifetrack |
| EAS Project ID | a3e65c3b-1458-40e3-a543-87e45802fab3 |
| ASC App ID | 6759284836 |
| Build profile | production (autoIncrement) |
| Min iOS | 15.0 |
| Min Android | API 29 (Android 10) |

---

## 8. Открытые вопросы

| # | Вопрос | Статус |
|---|--------|--------|
| 1 | Онлайн-синхронизация | Схема готова (updated_at, device_id). Реализация в v0.2.0 |
| 2 | Редактирование прошлых дней | v0.2.0 — за последние 7 дней |
| 3 | Адаптивность на малых/больших экранах | Планируется до публикации |
| 4 | Клавиатура при создании привычки (Android) | Планируется до публикации |
| 5 | Иконка на Android (слишком маленькая) | Планируется до публикации |
| 6 | Расширение до шкалы | v0.3.0 — опциональный "продвинутый режим" |

---

> MVP реализован. iOS — на ревью в App Store. Android — закрытое тестирование Google Play (февраль 2026).
