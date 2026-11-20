// Pure game rules. No DOM, no storage: everything here is derived from the activity log.

export type Diff = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type QKey = 'push' | 'sit' | 'squat' | 'run';
export type GateKind = 'study' | 'work' | 'read' | 'train';

export const QUEST_ITEMS: { key: QKey; label: string; unit: string; steps: number[] }[] = [
  { key: 'push', label: 'Push-ups', unit: '', steps: [5, 10, 25] },
  { key: 'sit', label: 'Sit-ups', unit: '', steps: [5, 10, 25] },
  { key: 'squat', label: 'Squats', unit: '', steps: [5, 10, 25] },
  { key: 'run', label: 'Run', unit: 'km', steps: [0.5, 1, 2] },
];

export const DIFFS: Record<Diff, { name: string; reps: number; km: number; xp: number }> = {
  E: { name: 'Beginner', reps: 10, km: 1, xp: 60 },
  D: { name: 'Novice', reps: 25, km: 2, xp: 90 },
  C: { name: 'Regular', reps: 50, km: 3, xp: 120 },
  B: { name: 'Athlete', reps: 75, km: 5, xp: 160 },
  A: { name: 'Elite', reps: 100, km: 7, xp: 200 },
  S: { name: 'Hunter', reps: 100, km: 10, xp: 250 },
};

export const GATE_KINDS: { kind: GateKind; label: string }[] = [
  { kind: 'study', label: 'Study' },
  { kind: 'work', label: 'Deep work' },
  { kind: 'read', label: 'Read' },
  { kind: 'train', label: 'Train' },
];

export const PENALTY_REPS = 30;
export const SIDE_XP = 15;
export const PENALTY_XP = 40;
export const MAX_GATE_MIN = 240;

export interface Gate { kind: GateKind; min: number; full: boolean; at: number }
export interface Day { diff: Diff; q: Partial<Record<QKey, number>>; side: string[]; gates: Gate[]; pen?: number }
export type Days = Record<string, Day>;

export const target = (d: Diff, k: QKey) => (k === 'run' ? DIFFS[d].km : DIFFS[d].reps);
export const emptyDay = (diff: Diff): Day => ({ diff, q: {}, side: [], gates: [] });

// ---------- dates (local calendar days, 'YYYY-MM-DD') ----------
export function dayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function shift(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n, 12));
}
export function msToMidnight(now = new Date()): number {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return t.getTime() - now.getTime();
}

// ---------- quest ----------
export function itemFrac(day: Day, k: QKey): number {
  return Math.min(1, (day.q[k] ?? 0) / target(day.diff, k));
}
export function questDone(day?: Day): boolean {
  return !!day && QUEST_ITEMS.every((i) => itemFrac(day, i.key) >= 1);
}
export const penaltyPaid = (day?: Day) => !!day && (day.pen ?? 0) >= PENALTY_REPS;
export const gateXp = (g: Gate) => g.min + (g.full ? Math.round(g.min * 0.2) : 0);

export function dayXp(day: Day): number {
  const base = DIFFS[day.diff].xp;
  let x = 0;
  for (const i of QUEST_ITEMS) x += (itemFrac(day, i.key) * base) / 5;
  if (questDone(day)) x += base / 5;
  x += day.side.length * SIDE_XP;
  for (const g of day.gates) x += gateXp(g);
  if (penaltyPaid(day)) x += PENALTY_XP;
  return Math.round(x);
}
export const totalXp = (days: Days) => Object.values(days).reduce((s, d) => s + dayXp(d), 0);

// ---------- levels & ranks ----------
export const xpNeed = (level: number) => 100 + 20 * (level - 1);
export function levelInfo(xp: number) {
  let level = 1;
  let rem = Math.max(0, xp);
  while (rem >= xpNeed(level)) rem -= xpNeed(level++);
  return { level, into: rem, need: xpNeed(level) };
}

export const RANKS = [
  { r: 'E', min: 1, name: 'E-Rank', color: '#9aa6ba' },
  { r: 'D', min: 10, name: 'D-Rank', color: '#6fdc8c' },
  { r: 'C', min: 20, name: 'C-Rank', color: '#5cc8ff' },
  { r: 'B', min: 35, name: 'B-Rank', color: '#7c94ff' },
  { r: 'A', min: 50, name: 'A-Rank', color: '#b483ff' },
  { r: 'S', min: 70, name: 'S-Rank', color: '#ffc95c' },
  { r: 'N', min: 100, name: 'National Level', color: '#ff6b7a' },
] as const;
export type Rank = (typeof RANKS)[number];
export function rankOf(level: number): Rank {
  let out: Rank = RANKS[0];
  for (const r of RANKS) if (level >= r.min) out = r;
  return out;
}
export const rankByLetter = (r: string): Rank => RANKS.find((x) => x.r === r) ?? RANKS[0];

// ---------- streaks & the Penalty Zone ----------
// A day counts if its Daily Quest is complete. One missed day is forgiven if the
// next day's quest is complete AND its penalty (burpees) is paid.
export function streakFrom(days: Days, start: string): number {
  let n = 0;
  let k = start;
  for (;;) {
    if (questDone(days[k])) { n++; k = shift(k, -1); continue; }
    const next = shift(k, 1);
    const before = shift(k, -1);
    if (n > 0 && penaltyPaid(days[next]) && questDone(days[before])) { k = before; continue; }
    return n;
  }
}

