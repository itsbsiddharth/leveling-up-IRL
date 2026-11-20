import type { Snapshot } from './game';

export interface Entry {
  id: string; name: string; score: number; level: number; rank: string; streak: number; title: string; week?: number;
}
export interface Board { entries: Entry[]; total: number; resetsAt?: number; guild?: { code: string; name: string; count: number } }
export interface PublicProfile extends Snapshot { name: string; created: number }

type AcctLike = { id: string; token: string };

async function call<T>(path: string, init: RequestInit & { acct?: AcctLike } = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.acct) headers.authorization = `Bearer ${init.acct.id}.${init.acct.token}`;
  const r = await fetch(path, { ...init, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data as T;
}

export const api = {
  board: (board: 'week' | 'all') => call<Board>(`/api/leaderboard?board=${board}`),
  guildBoard: (code: string) => call<Board>(`/api/leaderboard?board=guild&code=${encodeURIComponent(code)}`),
  guildInfo: (code: string) => call<{ code: string; name: string; count: number }>(`/api/guild?code=${encodeURIComponent(code)}`),
  guild: (acct: AcctLike, body: { action: 'create' | 'join' | 'leave'; name?: string; code?: string }) =>
    call<{ code: string; name: string; count: number }>('/api/guild', { method: 'POST', body: JSON.stringify(body), acct }),
  register: (name: string, snap: Snapshot) =>
    call<{ id: string; token: string; name: string }>('/api/register', { method: 'POST', body: JSON.stringify({ name, snap }) }),
  sync: (acct: AcctLike, body: { snap: Snapshot; backup?: string; name?: string; hidden?: boolean }) =>
    call<{ xp: number; name: string; nameError?: string; rank: { all: number | null; week: number | null } }>(
      '/api/sync', { method: 'POST', body: JSON.stringify(body), acct }),
  me: (acct: AcctLike) => call<{ name: string; hidden: boolean; backup: string | null }>('/api/me', { acct }),
  profile: (name: string) => call<PublicProfile>(`/api/profile?name=${encodeURIComponent(name)}`),
};
