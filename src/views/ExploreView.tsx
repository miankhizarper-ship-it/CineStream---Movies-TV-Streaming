import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Filter,
  ArrowUpDown,
  Calendar,
  RotateCcw,
  Sparkles,
  ArrowUp,
  Loader2,
  Radio,
  Check,
} from 'lucide-react';
import { tmdb, TMDBMedia, Genre } from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import { useRouter } from '../context/RouterContext';

interface ExploreViewProps {
  initialType?: 'movie' | 'tv';
  initialGenreId?: string;
}

// Master list of all genres across Movie & TV
interface GenreOption {
  name: string;
  movieId?: number;
  tvId?: number;
}

const ALL_GENRES: GenreOption[] = [
  { name: 'Action', movieId: 28, tvId: 10759 },
  { name: 'Adventure', movieId: 12, tvId: 10759 },
  { name: 'Animation', movieId: 16, tvId: 16 },
  { name: 'Comedy', movieId: 35, tvId: 35 },
  { name: 'Crime', movieId: 80, tvId: 80 },
  { name: 'Documentary', movieId: 99, tvId: 99 },
  { name: 'Drama', movieId: 18, tvId: 18 },
  { name: 'Family', movieId: 10751, tvId: 10751 },
  { name: 'Fantasy', movieId: 14, tvId: 10765 },
  { name: 'History', movieId: 36, tvId: 18 },
  { name: 'Horror', movieId: 27, tvId: 9648 },
  { name: 'Kids', movieId: 10751, tvId: 10762 },
  { name: 'Music', movieId: 10402 },
  { name: 'Mystery', movieId: 9648, tvId: 9648 },
  { name: 'News', tvId: 10763 },
  { name: 'Reality', tvId: 10764 },
  { name: 'Romance', movieId: 10749, tvId: 18 },
  { name: 'Science Fiction', movieId: 878, tvId: 10765 },
  { name: 'Sci-Fi & Fantasy', movieId: 878, tvId: 10765 },
  { name: 'Soap', tvId: 10766 },
  { name: 'Talk', tvId: 10767 },
  { name: 'Thriller', movieId: 53, tvId: 80 },
  { name: 'TV Movie', movieId: 10770 },
  { name: 'War', movieId: 10752, tvId: 10768 },
  { name: 'War & Politics', movieId: 10752, tvId: 10768 },
  { name: 'Western', movieId: 37, tvId: 37 },
];

interface WatchProviderOption {
  id: string;
  name: string;
  providerId?: string;
  networkId?: string;
  color: string;
  badgeColor: string;
}

