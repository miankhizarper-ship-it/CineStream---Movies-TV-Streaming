import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { buildRobotsTxt, buildSitemapXml, normalizeBaseUrl } from './seo-server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cinestreamSeoPlugin(): Plugin {
  return {
    name: 'cinestream-seo-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqPath = (req.url || '').split('?')[0];
        if (reqPath !== '/robots.txt' && reqPath !== '/sitemap.xml') {
          return next();
        }

        const host = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim() || req.headers.host;
        const isLocal = host ? /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(host) : true;
        const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() || (isLocal ? 'http' : 'https');
        const origin = host ? `${proto}://${host}` : normalizeBaseUrl();

        if (reqPath === '/robots.txt') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(buildRobotsTxt(origin));
          return;
        }

        if (reqPath === '/sitemap.xml') {
          try {
            const xml = await buildSitemapXml(origin);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.end(xml);
          } catch {
            res.statusCode = 500;
            res.end('Failed to generate sitemap');
          }
          return;
        }
      });
    },
    async closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      const envSiteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || '').trim();
      const envAppUrl = (process.env.APP_URL || '').trim();
      const isCustomOrigin = (val: string) =>
        Boolean(val) &&
        val !== 'MY_APP_URL' &&
        /^https?:\/\//i.test(val) &&
        !val.includes('.run.app');

      const origin = normalizeBaseUrl(
        isCustomOrigin(envSiteUrl)
          ? envSiteUrl
          : isCustomOrigin(envAppUrl)
            ? envAppUrl
            : 'https://cinestreams.net'
      );

      try {
        const [robotsTxt, sitemapXml] = await Promise.all([
          Promise.resolve(buildRobotsTxt(origin)),
          buildSitemapXml(origin),
        ]);
        fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
        fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
      } catch (err) {
        console.warn('[SEO] Failed to generate build-time SEO files:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      cinestreamSeoPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'CineStream - Movies & TV Streaming',
          short_name: 'CineStream',
          description: 'Stream trending movies and TV shows in 4K Ultra HD, explore curated genres, and sync your personal watchlist on CineStream.',
          theme_color: '#07080a',
          background_color: '#07080a',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['entertainment', 'movies', 'video'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/assets/aistudio/logo_1fdc68d7.png',
              sizes: '432x432',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//, /^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/.*\.json$/],
          runtimeCaching: [
            {
              urlPattern: /\/assets\/.*\.(png|jpg|jpeg|svg|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'local-assets-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'tmdb-images-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'lucide';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

