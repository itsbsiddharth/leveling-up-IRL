import { useEffect } from 'preact/hooks';
import { Today } from './views/today';
import { Ranks } from './views/ranks';
import { Status } from './views/status';
import { Profile } from './views/profile';
import { Invite } from './views/invite';
import { navigate, useNow, usePath } from './lib/router';
import { finishGate, getState, scheduleSync, useStore } from './lib/store';
import { Icon, Notices } from './ui';

const TABS = [
  { path: '/', label: 'Quest', icon: 'bolt' },
  { path: '/ranks', label: 'Ranks', icon: 'trophy' },
  { path: '/status', label: 'Status', icon: 'user' },
];

export function App() {
  const path = usePath();
  const s = useStore();
  const now = useNow(1000);

  // Planned gates close themselves, on any tab.
  useEffect(() => {
    const g = s.gate;
    if (g && g.plan > 0 && now - g.start >= g.plan * 60000) finishGate(getState());
  }, [now, s.gate]);

  useEffect(() => { scheduleSync(500); }, []);

  let view;
  if (path.startsWith('/h/')) view = <Profile name={decodeURIComponent(path.slice(3))} />;
  else if (path === '/ranks') view = <Ranks />;
  else if (path === '/status') view = <Status />;
  else view = <Today />;

  useEffect(() => {
    document.title = path === '/ranks' ? 'Leaderboard · Leveling Up IRL' : path === '/status' ? 'Status · Leveling Up IRL' : 'Leveling Up IRL: your real-life System';
  }, [path]);

  return (
    <div class="shell">
      <main class="main">{view}</main>
      <nav class="tabs" aria-label="Main">
        {TABS.map((t) => {
          const on = t.path === '/' ? path === '/' : path.startsWith(t.path);
          return (
            <a key={t.path} href={t.path} class={on ? 'on' : ''} aria-current={on ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); navigate(t.path); }}>
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
              {t.path === '/' && s.gate && <i class="dot" aria-label="Gate open" />}
            </a>
          );
        })}
      </nav>
      <Notices />
      <Invite />
    </div>
  );
}
