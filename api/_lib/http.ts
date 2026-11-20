import { P, cmd, hobj, pipe } from './redis.js';

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
export const err = (message: string, status = 400) => json({ error: message }, status);
export const cached = (seconds: number) => ({ 'cache-control': `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}` });

export async function body(req: Request): Promise<any> {
  try { return await req.json(); } catch { return {}; }
}

export function rid(len: number, alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789') {
  const b = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(b, (x) => alphabet[x % alphabet.length]).join('');
}
export const hexToken = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, '0')).join('');

export async function sha(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, '0')).join('');
}

export async function authed(req: Request) {
  const m = (req.headers.get('authorization') || '').match(/^Bearer ([a-z0-9]{6,16})\.([a-f0-9]{32})$/);
  if (!m) return null;
  const u = hobj(await cmd('HGETALL', `${P}u:${m[1]}`));
  if (!u || u.th !== (await sha(m[2]))) return null;
  return { id: m[1], u };
}

export const ip = (req: Request) => (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();

export async function limited(key: string, max: number, windowSec: number) {
  const k = `${P}rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const [n] = await pipe([['INCR', k], ['EXPIRE', k, windowSec]]);
  return Number(n) > max;
}

// ISO week in UTC, e.g. 2026-W47. The weekly board resets Monday 00:00 UTC.
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
}
export function weekResetsAt(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + (8 - day));
  return t.getTime();
}

const NAME_RE = /^[A-Za-z0-9_.-]{3,20}$/;
const BLOCK = ['admin', 'system', 'moderator', 'nigg', 'fag', 'retard', 'rape', 'hitler', 'nazi', 'cunt', 'whore', 'slut', 'chutiya', 'madarchod', 'bhenchod', 'randi'];
export function nameProblem(n: string): string | null {
  if (!NAME_RE.test(n)) return 'Use 3–20 letters, numbers, dot, dash or underscore.';
  const l = n.toLowerCase();
  if (BLOCK.some((b) => l.includes(b))) return 'Pick a different name.';
  return null;
}

const clampN = (v: unknown, lo: number, hi: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
};
const RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'N'];

// Trust nothing from the client: clamp every field of the snapshot.
export function cleanSnap(s: any) {
  s = s && typeof s === 'object' ? s : {};
  const st = s.stats || {};
  const t = s.totals || {};
  return {
    xp: Math.floor(clampN(s.xp, 0, 1e7)),
    wxp: Math.floor(clampN(s.wxp, 0, 1e6)),
    level: Math.floor(clampN(s.level, 1, 9999)),
    into: Math.floor(clampN(s.into, 0, 1e6)),
    need: Math.floor(clampN(s.need, 1, 1e6)),
    rank: RANKS.includes(s.rank) ? s.rank : 'E',
    streak: Math.floor(clampN(s.streak, 0, 10000)),
    best: Math.floor(clampN(s.best, 0, 10000)),
    title: String(s.title || 'Player').slice(0, 32),
    diff: ['E', 'D', 'C', 'B', 'A', 'S'].includes(s.diff) ? s.diff : 'E',
    stats: {
      str: Math.floor(clampN(st.str, 0, 99999)), agi: Math.floor(clampN(st.agi, 0, 99999)), int: Math.floor(clampN(st.int, 0, 99999)),
      vit: Math.floor(clampN(st.vit, 0, 99999)), per: Math.floor(clampN(st.per, 0, 99999)),
    },
    heat: (Array.isArray(s.heat) ? s.heat : []).slice(-84).map((x: unknown) => Math.floor(clampN(x, 0, 4))),
    totals: {
      reps: Math.floor(clampN(t.reps, 0, 1e8)), km: clampN(t.km, 0, 1e6), focus: Math.floor(clampN(t.focus, 0, 1e8)),
      questDays: Math.floor(clampN(t.questDays, 0, 1e5)),
    },
  };
}
export type CleanSnap = ReturnType<typeof cleanSnap>;

// Level must match XP; the server recomputes it so the board can't show a fake level.
export function levelFor(xp: number) {
  let level = 1;
  let rem = xp;
  while (rem >= 100 + 20 * (level - 1)) rem -= 100 + 20 * (level++ - 1);
  return { level, into: rem, need: 100 + 20 * (level - 1) };
}
export function rankFor(level: number) {
  return level >= 100 ? 'N' : level >= 70 ? 'S' : level >= 50 ? 'A' : level >= 35 ? 'B' : level >= 20 ? 'C' : level >= 10 ? 'D' : 'E';
}
export function withServerXp(s: CleanSnap, xp: number): CleanSnap {
  const lv = levelFor(xp);
  return { ...s, xp, level: lv.level, into: lv.into, need: lv.need, rank: rankFor(lv.level) };
}
