import { useEffect, useState } from 'preact/hooks';
import { api, Board } from '../lib/api';
import { update, useStore } from '../lib/store';
import { navigate, useNow } from '../lib/router';
import { ClaimForm, Icon, Panel, RankBadge } from '../ui';

type Tab = 'week' | 'all' | 'guilds';

export function Ranks() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>(location.hash === '#guilds' ? 'guilds' : 'week');
  return (
    <>
      <h1 class="page-title">Leaderboard</h1>
      {s.acct && !s.diff && (
        <Panel label="NEXT STEP" tone="gold">
          <p class="lead">You're on the board, {s.name}. Pick your Daily Quest to start earning XP.</p>
          <button class="btn btn-primary btn-block" onClick={() => navigate('/')}>Choose my quest <Icon name="arrow" size={16} /></button>
        </Panel>
      )}
      <div class="seg" role="tablist">
        {(['week', 'all', 'guilds'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} class={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t === 'week' ? 'This week' : t === 'all' ? 'All time' : 'Guilds'}
          </button>
        ))}
      </div>
      {tab === 'guilds' ? <Guilds /> : <Global board={tab} key={tab} />}
    </>
  );
}

function useBoard(load: () => Promise<Board>, deps: unknown[]) {
  const [data, setData] = useState<Board | null>(null);
  const [error, setError] = useState('');
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    setError('');
    load().then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [...deps, n]);
  return { data, error, retry: () => setN(n + 1) };
}

function Global({ board }: { board: 'week' | 'all' }) {
  const s = useStore();
  const now = useNow(60000);
  const { data, error, retry } = useBoard(() => api.board(board), [board]);
  const meIn = !!s.acct && !!data?.entries.some((e) => e.id === s.acct!.id);
  return (
    <>
      {board === 'week' && data?.resetsAt && <p class="hint">Resets every Monday 00:00 UTC · {fmtLeft(data.resetsAt - now)} left</p>}
      <List data={data} error={error} retry={retry} me={s.acct?.id} />
      {!s.acct && (
        <Panel label="JOIN THE BOARD">
          <p class="lead">{s.diff ? 'Type a name and your XP shows up here.' : 'Accept the Daily Quest, then put your name up.'}</p>
          {s.diff ? <ClaimForm /> : <button class="btn btn-primary btn-block" onClick={() => navigate('/')}>Start the Daily Quest</button>}
        </Panel>
      )}
      {s.acct && data && !meIn && !s.hidden && s.diff && (
        <p class="hint center">{data.entries.length >= 100 ? 'Not in the top 100 yet. Keep going.' : 'Earn XP this week to show up here.'}</p>
      )}
      {s.hidden && <p class="hint center">You're hidden from public boards (Status → Settings).</p>}
    </>
  );
}

function List({ data, error, retry, me, score = 'XP' }: { data: Board | null; error: string; retry: () => void; me?: string; score?: string }) {
  if (error) return <Panel><p class="lead">Couldn't load the board. {error}</p><button class="btn" onClick={retry}>Try again</button></Panel>;
  if (!data) return <div class="rows">{Array.from({ length: 6 }, (_, i) => <div key={i} class="row-item skeleton" />)}</div>;
  if (!data.entries.length) return <Panel><p class="lead">Nobody here yet. Be the first name on the board.</p></Panel>;
  return (
    <ol class="rows">
      {data.entries.map((e, i) => (
        <li key={e.id} class={`row-item ${e.id === me ? 'me' : ''} ${i < 3 ? `top top${i + 1}` : ''}`}>
          <span class="pos num">{i + 1}</span>
          <RankBadge r={e.rank} size="sm" />
          <a class="who" href={`/h/${encodeURIComponent(e.name)}`} onClick={(ev) => { ev.preventDefault(); navigate(`/h/${encodeURIComponent(e.name)}`); }}>
            <strong>{e.name}</strong>
            <small>Lv {e.level} · {e.title}{e.streak > 0 ? ` · 🔥${e.streak}` : ''}</small>
          </a>
          <span class="score num">{e.score.toLocaleString()} <small>{score}</small></span>
        </li>
      ))}
      {data.total > 100 && <li class="hint center">{data.total.toLocaleString()} hunters on the board</li>}
    </ol>
  );
}

function Guilds() {
  const s = useStore();
  const [sel, setSel] = useState<string | null>(s.guilds[0] ?? null);
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!s.acct) {
    return (
      <Panel label="GUILDS">
        <p class="lead">A guild is a private leaderboard for your friends, hostel or gym. Pick a name first.</p>
        <ClaimForm cta="Continue" />
      </Panel>
    );
  }

  const act = async (e: Event) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api.guild(s.acct!, mode === 'create' ? { action: 'create', name: val } : { action: 'join', code: val.trim().toUpperCase() });
      update((x) => { if (!x.guilds.includes(r.code)) x.guilds.push(r.code); }, { quiet: true });
      setSel(r.code); setMode(null); setVal('');
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Failed'); }
    finally { setBusy(false); }
  };

  return (
    <>
      {s.guilds.length > 0 && (
        <div class="chips">
          {s.guilds.map((g) => <button key={g} class={`chip ${sel === g ? 'on' : ''}`} onClick={() => setSel(g)}><span class="num">{g}</span></button>)}
        </div>
      )}
      {sel && s.guilds.includes(sel) && <GuildBoard code={sel} me={s.acct.id} onLeft={() => setSel(null)} />}
      <Panel label={s.guilds.length ? 'MORE GUILDS' : 'GUILDS'}>
        {!s.guilds.length && <p class="lead">Compete with friends on a private weekly board. Create one and send the invite link.</p>}
        {mode ? (
          <form onSubmit={act}>
            <div class="row">
              <input class="input" autoFocus value={val} maxLength={mode === 'create' ? 24 : 6} placeholder={mode === 'create' ? 'Guild name, e.g. Hostel 4 Hunters' : 'Invite code'}
                onInput={(e) => setVal((e.target as HTMLInputElement).value)} aria-label={mode === 'create' ? 'Guild name' : 'Invite code'} />
              <button class="btn btn-primary" disabled={busy || val.trim().length < (mode === 'create' ? 3 : 6)}>{mode === 'create' ? 'Create' : 'Join'}</button>
            </div>
            {err && <p class="form-error">{err}</p>}
            <button type="button" class="link" onClick={() => { setMode(null); setErr(''); }}>Cancel</button>
          </form>
        ) : (
          <div class="row">
            <button class="btn btn-primary" onClick={() => setMode('create')}><Icon name="plus" size={16} /> Create guild</button>
            <button class="btn" onClick={() => setMode('join')}>Join with code</button>
          </div>
        )}
      </Panel>
    </>
  );
}

