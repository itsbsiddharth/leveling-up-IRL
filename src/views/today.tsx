import { useState } from 'preact/hooks';
import {
  DIFFS, Diff, GATE_KINDS, GateKind, PENALTY_REPS, QKey, QUEST_ITEMS, dayKey, dayXp, levelInfo, msToMidnight,
  questDone, rankOf, streakInfo, target, totalXp,
} from '../lib/game';
import { editToday, finishGate, today, update, useStore } from '../lib/store';
import { navigate, useNow } from '../lib/router';
import { chime } from '../lib/sound';
import { Bar, ClaimForm, Icon, Panel, RankBadge, fmtClock } from '../ui';

export function Today() {
  const s = useStore();
  if (!s.diff) return <Awaken />;
  const xp = totalXp(s.days);
  const lv = levelInfo(xp);
  const st = streakInfo(s.days, dayKey());
  const day = today(s);
  const tk = dayKey();

  return (
    <>
      <header class="hud">
        <div class="hud-left">
          <RankBadge r={rankOf(lv.level).r} />
          <div>
            <div class="hud-level"><span class="sys dim">LV</span> <span class="num">{lv.level}</span></div>
            <Bar value={lv.into / lv.need} />
          </div>
        </div>
        <div class="hud-right">
          <span class={`streak ${st.current > 0 ? 'on' : ''}`} title="Daily Quest streak"><Icon name="flame" size={16} /> <span class="num">{st.current}</span></span>
          <span class="num dim">+{dayXp(day)} XP today</span>
        </div>
      </header>

      {st.zone && !st.paid && (
        <Panel label="PENALTY ZONE" tone="red">
          <p class="penalty-copy">You missed yesterday's quest. Clear today's quest <b>and</b> {PENALTY_REPS} burpees to keep your <b>{st.atStake}-day</b> streak.</p>
        </Panel>
      )}

      <Quest zone={st.zone} />
      <Gates />
      <SideQuests />

      {!s.acct && xp > 0 && s.claimLater !== tk && (
        <Panel label="LEADERBOARD" right={<button class="link" onClick={() => update((x) => { x.claimLater = tk; }, { quiet: true })}>Later</button>}>
          <p class="lead">You've earned <b>{xp} XP</b>. Put a name on it and see where you rank.</p>
          <ClaimForm />
        </Panel>
      )}
    </>
  );
}

function Awaken() {
  const [diff, setDiff] = useState<Diff>('E');
  const accept = () => {
    update((s) => { s.diff = diff; });
    chime('quest');
    window.scrollTo(0, 0);
  };
  return (
    <div class="awaken">
      <p class="sys glow center">[ SYSTEM ]</p>
      <h1 class="awaken-title">The System has found you.</h1>
      <p class="awaken-sub">Your real-life level is <b>1</b>. Clear a daily quest, enter focus gates, climb from E-rank to S-rank. No app, no sign-up.</p>
      <Panel label="CHOOSE YOUR DAILY QUEST">
        <div class="diffs" role="radiogroup">
          {(Object.keys(DIFFS) as Diff[]).map((d) => (
            <button key={d} role="radio" aria-checked={diff === d} class={`diff ${diff === d ? 'on' : ''}`} onClick={() => setDiff(d)}>
              <RankBadge r={d} size="sm" />
              <span class="diff-name">{DIFFS[d].name}</span>
              <span class="diff-spec num">{DIFFS[d].reps}·{DIFFS[d].reps}·{DIFFS[d].reps} · {DIFFS[d].km} km</span>
            </button>
          ))}
        </div>
        <p class="hint">Push-ups · sit-ups · squats · run. {diff === 'S' ? 'The real one. Good luck.' : 'You can change this anytime.'}</p>
        <button class="btn btn-primary btn-block" onClick={accept}>Accept the quest</button>
      </Panel>
      <button class="link center-block" onClick={() => navigate('/ranks')}>See who's on the leaderboard <Icon name="arrow" size={14} /></button>
    </div>
  );
}

