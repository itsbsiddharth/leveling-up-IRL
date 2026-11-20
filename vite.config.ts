import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

// Runs the Vercel functions in api/ inside the Vite dev server, so `npm run dev`
// is the whole app (with an in-memory Redis when no Upstash env vars are set).
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        let path = url.pathname;
        if (path.startsWith('/h/')) {
          url.searchParams.set('name', decodeURIComponent(path.slice(3)));
          path = '/api/h';
        }
        if (!path.startsWith('/api/')) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${path.slice(5)}.ts`);
          const handler = mod[req.method ?? 'GET'];
          if (!handler) { res.statusCode = 405; return res.end(); }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const headers = new Headers();
          for (const h of ['content-type', 'authorization']) if (req.headers[h]) headers.set(h, String(req.headers[h]));
          const request = new Request(`http://${req.headers.host}${path}?${url.searchParams}`, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          });
          const out: Response = await handler(request);
          res.statusCode = out.status;
          out.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await out.arrayBuffer()));
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [preact(), devApi()],
  test: { include: ['src/**/*.test.ts'] },
} as any);
