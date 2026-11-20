import { useEffect, useState } from 'preact/hooks';

const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function navigate(to: string, replace = false) {
  if (replace) history.replaceState(null, '', to);
  else history.pushState(null, '', to);
  emit();
  window.scrollTo(0, 0);
}

if (typeof window !== 'undefined') window.addEventListener('popstate', emit);

export function usePath() {
  const [p, setP] = useState(location.pathname);
  useEffect(() => {
    const f = () => setP(location.pathname);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return p;
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
