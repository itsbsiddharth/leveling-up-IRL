import { P, cmd, pipe } from './_lib/redis.js';
import { err, json } from './_lib/http.js';

export async function getProfile(name: string) {
  if (!/^[A-Za-z0-9_.-]{3,20}$/.test(name)) return null;
  const id = await cmd('GET', `${P}name:${name.toLowerCase()}`);
  if (!id) return null;
  const [row] = await pipe([['HMGET', `${P}u:${id}`, 'name', 'snap', 'created', 'hidden']]);
  const [n, snap, created, hidden] = row as (string | null)[];
  if (!n || hidden === '1') return null;
  let s: any = {};
  try { s = JSON.parse(snap || '{}'); } catch { /* ignore */ }
  return { ...s, name: n, created: Number(created) };
}

// GET ?name=… → public status window. No account needed to view.
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name') ?? '';
  const p = await getProfile(name);
  if (!p) return err('Hunter not found.', 404);
  return json(p, 200, { 'cache-control': 'public, s-maxage=30, stale-while-revalidate=120' });
}
