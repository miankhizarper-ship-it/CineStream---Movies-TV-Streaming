/**
 * Client-side Dynamic SEO & Schema.org JSON-LD Manager
 */

export interface SEOConfig {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'video.movie' | 'video.tv_show' | 'video.episode' | 'profile';
  ogImage?: string;
  robots?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function truncateDescription(text: string | undefined | null, maxLen = 155): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const sliced = cleaned.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced}…`;
}

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertJsonLd(data?: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('cinestream-jsonld');
  if (!data) {
    if (existing) existing.remove();
    return;
  }

  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'cinestream-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const payload = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data.map((d) => { const { '@context': _, ...rest } = d; return rest; }) }
    : data;

  script.textContent = JSON.stringify(payload);
}

export function getOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function resolveImageAbsoluteUrl(pathOrUrl?: string | null): string {
  const origin = getOrigin();
  if (!pathOrUrl) {
    return origin ? `${origin}/pwa-512x512.png` : '/pwa-512x512.png';
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return origin ? `${origin}${normalized}` : normalized;
}

export function applySEO(config: SEOConfig) {
  if (typeof document === 'undefined') return;

  const origin = getOrigin();
  const rawPath =
    config.canonicalPath ??
    (typeof window !== 'undefined' ? window.location.pathname : '/');
  const cleanPath = rawPath === '/' ? '/' : rawPath.replace(/\/+$/, '');
  const canonicalUrl = origin ? `${origin}${cleanPath}` : cleanPath;

  const imageUrl = resolveImageAbsoluteUrl(config.ogImage);
  const ogType = config.ogType || 'website';
  const robots =
    config.robots ||
    'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  document.title = config.title;

  upsertMeta('name', 'description', config.description);
  upsertMeta('name', 'robots', robots);
  upsertCanonical(canonicalUrl);

  upsertMeta('property', 'og:site_name', 'CineStream');
  upsertMeta('property', 'og:type', ogType);
  upsertMeta('property', 'og:title', config.title);
  upsertMeta('property', 'og:description', config.description);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:image', imageUrl);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', config.title);
  upsertMeta('name', 'twitter:description', config.description);
  upsertMeta('name', 'twitter:image', imageUrl);

  if (config.structuredData) {
    upsertJsonLd(config.structuredData);
  }
}
