// Upstash Redis over REST (no SDK). Falls back to an in-memory store for local dev.
type Arg = string | number;
type Cmd = Arg[];

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const P = 'lu:';

export async function pipe(cmds: Cmd[]): Promise<any[]> {
  if (!cmds.length) return [];
  if (!URL_ || !TOKEN) return cmds.map(mem);
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cmds.map((c) => c.map(String))),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  const out = (await r.json()) as { result?: unknown; error?: string }[];
  return out.map((o) => {
    if (o.error) throw new Error(o.error);
    return o.result;
  });
}

export const cmd = async (...c: Cmd) => (await pipe([c]))[0];

export function hobj(a: unknown): Record<string, string> | null {
  if (!Array.isArray(a) || !a.length) return null;
  const o: Record<string, string> = {};
  for (let i = 0; i < a.length; i += 2) o[a[i]] = a[i + 1];
  return o;
}

// ---------- in-memory fallback (dev only) ----------
const g = globalThis as unknown as { __luMem?: Map<string, any> };
const db = (g.__luMem ??= new Map());

function zsorted(z: Map<string, number>) {
  return [...z.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1));
}

function mem(c: Cmd): any {
  const [op, key, ...a] = c.map(String);
  const k = key;
  switch (op.toUpperCase()) {
    case 'GET': return db.get(k) ?? null;
    case 'SET': {
      if (a.includes('NX') && db.has(k)) return null;
      db.set(k, a[0]);
      return 'OK';
    }
    case 'DEL': { const had = db.delete(k); return had ? 1 : 0; }
    case 'INCR': { const v = Number(db.get(k) ?? 0) + 1; db.set(k, String(v)); return v; }
    case 'EXPIRE': return 1;
    case 'HSET': {
      const h: Map<string, string> = db.get(k) ?? new Map();
      for (let i = 0; i < a.length; i += 2) h.set(a[i], a[i + 1]);
      db.set(k, h);
      return a.length / 2;
    }
    case 'HGETALL': { const h: Map<string, string> | undefined = db.get(k); return h ? [...h.entries()].flat() : []; }
    case 'HMGET': { const h: Map<string, string> | undefined = db.get(k); return a.map((f) => h?.get(f) ?? null); }
    case 'ZADD': { const z: Map<string, number> = db.get(k) ?? new Map(); z.set(a[1], Number(a[0])); db.set(k, z); return 1; }
    case 'ZINCRBY': { const z: Map<string, number> = db.get(k) ?? new Map(); const v = (z.get(a[1]) ?? 0) + Number(a[0]); z.set(a[1], v); db.set(k, z); return String(v); }
    case 'ZREM': { const z: Map<string, number> | undefined = db.get(k); return z?.delete(a[0]) ? 1 : 0; }
    case 'ZSCORE': { const z: Map<string, number> | undefined = db.get(k); const v = z?.get(a[0]); return v == null ? null : String(v); }
    case 'ZCARD': return (db.get(k) as Map<string, number> | undefined)?.size ?? 0;
    case 'ZREVRANK': {
      const z: Map<string, number> | undefined = db.get(k);
      if (!z?.has(a[0])) return null;
      return zsorted(z).findIndex(([m]) => m === a[0]);
    }
    case 'ZRANGE': { // ZRANGE key start stop REV WITHSCORES
      const z: Map<string, number> | undefined = db.get(k);
      if (!z) return [];
      const rows = zsorted(z).slice(Number(a[0]), Number(a[1]) + 1);
      return rows.flatMap(([m, s]) => [m, String(s)]);
    }
    case 'SADD': { const s: Set<string> = db.get(k) ?? new Set(); a.forEach((m) => s.add(m)); db.set(k, s); return 1; }
    case 'SREM': { const s: Set<string> | undefined = db.get(k); return s?.delete(a[0]) ? 1 : 0; }
    case 'SMEMBERS': return [...((db.get(k) as Set<string> | undefined) ?? [])];
    case 'SCARD': return (db.get(k) as Set<string> | undefined)?.size ?? 0;
    case 'SISMEMBER': return (db.get(k) as Set<string> | undefined)?.has(a[0]) ? 1 : 0;
    default: throw new Error(`mem: unsupported ${op}`);
  }
}