const STREAMING_PROVIDERS: WatchProviderOption[] = [
  { id: 'all', name: 'All Networks', color: 'text-slate-300', badgeColor: 'bg-slate-500' },
  { id: 'netflix', name: 'Netflix', providerId: '8', networkId: '213', color: 'text-[#e50914]', badgeColor: 'bg-[#e50914]' },
  { id: 'hbo', name: 'HBO / Max', providerId: '1899|384', networkId: '49', color: 'text-purple-400', badgeColor: 'bg-purple-500' },
  { id: 'disney', name: 'Disney+', providerId: '337', networkId: '2739', color: 'text-blue-400', badgeColor: 'bg-blue-500' },
  { id: 'prime', name: 'Prime Video', providerId: '9|119', networkId: '1024', color: 'text-sky-400', badgeColor: 'bg-sky-500' },
  { id: 'apple', name: 'Apple TV+', providerId: '350', networkId: '2552', color: 'text-slate-100', badgeColor: 'bg-slate-300' },
  { id: 'paramount', name: 'Paramount+', providerId: '531', networkId: '4330', color: 'text-blue-500', badgeColor: 'bg-blue-600' },
  { id: 'hulu', name: 'Hulu', providerId: '15', networkId: '453', color: 'text-emerald-400', badgeColor: 'bg-emerald-500' },
];

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popularity.desc' },
  { label: 'Highest Rated', value: 'vote_average.desc' },
  { label: 'Newest Release', value: 'release_date.desc' },
  { label: 'Oldest First', value: 'release_date.asc' },
  { label: 'Most Voted', value: 'vote_count.desc' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [
  { label: 'All Years', value: '' },
  ...Array.from({ length: 30 }, (_, i) => {
    const yr = (CURRENT_YEAR - i).toString();
    return { label: yr, value: yr };
  }),
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  initialType = 'movie',
  initialGenreId,
}) => {
  const { route, navigate } = useRouter();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(initialType);
  const [genreList, setGenreList] = useState<GenreOption[]>(ALL_GENRES);
  const [selectedGenreName, setSelectedGenreName] = useState<string>(() => {
    if (initialGenreId || route.query.genre) {
      const targetId = Number(initialGenreId || route.query.genre);
      const matched = ALL_GENRES.find((g) => g.movieId === targetId || g.tvId === targetId);
      return matched ? matched.name : '';
    }
    return '';
  });
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');

  // Infinite Scroll State
  const [items, setItems] = useState<TMDBMedia[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Sentinel ref for infinite scrolling
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  loadingMoreRef.current = loadingMore;

  useEffect(() => {
    if (initialType) setMediaType(initialType);
  }, [initialType]);

  // Fetch all genres from both Movie and TV endpoints and merge
  useEffect(() => {
    let isMounted = true;
    async function loadAllGenres() {
      try {
        const [movieData, tvData] = await Promise.all([
          tmdb.getGenres('movie').catch(() => ({ genres: [] })),
          tmdb.getGenres('tv').catch(() => ({ genres: [] })),
        ]);

        if (!isMounted) return;

        const mergedMap = new Map<string, GenreOption>();
        // Seed with master ALL_GENRES
        ALL_GENRES.forEach((g) => mergedMap.set(g.name.toLowerCase(), g));

        // Merge movie genres
        (movieData.genres || []).forEach((g: Genre) => {
          const key = g.name.toLowerCase();
          const existing = mergedMap.get(key);
          if (existing) {
            existing.movieId = g.id;
          } else {
            mergedMap.set(key, { name: g.name, movieId: g.id });
          }
        });

        // Merge tv genres
        (tvData.genres || []).forEach((g: Genre) => {
          const key = g.name.toLowerCase();
          const existing = mergedMap.get(key);
          if (existing) {
            existing.tvId = g.id;
          } else {
            mergedMap.set(key, { name: g.name, tvId: g.id });
          }
        });

        setGenreList(Array.from(mergedMap.values()));
      } catch (err) {
        console.error('Failed to load all genres:', err);
      }
    }

    loadAllGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  // Track window scroll for "Scroll to Top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Resolve current active genre ID for TMDB query
  const getActiveGenreId = useCallback(() => {
    if (!selectedGenreName) return undefined;
    const matched = genreList.find(
      (g) => g.name.toLowerCase() === selectedGenreName.toLowerCase()
    );
    if (!matched) return undefined;
    if (mediaType === 'movie') {
      return matched.movieId || matched.tvId;
    } else {
      return matched.tvId || matched.movieId;
    }
  }, [selectedGenreName, genreList, mediaType]);

  // Primary Fetcher for Page 1 when any filter/sort changes
  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        setLoading(true);
        setPage(1);

        const genreId = getActiveGenreId();
        const providerObj = STREAMING_PROVIDERS.find((p) => p.id === selectedProvider);

        const res = await tmdb.discoverMedia(mediaType, {
          page: 1,
          with_genres: genreId,
          with_watch_providers: providerObj?.providerId || undefined,
          with_networks: mediaType === 'tv' && providerObj?.networkId ? providerObj.networkId : undefined,
          sort_by: sortBy,
          year: selectedYear || undefined,
        });

        if (!isMounted) return;
        setItems(res.results || []);
        setTotalPages(Math.min(res.total_pages || 1, 500));
        setTotalResults(res.total_results || 0);
      } catch (err) {
        console.error('Failed to load explore items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [mediaType, selectedGenreName, selectedProvider, selectedYear, sortBy, getActiveGenreId]);

  // Infinite Scroll: fetch next page when sentinel is in view
  const loadNextPage = useCallback(async () => {
    if (loadingMoreRef.current || loading || page >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const genreId = getActiveGenreId();
      const providerObj = STREAMING_PROVIDERS.find((p) => p.id === selectedProvider);

      const res = await tmdb.discoverMedia(mediaType, {
        page: nextPage,
        with_genres: genreId,
        with_watch_providers: providerObj?.providerId || undefined,
        with_networks: mediaType === 'tv' && providerObj?.networkId ? providerObj.networkId : undefined,
        sort_by: sortBy,
        year: selectedYear || undefined,
      });

      const newResults = res.results || [];
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const filteredNew = newResults.filter((i) => !existingIds.has(i.id));
        return [...prev, ...filteredNew];
      });
      setPage(nextPage);
      setTotalPages(Math.min(res.total_pages || 1, 500));
    } catch (err) {
      console.error('Failed to fetch next page in explore:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, page, totalPages, mediaType, selectedProvider, selectedYear, sortBy, getActiveGenreId]);

  // Set up IntersectionObserver on sentinel
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
      { rootMargin: '350px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage, loading, page, totalPages]);

  const handleResetFilters = () => {
    setSelectedGenreName('');
    setSelectedProvider('all');
    setSelectedYear('');
    setSortBy('popularity.desc');
  };

  const hasActiveFilters = Boolean(
    selectedGenreName || selectedProvider !== 'all' || selectedYear || sortBy !== 'popularity.desc'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <span className="w-1.5 h-6 bg-[#e50914] rounded-full inline-block" />
          Discover {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Browse complete catalogue with genre categories, release years, and custom sorting.
        </p>
      </div>

      {/* Streaming Platform / Network Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span>Streaming Platform / Network</span>
            {selectedProvider !== 'all' && (
              <span className="text-[10px] text-rose-400 font-medium">
                • {STREAMING_PROVIDERS.find((p) => p.id === selectedProvider)?.name} active
              </span>
            )}
          </span>
          {selectedProvider !== 'all' && (
            <button
              onClick={() => setSelectedProvider('all')}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Clear Platform
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto py-1 scrollbar-none gap-2 snap-x">
          {STREAMING_PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`snap-start shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e2235] border-rose-500 text-white shadow-md shadow-rose-950/30'
                    : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${provider.badgeColor} ${
                    isSelected ? 'ring-2 ring-rose-500/50 ring-offset-1 ring-offset-[#12131a]' : ''
                  }`}
                />
                <span className={isSelected ? 'text-white font-bold' : provider.color}>
                  {provider.name}
                </span>
                {isSelected && <Check className="w-3 h-3 text-rose-400 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* All Genres Chips Bar (Horizontal Scrollable snap-x) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>All Genres</span>
            <span className="text-[10px] text-slate-500 font-normal">({genreList.length} categories)</span>
          </span>
          {selectedGenreName && (
            <button
              onClick={() => setSelectedGenreName('')}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Reset to All Genres
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto py-1 scrollbar-none gap-2 snap-x">
          <button
            onClick={() => setSelectedGenreName('')}
            className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
              !selectedGenreName
                ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:bg-white/10'
            }`}
          >
            All Genres
          </button>
          {genreList.map((g) => {
            const isSelected = selectedGenreName.toLowerCase() === g.name.toLowerCase();
            return (
              <button
                key={g.name}
                onClick={() => setSelectedGenreName(isSelected ? '' : g.name)}
                className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                  isSelected
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                    : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls & Filter Bar: Year, Sort, Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#12131a] border border-white/[0.08] mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Release Year Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#181a26] border border-white/[0.1] rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr.label} value={yr.value} className="bg-[#12131a] text-white">
                  {yr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#181a26] border border-white/[0.1] rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#12131a] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{items.length}</span> titles
          {totalResults > 0 && <span> ({totalResults.toLocaleString()} available)</span>}
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="w-full min-h-[380px] flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-9 h-9 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Querying TMDB Discover catalogue...
          </p>
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {items.map((item) => (
              <MovieCard
                key={`${mediaType}-${item.id}`}
                media={item}
                mediaType={mediaType}
              />
            ))}
          </div>

          {/* Sentinel element for infinite scroll */}
          <div ref={sentinelRef} className="h-10 mt-6 flex items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 py-4">
                <Loader2 className="w-4 h-4 text-[#e50914] animate-spin" />
                <span>Loading more titles...</span>
              </div>
            )}
            {!loadingMore && page >= totalPages && items.length > 0 && (
              <p className="text-xs text-slate-500 font-medium py-4">
                You've reached the end of the catalogue ({items.length} titles loaded)
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-[#12131a] rounded-2xl border border-white/[0.08] px-4">
          <Filter className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <p className="text-base text-slate-200 font-bold mb-1">No matching titles found</p>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            Try adjusting your genre or release year filters to discover more content.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/60 cursor-pointer"
          >
            Reset All Filters
          </button>
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