function Quest({ zone }: { zone: boolean }) {
  const s = useStore();
  const now = useNow(1000);
  const day = today(s);
  const [open, setOpen] = useState<QKey | 'pen' | null>(null);
  const done = questDone(day);
  const add = (k: QKey, n: number) => {
    if (s.sound) chime('tap');
    editToday((d) => {
      const max = target(d.diff, k) * 5;
      d.q[k] = Math.max(0, Math.min(max, Math.round(((d.q[k] ?? 0) + n) * 10) / 10));
    });
  };
  const addPen = (n: number) => {
    if (s.sound) chime('tap');
    editToday((d) => { d.pen = Math.max(0, Math.min(PENALTY_REPS * 3, (d.pen ?? 0) + n)); });
  };
  void now;

  return (
    <Panel label="DAILY QUEST" right={<span class="num dim" title="Time left today">{done ? 'CLEARED' : fmtClock(msToMidnight())}</span>} tone={done ? 'gold' : undefined}>
      <p class="quest-sub">Strength training · {DIFFS[day.diff].name} <RankBadge r={day.diff} size="sm" /></p>
      <ul class="items">
        {QUEST_ITEMS.map((i) => {
          const v = day.q[i.key] ?? 0;
          const t = target(day.diff, i.key);
          const ok = v >= t;
          return (
            <li key={i.key} class={`item ${ok ? 'ok' : ''} ${open === i.key ? 'open' : ''}`}>
              <button class="item-row" onClick={() => setOpen(open === i.key ? null : i.key)} aria-expanded={open === i.key}>
                <span class="item-check">{ok ? <Icon name="check" size={16} /> : null}</span>
                <span class="item-label">{i.label}</span>
                <span class="item-val num">[{v}{i.unit && ` ${i.unit}`} / {t}{i.unit && ` ${i.unit}`}]</span>
              </button>
              <Bar value={v / t} tone={ok ? 'green' : undefined} />
              {open === i.key && (
                <div class="stepper">
                  <button class="step" onClick={() => add(i.key, -i.steps[0])} aria-label={`Remove ${i.steps[0]}`}><Icon name="minus" size={16} /></button>
                  {i.steps.map((n) => <button key={n} class="step" onClick={() => add(i.key, n)}>+{n}</button>)}
                  <button class="step step-done" onClick={() => add(i.key, Math.max(0, t - v))} disabled={ok}>Done</button>
                </div>
              )}
            </li>
          );
        })}
        {zone && (
          <li class={`item item-pen ${(day.pen ?? 0) >= PENALTY_REPS ? 'ok' : ''} ${open === 'pen' ? 'open' : ''}`}>
            <button class="item-row" onClick={() => setOpen(open === 'pen' ? null : 'pen')}>
              <span class="item-check">{(day.pen ?? 0) >= PENALTY_REPS ? <Icon name="check" size={16} /> : '!'}</span>
              <span class="item-label">Penalty: burpees</span>
              <span class="item-val num">[{day.pen ?? 0} / {PENALTY_REPS}]</span>
            </button>
            <Bar value={(day.pen ?? 0) / PENALTY_REPS} tone="red" />
            {open === 'pen' && (
              <div class="stepper">
                <button class="step" onClick={() => addPen(-5)} aria-label="Remove 5"><Icon name="minus" size={16} /></button>
                {[5, 10].map((n) => <button key={n} class="step" onClick={() => addPen(n)}>+{n}</button>)}
                <button class="step step-done" onClick={() => addPen(Math.max(0, PENALTY_REPS - (day.pen ?? 0)))}>Done</button>
              </div>
            )}
          </li>
        )}
      </ul>
      {!done && <p class="hint">Tap an exercise to log reps. Partial progress still earns XP.</p>}
      {done && <p class="reward">Rewards: <b>+{dayXp({ ...day, side: [], gates: [] })} XP</b> · streak extended</p>}
    </Panel>
  );
}

const DURATIONS = [25, 50, 90, 0];

