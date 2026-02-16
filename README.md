# 📊 LifeTrack

> Minimalist daily habit tracker — rate your day 0–5 in 30 seconds

**Status:** 🚧 MVP in Development | **Started:** Feb 2026 | **Format:** Proof of Work (Season 2)

**Current Status:**
- ✅ PRD v2 & Technical Spec ready
- ✅ Interactive prototype (v7) — tested with real users
- ✅ Design system finalized (6-level scale, dual theme)
- ⏳ React Native + Expo migration in progress
- 🎯 Target: App Store + Google Play in 30 days

---

## TL;DR

Every habit tracker out there asks too much. LifeTrack asks one question per habit: **how was it yesterday, 0 to 5?** Slide, tap "Done", see your GitHub-style heatmap grow. Total time: 30 seconds.

No sign-up. No cloud. No notifications. No stress.

**Target audience:** Anyone who wants to track habits without the tracking becoming a habit itself.

---

## The Idea

Most habit trackers fail because they become a chore. Streaks wants binary yes/no. Habitify needs 5 minutes of input. Productive sends 10 notifications a day. Users burn out on the tracker, not the habits.

**Personal pain:** Health circumstances made it critical to systematically track 5 areas: sleep, exercise, nutrition, mental health, and work. A year of manual journaling proved the concept — but no app made it simple enough.

**Solution:** A segmented slider (0–5) with text labels (Skip → Fire), a beautiful heatmap, and nothing else. Check in every morning, see your year fill up with color.

