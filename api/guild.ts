import { P, cmd, pipe } from './_lib/redis.js';
import { authed, body, cached, err, json, limited, rid } from './_lib/http.js';

const MAX_MEMBERS = 50;
const MAX_GUILDS = 10;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// GET ?code=ABC123 → public guild info (for invite links)
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get('code') ?? '').toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return err('Bad guild code.');
  const [g, count] = await pipe([['HMGET', `${P}g:${code}`, 'name'], ['SCARD', `${P}gm:${code}`]]);
  if (!g?.[0]) return err('Guild not found.', 404);
  return json({ code, name: g[0], count: Number(count) }, 200, cached(30));
}

// POST (Bearer) { action: 'create', name } | { action: 'join' | 'leave', code }
export async function POST(req: Request) {
  const a = await authed(req);
  if (!a) return err('Unknown hunter (401).', 401);
  if (await limited(`guild:${a.id}`, 20, 3600)) return err('Too many guild actions. Try later.', 429);
  const b = await body(req);
  const mine = `${P}ug:${a.id}`;

  if (b.action === 'create') {
    const name = String(b.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (name.length < 3) return err('Guild name needs 3+ characters.');
    if (Number(await cmd('SCARD', mine)) >= MAX_GUILDS) return err(`You can be in up to ${MAX_GUILDS} guilds.`);
    let code = '';
    for (let i = 0; i < 5 && !code; i++) {
      const c = rid(6, CODE_ALPHABET);
      if (await cmd('SET', `${P}gc:${c}`, a.id, 'NX')) code = c;
    }
    if (!code) return err('Try again.', 503);
    await pipe([
      ['HSET', `${P}g:${code}`, 'name', name, 'owner', a.id, 'created', Date.now()],
      ['SADD', `${P}gm:${code}`, a.id],
      ['SADD', mine, code],
    ]);
    return json({ code, name, count: 1 });
  }

  const code = String(b.code ?? '').toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return err('Invite codes are 6 characters.');
  const [g, count, isIn, myCount] = await pipe([
    ['HMGET', `${P}g:${code}`, 'name'], ['SCARD', `${P}gm:${code}`], ['SISMEMBER', `${P}gm:${code}`, a.id], ['SCARD', mine],
  ]);
  if (!g?.[0]) return err('No guild with that code.', 404);

  if (b.action === 'join') {
    if (Number(isIn)) return json({ code, name: g[0], count: Number(count) });
    if (Number(count) >= MAX_MEMBERS) return err('This guild is full.');
    if (Number(myCount) >= MAX_GUILDS) return err(`You can be in up to ${MAX_GUILDS} guilds.`);
    await pipe([['SADD', `${P}gm:${code}`, a.id], ['SADD', mine, code]]);
    return json({ code, name: g[0], count: Number(count) + 1 });
  }
  if (b.action === 'leave') {
    await pipe([['SREM', `${P}gm:${code}`, a.id], ['SREM', mine, code]]);
    return json({ code, name: g[0], count: Math.max(0, Number(count) - Number(isIn)) });
  }
  return err('Unknown action.');
}
