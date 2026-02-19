# LifeTrack

> Minimalist daily habit tracker — did you do it or not?

**Status:** v0.1.1 | iOS App Store (on review) | **Started:** Feb 2026

---

## TL;DR

Every habit tracker asks too much. Sliders, ratings, timers, notes. LifeTrack asks one thing: **did you do it?** Tap = done. Don't tap = skip. Five habits, five taps, done. See your GitHub-style heatmap grow green.

No sign-up. No cloud. No notifications. No stress. No thinking.

---

## The Idea

This project went through three design iterations before landing on the simplest possible version:

- **v1-v5:** Slider 0-10. Users said: *"What's the difference between sleep 7 and sleep 8?"*
- **v6-v7:** Slider 0-5 with text labels. Friend said: *"It looks like something you need to figure out."*
- **v8:** Binary. Tap = did it. That's it.

The insight: **the goal is to build the habit, not measure it.** Success = any progress at all. When the habit is formed, then you can go deeper. But first — just do it. Every day.

**Personal pain:** Health circumstances made it critical to track 5 areas daily. A year of manual journaling proved the concept. No app was simple enough.

First post: [Day 0/30 in Telegram channel](https://t.me/onezee_co)

---

## How It Works

```
Morning routine:

  🛌 Сон          [ — ] → tap → [ ✓ ]
  🚴 Активность   [ — ] → tap → [ ✓ ]
  🥗 Питание      [ — ]
  🧠 Ментальное   [ — ] → tap → [ ✓ ]
  💻 Проекты      [ — ] → tap → [ ✓ ]

  ████████████░░░░ 4/5

  [ Готово ✓ ]

Total time: 5 seconds.
```

Your data becomes a heatmap. Green = did something. Gray = didn't. Today pulses until you check in.

---

## Features

### Check-in Screen
- Tap card to toggle: gray (skip) → green (done)
- Spring scale animation + haptic feedback
- Progress bar: X/N filled
- "Готово" → confetti + summary
- Streak celebration on app open (2+ days in a row)

### Progress Screen (Drill-down)
- **Year:** 12 month cards with heatmaps (green/gray)
- **Month:** Calendar grid, current & best streaks
- **Week:** Per-habit bars, weekly summary
- **Day:** Detailed view per habit
- **Today:** Pulsing green border
- Filter by individual habit (active habits only in filter)
- Deleted habits shown only where they have data
- Swipe gestures with directional animations

### Habits Management
- Add / edit / delete with confirmation dialog
- Soft-delete preserves checkin history
- Emoji picker (20 presets), max 10 habits
- Long-press drag & drop reorder
- Default: Sleep, Activity, Nutrition, Mental, Projects

### Settings
- Dark/light theme toggle with smooth sheet animation
- About section with project info
- Feedback link (@onezee123 on Telegram)
- Social links (Telegram channel, YouTube)

---

## Tech Stack

```
Framework:   React Native + Expo SDK 52 (New Architecture)
Language:    TypeScript
State:       Zustand v5
Storage:     SQLite (expo-sqlite) with versioned migrations
Animations:  React Native Reanimated 3
Gestures:    react-native-gesture-handler (Tap + Pan)
Haptics:     expo-haptics
Navigation:  Expo Router (file-based)
Build:       EAS Build (cloud)
Platform:    iOS 15+
Backend:     None (local-only MVP)
```

---

## Project Structure

```
lifetrack/
├── app/
│   ├── _layout.tsx              # Root layout + SQLite provider + store init
│   ├── index.tsx                # Entry → redirect to checkin
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator (3 tabs)
│       ├── checkin.tsx          # Daily check-in screen
│       ├── progress.tsx         # Progress with drill-down + swipe
│       └── habits.tsx           # Habit management (CRUD + reorder)
├── components/
│   ├── HabitToggle.tsx          # Tap card with spring animation (memo)
│   ├── HeatmapCell.tsx          # Single heatmap cell (memo)
│   ├── ProgressYear.tsx         # Year view (12 memo'd month cards)
│   ├── ProgressMonth.tsx        # Month calendar grid
│   ├── ProgressWeek.tsx         # Week per-habit breakdown
│   ├── ProgressDay.tsx          # Day detailed view
│   ├── Settings.tsx             # Animated bottom sheet
│   ├── Confetti.tsx             # Celebration particles (memo)
│   ├── StreakCelebration.tsx     # Streak overlay with smooth dismiss
│   └── ui/
│       ├── Chip.tsx             # Filter chip
│       ├── NavHeader.tsx        # Screen header
│       └── BackBtn.tsx          # Navigation back button
├── store/
│   ├── useHabits.ts             # Habits store (CRUD + soft-delete)
│   ├── useCheckins.ts           # Checkins store (toggle + save + ranges)
│   └── useTheme.ts              # Theme store (light/dark)
├── db/
│   ├── schema.ts                # Table definitions
│   ├── migrations.ts            # Versioned migrations (v1-v3)
│   └── queries.ts               # All SQL queries
├── utils/
│   ├── dates.ts                 # Russian locale date helpers
│   └── constants.ts             # Colors, themes, defaults, emojis
└── types/
    └── index.ts                 # Habit, Checkin, DayData, DayStatus
```

---

## Database

SQLite with versioned migrations (PRAGMA user_version):

- **v1:** Initial schema (habits, checkins, preferences) + seed habits
- **v2:** Soft-delete for habits (`deleted_at` column)
- **v3:** Sync preparation (`updated_at` on checkins, `device_id` in preferences)

All data stored locally on device. No network requests.

---

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (macOS)

### Development

```bash
git clone https://github.com/OneZee23/life-track.git
cd life-track

npm install
npx expo start

# Press 'i' to open in iOS Simulator
# Press 'shift+i' to pick a specific simulator
```

### Building

```bash
# Production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD v3](./docs/lifetrack-prd.md) | Product requirements, acceptance criteria, design system |
| [Technical Spec](./docs/lifetrack-tech.md) | Architecture, SQLite schema, component design |
| [Prototype](./docs/lifetrack-mvp.jsx) | Interactive JSX prototype (v8) |
| [Slider archive](./docs/docs-for-slider/) | Earlier slider-based iterations (v1-v7) |

---

## Roadmap

### v0.1.0 MVP (done)

- [x] PRD v1 (0-10) → v2 (0-5) → v3 (binary)
- [x] JSX prototype v1-v8
- [x] User testing at each stage
- [x] Technical specification
- [x] React Native + Expo implementation
- [x] Binary check-in + tap cards
- [x] SQLite with versioned migrations
- [x] Progress (year/month/week/day) with swipe navigation
- [x] Habits management (CRUD + drag & drop + soft-delete)
- [x] Settings with about section
- [x] EAS Build + App Store submission

### v0.1.1 (done)

- [x] Bug fix: progress data loads from SQLite on mount
- [x] Bug fix: day refreshes on tab focus (midnight boundary)
- [x] Streak celebration screen (2+ days)
- [x] Swipe animations in progress (FadeInLeft/Right)
- [x] Smooth settings sheet (Reanimated, no Modal)
- [x] Deleted habits filtered from progress chips
- [x] Long-press drag reorder in habits
- [x] Delete confirmation dialog
- [x] Performance: React.memo (HabitToggle, HeatmapCell, MonthCard, Confetti)
- [x] Performance: SQL transactions (batch upsert, reorder)
- [x] Performance: animation cleanup on unmount

### v0.2.0 (planned)

- [ ] Push notifications (daily reminder)
- [ ] Onboarding (2-3 screens)
- [ ] iOS widget (today's streak)
- [ ] Data export (CSV/JSON)
- [ ] English localization

### v0.3.0 (ideas)

- [ ] Online sync (server + local offline data merge)
- [ ] Apple Watch companion
- [ ] Advanced mode (0-5 scale for power users)
- [ ] Sharing streak cards (Instagram stories)

---

## Design Evolution

| Version | System | Feedback | Decision |
|---------|--------|----------|----------|
| v1-v5 | Slider 0-10 | "What's 7 vs 8?" | Too granular |
| v6-v7 | Slider 0-5 + labels | "Looks complex" | Still too much thinking |
| **v8** | **Binary** | **"Instant. Love it."** | **Ship it** |

---

## Development Format

Open development, "Proof of Work" Season 2:

- All stages documented publicly
- Daily posts in [Telegram channel](https://t.me/onezee_co)
- Season 1: [Telegram Stars Shop](https://github.com/OneZee23/fraggram) (completed)

---

## Links

- **Channel:** [@onezee_co](https://t.me/onezee_co) — daily progress
- **YouTube:** [OneZee](https://www.youtube.com/c/onezee) — video docs
- **Feedback:** [@onezee123](https://t.me/onezee123) — DM for bugs & ideas
- **Season 1:** [Telegram Stars Shop](https://github.com/OneZee23/fraggram)

---

## License

MIT
