// Tiny synthesized chimes (no audio files). Original sounds only.
let ctx: AudioContext | null = null;

export function chime(kind: 'tap' | 'quest' | 'level') {
  try {
    ctx ??= new AudioContext();
    const notes = kind === 'tap' ? [880] : kind === 'quest' ? [660, 990] : [523, 659, 784, 1046];
    const t0 = ctx.currentTime;
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const t = t0 + i * 0.09;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(kind === 'tap' ? 0.04 : 0.09, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'tap' ? 0.08 : 0.5));
      o.connect(g).connect(ctx!.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
  } catch { /* audio blocked: stay silent */ }
  if (kind !== 'tap') navigator.vibrate?.(kind === 'level' ? [30, 40, 60] : 25);
}