function Gates() {
  const s = useStore();
  const now = useNow(1000);
  const [kind, setKind] = useState<GateKind>('study');
  const [plan, setPlan] = useState(50);
  const g = s.gate;
  const day = today(s);
  const minsToday = day.gates.reduce((a, x) => a + x.min, 0);

  if (g) {
    const el = now - g.start;
    const label = GATE_KINDS.find((x) => x.kind === g.kind)?.label;
    return (
      <Panel label="GATE OPEN" tone="gold" right={<span class="sys dim">{label}</span>}>
        <div class="gate-clock num">{g.plan ? fmtClock(Math.max(0, g.plan * 60000 - el)) : fmtClock(el)}</div>
        {g.plan > 0 && <Bar value={el / (g.plan * 60000)} tone="gold" />}
        <p class="hint center">{g.plan ? `Stay in the gate. ${Math.floor(el / 60000)} of ${g.plan} min · clearing it gives +20% XP.` : `${Math.floor(el / 60000)} min · close the gate when you're done.`}</p>
        <button class="btn btn-block" onClick={() => finishGate(s)}>{g.plan ? 'Leave gate early' : 'Close gate'}</button>
      </Panel>
    );
  }
  return (
    <Panel label="ENTER A GATE" right={minsToday > 0 ? <span class="num dim">{minsToday} min today</span> : undefined}>
      <p class="quest-sub">Focus timer. 1 XP per minute. Keep this tab open or come back later. The timer keeps running.</p>
      <div class="chips">
        {GATE_KINDS.map((k) => <button key={k.kind} class={`chip ${kind === k.kind ? 'on' : ''}`} onClick={() => setKind(k.kind)}>{k.label}</button>)}
      </div>
      <div class="chips">
        {DURATIONS.map((d) => <button key={d} class={`chip ${plan === d ? 'on' : ''}`} onClick={() => setPlan(d)}>{d ? `${d} min` : 'Open'}</button>)}
      </div>
      <button class="btn btn-primary btn-block" onClick={() => update((x) => { x.gate = { kind, plan, start: Date.now() }; }, { quiet: true })}>Enter gate</button>
    </Panel>
  );
}

const TEMPLATES = ['Drink 3 L of water', 'Read 10 pages', 'No phone for the first hour', 'Sleep before midnight', 'Meditate 10 min', 'Cold shower', 'Solve 2 coding problems'];

function SideQuests() {
  const s = useStore();
  const day = today(s);
  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState('');
  const toggle = (id: string) => editToday((d) => { d.side = d.side.includes(id) ? d.side.filter((x) => x !== id) : [...d.side, id]; });
  const addQ = (label: string) => {
    const l = label.trim().slice(0, 48);
    if (!l) return;
    update((x) => { x.side.push({ id: Math.random().toString(36).slice(2, 9), label: l }); }, { quiet: true });
    setText('');
    setAdding(false);
  };
  const full = s.side.length >= 6;
  return (
    <Panel label="SIDE QUESTS" right={s.side.length > 0 ? <button class="link" onClick={() => setEdit(!edit)}>{edit ? 'Done' : 'Edit'}</button> : undefined}>
      {s.side.length === 0 && !adding && <p class="quest-sub">Your own daily habits. +15 XP each, and they raise PER.</p>}
      <ul class="sides">
        {s.side.map((q) => {
          const on = day.side.includes(q.id);
          return (
            <li key={q.id} class={`side ${on ? 'ok' : ''}`}>
              <button class="side-btn" onClick={() => toggle(q.id)} aria-pressed={on}>
                <span class="item-check">{on ? <Icon name="check" size={16} /> : null}</span>
                <span>{q.label}</span>
                <span class="num dim">+15</span>
              </button>
              {edit && <button class="icon-btn" aria-label={`Delete ${q.label}`} onClick={() => update((x) => { x.side = x.side.filter((y) => y.id !== q.id); }, { quiet: true })}><Icon name="x" size={16} /></button>}
            </li>
          );
        })}
      </ul>
      {adding ? (
        <div class="add-side">
          <form class="row" onSubmit={(e) => { e.preventDefault(); addQ(text); }}>
            <input class="input" autoFocus value={text} maxLength={48} placeholder="e.g. Read 10 pages" onInput={(e) => setText((e.target as HTMLInputElement).value)} aria-label="New side quest" />
            <button class="btn btn-primary" disabled={!text.trim()}>Add</button>
          </form>
          <div class="chips">
            {TEMPLATES.filter((t) => !s.side.some((q) => q.label === t)).slice(0, 5).map((t) => <button key={t} class="chip" onClick={() => addQ(t)}>{t}</button>)}
          </div>
        </div>
      ) : (
        !full && <button class="btn btn-ghost btn-block" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add side quest</button>
      )}
    </Panel>
  );
}
