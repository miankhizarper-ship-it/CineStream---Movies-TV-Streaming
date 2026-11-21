import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { buildRobotsTxt, buildSitemapXml, getServerRouteMeta } from './seo-server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

function resolveRequestOrigin(req: express.Request): string {
  const envOrigin = (process.env.APP_URL || '').trim();
  if (envOrigin && envOrigin !== 'MY_APP_URL' && /^https?:\/\//i.test(envOrigin)) {
    return envOrigin.replace(/\/+$/, '');
  }
  const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim() || req.get('host');
  if (host) {
    return `${proto}://${host}`;
  }
  return `http://localhost:${PORT}`;
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectRouteMeta(html: string, pathname: string, origin: string): string {
  const meta = getServerRouteMeta(pathname, origin);
  const t = escapeHtmlAttr(meta.title);
  const d = escapeHtmlAttr(meta.description);
  const c = escapeHtmlAttr(meta.canonical);
  const img = escapeHtmlAttr(meta.ogImage);
  const r = escapeHtmlAttr(meta.robots);
  const ot = escapeHtmlAttr(meta.ogType);

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${d}" />`)
    .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${r}" />`)
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${c}" />`)
    .replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${ot}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${t}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${d}" />`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${c}" />`)
    .replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${img}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${t}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${d}" />`)
    .replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${img}" />`);
}

// Cloud Run health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Dynamic robots.txt pointing to live sitemap.xml
app.get('/robots.txt', (req, res) => {
  const origin = resolveRequestOrigin(req);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(buildRobotsTxt(origin));
});

// Dynamic sitemap.xml including all static and dynamic TMDB routes
app.get('/sitemap.xml', async (req, res) => {
  try {
    const origin = resolveRequestOrigin(req);
    const xml = await buildSitemapXml(origin);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Failed to generate sitemap.xml:', err);
    res.status(500).send('Failed to generate sitemap');
  }
});

// Serve static assets from built dist directory (skip index.html so SPA routes get per-route SEO meta)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1h', index: false }));
}

// Fallback all routes to index.html with route-specific SEO meta tags injected
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    try {
      const rawHtml = fs.readFileSync(indexPath, 'utf-8');
      const origin = resolveRequestOrigin(req);
      const htmlWithMeta = injectRouteMeta(rawHtml, req.path, origin);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(htmlWithMeta);
    } catch {
      res.sendFile(indexPath);
    }
  } else {
    res.status(200).send(`<!DOCTYPE html><html><head><title>CineStream</title></head><body><div id="root">Loading CineStream...</div><script type="module" src="/src/main.tsx"></script></body></html>`);
  }
});

// Bind to 0.0.0.0 for Cloud Run container ingress
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`CineStream server listening on 0.0.0.0:${PORT}`);
});

// Handle graceful termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
