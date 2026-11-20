import { getProfile } from './profile.js';

const RANK_NAMES: Record<string, string> = { E: 'E-Rank', D: 'D-Rank', C: 'C-Rank', B: 'B-Rank', A: 'A-Rank', S: 'S-Rank', N: 'National Level' };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// /h/:name → the app's index.html with link-preview tags for that hunter.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get('name') ?? '';
  const [html, p] = await Promise.all([
    fetch(new URL('/index.html', url.origin)).then((r) => r.text()),
    getProfile(name).catch(() => null),
  ]);
  let out = html;
  if (p) {
    const title = `${p.name} · Level ${p.level} ${RANK_NAMES[p.rank] ?? ''} · Leveling Up IRL`;
    const desc = `${p.streak}-day streak · ${Number(p.totals?.reps ?? 0).toLocaleString()} reps · ${p.totals?.km ?? 0} km · ${Math.round((p.totals?.focus ?? 0) / 60)} focus hours. Think you can pass them? Accept the Daily Quest. No sign-up.`;
    const tags = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(desc)}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:image" content="${url.origin}/og.png" />`,
      `<meta property="og:url" content="${url.origin}/h/${encodeURIComponent(p.name)}" />`,
      `<meta property="og:type" content="profile" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    ].join('\n    ');
    out = html.replace(/<!--og-->[\s\S]*?<!--\/og-->/, tags);
  }
  return new Response(out, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
