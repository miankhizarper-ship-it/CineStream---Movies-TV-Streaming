import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ChevronDown,
  Globe,
  Languages,
  Flame,
  Star,
  Clock,
  X,
  Film,
  Tv,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  tmdb,
  TMDBMedia,
  Genre,
  TMDBCountry,
  TMDBLanguage,
} from '../lib/tmdb';
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

export type FeedType = 'discover' | 'now_playing' | 'top_rated' | 'upcoming';

const FEED_OPTIONS: { id: FeedType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'discover', label: 'All Catalog', icon: Sparkles },
  { id: 'now_playing', label: 'Now Playing', icon: Flame },
  { id: 'top_rated', label: 'Top Rated', icon: Star },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
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

// Popular fallback countries to ensure immediate instant rendering
const POPULAR_COUNTRIES: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'KR', name: 'South Korea' },
  { code: 'JP', name: 'Japan' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'AU', name: 'Australia' },
  { code: 'CN', name: 'China' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TH', name: 'Thailand' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'HK', name: 'Hong Kong' },
];

// Popular fallback languages
const POPULAR_LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'hi', name: 'Hindi' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'zh', name: 'Chinese / Mandarin' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'th', name: 'Thai' },
  { code: 'sv', name: 'Swedish' },
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  initialType = 'movie',
  initialGenreId,
}) => {
  const { route, navigate } = useRouter();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(initialType);
  const [feedType, setFeedType] = useState<FeedType>('discover');

  // Genres
  const [genreList, setGenreList] = useState<GenreOption[]>(ALL_GENRES);
  const [selectedGenreName, setSelectedGenreName] = useState<string>(() => {
    if (initialGenreId || route.query.genre) {
      const targetId = Number(initialGenreId || route.query.genre);
      const matched = ALL_GENRES.find((g) => g.movieId === targetId || g.tvId === targetId);
      return matched ? matched.name : '';
    }
    return '';
  });

  // Configuration Filters
  const [countries, setCountries] = useState<TMDBCountry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [languages, setLanguages] = useState<TMDBLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  // Other filters
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');

  // Dropdown menus open state & search queries
  const [openDropdown, setOpenDropdown] = useState<'country' | 'language' | 'year' | 'sort' | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const filterBarRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

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

  // Fetch TMDB Configuration (Countries & Languages)
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const [cData, lData] = await Promise.all([
          tmdb.getCountries('en').catch(() => []),
          tmdb.getLanguages().catch(() => []),
        ]);

        if (!isMounted) return;
        if (Array.isArray(cData) && cData.length > 0) {
          const sorted = [...cData].sort((a, b) =>
            (a.english_name || '').localeCompare(b.english_name || '')
          );
          setCountries(sorted);
        }
        if (Array.isArray(lData) && lData.length > 0) {
          const sorted = [...lData]
            .filter((l) => Boolean(l.english_name || l.name))
            .sort((a, b) => (a.english_name || '').localeCompare(b.english_name || ''));
          setLanguages(sorted);
        }
      } catch (err) {
        console.error('Failed to load TMDB configurations:', err);
      }
    }

    loadConfig();
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

  // Unified Fetcher based on Feed Type and active filters
  const fetchItemsForPage = useCallback(
    async (targetPage: number) => {
      const genreId = getActiveGenreId();
      const providerObj = STREAMING_PROVIDERS.find((p) => p.id === selectedProvider);
      const hasGranularFilters = Boolean(
        genreId ||
        (providerObj && providerObj.id !== 'all') ||
        selectedYear ||
        selectedLanguage ||
        selectedCountry ||
        sortBy !== 'popularity.desc'
      );

      // Dedicated Feed Endpoints (/now_playing, /top_rated, /upcoming)
      if (!hasGranularFilters) {
        if (feedType === 'now_playing') {
          if (mediaType === 'movie') {
            return tmdb.getNowPlayingMovies(targetPage, selectedCountry || undefined);
          } else {
            return tmdb.getOnTheAirTV(targetPage);
          }
        }

        if (feedType === 'top_rated') {
          if (mediaType === 'movie') {
            return tmdb.getTopRatedMovies(targetPage);
          } else {
            return tmdb.getTopRatedTV(targetPage);
          }
        }

        if (feedType === 'upcoming') {
          if (mediaType === 'movie') {
            return tmdb.getUpcomingMovies(targetPage, selectedCountry || undefined);
          } else {
            return tmdb.getAiringTodayTV(targetPage);
          }
        }
      }

      // If feedType is specified WITH custom filters, tailor discover parameters
      let activeSort = sortBy;
      if (feedType === 'top_rated' && sortBy === 'popularity.desc') {
        activeSort = 'vote_average.desc';
      }

      return tmdb.discoverMedia(mediaType, {
        page: targetPage,
        with_genres: genreId,
        with_watch_providers: providerObj?.providerId || undefined,
        with_networks:
          mediaType === 'tv' && providerObj?.networkId ? providerObj.networkId : undefined,
        sort_by: activeSort,
        year: selectedYear || undefined,
        with_original_language: selectedLanguage || undefined,
        with_origin_country: selectedCountry || undefined,
      });
    },
    [
      feedType,
      mediaType,
      selectedProvider,
      selectedYear,
      selectedLanguage,
      selectedCountry,
      sortBy,
      getActiveGenreId,
    ]
  );

  // Primary Fetcher for Page 1 when any filter/feed/sort changes
  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        setLoading(true);
        setPage(1);

        const res = await fetchItemsForPage(1);
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
  }, [fetchItemsForPage]);

  // Infinite Scroll: fetch next page when sentinel is in view
  const loadNextPage = useCallback(async () => {
    if (loadingMoreRef.current || loading || page >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetchItemsForPage(nextPage);

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
  }, [fetchItemsForPage, loading, page, totalPages]);

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
    setFeedType('discover');
    setSelectedGenreName('');
    setSelectedProvider('all');
    setSelectedYear('');
    setSelectedCountry('');
    setSelectedLanguage('');
    setSortBy('popularity.desc');
    setOpenDropdown(null);
  };

  const hasActiveFilters = Boolean(
    feedType !== 'discover' ||
    selectedGenreName ||
    selectedProvider !== 'all' ||
    selectedYear ||
    selectedCountry ||
    selectedLanguage ||
    sortBy !== 'popularity.desc'
  );

  // Search filter for countries
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase().trim();
    return countries.filter(
      (c) =>
        (c.english_name && c.english_name.toLowerCase().includes(q)) ||
        (c.iso_3166_1 && c.iso_3166_1.toLowerCase().includes(q)) ||
        (c.native_name && c.native_name.toLowerCase().includes(q))
    );
  }, [countries, countrySearch]);

  // Search filter for languages
  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return languages;
    const q = languageSearch.toLowerCase().trim();
    return languages.filter(
      (l) =>
        (l.english_name && l.english_name.toLowerCase().includes(q)) ||
        (l.iso_639_1 && l.iso_639_1.toLowerCase().includes(q)) ||
        (l.name && l.name.toLowerCase().includes(q))
    );
  }, [languages, languageSearch]);

  // Display labels for the active selections
  const activeCountryLabel = useMemo(() => {
    if (!selectedCountry) return 'All Countries';
    const found =
      countries.find((c) => c.iso_3166_1 === selectedCountry) ||
      POPULAR_COUNTRIES.find((c) => c.code === selectedCountry);
    return found ? ('english_name' in found ? found.english_name : found.name) : selectedCountry;
  }, [selectedCountry, countries]);

  const activeLanguageLabel = useMemo(() => {
    if (!selectedLanguage) return 'All Languages';
    const found =
      languages.find((l) => l.iso_639_1 === selectedLanguage) ||
      POPULAR_LANGUAGES.find((l) => l.code === selectedLanguage);
    return found ? ('english_name' in found ? found.english_name : found.name) : selectedLanguage;
  }, [selectedLanguage, languages]);

  const activeYearLabel = selectedYear || 'All Years';
  const activeSortLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Most Popular';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      {/* Top Header & Media Type Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-[#e50914] rounded-full inline-block" />
            Discover {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse complete catalogue with genres, countries, languages, and release feeds.
          </p>
        </div>

        {/* Media Type Switcher (Movie vs TV) */}
        <div className="flex items-center bg-[#12131a] p-1 rounded-2xl border border-white/[0.08] self-start sm:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMediaType('movie');
              navigate('/explore/movie');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mediaType === 'movie'
                ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMediaType('tv');
              navigate('/explore/tv');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mediaType === 'tv'
                ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Series</span>
          </button>
        </div>
      </div>

      {/* Feed Mode Selector (/now_playing, /top_rated, /upcoming, discover) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [touch-action:pan-x_pan-y]">
          {FEED_OPTIONS.map((feed) => {
            const Icon = feed.icon;
            const isSelected = feedType === feed.id;
            return (
              <button
                key={feed.id}
                type="button"
                onClick={() => setFeedType(feed.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-lg shadow-rose-950/40 ring-1 ring-rose-400/30'
                    : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:bg-[#181a26] hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{feed.label}</span>
                {feed.id === 'now_playing' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
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
        <div className="flex overflow-x-auto py-1 scrollbar-none gap-2 [touch-action:pan-x_pan-y]">
          {STREAMING_PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
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

      {/* Genres Horizontal Bar (Clean, Responsive, Expand Button Removed) */}
      <div className="mb-6 bg-[#12131a] p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] shadow-sm">
        {/* Header with Title and Active Tag */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Genres</span>
              <span className="text-[10px] text-slate-500 font-normal">
                ({genreList.length} categories)
              </span>
            </span>

            {/* Active Genre Tag */}
            {selectedGenreName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold text-[11px]">
                <span>{selectedGenreName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedGenreName('')}
                  className="hover:text-white cursor-pointer"
                  title="Clear genre filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedGenreName && (
              <button
                type="button"
                onClick={() => setSelectedGenreName('')}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* All Genres in a 3-Rows Grid */}
        <div className="grid grid-rows-3 grid-flow-col auto-cols-max lg:auto-cols-fr gap-2 sm:gap-2.5 overflow-x-auto py-2.5 scrollbar-none [touch-action:pan-x_pan-y] mt-2">
          <button
            type="button"
            onClick={() => setSelectedGenreName('')}
            className={`w-full py-2 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap text-center transition-all border cursor-pointer select-none flex items-center justify-center ${
              !selectedGenreName
                ? 'bg-[#e50914] border-rose-500 text-white shadow-md shadow-rose-950/40 ring-1 ring-rose-400/30 font-bold'
                : 'bg-[#181a26] border-white/[0.08] text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-[0.98]'
            }`}
          >
            All Genres
          </button>

          {genreList.map((g) => {
            const isSelected = selectedGenreName.toLowerCase() === g.name.toLowerCase();
            return (
              <button
                key={g.name}
                type="button"
                onClick={() => setSelectedGenreName(isSelected ? '' : g.name)}
                className={`w-full py-2 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap text-center transition-all border cursor-pointer select-none flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-md shadow-rose-950/40 ring-1 ring-rose-400/30 font-bold'
                    : 'bg-[#181a26] border-white/[0.08] text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-[0.98]'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Styled Responsive Filter Bar: Country, Language, Year, Sort */}
      <div
        ref={filterBarRef}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-[#12131a] border border-white/[0.08] mb-6 relative z-30"
      >
        {/* Dropdowns Row (2x2 grid on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {/* Dropdown 1: Country Filter (TMDB /configuration/countries) */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(openDropdown === 'country' ? null : 'country');
                setCountrySearch('');
              }}
              aria-expanded={openDropdown === 'country'}
              className={`w-full sm:w-auto sm:min-w-[150px] md:min-w-[170px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer select-none ${
                openDropdown === 'country' || selectedCountry
                  ? 'bg-[#1e2235] border-rose-500/60 text-white shadow-md shadow-rose-950/20'
                  : 'bg-[#161824] hover:bg-[#1c1f30] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-rose-500/15 flex items-center justify-center shrink-0">
                  <Globe className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                    Country
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {activeCountryLabel}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                  openDropdown === 'country' ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Country Popover Menu */}
            <AnimatePresence>
              {openDropdown === 'country' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-72 bg-[#121420]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/90 p-1.5 z-50 overflow-hidden"
                >
                  {/* Search input */}
                  <div className="p-1.5 border-b border-white/[0.08]">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search countries..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full bg-[#181a26] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-60 sm:max-h-72 overflow-y-auto overscroll-contain p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCountry('');
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        !selectedCountry
                          ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>All Countries</span>
                      {!selectedCountry && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    {!countrySearch.trim() && (
                      <>
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          Popular Regions
                        </div>
                        {POPULAR_COUNTRIES.map((c) => {
                          const isSelected = selectedCountry === c.code;
                          return (
                            <button
                              key={`pop-${c.code}`}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c.code);
                                setOpenDropdown(null);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                                  : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-black/30 text-rose-100' : 'bg-white/5 text-slate-400'
                                }`}
                              >
                                {c.code}
                              </span>
                            </button>
                          );
                        })}

                        {countries.length > 0 && (
                          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 border-t border-white/[0.06] pt-1.5">
                            All Countries ({countries.length})
                          </div>
                        )}
                      </>
                    )}

                    {(countrySearch.trim() ? filteredCountries : countries).map((c) => {
                      const isSelected = selectedCountry === c.iso_3166_1;
                      return (
                        <button
                          key={c.iso_3166_1}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c.iso_3166_1);
                            setOpenDropdown(null);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <span className="truncate">{c.english_name || c.native_name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-black/30 text-rose-100' : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {c.iso_3166_1}
                          </span>
                        </button>
                      );
                    })}

                    {countrySearch.trim() && filteredCountries.length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-500 font-medium">
                        No countries match "{countrySearch}"
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dropdown 2: Language Filter (TMDB /configuration/languages) */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(openDropdown === 'language' ? null : 'language');
                setLanguageSearch('');
              }}
              aria-expanded={openDropdown === 'language'}
              className={`w-full sm:w-auto sm:min-w-[150px] md:min-w-[170px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer select-none ${
                openDropdown === 'language' || selectedLanguage
                  ? 'bg-[#1e2235] border-sky-500/60 text-white shadow-md shadow-sky-950/20'
                  : 'bg-[#161824] hover:bg-[#1c1f30] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-sky-500/15 flex items-center justify-center shrink-0">
                  <Languages className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                    Language
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {activeLanguageLabel}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                  openDropdown === 'language' ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Language Popover Menu */}
            <AnimatePresence>
              {openDropdown === 'language' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 sm:left-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-72 bg-[#121420]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/90 p-1.5 z-50 overflow-hidden"
                >
                  {/* Search input */}
                  <div className="p-1.5 border-b border-white/[0.08]">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search languages..."
                        value={languageSearch}
                        onChange={(e) => setLanguageSearch(e.target.value)}
                        className="w-full bg-[#181a26] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-60 sm:max-h-72 overflow-y-auto overscroll-contain p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguage('');
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        !selectedLanguage
                          ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>All Languages</span>
                      {!selectedLanguage && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    {!languageSearch.trim() && (
                      <>
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          Popular Languages
                        </div>
                        {POPULAR_LANGUAGES.map((l) => {
                          const isSelected = selectedLanguage === l.code;
                          return (
                            <button
                              key={`pop-lang-${l.code}`}
                              type="button"
                              onClick={() => {
                                setSelectedLanguage(l.code);
                                setOpenDropdown(null);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                                  : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                              }`}
                            >
                              <span className="truncate">{l.name}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-black/30 text-rose-100' : 'bg-white/5 text-slate-400'
                                }`}
                              >
                                {l.code}
                              </span>
                            </button>
                          );
                        })}

                        {languages.length > 0 && (
                          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 border-t border-white/[0.06] pt-1.5">
                            All Languages ({languages.length})
                          </div>
                        )}
                      </>
                    )}

                    {(languageSearch.trim() ? filteredLanguages : languages).map((l) => {
                      const isSelected = selectedLanguage === l.iso_639_1;
                      return (
                        <button
                          key={l.iso_639_1}
                          type="button"
                          onClick={() => {
                            setSelectedLanguage(l.iso_639_1);
                            setOpenDropdown(null);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <span className="truncate">{l.english_name || l.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-black/30 text-rose-100' : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {l.iso_639_1}
                          </span>
                        </button>
                      );
                    })}

                    {languageSearch.trim() && filteredLanguages.length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-500 font-medium">
                        No languages match "{languageSearch}"
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dropdown 3: Release Year Filter */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
              aria-expanded={openDropdown === 'year'}
              className={`w-full sm:w-auto sm:min-w-[125px] md:min-w-[140px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer select-none ${
                openDropdown === 'year' || selectedYear
                  ? 'bg-[#1e2235] border-emerald-500/60 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-[#161824] hover:bg-[#1c1f30] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                    Year
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {activeYearLabel}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                  openDropdown === 'year' ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Year Popover Menu */}
            <AnimatePresence>
              {openDropdown === 'year' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 sm:left-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-56 bg-[#121420]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/90 p-1.5 z-50 overflow-hidden"
                >
                  <div className="max-h-60 sm:max-h-72 overflow-y-auto overscroll-contain p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {YEAR_OPTIONS.map((yr) => {
                      const isSelected = selectedYear === yr.value;
                      return (
                        <button
                          key={yr.label}
                          type="button"
                          onClick={() => {
                            setSelectedYear(yr.value);
                            setOpenDropdown(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <span>{yr.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dropdown 4: Sort Filter */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              aria-expanded={openDropdown === 'sort'}
              className={`w-full sm:w-auto sm:min-w-[140px] md:min-w-[160px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer select-none ${
                openDropdown === 'sort' || sortBy !== 'popularity.desc'
                  ? 'bg-[#1e2235] border-amber-500/60 text-white shadow-md shadow-amber-950/20'
                  : 'bg-[#161824] hover:bg-[#1c1f30] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                    Sort By
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {activeSortLabel}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                  openDropdown === 'sort' ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Sort Popover Menu */}
            <AnimatePresence>
              {openDropdown === 'sort' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-60 bg-[#121420]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/90 p-1.5 z-50 overflow-hidden"
                >
                  <div className="p-1 space-y-0.5">
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortBy === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.value);
                            setOpenDropdown(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all cursor-pointer h-[42px] active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="text-xs text-slate-400 font-medium shrink-0 flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t border-white/[0.06] md:border-t-0">
          <div>
            Showing <span className="text-white font-bold">{items.length}</span> titles
            {totalResults > 0 && <span> ({totalResults.toLocaleString()} available)</span>}
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar (When multiple filters are set) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Active Filters:
          </span>

          {feedType !== 'discover' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <span>Feed: {FEED_OPTIONS.find((f) => f.id === feedType)?.label}</span>
              <button
                type="button"
                onClick={() => setFeedType('discover')}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCountry && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <Globe className="w-3 h-3" />
              <span>Country: {activeCountryLabel}</span>
              <button
                type="button"
                onClick={() => setSelectedCountry('')}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedLanguage && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold">
              <Languages className="w-3 h-3" />
              <span>Language: {activeLanguageLabel}</span>
              <button
                type="button"
                onClick={() => setSelectedLanguage('')}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedGenreName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <span>Genre: {selectedGenreName}</span>
              <button
                type="button"
                onClick={() => setSelectedGenreName('')}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedYear && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span>Year: {selectedYear}</span>
              <button
                type="button"
                onClick={() => setSelectedYear('')}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedProvider !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <span>
                Platform: {STREAMING_PROVIDERS.find((p) => p.id === selectedProvider)?.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProvider('all')}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Grid Results */}
      {loading ? (
        <div className="w-full min-h-[380px] flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-9 h-9 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            {feedType !== 'discover'
              ? `Loading ${FEED_OPTIONS.find((f) => f.id === feedType)?.label}...`
              : 'Querying TMDB Discover catalogue...'}
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
            Try adjusting your feed, genre, country, language, or release year filters to discover more content.
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
