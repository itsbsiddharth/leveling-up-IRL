<div align="center">

<img src="public/og-image.png" alt="Leveling Up IRL" width="640" />

# Leveling Up IRL

**Turn real-life productivity into an RPG.**
Track focused work, earn XP, guard your HP and climb the hunter ranks from E to S.

[Features](#features) · [How it works](#how-it-works) · [Getting started](#getting-started) · [Architecture](#architecture) · [Deployment](#deployment)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth_%7C_Firestore-FFCA28?logo=firebase&logoColor=black)

</div>

---

## Overview

Leveling Up IRL (shipped in-app as **Grind IRL**) is a gamified productivity tracker. Every minute you spend
studying, training or recovering is logged as XP. Time lost to distractions costs HP. Consistency builds streaks,
and progress moves you through a hunter rank system with a global leaderboard to measure yourself against others.

It is built for students and self-improvers who find ordinary to-do lists and habit trackers easy to ignore.

## Features

| | |
|---|---|
| ⏱️ **Activity timer** | Start, pause and log sessions across four categories: Intellectual, Physical, Distractions and Recovery. Time can also be logged manually. |
| ⚡ **XP and HP** | Productive time earns XP; distractions drain HP; recovery restores it. High-quality sessions earn bonus XP. |
| 🏅 **Hunter ranks** | Progress from E-Rank to S-Rank, with unlimited levels beyond S-Rank. |
| 🔥 **Streaks** | Consecutive active days build a streak, with your best streak tracked separately. |
| 📜 **Quests** | Task management styled as quests, with categories, XP rewards, due dates and notes. |
| 🏆 **Achievements** | Unlockable milestones with visual badges. |
| 🌍 **Global leaderboard** | Compare XP and rank with every other hunter. |
| 📅 **Activity heatmap** | A calendar view of your daily effort on the profile page. |
| 🎧 **Ambient player** | A draggable, resizable in-app music player with track selection. |
| 📱 **Responsive** | Designed for both desktop and mobile. |

## How it works

### XP and HP

| Activity | Effect |
|---|---|
| Intellectual / Physical | **+1 XP per minute**. +50% for high-quality sessions. +5 XP bonus at 30 min and another +5 at 60 min. |
| Distractions | **−1 HP per 5 minutes**. Time beyond the first hour costs 50% more. Capped at 60 HP per session. |
| Recovery | **+2 HP per minute**, capped at 60 HP per session. |

Sessions longer than 12 hours ask for confirmation before they are logged.

### Ranks

| Rank | XP required |
|---|---:|
| E-Rank Hunter | 0 |
| D-Rank Hunter | 500 |
| C-Rank Hunter | 1,500 |
| B-Rank Hunter | 3,500 |
| A-Rank Hunter | 7,000 |
| S-Rank Hunter | 15,000 |

S-Rank is split into levels of 2,000 XP. After S-Rank Level 5, every additional level costs 1,000 XP, with no cap.

## Getting started

### Prerequisites

- Node.js 18 or later
- A [Firebase](https://firebase.google.com) project with **Authentication** (Google and Email link providers) and **Cloud Firestore** enabled

### Installation

```bash
git clone https://github.com/itsbsiddharth/leveling-up-IRL.git
cd leveling-up-IRL
npm install
```

### Configuration

Create a `.env.local` file in the project root with your Firebase web app config:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Then publish the contents of [`firestore.rules`](firestore.rules) under **Firebase Console → Firestore Database → Rules**.

See [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) for a step-by-step Firebase walkthrough.

### Run

```bash
npm run dev        # start the dev server at http://localhost:8080
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm run lint       # lint with ESLint
```

## Architecture

### Tech stack

| Layer | Technology |
|---|---|
| UI | React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix UI), Framer Motion |
| State | React Context (`AuthContext`, `GameContext`, `PopupContext`), TanStack Query |
| Routing | React Router |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Functions |
| Audio | Howler.js |
| Build | Vite |

### Project structure

```
src/
├── components/     UI components, grouped by feature
│   ├── achievements/
│   ├── dashboard/
│   ├── layout/
│   ├── leaderboard/
│   ├── popups/
│   ├── profile/
│   ├── timer/
│   └── ui/
├── context/        Auth, game-state and popup providers
├── firebase/       User and leaderboard services, schema
├── hooks/          Custom React hooks
├── pages/          Routes: Index, Timer, Quests, Achievements, Profile
└── utils/          Rank maths, activity summaries, popup helpers
functions/          Firebase Cloud Functions
public/             Static assets: images, sounds, music
```

### Data model

| Collection | Contents | Access |
|---|---|---|
| `users/{uid}` | Profile, settings and game stats (XP, HP, streak) | Owner only |
| `users/{uid}/userActivities` | Logged sessions: type, minutes, XP/HP change, quality flag | Owner only |
| `users/{uid}/userQuests` | Quests: title, category, XP value, due date, notes | Owner only |
| `users/{uid}/userAchievements` | Unlocked achievements | Owner only |
| `leaderboard/{uid}` | Public summary: name, XP, rank | Signed-in users read; owner writes |

Access is enforced by [`firestore.rules`](firestore.rules).

### Cloud Functions

| Function | Schedule | Purpose |
|---|---|---|
| `updateLeaderboard` | Every 30 minutes | Rebuilds leaderboard entries from user stats |
| `resetDailyQuests` | Daily, 00:00 | Resets daily quests |
| `awardStreakBonuses` | Daily, 01:00 | Grants streak rewards |

## Deployment

The app is a static single-page build and deploys to any static host. A Netlify configuration with SPA
redirects is included in [`netlify.toml`](netlify.toml):

```bash
npm run build      # outputs to dist/
```

Deploy the Cloud Functions separately:

```bash
firebase deploy --only functions
```

Remember to add your production domain under **Firebase Console → Authentication → Settings → Authorized domains**.

## Documentation

| Document | Topic |
|---|---|
| [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) | Firebase project setup |
| [`BACKGROUND_FEATURE.md`](BACKGROUND_FEATURE.md) | Animated background system |
| [`MEDIA_REQUIREMENTS.md`](MEDIA_REQUIREMENTS.md) | Image, sound and music assets |
| [`MOBILE_IMPROVEMENTS.md`](MOBILE_IMPROVEMENTS.md) | Mobile layout work |
| [`MOBILE_FIXES.md`](MOBILE_FIXES.md) | Mobile bug fixes |

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push and open a pull request

## Acknowledgements

Inspired by the "System" and hunter ranks of the *Solo Leveling* series. This is an independent fan project and is
not affiliated with or endorsed by the rights holders. Music and other third-party media in `public/` remain the
property of their respective owners.

---

<div align="center">
Built by <a href="https://bsid.dev">Siddharth</a>
</div>
