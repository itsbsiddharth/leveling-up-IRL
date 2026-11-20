import { useEffect, useState } from 'preact/hooks';
import {
  Day, Days, Diff, GateKind, MAX_GATE_MIN, dayKey, emptyDay, levelInfo, questDone, snapshot,
  totalXp, totals, unlockedTitles, streakInfo, rankOf,
} from './game';
import { api } from './api';
import { chime } from './sound';

export interface SideQuest { id: string; label: string }
export interface Acct { id: string; token: string }
export interface ActiveGate { kind: GateKind; start: number; plan: number }

export interface State {
  v: 1;
  created: number;
  diff: Diff | null;
  days: Days;
  side: SideQuest[];
  name: string;
  acct: Acct | null;
  hidden: boolean;
  guilds: string[];
  sound: boolean;
  gate: ActiveGate | null;
  claimLater: string | null;
}

const KEY = 'lu:v1';
const fresh = (): State => ({
  v: 1, created: Date.now(), diff: null, days: {}, side: [], name: '', acct: null, hidden: false,
  guilds: [], sound: true, gate: null, claimLater: null,
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch { /* private mode or corrupt: start fresh */ }
  return fresh();
}

let state = load();
const subs = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

export const getState = () => state;

export function useStore(): State {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return state;
}

// ---------- System notices (popups) ----------
export interface Notice { id: number; kind: 'level' | 'quest' | 'title' | 'info' | 'warn'; title: string; body?: string }
let notices: Notice[] = [];
const noticeSubs = new Set<(n: Notice[]) => void>();
let nid = 0;
export function notify(n: Omit<Notice, 'id'>) {
  const item = { ...n, id: ++nid };
  notices = [...notices, item];
  noticeSubs.forEach((f) => f(notices));
  setTimeout(() => dismiss(item.id), n.kind === 'level' ? 4200 : 2800);
}
export function dismiss(id: number) {
  notices = notices.filter((x) => x.id !== id);
  noticeSubs.forEach((f) => f(notices));
}
export function useNotices() {
  const [n, setN] = useState(notices);
  useEffect(() => { noticeSubs.add(setN); return () => { noticeSubs.delete(setN); }; }, []);
  return n;
}

// ---------- updates ----------
function progressKey(s: State) {
  const today = dayKey();
  const xp = totalXp(s.days);
  const lv = levelInfo(xp).level;
  const t = totals(s.days);
  const best = streakInfo(s.days, today).best;
  return { lv, done: questDone(s.days[today]), titles: unlockedTitles({ t, best, level: lv }).map((x) => x.name) };
}

export function update(fn: (s: State) => void, opts: { quiet?: boolean } = {}) {
  const before = progressKey(state);
  const next: State = structuredClone(state);
  fn(next);
  state = next;
  persist();
  subs.forEach((f) => f());
  if (opts.quiet) return;

  const after = progressKey(state);
  if (after.done && !before.done) {
    notify({ kind: 'quest', title: 'Quest complete', body: 'Daily Quest cleared. Rewards received.' });
    if (state.sound) chime('quest');
  }
  if (after.lv > before.lv) {
    const r = rankOf(after.lv);
    notify({ kind: 'level', title: `Level up · ${after.lv}`, body: rankOf(before.lv).r !== r.r ? `Rank up: ${r.name}` : 'Your stats have grown.' });
    if (state.sound) chime('level');
  }
  for (const t of after.titles) if (!before.titles.includes(t)) notify({ kind: 'title', title: 'Title acquired', body: t });
  scheduleSync();
}

export function today(s: State): Day {
  const k = dayKey();
  return s.days[k] ?? emptyDay(s.diff ?? 'E');
}
export function editToday(fn: (d: Day) => void) {
  update((s) => {
    const k = dayKey();
    const d = s.days[k] ?? emptyDay(s.diff ?? 'E');
    fn(d);
    s.days[k] = d;
  });
}

// ---------- gates ----------
export function finishGate(s: State, now = Date.now()) {
  const g = s.gate;
  if (!g) return;
  const elapsed = Math.min(MAX_GATE_MIN, Math.floor((now - g.start) / 60000));
  const full = g.plan > 0 && elapsed >= g.plan;
  const min = full ? g.plan : elapsed;
  update((st) => {
    st.gate = null;
    if (min < 1) return;
    const k = dayKey();
    const d = st.days[k] ?? emptyDay(st.diff ?? 'E');
    d.gates.push({ kind: g.kind, min, full, at: g.start });
    st.days[k] = d;
  });
  if (min < 1) notify({ kind: 'warn', title: 'Gate closed', body: 'Under a minute, so no XP this time.' });
  else notify({ kind: 'quest', title: full ? 'Gate cleared' : 'Gate closed', body: `${min} min logged${full ? ' · +20% clear bonus' : ''}` });
  if (s.sound && min >= 1) chime('quest');
}

// ---------- server sync ----------
let syncTimer: ReturnType<typeof setTimeout> | undefined;
export function scheduleSync(delay = 3000) {
  if (!state.acct) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, delay);
}

export function backupOf(s: State) {
  const { acct: _a, gate: _g, ...rest } = s;
  return JSON.stringify(rest);
}

export async function syncNow(extra: { name?: string; hidden?: boolean } = {}) {
  const s = state;
  if (!s.acct) return null;
  try {
    const res = await api.sync(s.acct, {
      snap: snapshot(s.days, s.diff),
      backup: backupOf(s),
      ...extra,
    });
    if (res.name && res.name !== state.name) update((st) => { st.name = res.name; }, { quiet: true });
    return res;
  } catch (e) {
    if (e instanceof Error && /401/.test(e.message)) update((st) => { st.acct = null; }, { quiet: true });
    return null;
  }
}

export async function join(name: string) {
  const s = state;
  const res = await api.register(name, snapshot(s.days, s.diff));
  update((st) => { st.acct = { id: res.id, token: res.token }; st.name = res.name; }, { quiet: true });
  void syncNow();
  return res;
}

export function restore(acct: Acct, backup: string | null, name: string) {
  let next: State = { ...fresh(), acct, name };
  if (backup) {
    try { next = { ...next, ...JSON.parse(backup), acct, name }; } catch { /* keep fresh */ }
  }
  state = next;
  persist();
  subs.forEach((f) => f());
}

export function resetAll() {
  state = fresh();
  persist();
  subs.forEach((f) => f());
}

export const hunterKey = (a: Acct) => `${a.id}.${a.token}`;
export function parseKey(k: string): Acct | null {
  const m = k.trim().match(/([a-z0-9]{6,16})\.([a-f0-9]{32})/);
  return m ? { id: m[1], token: m[2] } : null;
}

if (typeof window !== 'undefined') {
  // Sync when the tab is hidden so the board stays fresh.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') scheduleSync(0); });
  // Another tab changed progress.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { state = load(); subs.forEach((f) => f()); }
  });
}
