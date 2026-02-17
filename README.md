# 📊 LifeTrack

> Minimalist daily habit tracker — did you do it or not?

**Status:** 🚧 MVP in Development | **Started:** Feb 2026 | **Format:** Proof of Work (Season 2)

**Current Status:**
- ✅ PRD v3 & Technical Spec ready
- ✅ Interactive prototype (v8) — binary system, tested with users
- ✅ Design finalized (tap cards ✓/—, dual theme)
- ⏳ React Native + Expo migration in progress
- 🎯 Target: App Store + Google Play in 30 days

---

## TL;DR

Every habit tracker asks too much. Sliders, ratings, timers, notes. LifeTrack asks one thing: **did you do it?** Tap = ✓. Don't tap = —. Five habits, five taps, done. See your GitHub-style heatmap grow green.

No sign-up. No cloud. No notifications. No stress. No thinking.

---

## The Idea

This project went through three design iterations before landing on the simplest possible version:

- **v1–v5:** Slider 0–10. Users said: *"What's the difference between sleep 7 and sleep 8?"*
- **v6–v7:** Slider 0–5 with text labels. Friend said: *"It looks like something you need to figure out."*
- **v8:** Binary. Tap = did it. That's it.

The insight: **the goal is to build the habit, not measure it.** Success = any progress at all. Sleep? Did you go to bed on time — yes or no. Exercise? Did you move — yes or no. When the habit is formed, then you can go deeper. But first — just do it. Every day.

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

## Tech Stack

```
Framework:   React Native + Expo SDK 54 (New Architecture)
Language:    TypeScript
State:       Zustand
Storage:     SQLite (expo-sqlite)
Animations:  React Native Reanimated 4
Gestures:    react-native-gesture-handler
Haptics:     expo-haptics
Build:       EAS Build (cloud)
Platforms:   iOS 15+ / Android 10+
Backend:     None (MVP) → NestJS + PostgreSQL (v2)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [📋 PRD v3](./docs/PRD.md) | Product requirements, acceptance criteria, design system |
| [🔧 Technical Spec](./docs/TECHNICAL_SPEC.md) | Architecture, SQLite schema, component design |
| [🎨 Prototype](./prototype/) | Interactive JSX prototype (v8) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Development

```bash
git clone https://github.com/OneZee23/life-track.git
cd life-track

npm install
npx expo start --dev-client

# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Building

```bash
# Preview (internal testing)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production
eas build --platform all --profile production

# Submit
eas submit --platform ios
eas submit --platform android
```

---

## Features

### ✅ Design & Prototyping (8 iterations)

- v1–v5: Slider 0–10 → user feedback → too complex
- v6–v7: Slider 0–5 with labels → friend feedback → still too complex
- v8: Binary tap cards ✓/— → just right
- Light & dark theme with iOS-native feel
- Spring animations, haptic feedback

### ✅ Check-in Screen

- Tap card to toggle: gray (—) → green (✓)
- Spring scale animation + checkmark pop effect
- Progress bar: X/5 filled
- "Готово ✓" → "День записан!" with confetti
- Gear icon (⚙) → settings

### ✅ Progress Screen (Drill-down)

- **Year:** 12 month cards with binary heatmaps (green/gray)
- **Month:** Calendar grid, current & best streaks
- **Week:** Per-habit bars (✓/—), weekly X/Y
- **Day:** Detailed ✓/— per habit
- **Today:** Pulsing green border
- Filter by individual habit

### ✅ Habits Management

- Add / edit / delete, emoji picker (20 presets)
- Drag & drop reorder, max 10 habits
- Default: Sleep 🛌, Activity 🚴, Nutrition 🥗, Mental 🧠, Projects 💻

### ✅ Settings

- Dark/light theme toggle
- Social links (Telegram, Threads)
- App version

### 🚧 In Progress

- [ ] React Native + Expo project setup
- [ ] SQLite schema & migrations
- [ ] Zustand stores
- [ ] HabitToggle component (Reanimated 4 tap gesture)
- [ ] All screens migration
- [ ] EAS Build configuration

---

## Roadmap

### Phase 1: MVP ← current

- [x] Market research
- [x] PRD v1 (0–10) → v2 (0–5) → v3 (binary)
- [x] Prototype v1–v8
- [x] User testing at each stage
- [x] Technical specification
- [ ] React Native implementation
- [ ] App Store + Google Play

### Phase 2: Polish

- [ ] Onboarding (2–3 screens)
- [ ] Data export (CSV/JSON)
- [ ] iOS widget (streak)
- [ ] English localization

### Phase 3: Advanced (optional)

- [ ] "Advanced mode" — 0–5 scale for power users
- [ ] NestJS + PostgreSQL backend
- [ ] Cross-device sync

### Phase 4: Expansion

- [ ] Apple Health, Apple Watch, Telegram Mini App

---

## Design Evolution

| Version | System | Feedback | Decision |
|---------|--------|----------|----------|
| v1–v5 | Slider 0–10 | "What's 7 vs 8?" | Too granular |
| v6–v7 | Slider 0–5 + labels | "Looks complex" | Still too much thinking |
| **v8** | **Binary ✓/—** | **"Instant. Love it."** | **Ship it** |

The key insight: a habit tracker should require **zero decisions**. Not "how well did I do?" — just "did I do it?"

---

## Development Format

Open development, "Proof of Work" Season 2:

- All stages documented publicly
- Daily posts in [Telegram channel](https://t.me/onezee_co)
- Season 1: [Telegram Stars Shop](https://github.com/OneZee23/fraggram) (completed)

---

## Contributing

Issues and PRs welcome. To run the prototype locally, open `prototype/lifetrack-mvp.jsx` in any React sandbox.

---

## License

MIT

---

## Links

- **Channel:** [@onezee_co](https://t.me/onezee_co) — daily progress
- **YouTube:** [OneZee](https://www.youtube.com/c/onezee) — video docs
- **Season 1:** [Telegram Stars Shop](https://github.com/OneZee23/fraggram)
