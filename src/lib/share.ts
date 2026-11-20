import { STAT_LABELS, rankByLetter } from './game';
import type { CardData } from '../ui';

// Draws a 1080x1920 story card of the status window and shares or downloads it.
export async function shareCard(d: CardData, url: string) {
  await document.fonts.ready;
  const W = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const rank = rankByLetter(d.rank);

  // background
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#060a16'); bg.addColorStop(1, '#02040a');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 520, 40, W / 2, 520, 900);
  glow.addColorStop(0, 'rgba(70,140,255,0.28)'); glow.addColorStop(1, 'rgba(70,140,255,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);

  // panel
  const px = 80, py = 260, pw = W - 160, ph = 1300;
  g.fillStyle = 'rgba(12,22,44,0.82)';
  g.strokeStyle = 'rgba(120,180,255,0.55)'; g.lineWidth = 3;
  g.beginPath(); g.roundRect(px, py, pw, ph, 28); g.fill(); g.stroke();
  // corner brackets
  g.strokeStyle = '#8cc4ff'; g.lineWidth = 6;
  for (const [x, y, sx, sy] of [[px, py, 1, 1], [px + pw, py, -1, 1], [px, py + ph, 1, -1], [px + pw, py + ph, -1, -1]]) {
    g.beginPath(); g.moveTo(x + sx * 60, y); g.lineTo(x, y); g.lineTo(x, y + sy * 60); g.stroke();
  }

  const sys = (s: string, x: number, y: number, size = 34, color = '#8cc4ff', align: CanvasTextAlign = 'left') => {
    g.font = `600 ${size}px "Chakra Petch", sans-serif`; g.fillStyle = color; g.textAlign = align;
    g.fillText(s, x, y);
  };
  const ui = (s: string, x: number, y: number, size: number, color = '#e8f0ff', weight = 600, align: CanvasTextAlign = 'left') => {
    g.font = `${weight} ${size}px "Geist", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = align;
    g.fillText(s, x, y);
  };

  sys('LEVELING UP IRL', W / 2, 170, 40, '#8cc4ff', 'center');
  sys('[ STATUS ]', W / 2, py + 90, 44, '#e8f0ff', 'center');

  ui(d.name || 'Unnamed Player', px + 70, py + 210, 72, '#ffffff', 700);
  ui(`Title: ${d.title}`, px + 70, py + 270, 36, '#8a9bb8', 500);

  // rank badge
  const bx = px + pw - 170, by = py + 140;
  g.strokeStyle = rank.color; g.lineWidth = 6; g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.roundRect(bx, by, 110, 130, 18); g.fill(); g.stroke();
  sys(rank.r, bx + 55, by + 98, 84, rank.color, 'center');

  sys('LEVEL', px + 70, py + 390, 36, '#8a9bb8');
  g.font = '700 190px "Geist Mono", monospace'; g.fillStyle = '#ffffff'; g.textAlign = 'left';
  g.fillText(String(d.level), px + 60, py + 570);
  ui(rank.name, px + 70, py + 630, 40, rank.color, 600);

  // xp bar
  const barY = py + 680, barW = pw - 140;
  g.fillStyle = 'rgba(120,180,255,0.15)'; g.beginPath(); g.roundRect(px + 70, barY, barW, 18, 9); g.fill();
  g.fillStyle = '#58a6ff'; g.beginPath(); g.roundRect(px + 70, barY, Math.max(18, barW * (d.into / d.need)), 18, 9); g.fill();

  // stats
  let sy = py + 800;
  const max = Math.max(20, ...Object.values(d.stats));
  for (const [k, label] of STAT_LABELS) {
    sys(label, px + 70, sy, 40, '#8cc4ff');
    g.font = '700 44px "Geist Mono", monospace'; g.fillStyle = '#fff'; g.textAlign = 'right';
    g.fillText(String(d.stats[k]), px + 330, sy);
    g.fillStyle = 'rgba(120,180,255,0.15)'; g.beginPath(); g.roundRect(px + 370, sy - 22, pw - 440, 14, 7); g.fill();
    g.fillStyle = '#58a6ff'; g.beginPath(); g.roundRect(px + 370, sy - 22, (pw - 440) * (d.stats[k] / max), 14, 7); g.fill();
    sy += 84;
  }

  // kpis
  const k = [[`${d.streak}`, 'DAY STREAK'], [d.totals.reps.toLocaleString(), 'REPS'], [`${d.totals.km}`, 'KM'], [`${Math.round(d.totals.focus / 60)}`, 'FOCUS HRS']];
  k.forEach(([v, l], i) => {
    const cx = px + 70 + i * ((pw - 140) / 4) + (pw - 140) / 8;
    g.font = '700 56px "Geist Mono", monospace'; g.fillStyle = '#ffffff'; g.textAlign = 'center';
    g.fillText(v, cx, py + 1250);
    sys(l, cx, py + 1290, 24, '#8a9bb8', 'center');
  });

  sys('Accept the Daily Quest. No sign-up.', W / 2, 1700, 40, '#e8f0ff', 'center');
  ui(url.replace(/^https?:\/\//, ''), W / 2, 1770, 44, '#58a6ff', 700, 'center');

  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), 'image/png'));
  const file = new File([blob], `${(d.name || 'status').toLowerCase()}-status.png`, { type: 'image/png' });
  const text = `Level ${d.level} ${rank.name} · ${d.streak}-day streak. Accept the quest: ${url}`;
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return 'shared'; } catch { /* cancelled */ return 'cancelled'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}