First post: [Day 0/30 in Telegram channel](https://t.me/onezee_co/97)

Development follows a "Proof of Work" format: the entire process from idea to App Store is documented openly.

---

## How It Works

### 30-Second Check-in

Each morning you rate yesterday on a 0–5 scale per habit:

| Value | Label | Zone | Meaning |
|-------|-------|------|---------|
| 0 | Пропуск | — | Didn't do it |
| 1 | Слабо | BAD | Barely |
| 2 | Так себе | MEH | Meh |
| 3 | Норм | OK | Average |
| 4 | Хорошо | GOOD | Good |
| 5 | Огонь | MAX | Crushed it |

### GitHub-Style Progress

Your data becomes a heatmap — 6 discrete colors, drill-down from year → month → week → day. Today pulses with a green border until you check in.

### Why 0–5, Not 0–10?

User testing revealed cognitive friction: "What's the difference between sleep 7 and sleep 8?" With 6 levels and text labels, the choice is instant.

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
| [📋 PRD v2](./docs/PRD.md) | Product requirements, user stories, acceptance criteria, design system |
| [🔧 Technical Spec](./docs/TECHNICAL_SPEC.md) | Architecture, data model, SQLite schema, component design |
| [🎨 Prototype](./prototype/) | Interactive JSX prototype (v7) — run with any React sandbox |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- EAS CLI for builds (`npm install -g eas-cli`)

### Development

```bash
# Clone
git clone https://github.com/onezee/lifetrack.git
cd lifetrack

# Install dependencies
npm install

# Start dev server
npx expo start --dev-client

# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android
```

### Building

```bash
# Preview build (internal testing)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Features

### ✅ Design & Prototyping

- Interactive JSX prototype (7 iterations)
- User testing with real feedback → scale changed from 0–10 to 0–5
- Light & dark theme with iOS-native feel
- 6-level color system with smooth gradient slider
- Segmented slider with snap positions, spring easing, haptic feedback
- Confetti animation on check-in completion

### ✅ Check-in Screen

- Yesterday's date with proper Russian declension ("15 февраля, воскресенье")
- Habit list with segmented sliders (0–5)
- Thumb shows current number, label below shows text (Пропуск → Огонь)
- Zone labels inside gradient track (— / BAD / MEH / OK / GOOD / MAX)
- "Готово ✓" button → "День записан!" summary with average score
- "Переоценить день" option
- Gear icon (⚙) → settings bottom sheet

### ✅ Progress Screen (Drill-down)

- **Year view:** 12 month cards with mini-heatmaps, average score badges
- **Month view:** Calendar grid, current & best streaks
- **Week view:** Per-habit mini-bars, weekly summary
- **Day view:** Detailed scores with progress bars per habit
- **Today:** Pulsing green border, "Ожидает чек-ина" label
- Filter by individual habit (horizontal chips)
- Navigation arrows + back button at each level
- Legend with 6 colors + "Today" marker

### ✅ Habits Management

- Add / edit / delete habits
- Emoji picker (20 presets)
- Name input with 20-char limit and counter
- Drag & drop reorder
- Max 10 habits
- Default set: Sleep 🛌, Activity 🚴, Nutrition 🥗, Mental 🧠, Projects 💻

### ✅ Settings

- Bottom sheet with drag handle
- Dark/light theme toggle (iOS-style switch)
- Social links (Telegram channel, Threads)
- App version

### 🚧 In Progress

- [ ] React Native + Expo project setup
- [ ] SQLite schema & migrations
- [ ] Zustand stores (habits, checkins, theme)
- [ ] SegSlider component (Reanimated 4 + Gesture Handler)
- [ ] All screens migration from prototype
- [ ] Haptic feedback integration
- [ ] EAS Build configuration

---

## Roadmap

### Phase 1: MVP ← current

- [x] Market research & competitor analysis
- [x] PRD v1 → v2
- [x] Interactive prototype (v1–v7)
- [x] User testing → 0–5 scale decision
- [x] Technical specification
- [ ] React Native + Expo implementation
- [ ] SQLite storage
- [ ] All screens (check-in, progress, habits, settings)
- [ ] Testing on iOS + Android
- [ ] App Store + Google Play submission

### Phase 2: Polish

- [ ] Onboarding (2–3 screens)
- [ ] Data export (CSV/JSON)
- [ ] iOS widget (streak)
- [ ] English localization
- [ ] Firebase analytics (opt-in)

### Phase 3: Backend & Monetization

- [ ] NestJS + PostgreSQL backend
- [ ] Cross-device sync (free for all)
- [ ] Public Grafana dashboard
- [ ] Daily Check-in Rewards (rewarded ads)
- [ ] Correlation analytics

### Phase 4: Expansion

- [ ] Apple Health / HealthKit
- [ ] Apple Watch complication
- [ ] Telegram Mini App version

---

## Challenges & Learnings

- **Scale debate (0–10 vs 0–5):** Community feedback was clear — "what's the difference between 7 and 8?" Switching to 0–5 with text labels eliminated decision fatigue
- **Gradient design:** First gradient looked "dirty" (грязноватый). Took 3 iterations to get clean, readable color transitions
- **Measurable metrics rejected:** Users asked for "sleep = 8 hours". Rejected — it kills the 30-second philosophy. The slider is subjective by design
- **Apple Developer Account:** Russian accounts face restrictions (no in-app purchases). Google Play as parallel track

---

## Development Format

The project is developed openly in a "Proof of Work" format (Season 2):

- All stages are documented publicly
- Code is published in this repository
- Progress is tracked in daily posts in [Telegram channel](https://t.me/onezee_co)
- Season 1 was [Telegram Stars Shop](https://github.com/onezee/fraggram) (completed)
- Can be run locally and contribute to development

---

## Contributing

The project is in active development. Issues and PRs are welcome.

To run the prototype locally, open `prototype/lifetrack-mvp.jsx` in any React sandbox (CodeSandbox, StackBlitz, or local Vite/CRA project).

---

## License

MIT

---

## Links

- **Development Channel:** [@onezee_co](https://t.me/onezee_co) — daily progress updates
- **YouTube:** [OneZee](https://www.youtube.com/c/onezee) — video documentation
- **Season 1:** [Telegram Stars Shop](https://github.com/onezee/fraggram) — previous Proof of Work project
