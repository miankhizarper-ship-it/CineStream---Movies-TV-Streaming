import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  SlidersHorizontal,
} from 'lucide-react';
import { tmdb, TMDBMedia, getImageUrl } from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import { useRouter } from '../context/RouterContext';

export const SearchView: React.FC = () => {
  const { route, navigate } = useRouter();
  const [query, setQuery] = useState(route.query.q || '');
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'person'>('all');
  const [results, setResults] = useState<(TMDBMedia & { known_for?: TMDBMedia[] })[]>([]);
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

  // Load trending suggestions on mount
  useEffect(() => {
    let isMounted = true;
    tmdb.getTrending('all', 'day')
      .then((res) => {
        if (isMounted) {
          setTrending((res.results || []).slice(0, 10));
        }
      })
      .catch(() => {});
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

  // Execute Search for page 1
  const executeSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setTotalPages(1);
      setTotalResults(0);
      return;
    }

    try {
      setLoading(true);
      setPage(1);
      const data = await tmdb.multiSearch(trimmed, 1);
      const raw = data.results || [];
      // Filter out items without poster/profile or empty titles
      const valid = raw.filter((item) => item.title || item.name);
      setResults(valid);
      setTotalPages(Math.min(data.total_pages || 1, 50));
      setTotalResults(data.total_results || 0);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search on debounce or URL change
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  // Load next page for infinite scroll
  const loadNextPage = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || loadingMoreRef.current || loading || page >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await tmdb.multiSearch(trimmed, nextPage);
      const raw = data.results || [];
      const valid = raw.filter((item) => item.title || item.name);

      setResults((prev) => {
        const existingIds = new Set(prev.map((i) => `${i.media_type}-${i.id}`));
        const filteredNew = valid.filter((i) => !existingIds.has(`${i.media_type}-${i.id}`));
        return [...prev, ...filteredNew];
      });
      setPage(nextPage);
      setTotalPages(Math.min(data.total_pages || 1, 50));
    } catch (err) {
      console.error('Failed to fetch next search page:', err);
    } finally {
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
  };

  const filteredResults = results.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'movie') return item.media_type === 'movie';
    if (activeTab === 'tv') return item.media_type === 'tv';
    if (activeTab === 'person') return item.media_type === 'person';
    return true;
  });

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      {/* Header & Search Bar Box */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Search Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse complete titles, cast, crews, and streaming media with live results.
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
              placeholder="Search by movie title, TV show, actor, or genre..."
              className="w-full h-12 sm:h-14 pl-12 pr-12 rounded-2xl bg-[#12131a] border border-white/15 text-white text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:border-[#e50914] shadow-2xl transition-all"
              autoFocus
            />
            <Search className="w-5 h-5 text-rose-500 absolute left-4 pointer-events-none" />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
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

        {/* Tab Filters (Visible when query exists) */}
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

            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {totalResults > 0 && <span>{totalResults.toLocaleString()} total matches</span>}
            </span>
          </div>
        )}
      </div>

      {/* Results View */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-9 h-9 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Searching TMDB database for "{query}"...
          </p>
        </div>
      ) : filteredResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {filteredResults.map((item) => {
              if (item.media_type === 'person') {
                const knownForTitles = (item.known_for || [])
                  .map((k) => k.title || k.name)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(', ');

                return (
                  <div
                    key={`person-${item.id}`}
                    onClick={() => navigate(`/person/${item.id}`)}
                    className="group cursor-pointer rounded-2xl overflow-hidden bg-[#101119] border border-white/10 hover:border-rose-500/50 p-4 text-center transition-all duration-300 hover:scale-105 hover:z-30 hover:shadow-2xl active:scale-95 flex flex-col items-center justify-between"
                  >
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
                <MovieCard
                  key={`${item.media_type || 'item'}-${item.id}`}
                  media={item}
                />
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
        <div className="text-center py-20 bg-[#12131a] rounded-3xl border border-white/[0.08] max-w-lg mx-auto p-8 shadow-2xl">
          <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-white mb-1">
            No matches found for "{query}"
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Check the spelling, search for an alternate title, or browse popular searches below.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {popularTags.slice(0, 5).map((tag) => (
              <button
                key={tag}
                onClick={() => handleSuggestionClick(tag)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors"
              >
                {tag}
              </button>
            ))}
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
                  className="px-3.5 py-1.5 rounded-xl bg-[#12131a] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
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
