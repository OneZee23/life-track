# LifeTrack

> Minimalist daily habit tracker — slider 0–10, GitHub-style progress, 30 seconds a day

**Status:** MVP in Development | **Started:** Feb 12, 2026 | **Format:** Proof of Work · Season 2

**Current Status:**
- ✅ Business requirements (PRD) written
- ✅ Technical solution defined
- ✅ UI prototype ready (JSX)
- ⏳ Apple Developer Account registration in progress
- 🎯 React Native + Expo implementation next

---

## TL;DR

Most habit trackers fail because they demand too much effort — calories, timers, detailed analytics — and become a source of stress themselves. LifeTrack strips it down to the bare minimum: every morning you rate yesterday on a slider (0–10) for each habit. That's it. 30 seconds, done.

A GitHub-style contribution grid shows your progress at a glance. Green streaks feel good. Gaps hurt. That's all the motivation you need.

**Target audience:** Anyone who wants to build habits without the overhead of complex tracking apps.

---

## The Story

This project started from a personal health situation. After a serious diagnosis in early 2025, I had to rebuild 5 core areas of my life: sleep, physical activity, nutrition, mental health, and personal projects.

I started tracking manually — a paper journal for food, Apple Watch for activity and sleep, Google Calendar for work schedule, notes for therapy insights. Over a year, the results were visible and real. But there was no single tool that made this simple and beautiful.

The idea for LifeTrack came when a friend who runs a YouTube channel about his esports journey reached out. He tracks sleep 5/5, food 4/5, activity 3/5 in Excel for his videos. His audience started asking: "Where's the app for this?" There wasn't one.

We debated the scoring system with the community for days. Binary (did/didn't) felt too rough. Detailed scores (1–10 with decimals) felt too stressful. The compromise: **a gradient slider from 0 to 10**. One thumb movement. No overthinking. Red to yellow to green. Done.

First post: [Day 0/30 · Season 2](https://t.me/onezee_co/97)

---

## Why LifeTrack?

The name follows the "-Track" universe: **LifeTrack** (habit tracker), **TeachTrack** (ed-tech for tutors, future project). Same philosophy — track what matters, keep it simple.

### Key Hypothesis

> People abandon habit trackers because they require too much effort. If you reduce check-in to 30 seconds and provide beautiful progress visualization — retention will be higher than competitors.

### What Makes It Different

| Problem with existing apps | LifeTrack approach |
|---|---|
| Complex forms, KBJU, timers | One slider per habit, 30 seconds total |
| Subscription fatigue | Free. No paywall, no limits |
| Data collection, accounts | Zero analytics, fully offline, no registration |
| Overwhelming dashboards | GitHub-style grid — one glance |
| Push notifications, nagging | Silent. No reminders in MVP |

---

## Tech Stack

```
Framework:   React Native + Expo SDK 54 (TypeScript)
State:       Zustand
Animations:  Reanimated 4 + Gesture Handler (60fps slider)
Haptics:     expo-haptics
Database:    expo-sqlite (fully offline, local-first)
Build:       EAS Build (cloud builds for iOS/Android)
Backend:     None in MVP (planned NestJS + PostgreSQL for v2 sync)
```

---

## Documentation

Full project documentation is in [`docs/`](./docs/):

| Document | Description |
|----------|-------------|
| [Product Requirements (PRD)](./docs/lifetrack-prd.md) | Business requirements, user personas, MoSCoW scope, monetization strategy |
| [Technical Solution](./docs/technical-solution.md) | Architecture, data model, Zustand stores, component mapping, SQLite schema |
| [UI Prototype (JSX)](./docs/lifetrack-mvp.jsx) | Interactive web prototype — all screens, themes, slider, contribution grid |

---

## Features (MVP Scope)

### Must Have

- [ ] **Daily check-in** — rate yesterday's habits via slider (0–10), one screen, 30 seconds
- [ ] **Gradient slider** — red (0) → yellow (5) → green (10), haptic feedback on each step
- [ ] **Year view** — GitHub contribution grid, color-coded by daily average
- [ ] **Month view** — calendar grid with streaks (current + best)
- [ ] **Week view** — per-habit breakdown with mini bars
- [ ] **Habit filter** — horizontal chips to view progress for one specific habit
- [ ] **Habit management** — add, edit, delete, reorder (max 10 habits)
- [ ] **Local storage** — SQLite, all data on device, zero network requests
- [ ] **Time progress bar** — days passed/remaining in year, month, week

### Default Habits (first launch)

| Emoji | Name |
|-------|------|
| 🛌 | Sleep |
| 🚴 | Activity |
| 🥗 | Nutrition |
| 🧠 | Mental |
| 💻 | Projects |

---

## Roadmap

### Phase 1: MVP (current)

- [x] Concept and business requirements (PRD)
- [x] UI prototype (JSX)
- [x] Technical solution document
- [ ] Expo project setup
- [ ] SQLite schema and migrations
- [ ] Check-in screen with sliders
- [ ] Progress screen (year / month / week)
- [ ] Habit management screen
- [ ] Testing on iOS + Android
- [ ] Publish to Google Play
- [ ] Publish to App Store (pending developer account)

### Phase 2: Polish

- [ ] Onboarding (2–3 screens)
- [ ] Data export (CSV/JSON)
- [ ] iOS widget (streak on lock screen)
- [ ] English localization
- [ ] "About" section with Telegram channel link
- [ ] Light theme
- [ ] Analytics (Firebase, opt-in)

### Phase 3: Backend & Monetization

- [ ] NestJS + PostgreSQL backend
- [ ] Cross-device sync (free for all users)
- [ ] Auth (only for sync)
- [ ] Public Grafana dashboard with business metrics
- [ ] Daily Check-in Rewards (rewarded ads — separate from core tracking)
- [ ] Correlation analytics ("when you sleep 8h, next day activity is +40%")
- [ ] Weekly/monthly reports

### Phase 4: Expansion

- [ ] Apple Health / HealthKit integration
- [ ] Apple Watch complication
- [ ] Telegram Mini App version

---

## Proof of Work

This project is Season 2 of the Proof of Work challenge. Season 1 was [Telegram Stars Shop](https://github.com/0nezee/telegram-stars-market) — 29 days of building an automated Stars marketplace, which taught us that sometimes the hardest part isn't code, but legal and business infrastructure.

The format: pick a project, build it in 30 days, document everything publicly. Not about speed — about the process.

Season 2 started with a community vote. The habit tracker won. The entire journey — from idea debates to architecture decisions to "should we use binary or slider scoring" — is documented in the Telegram channel.

---

## Development Format

The project is developed openly in a "Proof of Work" format:

- All stages documented in [Telegram channel](https://t.me/onezee_co)
- Code published in this repository
- Progress tracked in daily posts
- Community feedback shapes product decisions
- Can be run locally

---

## Quick Start

> Coming soon — Expo project setup in progress.

```bash
# Clone
git clone https://github.com/0nezee/life-track.git
cd life-track

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

---

## Contributing

The project is actively under development. If you want to help or have questions — create Issues or PRs.

---

## License

MIT

---

## Links

- **Telegram Channel:** [@onezee_co](https://t.me/onezee_co) — daily progress, discussions, votes
- **First Post (Season 2):** [Day 0/30](https://t.me/onezee_co/97)
- **YouTube:** [OneZee](https://www.youtube.com/c/onezee)
