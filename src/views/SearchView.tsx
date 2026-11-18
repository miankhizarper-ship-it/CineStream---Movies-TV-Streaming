import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  Film,
  Tv,
  User,
  Sparkles,
  TrendingUp,
  Loader2,
  ArrowUp,
  CheckCircle2,
  Info,
  Tag,
} from 'lucide-react';
import {
  TMDBMedia,
  TMDBKeyword,
  getImageUrl,
  enhancedSearch,
  SearchMediaItem,
  generateSearchQueryVariants,
} from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import { useRouter } from '../context/RouterContext';

export const SearchView: React.FC = () => {
  const { route, navigate } = useRouter();
  const [query, setQuery] = useState(route.query.q || '');
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'person'>('all');
  const [results, setResults] = useState<SearchMediaItem[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [isFuzzyMatched, setIsFuzzyMatched] = useState(false);
  const [usedFallbackQuery, setUsedFallbackQuery] = useState<string | null>(null);
  const [matchedKeywords, setMatchedKeywords] = useState<TMDBKeyword[]>([]);
  const [isKeywordFallback, setIsKeywordFallback] = useState(false);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trending, setTrending] = useState<TMDBMedia[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  loadingMoreRef.current = loadingMore;
  const activeFallbackRef = useRef<string | null>(null);
  activeFallbackRef.current = usedFallbackQuery;

  // Load trending suggestions on mount
  useEffect(() => {
    let isMounted = true;
    import('../lib/tmdb').then(({ tmdb }) => {
      tmdb
        .getTrending('all', 'day')
        .then((res) => {
          if (isMounted) {
            setTrending((res.results || []).slice(0, 10));
          }
        })
        .catch(() => {});
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state if URL query changes
  useEffect(() => {
    if (route.query.q !== undefined && route.query.q !== query) {
      setQuery(route.query.q);
    }
  }, [route.query.q]);

  // Track window scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Execute Search for page 1 using enhanced fuzzy & keyword fallback logic
  const executeSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setDidYouMean(null);
      setIsFuzzyMatched(false);
      setUsedFallbackQuery(null);
      setMatchedKeywords([]);
      setIsKeywordFallback(false);
      setTotalPages(1);
      setTotalResults(0);
      return;
    }

    try {
      setLoading(true);
      setPage(1);
      const searchRes = await enhancedSearch(trimmed, 1);

      setResults(searchRes.results);
      setDidYouMean(searchRes.didYouMean);
      setIsFuzzyMatched(searchRes.isFuzzyMatched);
      setUsedFallbackQuery(searchRes.usedFallbackQuery);
      setMatchedKeywords(searchRes.matchedKeywords || []);
      setIsKeywordFallback(searchRes.isKeywordFallback || false);
      setTotalPages(Math.min(searchRes.total_pages || 1, 50));
      setTotalResults(searchRes.total_results || 0);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      setDidYouMean(null);
      setIsFuzzyMatched(false);
      setUsedFallbackQuery(null);
      setMatchedKeywords([]);
      setIsKeywordFallback(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search on debounce or URL change
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query);
    }, 280);
    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  // Load next page for infinite scroll
  const loadNextPage = useCallback(async () => {
    const targetQuery = activeFallbackRef.current || query.trim();
    if (!targetQuery || loadingMoreRef.current || loading || page >= totalPages) return;

    try {
      loadingMoreRef.current = true;
      setLoadingMore(true);
      const nextPage = page + 1;
      const searchRes = await enhancedSearch(targetQuery, nextPage);
      const valid = searchRes.results.filter((item) => item.title || item.name);

      setResults((prev) => {
        const seen = new Set<string>();
        const merged: SearchMediaItem[] = [];
        for (const item of [...prev, ...valid]) {
          if (!item || !item.id) continue;
          const type = item.media_type || (item.title ? 'movie' : 'tv');
          const key = `${type}-${item.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push({ ...item, media_type: type as any });
          }
        }
        return merged;
      });
      setPage(nextPage);
      setTotalPages(Math.min(searchRes.total_pages || 1, 50));
    } catch (err) {
      console.error('Failed to fetch next search page:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [query, loading, page, totalPages]);

  // Sentinel observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loading && !loadingMoreRef.current && page < totalPages) {
          loadNextPage();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage, loading, page, totalPages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      executeSearch(query.trim());
    }
  };

  const handleSuggestionClick = (keyword: string) => {
    setQuery(keyword);
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
    executeSearch(keyword);
  };

  const filteredResults = useMemo<SearchMediaItem[]>(() => {
    const seen = new Set<string>();
    return results.filter((item: SearchMediaItem): boolean => {
      if (!item || !item.id) return false;
      const type = item.media_type || (item.title ? 'movie' : 'tv');
      const key = `${type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);

      if (activeTab === 'all') return true;
      if (activeTab === 'movie') return type === 'movie';
      if (activeTab === 'tv') return type === 'tv';
      if (activeTab === 'person') return type === 'person';
      return true;
    });
  }, [results, activeTab]);

  const movieCount = results.filter((r) => r.media_type === 'movie').length;
  const tvCount = results.filter((r) => r.media_type === 'tv').length;
  const personCount = results.filter((r) => r.media_type === 'person').length;

  const popularTags = [
    'Marvel',
    'Avatar',
    'Batman',
    'Star Wars',
    'Stranger Things',
    'Anime',
    'Oppenheimer',
    'Breaking Bad',
  ];

  // Possible typo variations if results are 0
  const alternateVariants = query.trim()
    ? generateSearchQueryVariants(query).filter(
        (v) => v.toLowerCase() !== query.trim().toLowerCase()
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      {/* Header & Search Bar Box */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Search Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse complete titles, cast, crews, and streaming media with live fuzzy search.
          </p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) {
                  navigate(`/search?q=${encodeURIComponent(e.target.value)}`);
                }
              }}
              placeholder="Search by title, TV show, actor, or genre (e.g. khani, avatar)..."
              className="w-full h-12 sm:h-14 pl-12 pr-12 rounded-2xl bg-[#12131a] border border-white/15 text-white text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:border-[#e50914] shadow-2xl transition-all"
              autoFocus
            />
            <Search className="w-5 h-5 text-rose-500 absolute left-4 pointer-events-none" />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDidYouMean(null);
                  setIsFuzzyMatched(false);
                  setUsedFallbackQuery(null);
                  setMatchedKeywords([]);
                  setIsKeywordFallback(false);
                  navigate('/search');
                }}
                className="absolute right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="ml-2.5 px-5 sm:px-6 h-12 sm:h-14 rounded-2xl bg-[#e50914] hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-950/70 transition-all shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Tab Filters (Visible when results or query exists) */}
        {results.length > 0 && (
          <div className="flex items-center justify-between gap-3 mt-4 overflow-x-auto scrollbar-none py-1 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === 'all'
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                    : 'bg-[#12131a] border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setActiveTab('movie')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === 'movie'
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                    : 'bg-[#12131a] border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Movies ({movieCount})</span>
              </button>
              <button
                onClick={() => setActiveTab('tv')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === 'tv'
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                    : 'bg-[#12131a] border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV Shows ({tvCount})</span>
              </button>
              <button
                onClick={() => setActiveTab('person')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === 'person'
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                    : 'bg-[#12131a] border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>People ({personCount})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isFuzzyMatched && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <Sparkles className="w-3 h-3" />
                  <span>Fuzzy Matched</span>
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                {totalResults > 0 && <span>{totalResults.toLocaleString()} matches</span>}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* "Did you mean..." UI Banner */}
      {didYouMean && (
        <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#161826] to-[#12131a] border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-300">
                <span className="font-medium text-slate-400">Did you mean:</span>
                <button
                  onClick={() => handleSuggestionClick(didYouMean)}
                  className="font-extrabold text-rose-400 hover:text-rose-300 underline underline-offset-2 cursor-pointer text-sm"
                >
                  "{didYouMean}"
                </button>
                <span className="text-slate-500 text-[11px]">(fuzzy typo correction)</span>
              </div>
              {usedFallbackQuery && (
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-500" />
                  <span>
                    Auto-expanded search using variant spelling:{' '}
                    <span className="text-white font-semibold">"{usedFallbackQuery}"</span>
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => handleSuggestionClick(didYouMean)}
            className="px-4 py-2 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Search "{didYouMean}"</span>
          </button>
        </div>
      )}

      {/* TMDB Keyword Search Fallback Banner */}
      {isKeywordFallback && matchedKeywords.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#131a22] to-[#12131a] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-200">
                <span className="font-bold text-emerald-400">Thematic Discovery:</span>
                <span>No direct title for "{query}". Discovered content tagged with keyword:</span>
                <span className="font-extrabold text-white bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                  #{matchedKeywords[0]?.name}
                </span>
              </div>
              {matchedKeywords.length > 1 && (
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Related keywords:</span>
                  {matchedKeywords.slice(1, 5).map((kw) => (
                    <button
                      key={kw.id}
                      onClick={() => handleSuggestionClick(kw.name)}
                      className="text-[10px] text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-850 border border-emerald-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      #{kw.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Related Thematic Keywords strip when direct matches exist */}
      {!isKeywordFallback && matchedKeywords.length > 0 && results.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6 px-4 py-2.5 rounded-xl bg-[#141622] border border-white/[0.08] flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 font-medium shrink-0">Matching keywords:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {matchedKeywords.slice(0, 6).map((kw) => (
              <button
                key={kw.id}
                onClick={() => handleSuggestionClick(kw.name)}
                className="text-[11px] font-semibold text-slate-300 hover:text-emerald-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-2.5 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer"
              >
                #{kw.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results View */}
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400 font-medium">
            <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
            <span>Searching TMDB and ranking matches for "{query}"...</span>
          </div>

          {/* Smooth Skeleton Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="rounded-2xl overflow-hidden bg-[#121420]/80 border border-white/5 animate-pulse flex flex-col"
              >
                <div className="aspect-[2/3] w-full bg-white/[0.04]" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-white/[0.08] rounded w-3/4" />
                  <div className="h-2.5 bg-white/[0.04] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {filteredResults.map((item, idx) => {
              if (item.media_type === 'person') {
                const knownForTitles = (item.known_for || [])
                  .map((k) => k.title || k.name)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(', ');

                return (
                  <div
                    key={`person-${item.id}-${idx}`}
                    onClick={() => navigate(`/person/${item.id}`)}
                    className="group cursor-pointer rounded-2xl overflow-hidden bg-[#101119] border border-white/10 hover:border-rose-500/50 p-4 text-center transition-all duration-300 hover:scale-105 hover:z-30 hover:shadow-2xl active:scale-95 flex flex-col items-center justify-between relative"
                  >
                    {item._isFuzzyMatch && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30">
                        Fuzzy
                      </span>
                    )}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-[#181a26] border border-white/10 mb-3 group-hover:border-rose-500 transition-colors shadow-lg">
                      <img
                        src={getImageUrl(item.profile_path, 'w185')}
                        alt={item.name || 'Person'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider mt-0.5">
                        {item.known_for_department || 'Actor / Creator'}
                      </p>
                      {knownForTitles && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                          {knownForTitles}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={`${item.media_type || 'item'}-${item.id}-${idx}`} className="relative group">
                  <MovieCard media={item} />
                  {item._isKeywordMatch ? (
                    <div className="absolute top-2 left-2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-emerald-400 text-[9px] font-extrabold border border-emerald-500/40 shadow-lg flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        <span>Theme: {item.matchedKeyword || 'Keyword'}</span>
                      </span>
                    </div>
                  ) : item._isFuzzyMatch ? (
                    <div className="absolute top-2 left-2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-amber-400 text-[9px] font-extrabold border border-amber-500/40 shadow-lg flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Fuzzy Match</span>
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Sentinel for Infinite Scroll */}
          <div ref={sentinelRef} className="h-10 mt-8 flex items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 py-4">
                <Loader2 className="w-4 h-4 text-[#e50914] animate-spin" />
                <span>Loading more results...</span>
              </div>
            )}
            {!loadingMore && page >= totalPages && filteredResults.length > 0 && (
              <p className="text-xs text-slate-500 font-medium py-4">
                All {results.length} matching titles loaded
              </p>
            )}
          </div>
        </>
      ) : query.trim() ? (
        <div className="text-center py-16 bg-[#12131a] rounded-3xl border border-white/[0.08] max-w-xl mx-auto p-8 shadow-2xl">
          <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-white mb-1">
            No exact matches found for "{query}"
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            We searched TMDB movies and TV series including fuzzy variants. Check the suggestions below:
          </p>

          {/* Show spelling variants as clickable suggestions if any */}
          {alternateVariants.length > 0 && (
            <div className="mb-6 pb-6 border-b border-white/[0.08]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Suggested Alternate Spellings:
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {alternateVariants.slice(0, 4).map((variant) => (
                  <button
                    key={variant}
                    onClick={() => handleSuggestionClick(variant)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all cursor-pointer"
                  >
                    "{variant}"
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Or Explore Popular Searches:
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              {popularTags.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSuggestionClick(tag)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State with Discovery & Trending */
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Quick Tags */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
              <span>Trending Searches</span>
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSuggestionClick(tag)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#12131a] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Trending Today Showcase */}
          {trending.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Popular Right Now</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {trending.slice(0, 5).map((item) => (
                  <MovieCard key={`trending-${item.id}`} media={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#12131a]/90 hover:bg-[#e50914] text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
