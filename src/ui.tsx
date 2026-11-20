import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { STAT_LABELS, Stats, rankByLetter } from './lib/game';
import { dismiss, join, useNotices } from './lib/store';

const PATHS: Record<string, string> = {
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6 6 18',
  share: 'M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  flame: 'M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
};

export function Icon({ name, size = 20 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Panel({ label, right, children, tone, class: cls = '' }: { label?: string; right?: ComponentChildren; children: ComponentChildren; tone?: 'red' | 'gold'; class?: string }) {
  return (
    <section class={`panel ${tone ? `panel-${tone}` : ''} ${cls}`}>
      {label && (
        <header class="panel-head">
          <span class="sys">{label}</span>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function RankBadge({ r, size = 'md' }: { r: string; size?: 'sm' | 'md' | 'lg' }) {
  const rank = rankByLetter(r);
  return (
    <span class={`rank rank-${size}`} style={{ '--rc': rank.color } as any} title={rank.name}>
      {rank.r === 'N' ? 'N' : rank.r}
    </span>
  );
}

export function Bar({ value, tone }: { value: number; tone?: 'gold' | 'red' | 'green' }) {
  return (
    <div class={`bar ${tone ? `bar-${tone}` : ''}`}>
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ComponentChildren }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  return (
    <div class="sheet-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header class="sheet-head">
          <span class="sys">{title}</span>
          <button class="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Notices() {
  const list = useNotices();
  return (
    <div class="notices" aria-live="polite">
      {list.map((n) => (
        <button key={n.id} class={`notice notice-${n.kind}`} onClick={() => dismiss(n.id)}>
          <span class="notice-tag">{n.kind === 'warn' ? '! WARNING' : n.kind === 'level' ? '▲ LEVEL UP' : n.kind === 'title' ? '◆ TITLE' : '■ SYSTEM'}</span>
          <strong>{n.title}</strong>
          {n.body && <span>{n.body}</span>}
        </button>
      ))}
    </div>
  );
}

export function ClaimForm({ cta = 'Join the board', onDone, autoFocus }: { cta?: string; onDone?: () => void; autoFocus?: boolean }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: Event) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await join(name.trim());
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form class="claim" onSubmit={submit}>
      <div class="row">
        <input
          class="input"
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          placeholder="Hunter name"
          maxLength={20}
          autoComplete="nickname"
          autoFocus={autoFocus}
          aria-label="Hunter name"
          required
          minLength={3}
          pattern="[A-Za-z0-9_.\-]{3,20}"
          title="3–20 letters, numbers, dot, dash or underscore"
        />
        <button class="btn btn-primary" disabled={busy || name.trim().length < 3}>{busy ? 'Joining…' : cta}</button>
      </div>
      {error ? <p class="form-error">{error}</p> : <p class="hint">No email, no password. Just a name.</p>}
    </form>
  );
}

export interface CardData {
  name: string; title: string; level: number; rank: string; into: number; need: number; xp: number;
  stats: Stats; streak: number; best: number; heat: number[]; totals: { reps: number; km: number; focus: number; questDays: number };
}

export function StatusWindow({ d }: { d: CardData }) {
  const max = Math.max(20, ...Object.values(d.stats));
  return (
    <Panel label="STATUS" class="status">
      <div class="status-top">
        <div>
          <div class="status-name">{d.name || 'Unnamed Player'}</div>
          <div class="status-title">Title: {d.title}</div>
        </div>
        <RankBadge r={d.rank} size="lg" />
      </div>
      <div class="status-level">
        <span class="sys dim">LEVEL</span>
        <span class="num big">{d.level}</span>
        <span class="status-rankname">{rankByLetter(d.rank).name}</span>
      </div>
      <Bar value={d.into / d.need} />
      <div class="meta-row"><span>{d.into} / {d.need} XP to next level</span><span>{d.xp.toLocaleString()} XP total</span></div>
      <div class="stats">
        {STAT_LABELS.map(([k, label, hint]) => (
          <div class="stat" key={k} title={hint}>
            <span class="sys">{label}</span>
            <span class="num">{d.stats[k]}</span>
            <Bar value={d.stats[k] / max} />
          </div>
        ))}
      </div>
      <div class="kpis">
        <div><span class="num">{d.streak}</span><small>day streak</small></div>
        <div><span class="num">{d.best}</span><small>best</small></div>
        <div><span class="num">{d.totals.reps.toLocaleString()}</span><small>reps</small></div>
        <div><span class="num">{d.totals.km}</span><small>km</small></div>
        <div><span class="num">{Math.round(d.totals.focus / 60)}</span><small>focus hrs</small></div>
      </div>
      <div class="heat" aria-label="Last 12 weeks of activity">
        {d.heat.map((h, i) => <i key={i} class={`h${h}`} />)}
      </div>
    </Panel>
  );
}

export function fmtClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
}
