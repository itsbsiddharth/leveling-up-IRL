import { P, pipe, cmd } from './_lib/redis.js';
import { body, cleanSnap, err, hexToken, ip, json, limited, nameProblem, rid, sha, weekKey, withServerXp } from './_lib/http.js';

// POST { name, snap } → { id, token, name }. No email, no password.
export async function POST(req: Request) {
  const b = await body(req);
  const name = String(b.name ?? '').trim();
  const problem = nameProblem(name);
  if (problem) return err(problem);
  if (await limited(`reg:${ip(req)}`, 8, 3600)) return err('Too many new hunters from this network. Try again later.', 429);

  const id = rid(10);
  const token = hexToken();
  if (!(await cmd('SET', `${P}name:${name.toLowerCase()}`, id, 'NX'))) return err('That name is taken.', 409);

  const s = cleanSnap(b.snap);
  // Offline progress before joining is trusted up to ~2 weeks of heavy play.
  const xp = Math.min(s.xp, 3000);
  const wxp = Math.min(s.wxp, xp);
  const now = Date.now();
  const wk = `${P}lb:w:${weekKey()}`;
  await pipe([
    ['HSET', `${P}u:${id}`, 'name', name, 'th', await sha(token), 'xp', xp, 'created', now, 'sync', now, 'hidden', 0, 'snap', JSON.stringify(withServerXp(s, xp))],
    ['ZADD', `${P}lb:all`, xp, id],
    ['ZINCRBY', wk, wxp, id],
    ['EXPIRE', wk, 60 * 60 * 24 * 40],
  ]);
  return json({ id, token, name });
}
