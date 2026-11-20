# Leveling Up IRL v2: product plan

_Last updated: 2026-11-20_

## One line

Your real-life System: a daily quest, focus "gates" and hunter ranks, plus a public leaderboard.
Open the link and you're playing. No install and no sign-up.

## Why rebuild

v1 (Mar–Apr 2025) worked, but nobody would stick with it:

| Problem in v1 | Effect |
|---|---|
| Sign-in wall (Google / email link) before anything | Most visitors bounce before seeing the product |
| Leaderboard readable only when signed in | No social proof, nothing to share |
| ~13.7k lines, 40+ UI packages, Firebase **and** Supabase, 1.2k-line music player | Slow load, hard to change, bugs |
| 16 MB of copyrighted anime OST in `public/music` | Legal takedown risk on a public site |
| `.env` with a Google OAuth client secret committed to a public repo | Security leak (secret must be rotated) |

## Market check (Nov 2026)

- **Demand is real.** The App Store has a dozen+ "Solo Leveling system" habit apps (SYSTEM, Solo Level: System,
  Solo Hunter, Quest Leveling, Dual, Awakened…). The "daily quest" workout from the series
  (100 push-ups / sit-ups / squats + 10 km) is a recurring TikTok challenge, with scaled-down versions.
- **The gap:** they are all native installs, most need an account, and several have **no social layer at all**
  (SYSTEM's listing says "no social features or leaderboards"). Nobody owns
  "open a link → playing in 3 seconds → post your status card".
- **Who:** students and young gym-goers (16–25), anime fans, India and US first. Same crowd that uses
  YPT / Forest-style study timers with study groups.

## The product (v2 scope)

Guest-first. Everything works offline in the browser; the server only holds the leaderboard.

1. **Daily Quest**: push-ups, sit-ups, squats, run. Six tiers from E (10/10/10/1 km) to S
   (100/100/100/10 km, the "real one"). Tap to log reps, see the bars fill, then the System pops "QUEST COMPLETE".
2. **Penalty Zone**: miss a day and the next day adds 30 burpees. Pay it and your streak survives
   (works like a streak repair; the main retention hook).
3. **Gates**: focus timer (study / work / read / train, 25/50/90/open). 1 XP per minute, +20% for clearing the full gate.
4. **Side quests**: up to 6 of your own daily habits (water, reading, no phone…).
5. **Status window**: level, rank E→S→National, title, five stats (STR AGI INT VIT PER) derived from what you
   actually did, streak, 12-week heatmap.
6. **Public leaderboard**: weekly and all-time, **visible to everyone without joining**. To appear, type a name, nothing else.
7. **Guilds**: private friend leaderboards with an invite link. This is the viral loop.
8. **Share card**: one tap makes a 1080×1920 status image for stories, plus a public profile link `/h/<name>`
   with a rich link preview.
9. **Hunter Key**: "sign in later" without accounts. A secret link that restores your progress on another device.

### Not now

- Google sign-in (the Hunter Key covers cross-device; add Google once someone asks for it)
- Push reminders (needs a service worker plus a cron; v2.1)
- Native apps (the web app is installable as a PWA)
- **GTA 6 edition: dropped.** GTA 6 launched 2026-11-19. People hyped for it are playing it, not tracking
  habits; a GTA look is Rockstar/Take-Two IP and a takedown risk; a second theme splits a v1 that has zero users.
  We use the moment for launch copy instead (see [LAUNCH.md](LAUNCH.md)).

## Metrics that matter

- **Activation:** % of visitors who log their first rep within 60 s (target > 40%)
- **D1 / D7 retention:** % who complete the quest the next day / a week later
- **K-factor:** guild invites and share-card opens per active hunter
- **North star:** Daily Quests completed per day

## Roadmap

| When | What |
|---|---|
| v2.0 | Everything in scope above, deployed on Vercel at a bsid.dev subdomain |
| v2.1 | Push reminders, weekly recap card, guild weekly winner |
| v2.2 | Seasons (monthly reset with badges), custom quest sets (study-only, yoga…) |
| later | Google sign-in, native wrapper if web retention proves out |
