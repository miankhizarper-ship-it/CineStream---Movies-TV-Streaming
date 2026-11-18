import Fuse from 'fuse.js';
import { tmdb, TMDBMedia, TMDBKeyword } from './tmdb';

export type SearchMediaItem = TMDBMedia & {
  known_for?: TMDBMedia[];
  _fuzzyScore?: number;
  _isFuzzyMatch?: boolean;
  _isKeywordMatch?: boolean;
  matchedKeyword?: string;
};

export interface EnhancedSearchResult {
  query: string;
  results: SearchMediaItem[];
  total_pages: number;
  total_results: number;
  didYouMean: string | null;
  isFuzzyMatched: boolean;
  usedFallbackQuery: string | null;
  matchedKeywords?: TMDBKeyword[];
  isKeywordFallback?: boolean;
}

/**
 * Normalizes query string by trimming unnecessary spaces and punctuation.
 */
export function normalizeSearchQuery(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove invisible zero-width chars
    .replace(/\s+/g, ' '); // collapse consecutive spaces
}

/**
 * Generates intelligent phonetic, vowel-elongation, repetition-collapsed,
 * and punctuation-sanitized variants of a query for fallback search.
 */
export function generateSearchQueryVariants(raw: string): string[] {
  const base = normalizeSearchQuery(raw);
  if (!base) return [];

  const variants = new Set<string>();

  // 1. Lowercase trimmed base
  variants.add(base);

  // 2. Repetition reduction (e.g., "khaaani" -> "khaani", "khani", "spiderrr" -> "spider")
  const collapsedRepeats = base.replace(/(.)\1{2,}/gi, '$1$1');
  if (collapsedRepeats !== base) variants.add(collapsedRepeats);

  const collapsedSingle = base.replace(/(.)\1+/gi, '$1');
  if (collapsedSingle !== base) variants.add(collapsedSingle);

  // 3. Vowel elongation / transliteration variations (e.g. "khani" <-> "khaani")
  // Expanding single 'a' to 'aa' for transliterated titles
  if (/a(?!a)/i.test(base)) {
    variants.add(base.replace(/a(?!a)/gi, 'aa'));
  }
  // Collapsing 'aa' to 'a'
  if (/aa/i.test(base)) {
    variants.add(base.replace(/aa/gi, 'a'));
  }
  // 'ee' <-> 'i'
  if (/ee/i.test(base)) {
    variants.add(base.replace(/ee/gi, 'i'));
  } else if (/i(?!i)/i.test(base)) {
    variants.add(base.replace(/i(?!i)/gi, 'ee'));
  }
  // 'oo' <-> 'u'
  if (/oo/i.test(base)) {
    variants.add(base.replace(/oo/gi, 'u'));
  } else if (/u(?!u)/i.test(base)) {
    variants.add(base.replace(/u(?!u)/gi, 'oo'));
  }

  // 4. Punctuation sanitization (e.g., "grey's anatomy" -> "greys anatomy", "spider-man" -> "spiderman")
  const noPunctuation = base.replace(/['’`.:;!?,_/\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
  if (noPunctuation && noPunctuation !== base) {
    variants.add(noPunctuation);
  }
  const collapsedPunctuation = base.replace(/['’`.:;!?,_/\-–—\s]/g, '');
  if (collapsedPunctuation && collapsedPunctuation !== base) {
    variants.add(collapsedPunctuation);
  }

  // 5. Broader keyword extraction for multi-word queries:
  // Remove common stop words (the, a, an, of, and) if query has >= 2 words
  const words = base.split(' ').filter(Boolean);
  if (words.length >= 2) {
    const stopWords = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to']);
    const nonStop = words.filter((w) => !stopWords.has(w.toLowerCase()));
    if (nonStop.length > 0 && nonStop.length < words.length) {
      variants.add(nonStop.join(' '));
    }
  }

  // Filter out variants that are too short (< 2 chars)
  return Array.from(variants).filter((v) => v.length >= 2);
}

/**
 * Deduplicates media items by compound key `${media_type}-${id}`
 */
function deduplicateMedia(items: SearchMediaItem[]): SearchMediaItem[] {
  const seen = new Set<string>();
  const output: SearchMediaItem[] = [];

  for (const item of items) {
    if (!item || !item.id) continue;
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    const key = `${type}-${item.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      output.push({ ...item, media_type: type as any });
    }
  }

  return output;
}

/**
 * Performs Fuse.js client-side fuzzy ranking on an array of media candidates
 */
export function rankMediaWithFuse(
  candidates: SearchMediaItem[],
  query: string
): { ranked: SearchMediaItem[]; bestMatchTitle: string | null } {
  if (candidates.length === 0 || !query.trim()) {
    return { ranked: candidates, bestMatchTitle: null };
  }

  const fuse = new Fuse(candidates, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'name', weight: 0.4 },
      { name: 'original_title', weight: 0.2 },
      { name: 'original_name', weight: 0.2 },
    ],
    threshold: 0.48, // Allows spelling variations (e.g. khani vs Khaani, avater vs Avatar)
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
    shouldSort: true,
  });

  const fuseResults = fuse.search(query);

  if (fuseResults.length === 0) {
    return { ranked: candidates, bestMatchTitle: null };
  }

  const matchedSet = new Set<string>();
  const ranked: SearchMediaItem[] = [];

  for (const res of fuseResults) {
    if (!res.item || !res.item.id) continue;
    const type = res.item.media_type || (res.item.title ? 'movie' : 'tv');
    const key = `${type}-${res.item.id}`;
    if (!matchedSet.has(key)) {
      matchedSet.add(key);
      ranked.push({
        ...res.item,
        media_type: type as any,
        _fuzzyScore: res.score,
        _isFuzzyMatch: (res.score ?? 1) > 0.05,
      });
    }
  }

  // Append remaining candidates that didn't directly match the threshold
  for (const cand of candidates) {
    if (!cand || !cand.id) continue;
    const type = cand.media_type || (cand.title ? 'movie' : 'tv');
    const key = `${type}-${cand.id}`;
    if (!matchedSet.has(key)) {
      matchedSet.add(key);
      ranked.push({ ...cand, media_type: type as any });
    }
  }

  // Find candidate for "Did you mean..."
  let bestMatchTitle: string | null = null;
  const topResult = ranked[0];
  if (topResult) {
    const matchedName = topResult.title || topResult.name;
    if (matchedName && matchedName.toLowerCase() !== query.toLowerCase()) {
      bestMatchTitle = matchedName;
    }
  }

  return { ranked: deduplicateMedia(ranked), bestMatchTitle };
}

/**
 * Searches TMDB Keywords endpoint for matching keywords and fetches
 * thematic movies & TV series via /discover/movie and /discover/tv with with_keywords.
 */
export async function discoverByKeywordSearch(
  query: string,
  page: number = 1
): Promise<{
  items: SearchMediaItem[];
  matchedKeywords: TMDBKeyword[];
  totalResults: number;
  totalPages: number;
}> {
  try {
    const keywordRes = await tmdb.searchKeywords(query, 1);
    const keywords = keywordRes.results || [];
    if (keywords.length === 0) {
      return { items: [], matchedKeywords: [], totalResults: 0, totalPages: 1 };
    }

    const lowerQuery = query.toLowerCase();
    // Prioritize exact or prefix matches, then shorter/more focused keywords
    const sortedKeywords = [...keywords].sort((a, b) => {
      const aExact = a.name.toLowerCase() === lowerQuery ? 1 : 0;
      const bExact = b.name.toLowerCase() === lowerQuery ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      const aStarts = a.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
      const bStarts = b.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
      return bStarts - aStarts;
    });

    const primaryKeyword = sortedKeywords[0];
    const topKeywords = sortedKeywords.slice(0, 2);
    const keywordIds = topKeywords.map((k) => k.id).join('|');

    // Discover movies and TV series with with_keywords in parallel
    const [moviesRes, tvRes] = await Promise.allSettled([
      tmdb.discoverMedia('movie', {
        with_keywords: keywordIds,
        page,
        sort_by: 'popularity.desc',
      }),
      tmdb.discoverMedia('tv', {
        with_keywords: keywordIds,
        page,
        sort_by: 'popularity.desc',
      }),
    ]);

    const discoveredItems: SearchMediaItem[] = [];
    let totalPages = 1;
    let totalResults = 0;

    if (moviesRes.status === 'fulfilled' && moviesRes.value?.results) {
      discoveredItems.push(
        ...moviesRes.value.results.map((m) => ({
          ...m,
          media_type: 'movie' as const,
          _isKeywordMatch: true,
          matchedKeyword: primaryKeyword.name,
        }))
      );
      totalPages = Math.max(totalPages, moviesRes.value.total_pages || 1);
      totalResults += moviesRes.value.total_results || 0;
    }

    if (tvRes.status === 'fulfilled' && tvRes.value?.results) {
      discoveredItems.push(
        ...tvRes.value.results.map((t) => ({
          ...t,
          media_type: 'tv' as const,
          _isKeywordMatch: true,
          matchedKeyword: primaryKeyword.name,
        }))
      );
      totalPages = Math.max(totalPages, tvRes.value.total_pages || 1);
      totalResults += tvRes.value.total_results || 0;
    }

    return {
      items: deduplicateMedia(discoveredItems),
      matchedKeywords: sortedKeywords.slice(0, 8),
      totalResults,
      totalPages: Math.min(totalPages, 50),
    };
  } catch (err) {
    console.error('Failed to discover by keyword search:', err);
    return { items: [], matchedKeywords: [], totalResults: 0, totalPages: 1 };
  }
}

/**
 * Comprehensive TMDB search with:
 * 1. Normalized query
 * 2. Parallel /search/multi & /search/tv retrieval to guarantee TV dramas/shows are included
 * 3. TMDB Keyword Search fallback & smart thematic matching layer via /search/keyword and /discover
 * 4. Fallback search retry using query variants if 0 or weak results
 * 5. Fuse.js client-side fuzzy scoring and ranking
 * 6. "Did you mean" detection
 */
export async function enhancedSearch(
  rawQuery: string,
  page: number = 1
): Promise<EnhancedSearchResult> {
  const normalized = normalizeSearchQuery(rawQuery);

  if (!normalized) {
    return {
      query: '',
      results: [],
      total_pages: 1,
      total_results: 0,
      didYouMean: null,
      isFuzzyMatched: false,
      usedFallbackQuery: null,
      matchedKeywords: [],
      isKeywordFallback: false,
    };
  }

  // Step 1: Run primary searches for the exact normalized query in parallel
  // Query both multiSearch and searchTv to guarantee TV shows aren't dropped
  const [multiRes, tvRes] = await Promise.allSettled([
    tmdb.multiSearch(normalized, page),
    tmdb.searchTv(normalized, page),
  ]);

  let combined: SearchMediaItem[] = [];
  let totalPages = 1;
  let totalResults = 0;
  let matchedKeywords: TMDBKeyword[] = [];
  let isKeywordFallback = false;

  if (multiRes.status === 'fulfilled' && multiRes.value) {
    const results = (multiRes.value.results || []).filter((i) => i.title || i.name);
    combined.push(...results);
    totalPages = Math.max(totalPages, multiRes.value.total_pages || 1);
    totalResults = Math.max(totalResults, multiRes.value.total_results || 0);
  }

  if (tvRes.status === 'fulfilled' && tvRes.value) {
    const tvItems: SearchMediaItem[] = (tvRes.value.results || [])
      .filter((i) => i.title || i.name)
      .map((item) => ({ ...item, media_type: 'tv' }));
    combined.push(...tvItems);
    totalResults = Math.max(totalResults, (tvRes.value.total_results || 0) + combined.length);
  }

  combined = deduplicateMedia(combined);

  let usedFallbackQuery: string | null = null;

  // Step 2: Keyword Endpoint Integration (Fallback / Smart Matching Layer)
  // When a user query does not yield direct results from /search/movie or /search/tv,
  // query /search/keyword to find relevant keyword IDs, then discover content with with_keywords
  if (combined.length === 0) {
    const keywordDiscovery = await discoverByKeywordSearch(normalized, page);
    if (keywordDiscovery.items.length > 0) {
      combined = deduplicateMedia([...combined, ...keywordDiscovery.items]);
      matchedKeywords = keywordDiscovery.matchedKeywords;
      isKeywordFallback = true;
      totalResults = Math.max(totalResults, keywordDiscovery.totalResults);
      totalPages = Math.max(totalPages, keywordDiscovery.totalPages);
    }
  }

  // Step 3: Query variant spelling fallback if results are still 0 or low (< 2) on page 1
  if (page === 1 && combined.length < 2) {
    const variants = generateSearchQueryVariants(normalized).filter(
      (v) => v.toLowerCase() !== normalized.toLowerCase()
    );

    for (const variant of variants) {
      try {
        const [variantMulti, variantTv] = await Promise.allSettled([
          tmdb.multiSearch(variant, 1),
          tmdb.searchTv(variant, 1),
        ]);

        const fallbackItems: SearchMediaItem[] = [];

        if (variantMulti.status === 'fulfilled' && variantMulti.value?.results) {
          fallbackItems.push(
            ...variantMulti.value.results.filter((i) => i.title || i.name)
          );
        }
        if (variantTv.status === 'fulfilled' && variantTv.value?.results) {
          fallbackItems.push(
            ...variantTv.value.results
              .filter((i) => i.title || i.name)
              .map((i) => ({ ...i, media_type: 'tv' as const }))
          );
        }

        if (fallbackItems.length > 0) {
          combined = deduplicateMedia([...combined, ...fallbackItems]);
          usedFallbackQuery = variant;
          totalResults = Math.max(totalResults, combined.length);
          totalPages = Math.max(totalPages, 1);
          break;
        }
      } catch (err) {
        // Continue to next variant on error
      }
    }

    // If still 0 results after variants, try keyword discovery on the variants
    if (combined.length === 0) {
      for (const variant of variants) {
        const kwVariant = await discoverByKeywordSearch(variant, page);
        if (kwVariant.items.length > 0) {
          combined = deduplicateMedia([...combined, ...kwVariant.items]);
          matchedKeywords = kwVariant.matchedKeywords;
          isKeywordFallback = true;
          usedFallbackQuery = variant;
          totalResults = Math.max(totalResults, kwVariant.totalResults);
          totalPages = Math.max(totalPages, kwVariant.totalPages);
          break;
        }
      }
    }
  }

  // Step 4: Thematic Keyword Enrichment (Combine Results)
  // If user searched a thematic word (e.g. "cyberpunk", "zombies", "post-apocalyptic")
  // and page is 1, discover and merge matching keyword media so thematic titles are included!
  if (page === 1 && combined.length > 0 && combined.length < 16 && matchedKeywords.length === 0) {
    try {
      const kwRes = await tmdb.searchKeywords(normalized, 1);
      const keywords = kwRes.results || [];
      const exactOrClose = keywords.find((k) => {
        const kName = k.name.toLowerCase();
        const qName = normalized.toLowerCase();
        return kName === qName || kName.startsWith(qName) || qName.startsWith(kName);
      });

      if (exactOrClose) {
        matchedKeywords = keywords.slice(0, 6);
        const kwDiscovery = await discoverByKeywordSearch(exactOrClose.name, 1);
        if (kwDiscovery.items.length > 0) {
          // Keep title matches prioritized, append keyword-discovered items
          combined = deduplicateMedia([...combined, ...kwDiscovery.items]);
          totalResults = Math.max(totalResults, combined.length);
        }
      }
    } catch {}
  }

  // Step 5: Client-side Fuzzy Matching & Ranking via Fuse.js
  const { ranked, bestMatchTitle } = rankMediaWithFuse(combined, normalized);

  const isFuzzy = Boolean(usedFallbackQuery || (bestMatchTitle && ranked.some((r) => r._isFuzzyMatch)));
  const didYouMean = bestMatchTitle || usedFallbackQuery;

  return {
    query: normalized,
    results: deduplicateMedia(ranked),
    total_pages: Math.min(totalPages, 50),
    total_results: Math.max(totalResults, ranked.length),
    didYouMean: didYouMean && didYouMean.toLowerCase() !== normalized.toLowerCase() ? didYouMean : null,
    isFuzzyMatched: isFuzzy,
    usedFallbackQuery,
    matchedKeywords,
    isKeywordFallback,
  };
}
