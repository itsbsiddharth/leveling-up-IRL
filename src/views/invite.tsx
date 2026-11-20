import { useEffect, useState } from 'preact/hooks';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { getState, notify, parseKey, restore, update, useStore } from '../lib/store';
import { ClaimForm, Sheet } from '../ui';

// Handles ?g=CODE (guild invite) and ?key=ID.TOKEN (Hunter Key) links.
export function Invite() {
  const s = useStore();
  const [code, setCode] = useState<string | null>(null);
  const [guild, setGuild] = useState<{ name: string; count: number } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const g = q.get('g');
    const key = q.get('key');
    if (key) {
      const acct = parseKey(key);
      history.replaceState(null, '', location.pathname);
      if (acct && acct.id !== getState().acct?.id) {
        api.me(acct).then((me) => {
          const cur = getState();
          const hasLocal = Object.keys(cur.days).length > 0;
          if (!hasLocal || confirm(`Continue as ${me.name}? This replaces the progress on this device.`)) {
            restore(acct, me.backup, me.name);
            notify({ kind: 'info', title: `Welcome back, ${me.name}`, body: 'Progress restored.' });
          }
        }).catch(() => notify({ kind: 'warn', title: 'Invalid Hunter Key' }));
      }
    }
    if (g && /^[A-Z0-9]{6}$/i.test(g)) {
      const c = g.toUpperCase();
      history.replaceState(null, '', location.pathname);
      if (getState().guilds.includes(c)) { navigate('/ranks#guilds'); return; }
      setCode(c);
      api.guildInfo(c).then(setGuild).catch(() => setErr('This invite link has expired.'));
    }
  }, []);

  const joinGuild = async () => {
    const acct = getState().acct; // fresh: may have been created by ClaimForm a moment ago
    if (!code || !acct) return;
    setBusy(true);
    try {
      await api.guild(acct, { action: 'join', code });
      update((x) => { if (!x.guilds.includes(code)) x.guilds.push(code); }, { quiet: true });
      notify({ kind: 'info', title: 'Guild joined', body: guild?.name });
      setCode(null);
      navigate('/ranks#guilds');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={!!code} onClose={() => setCode(null)} title="GUILD INVITE">
      {err ? <p class="lead">{err}</p> : (
        <>
          <p class="lead">You've been invited to <b>{guild?.name ?? '…'}</b>{guild ? ` · ${guild.count} member${guild.count === 1 ? '' : 's'}` : ''}. A private weekly leaderboard: clear quests, earn XP, beat your friends.</p>
          {s.acct
            ? <button class="btn btn-primary btn-block" disabled={busy || !guild} onClick={joinGuild}>{busy ? 'Joining…' : `Join as ${s.name}`}</button>
            : <ClaimForm cta="Join guild" autoFocus onDone={joinGuild} />}
        </>
      )}
    </Sheet>
  );
}
