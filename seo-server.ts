/**
 * Shared Server & Build-time SEO Utility for CineStream
 * Generates dynamic sitemap.xml, robots.txt, and route-level HTML metadata.
 */

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

interface TMDBLiteItem {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview?: string;
  biography?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
}

const DEFAULT_FALLBACK_MOVIES: number[] = [
  550, 27205, 157336, 155, 299534, 299536, 603, 120, 122, 680,
  238, 24428, 634649, 438631, 693134, 872585, 346698, 533535, 1022789, 519182,
];

const DEFAULT_FALLBACK_TV: number[] = [
  1399, 1396, 66732, 94997, 84958, 100088, 76479, 94605, 60574, 1402,
  119051, 95557, 71446, 63174, 4614, 1416, 456, 2190, 60625, 37854,
];

const DEFAULT_FALLBACK_PEOPLE: number[] = [
  287, 500, 6193, 1245, 3223, 1136406, 505710, 976, 3894, 1892,
];

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cachedDynamicCatalog: {
  timestamp: number;
  movies: number[];
  tv: number[];
  people: number[];
} | null = null;

function getTMDBToken(): { bearer?: string; apiKey?: string } {
  const bearer =
    process.env.VITE_TMDB_API_READ_ACCESS_TOKEN ||
    process.env.TMDB_API_READ_ACCESS_TOKEN ||
    '';
  const apiKey =
    process.env.VITE_TMDB_API_KEY ||
    process.env.TMDB_API_KEY ||
    '';
  return {
    bearer: bearer && !bearer.startsWith('YOUR_') ? bearer : undefined,
    apiKey: apiKey && !apiKey.startsWith('YOUR_') ? apiKey : undefined,
  };
}

