import { useState } from 'preact/hooks';
import { DIFFS, Diff, TITLES, dayKey, snapshot, totals, streakInfo, levelInfo, totalXp } from '../lib/game';
import { api } from '../lib/api';
import { hunterKey, parseKey, resetAll, restore, syncNow, update, useStore } from '../lib/store';
import { shareCard } from '../lib/share';
import { navigate } from '../lib/router';
import { CardData, ClaimForm, Icon, Panel, RankBadge, Sheet, StatusWindow } from '../ui';

export function Status() {
  const s = useStore();
  const [settings, setSettings] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const snap = snapshot(s.days, s.diff);
  const card: CardData = { ...snap, name: s.name };
  const t = totals(s.days);
  const best = streakInfo(s.days, dayKey()).best;
  const level = levelInfo(totalXp(s.days)).level;
  const base = location.origin;
  const profileUrl = s.acct && s.name ? `${base}/h/${encodeURIComponent(s.name)}` : base;

  const share = async () => {
    setSharing(true);
    try { await shareCard(card, profileUrl); } finally { setSharing(false); }
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <div class="page-head">
        <h1 class="page-title">Status</h1>
        <button class="icon-btn" onClick={() => setSettings(true)} aria-label="Settings"><Icon name="gear" /></button>
      </div>
      <StatusWindow d={card} />
      <div class="row">
        <button class="btn btn-primary grow" onClick={share} disabled={sharing}><Icon name="share" size={16} /> {sharing ? 'Making card…' : 'Share status card'}</button>
        {s.acct && <button class="btn" onClick={copyLink}><Icon name="link" size={16} /> {copied ? 'Copied' : 'Profile link'}</button>}
      </div>

      <Panel label="TITLES">
        <ul class="titles">
          {TITLES.map((x) => {
            const on = x.test({ t, best, level });
            return (
              <li key={x.id} class={on ? 'on' : ''}>
                <span class="title-mark">{on ? '◆' : '◇'}</span>
                <span><strong>{x.name}</strong><small>{x.desc}</small></span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Settings open={settings} onClose={() => setSettings(false)} />
    </>
  );
}

function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const [name, setName] = useState(s.name);
  const [msg, setMsg] = useState('');
  const [keyIn, setKeyIn] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const rename = async (e: Event) => {
    e.preventDefault();
    setMsg('');
    const r = await syncNow({ name: name.trim() });
    setMsg(r?.nameError ?? (r ? 'Saved.' : 'Offline. Try again.'));
  };
  const toggleHidden = async () => {
    const hidden = !s.hidden;
    update((x) => { x.hidden = hidden; }, { quiet: true });
    await syncNow({ hidden });
  };
  const doRestore = async (e: Event) => {
    e.preventDefault();
    const acct = parseKey(keyIn);
    if (!acct) return setMsg('That key doesn’t look right.');
    if (!confirm('Replace the progress on this device with that hunter?')) return;
    try {
      const me = await api.me(acct);
      restore(acct, me.backup, me.name);
      setMsg(`Welcome back, ${me.name}.`);
    } catch { setMsg('Key not found.'); }
  };
  const link = s.acct ? `${location.origin}/?key=${hunterKey(s.acct)}` : '';

  return (
    <Sheet open={open} onClose={onClose} title="SETTINGS">
      <section class="set">
        <h3>Daily Quest difficulty</h3>
        <div class="diffs compact">
          {(Object.keys(DIFFS) as Diff[]).map((d) => (
            <button key={d} class={`diff ${s.diff === d ? 'on' : ''}`} onClick={() => update((x) => {
              x.diff = d;
              const k = dayKey();
              if (x.days[k]) x.days[k].diff = d;
            })}>
              <RankBadge r={d} size="sm" />
              <span class="diff-name">{DIFFS[d].name}</span>
              <span class="diff-spec num">{DIFFS[d].reps} reps · {DIFFS[d].km} km</span>
            </button>
          ))}
        </div>
        <p class="hint">Changing it applies to today and onward. Harder quests give more XP.</p>
      </section>

      {s.acct ? (
        <>
          <section class="set">
            <h3>Hunter name</h3>
            <form class="row" onSubmit={rename}>
              <input class="input" value={name} maxLength={20} onInput={(e) => setName((e.target as HTMLInputElement).value)} aria-label="Hunter name" />
              <button class="btn" disabled={name.trim() === s.name || name.trim().length < 3}>Save</button>
            </form>
          </section>
          <section class="set">
            <label class="toggle">
              <input type="checkbox" checked={!s.hidden} onChange={toggleHidden} />
              <span>Show me on public leaderboards</span>
            </label>
          </section>
          <section class="set">
            <h3>Hunter Key</h3>
            <p class="hint">Your login, without an account. Open this link on another device to continue there. Keep it private: anyone with it can play as you.</p>
            {showKey ? (
              <div class="row">
                <input class="input mono" readOnly value={link} onFocus={(e) => (e.target as HTMLInputElement).select()} aria-label="Hunter Key link" />
                <button class="btn" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Icon name="copy" size={16} /> {copied ? 'Copied' : 'Copy'}</button>
              </div>
            ) : <button class="btn" onClick={() => setShowKey(true)}>Show my Hunter Key</button>}
          </section>
        </>
      ) : (
        <section class="set">
          <h3>Save your progress</h3>
          <p class="hint">Progress lives on this device. Pick a name to join the leaderboard and get a Hunter Key that works on any device.</p>
          <ClaimForm cta="Save" />
        </section>
      )}

      <section class="set">
        <h3>Use an existing Hunter Key</h3>
        <form class="row" onSubmit={doRestore}>
          <input class="input mono" value={keyIn} placeholder="Paste key or link" onInput={(e) => setKeyIn((e.target as HTMLInputElement).value)} aria-label="Hunter Key" />
          <button class="btn" disabled={!keyIn.trim()}>Restore</button>
        </form>
      </section>

      <section class="set">
        <label class="toggle">
          <input type="checkbox" checked={s.sound} onChange={() => update((x) => { x.sound = !x.sound; }, { quiet: true })} />
          <span>Sounds and vibration</span>
        </label>
      </section>

      {msg && <p class="form-note">{msg}</p>}

      <section class="set">
        <button class="link danger" onClick={() => {
          if (confirm('Erase all progress on this device? Your leaderboard entry stays unless you hide it first.')) { resetAll(); onClose(); navigate('/'); }
        }}>Erase progress on this device</button>
      </section>
      <p class="hint center">Leveling Up IRL · <a href="https://github.com/itsbsiddharth/leveling-up-IRL" target="_blank" rel="noopener">Open source</a> · Made by <a href="https://bsid.dev" target="_blank" rel="noopener">bsid.dev</a></p>
    </Sheet>
  );
}
