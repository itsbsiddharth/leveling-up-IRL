import { useEffect, useState } from 'preact/hooks';
import { api, PublicProfile } from '../lib/api';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import { Icon, Panel, StatusWindow } from '../ui';

export function Profile({ name }: { name: string }) {
  const s = useStore();
  const [p, setP] = useState<PublicProfile | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setP(null); setError('');
    api.profile(name).then(setP).catch((e) => setError(e.message));
  }, [name]);
  const mine = s.name && s.name.toLowerCase() === name.toLowerCase();

  return (
    <>
      <div class="page-head">
        <button class="link" onClick={() => (history.length > 1 ? history.back() : navigate('/ranks'))}>← Back</button>
      </div>
      {error && <Panel><p class="lead">No hunter called “{name}”.</p></Panel>}
      {!p && !error && <div class="panel skeleton tall" />}
      {p && <StatusWindow d={p} />}
      {!mine && (
        <Panel label={s.diff ? 'YOUR MOVE' : 'THE SYSTEM HAS FOUND YOU'}>
          <p class="lead">{s.diff ? `Think you can pass ${p?.name ?? 'them'}? Clear today's quest.` : 'Your real-life level is 1. Accept the Daily Quest. No app, no sign-up.'}</p>
          <button class="btn btn-primary btn-block" onClick={() => navigate('/')}>{s.diff ? 'Go to my quest' : 'Accept the quest'} <Icon name="arrow" size={16} /></button>
        </Panel>
      )}
    </>
  );
}