async function fetchTMDBIds(endpoint: string): Promise<number[]> {
  const { bearer, apiKey } = getTMDBToken();
  if (!bearer && !apiKey) return [];

  try {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    if (!bearer && apiKey) {
      url.searchParams.set('api_key', apiKey);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }

    const res = await fetch(url.toString(), {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = (await res.json()) as { results?: TMDBLiteItem[] };
    return (data.results || [])
      .map((item) => item.id)
      .filter((id) => typeof id === 'number' && id > 0);
  } catch {
    return [];
  }
}

async function getDynamicCatalogIds(): Promise<{
  movies: number[];
  tv: number[];
  people: number[];
}> {
  if (cachedDynamicCatalog && Date.now() - cachedDynamicCatalog.timestamp < CACHE_TTL_MS) {
    return cachedDynamicCatalog;
  }

  const [
    trendMovies,
    popMovies,
    topMovies,
    trendTv,
    popTv,
    topTv,
    popPeople,
  ] = await Promise.all([
    fetchTMDBIds('/trending/movie/week'),
    fetchTMDBIds('/movie/popular'),
    fetchTMDBIds('/movie/top_rated'),
    fetchTMDBIds('/trending/tv/week'),
    fetchTMDBIds('/tv/popular'),
    fetchTMDBIds('/tv/top_rated'),
    fetchTMDBIds('/person/popular'),
  ]);

  const movies = Array.from(
    new Set([...trendMovies, ...popMovies, ...topMovies, ...DEFAULT_FALLBACK_MOVIES])
  ).slice(0, 60);

  const tv = Array.from(
    new Set([...trendTv, ...popTv, ...topTv, ...DEFAULT_FALLBACK_TV])
  ).slice(0, 60);

  const people = Array.from(
    new Set([...popPeople, ...DEFAULT_FALLBACK_PEOPLE])
  ).slice(0, 30);

  cachedDynamicCatalog = {
    timestamp: Date.now(),
    movies,
    tv,
    people,
  };

  return cachedDynamicCatalog;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeBaseUrl(rawOrigin?: string): string {
  const candidate = (rawOrigin || process.env.APP_URL || '').trim();
  if (candidate && candidate !== 'MY_APP_URL' && /^https?:\/\//i.test(candidate)) {
    return candidate.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

export function buildRobotsTxt(origin?: string): string {
  const baseUrl = normalizeBaseUrl(origin);
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /assets/',
    'Disallow: /mylist',
    'Disallow: /profile',
    'Disallow: /api/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export async function buildSitemapXml(origin?: string): Promise<string> {
  const baseUrl = normalizeBaseUrl(origin);
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes: SitemapEntry[] = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/explore/movie`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/explore/tv`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/search`, lastmod: today, changefreq: 'weekly', priority: '0.7' },
    { loc: `${baseUrl}/download-app`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
    { loc: `${baseUrl}/download-app/windows`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
  ];

  const catalog = await getDynamicCatalogIds();

  const movieRoutes: SitemapEntry[] = catalog.movies.map((id) => ({
    loc: `${baseUrl}/movie/${id}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '0.8',
  }));

  const tvRoutes: SitemapEntry[] = catalog.tv.map((id) => ({
    loc: `${baseUrl}/tv/${id}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '0.8',
  }));

  const personRoutes: SitemapEntry[] = catalog.people.map((id) => ({
    loc: `${baseUrl}/person/${id}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.6',
  }));

  const allEntries = [...staticRoutes, ...movieRoutes, ...tvRoutes, ...personRoutes];

  const urlNodes = allEntries
    .map((entry) => {
      const lines = [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
      ];
      if (entry.lastmod) lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority) lines.push(`    <priority>${entry.priority}</priority>`);
      lines.push('  </url>');
      return lines.join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>\n`;
}

export interface RouteMetaSummary {
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  ogImage: string;
  robots: string;
}

export function getServerRouteMeta(pathname: string, origin?: string): RouteMetaSummary {
  const baseUrl = normalizeBaseUrl(origin);
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const canonical = `${baseUrl}${cleanPath === '/' ? '/' : cleanPath}`;
  const defaultImage = `${baseUrl}/pwa-512x512.png`;

  if (cleanPath === '/explore/movie') {
    return {
      title: 'Explore Movies by Genre, Year & Rating | CineStream',
      description: 'Browse thousands of popular, top-rated, and upcoming movies filtered by genre, language, and streaming platform on CineStream.',
      canonical,
      ogType: 'website',
      ogImage: defaultImage,
      robots: 'index, follow',
    };
  }

  if (cleanPath === '/explore/tv') {
    return {
      title: 'Explore TV Series by Genre & Network | CineStream',
      description: 'Discover trending TV shows, top-rated series, and binge-worthy episodes across every genre and network on CineStream.',
      canonical,
      ogType: 'website',
      ogImage: defaultImage,
      robots: 'index, follow',
    };
  }

  if (cleanPath === '/search') {
    return {
      title: 'Search Movies, TV Shows & Cast | CineStream',
      description: 'Instantly search thousands of movies, TV series, actors, and directors with smart fuzzy matching on CineStream.',
      canonical,
      ogType: 'website',
      ogImage: defaultImage,
      robots: 'index, follow',
    };
  }

  if (cleanPath.startsWith('/download-app/windows')) {
    return {
      title: 'Download CineStream for Windows PC | CineStream',
      description: 'Get the native CineStream Windows desktop installer with 4K hardware acceleration, keyboard shortcuts, and watchlist sync.',
      canonical,
      ogType: 'website',
      ogImage: defaultImage,
      robots: 'index, follow',
    };
  }

  if (cleanPath.startsWith('/download-app') || cleanPath === '/download' || cleanPath === '/apk') {
    return {
      title: 'Download CineStream Android APK & Desktop App | CineStream',
      description: 'Download the official CineStream Android APK or Windows app for fast, ad-free 4K movie and TV series streaming.',
      canonical,
      ogType: 'website',
      ogImage: defaultImage,
      robots: 'index, follow',
    };
  }

  if (cleanPath === '/mylist' || cleanPath === '/profile') {
    return {
      title: 'My Watchlist & Watch History | CineStream',
      description: 'Access your saved movies, TV shows, and continue-watching progress synced across devices on CineStream.',
      canonical,
      ogType: 'website',
      ogImage: defaultImage,
      robots: 'noindex, nofollow',
    };
  }

  if (cleanPath.startsWith('/movie/')) {
    return {
      title: 'Movie Details, Cast & Watch Online | CineStream',
      description: 'View full movie overview, cast, ratings, and stream in HD 4K on CineStream.',
      canonical,
      ogType: 'video.movie',
      ogImage: defaultImage,
      robots: 'index, follow',
    };
  }

  if (cleanPath.startsWith('/tv/')) {
    return {
      title: 'TV Series Seasons, Episodes & Stream | CineStream',
      description: 'Browse seasons, episode guides, cast details, and stream TV series in HD 4K on CineStream.',
      canonical,
      ogType: 'video.tv_show',
      ogImage: defaultImage,
      robots: 'index, follow',
    };
  }

  if (cleanPath.startsWith('/person/')) {
    return {
      title: 'Actor & Creator Filmography & Biography | CineStream',
      description: 'Explore biography, known credits, movies, and TV shows on CineStream.',
      canonical,
      ogType: 'profile',
      ogImage: defaultImage,
      robots: 'index, follow',
    };
  }

  return {
    title: 'CineStream – Watch Movies & TV Series Online in HD',
    description: 'Stream trending movies and TV shows in 4K Ultra HD, explore curated genres, and sync your personal watchlist on CineStream.',
    canonical: `${baseUrl}/`,
    ogType: 'website',
    ogImage: defaultImage,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  };
}