function GuildBoard({ code, me, onLeft }: { code: string; me: string; onLeft: () => void }) {
  const s = useStore();
  const { data, error, retry } = useBoard(() => api.guildBoard(code), [code]);
  const [copied, setCopied] = useState(false);
  const link = `${location.origin}/?g=${code}`;
  const invite = async () => {
    const text = `Join my guild "${data?.guild?.name ?? code}" on Leveling Up IRL. Weekly board, no sign-up.`;
    if (navigator.share) { try { await navigator.share({ text, url: link }); return; } catch { return; } }
    await navigator.clipboard.writeText(`${text} ${link}`);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  const leave = async () => {
    if (!confirm('Leave this guild?')) return;
    try { await api.guild(s.acct!, { action: 'leave', code }); } catch { /* already gone */ }
    update((x) => { x.guilds = x.guilds.filter((g) => g !== code); }, { quiet: true });
    onLeft();
  };
  return (
    <>
      <div class="guild-head">
        <div>
          <strong>{data?.guild?.name ?? '…'}</strong>
          <small class="dim">Code <span class="num">{code}</span> · {data?.guild?.count ?? '–'} members · this week</small>
        </div>
        <button class="btn btn-primary" onClick={invite}><Icon name="share" size={16} /> {copied ? 'Link copied' : 'Invite'}</button>
      </div>
      <List data={data} error={error} retry={retry} me={me} score="XP this week" />
      <button class="link danger" onClick={leave}>Leave guild</button>
    </>
  );
}

function fmtLeft(ms: number) {
  const h = Math.max(0, Math.floor(ms / 3600000));
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h`;
}
