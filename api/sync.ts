import { P, cmd, pipe } from './_lib/redis.js';
import { authed, body, cleanSnap, err, json, limited, nameProblem, weekKey, withServerXp } from './_lib/http.js';

const MAX_BACKUP = 400_000;

// POST (Bearer id.token) { snap, backup?, name?, hidden? }
export async function POST(req: Request) {
  const a = await authed(req);
  if (!a) return err('Unknown hunter (401).', 401);
  if (await limited(`sync:${a.id}`, 40, 60)) return err('Slow down.', 429);
  const b = await body(req);
  const s = cleanSnap(b.snap);
  const u = a.u;
  const now = Date.now();

  // Plausibility clamp: you can't earn faster than a very busy human.
  const prev = Number(u.xp) || 0;
  const mins = Math.max(0, (now - (Number(u.sync) || now)) / 60000);
  let delta = s.xp - prev;
  const allow = Math.floor(300 + 1.5 * mins);
  if (delta > allow) delta = allow;
  const xp = Math.max(0, prev + delta);
  const hidden = typeof b.hidden === 'boolean' ? (b.hidden ? 1 : 0) : Number(u.hidden) || 0;

  let name = u.name;
  let nameError: string | undefined;
  if (typeof b.name === 'string' && b.name.trim() && b.name.trim() !== u.name) {
    const want = b.name.trim();
    nameError = nameProblem(want) ?? undefined;
    if (!nameError) {
      const sameLower = want.toLowerCase() === u.name.toLowerCase();
      if (sameLower || (await cmd('SET', `${P}name:${want.toLowerCase()}`, a.id, 'NX'))) {
        if (!sameLower) await cmd('DEL', `${P}name:${u.name.toLowerCase()}`);
        name = want;
      } else nameError = 'That name is taken.';
    }
  }

  const wk = `${P}lb:w:${weekKey()}`;
  const cmds: (string | number)[][] = [
    ['HSET', `${P}u:${a.id}`, 'xp', xp, 'sync', now, 'hidden', hidden, 'name', name, 'snap', JSON.stringify(withServerXp(s, xp))],
  ];
  if (hidden) cmds.push(['ZREM', `${P}lb:all`, a.id], ['ZREM', wk, a.id]);
  else {
    cmds.push(['ZADD', `${P}lb:all`, xp, a.id]);
    if (delta !== 0) cmds.push(['ZINCRBY', wk, delta, a.id], ['EXPIRE', wk, 60 * 60 * 24 * 40]);
  }
  if (typeof b.backup === 'string' && b.backup.length <= MAX_BACKUP) cmds.push(['SET', `${P}bk:${a.id}`, b.backup]);
  cmds.push(['ZREVRANK', `${P}lb:all`, a.id], ['ZREVRANK', wk, a.id]);

  const out = await pipe(cmds);
  const [all, week] = out.slice(-2);
  return json({ xp, name, nameError, rank: { all: all == null ? null : Number(all) + 1, week: week == null ? null : Number(week) + 1 } });
}
