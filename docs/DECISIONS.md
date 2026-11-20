# Decisions

Short records of why things are the way they are. Newest first.

## 2026-11-20: Rebuild from scratch instead of fixing v1
v1 had a forced sign-in, a private leaderboard, two backends, 40+ UI packages and copyrighted audio.
Fixing it would take longer than rewriting the ~2k lines that matter.

## 2026-11-20: Preact + Vite, plain CSS
The app is a handful of screens. Preact gives the React API at ~4 KB; plain CSS with design tokens avoids
a component library. Target: first load under 60 KB gzipped on Indian 4G.

## 2026-11-20: Local-first, server only for the leaderboard
All progress lives in `localStorage`, and XP is *derived* from the activity log (never stored on its own), so it
can't drift. The server keeps a public snapshot (name, level, stats) for leaderboards and profiles.

## 2026-11-20: No accounts. Device token + "Hunter Key"
Joining the board needs only a name. The server returns an id + secret token (stored as a SHA-256 hash).
The Hunter Key (`id.token`) restores progress on another device. No email, no OAuth, no passwords.

## 2026-11-20: Vercel Functions + Upstash Redis
Sorted sets are a leaderboard. Upstash is already installed on the Vercel team, its REST API needs no SDK,
and leaderboard reads are CDN-cached for 15 s so traffic spikes don't hit Redis.

## 2026-11-20: Anti-cheat by plausibility, not trust
The server clamps XP gain to `300 + 1.5 × minutes since last sync`. A script can't post 1M XP, and a real
heavy day (~1,500 XP) is never blocked.

## 2026-11-20: Original wording and art only
Inspired by the System from the manhwa/anime, but no names, art, music or quotes from it, and no GTA assets.
