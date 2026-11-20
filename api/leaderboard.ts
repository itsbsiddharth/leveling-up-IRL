import { P, pipe } from './_lib/redis.js';
import { cached, err, json, weekKey, weekResetsAt } from './_lib/http.js';

const LIMIT = 100;

async function entries(ids: string[], scores: Map<string, number>) {
  if (!ids.length) return [];
  const rows = await pipe(ids.map((id) => ['HMGET', `${P}u:${id}`, 'name', 'snap', 'hidden']));
  return ids.flatMap((id, i) => {
    const [name, snapRaw, hidden] = rows[i] as (string | null)[];
    if (!name || hidden === '1') return [];
    let s: any = {};
    try { s = JSON.parse(snapRaw || '{}'); } catch { /* old row */ }
    return [{ id, name, score: Math.round(scores.get(id) ?? 0), level: s.level ?? 1, rank: s.rank ?? 'E', streak: s.streak ?? 0, title: s.title ?? 'Player' }];
  });
}

// GET ?board=week|all  or  ?board=guild&code=ABC123. Public: no account needed.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const board = q.get('board') ?? 'week';

  if (board === 'guild') {
    const code = (q.get('code') ?? '').toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return err('Bad guild code.');
    const [g, members] = await pipe([['HMGET', `${P}g:${code}`, 'name'], ['SMEMBERS', `${P}gm:${code}`]]);
    if (!g?.[0]) return err('Guild not found.', 404);
    const ids = (members as string[]) ?? [];
    const wk = `${P}lb:w:${weekKey()}`;
    const sc = await pipe(ids.map((id) => ['ZSCORE', wk, id]));
    const scores = new Map(ids.map((id, i) => [id, Number(sc[i] ?? 0)]));
    const list = (await entries(ids, scores)).sort((a, b) => b.score - a.score);
    return json({ entries: list, total: list.length, resetsAt: weekResetsAt(), guild: { code, name: g[0], count: ids.length } }, 200, cached(10));
  }

  if (board !== 'week' && board !== 'all') return err('Unknown board.');
  const key = board === 'week' ? `${P}lb:w:${weekKey()}` : `${P}lb:all`;
  const [flat, total] = await pipe([['ZRANGE', key, 0, LIMIT - 1, 'REV', 'WITHSCORES'], ['ZCARD', key]]);
  const ids: string[] = [];
  const scores = new Map<string, number>();
  for (let i = 0; i < (flat as string[]).length; i += 2) {
    ids.push(flat[i]);
    scores.set(flat[i], Number(flat[i + 1]));
  }
  const list = (await entries(ids, scores)).filter((e) => e.score > 0);
  return json({ entries: list, total: Number(total) || 0, resetsAt: board === 'week' ? weekResetsAt() : undefined }, 200, cached(15));
}
