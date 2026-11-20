import { P, cmd } from './_lib/redis.js';
import { authed, err, json } from './_lib/http.js';

// GET (Bearer) → name + backup, used by the Hunter Key to restore on a new device.
export async function GET(req: Request) {
  const a = await authed(req);
  if (!a) return err('Unknown hunter (401).', 401);
  const backup = await cmd('GET', `${P}bk:${a.id}`);
  return json({ name: a.u.name, hidden: a.u.hidden === '1', backup: backup ?? null });
}