export function streakInfo(days: Days, today: string) {
  const y = shift(today, -1);
  const current = questDone(days[today]) ? streakFrom(days, today) : streakFrom(days, y);
  // Penalty Zone: yesterday missed, the day before was done.
  const zone = !questDone(days[y]) && questDone(days[shift(y, -1)]);
  const atStake = zone ? streakFrom(days, shift(y, -1)) : 0;
  let best = current;
  for (const k of Object.keys(days)) if (questDone(days[k])) best = Math.max(best, streakFrom(days, k));
  return { current, best, zone, atStake, paid: penaltyPaid(days[today]) };
}

// ---------- totals, stats, titles ----------
export function totals(days: Days) {
  const t = { reps: 0, km: 0, study: 0, work: 0, read: 0, train: 0, focus: 0, side: 0, questDays: 0, gates: 0, pens: 0 };
  for (const d of Object.values(days)) {
    t.reps += (d.q.push ?? 0) + (d.q.sit ?? 0) + (d.q.squat ?? 0) + (d.pen ?? 0);
    t.km += d.q.run ?? 0;
    for (const g of d.gates) { t[g.kind] += g.min; t.focus += g.min; t.gates++; }
    t.side += d.side.length;
    if (questDone(d)) t.questDays++;
    if (penaltyPaid(d)) t.pens++;
  }
  t.km = Math.round(t.km * 10) / 10;
  return t;
}
export type Totals = ReturnType<typeof totals>;

export interface Stats { str: number; agi: number; int: number; vit: number; per: number }
export function stats(t: Totals): Stats {
  return {
    str: 10 + Math.floor(t.reps / 150),
    agi: 10 + Math.floor(t.km / 5),
    int: 10 + Math.floor((t.study + t.work) / 120),
    vit: 10 + Math.floor(t.questDays / 2) + Math.floor(t.train / 120),
    per: 10 + Math.floor((t.read + t.side * 10) / 120),
  };
}
export const STAT_LABELS: [keyof Stats, string, string][] = [
  ['str', 'STR', 'Push-ups, sit-ups, squats'],
  ['agi', 'AGI', 'Kilometres run'],
  ['int', 'INT', 'Study and deep-work gates'],
  ['vit', 'VIT', 'Quest days and training'],
  ['per', 'PER', 'Reading and side quests'],
];

type TitleCtx = { t: Totals; best: number; level: number };
export const TITLES: { id: string; name: string; desc: string; test: (c: TitleCtx) => boolean }[] = [
  { id: 'player', name: 'Player', desc: 'Accept the quest', test: () => true },
  { id: 'awakened', name: 'Awakened', desc: 'Clear your first Daily Quest', test: (c) => c.t.questDays >= 1 },
  { id: 'penitent', name: 'Penitent', desc: 'Survive the Penalty Zone', test: (c) => c.t.pens >= 1 },
  { id: 'gatebreaker', name: 'Gatebreaker', desc: 'Clear 10 gates', test: (c) => c.t.gates >= 10 },
  { id: 'unbroken', name: 'Unbroken', desc: 'Reach a 7-day streak', test: (c) => c.best >= 7 },
  { id: 'iron', name: 'Iron Body', desc: 'Log 1,000 reps', test: (c) => c.t.reps >= 1000 },
  { id: 'marathoner', name: 'Marathoner', desc: 'Run 42 km in total', test: (c) => c.t.km >= 42 },
  { id: 'scholar', name: 'Scholar', desc: 'Spend 50 hours in gates', test: (c) => c.t.focus >= 3000 },
  { id: 'monarch', name: 'Monarch of Habit', desc: 'Reach a 30-day streak', test: (c) => c.best >= 30 },
  { id: 'srank', name: 'S-Rank Hunter', desc: 'Reach level 70', test: (c) => c.level >= 70 },
];
export const unlockedTitles = (c: TitleCtx) => TITLES.filter((x) => x.test(c));

export function heat(days: Days, today: string, n = 84): number[] {
  const out: number[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = days[shift(today, -i)];
    const x = d ? dayXp(d) : 0;
    out.push(x === 0 ? 0 : x < 60 ? 1 : x < 150 ? 2 : x < 300 ? 3 : 4);
  }
  return out;
}

// XP earned since Monday (local), for the first weekly-board entry.
export function weekXp(days: Days, today: string): number {
  const [y, m, d] = today.split('-').map(Number);
  const dow = (new Date(y, m - 1, d, 12).getDay() + 6) % 7;
  let x = 0;
  for (let i = 0; i <= dow; i++) { const day = days[shift(today, -i)]; if (day) x += dayXp(day); }
  return x;
}

// Everything the leaderboard and profile need, in one object.
export function snapshot(days: Days, diff: Diff | null, today = dayKey()) {
  const xp = totalXp(days);
  const lv = levelInfo(xp);
  const st = streakInfo(days, today);
  const t = totals(days);
  const titles = unlockedTitles({ t, best: st.best, level: lv.level });
  return {
    xp,
    wxp: weekXp(days, today),
    level: lv.level,
    into: lv.into,
    need: lv.need,
    rank: rankOf(lv.level).r,
    streak: st.current,
    best: st.best,
    title: titles[titles.length - 1].name,
    diff: diff ?? 'E',
    stats: stats(t),
    heat: heat(days, today),
    totals: { reps: t.reps, km: t.km, focus: t.focus, questDays: t.questDays },
  };
}
export type Snapshot = ReturnType<typeof snapshot>;
