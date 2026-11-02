import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Flame,
  Star,
  Search,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  Tv,
} from 'lucide-react';
import {
  anilistApi,
  AnilistMedia,
} from '../lib/anilist';
import { useRouter } from '../context/RouterContext';
import { MovieCard } from '../components/MovieCard';

export type AnimeSectionTab = 'trending' | 'popular' | 'airing' | 'search';

const ANIME_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

const STATUS_FILTERS = [
  { id: '', label: 'All Status' },
  { id: 'RELEASING', label: 'Ongoing' },
  { id: 'FINISHED', label: 'Completed' },
  { id: 'NOT_YET_RELEASED', label: 'Upcoming' },
];

const FORMAT_FILTERS = [
  { id: '', label: 'All Formats' },
  { id: 'TV', label: 'TV Series' },
  { id: 'MOVIE', label: 'Anime Movie' },
  { id: 'OVA', label: 'OVA' },
  { id: 'SPECIAL', label: 'Special' },
];

export const AnimeExploreView: React.FC = () => {
  const { route } = useRouter();

  // Active section tab
  const [activeTab, setActiveTab] = useState<AnimeSectionTab>('trending');

  // Search input
  const [searchQuery, setSearchQuery] = useState(route.query.q || '');
  const [debouncedSearch, setDebouncedSearch] = useState(route.query.q || '');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [onlyNotYetAired, setOnlyNotYetAired] = useState<boolean>(false);

  // Data states
  const [animeList, setAnimeList] = useState<AnilistMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync initial query if present
  useEffect(() => {
    if (route.query.q) {
      setSearchQuery(route.query.q);
      setDebouncedSearch(route.query.q);
      setActiveTab('search');
    }
  }, [route.query.q]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      if (searchQuery.trim()) {
        setActiveTab('search');
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch anime data according to active tab & page
  const fetchAnimeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'search' && debouncedSearch) {
        const res = await anilistApi.searchAnime(debouncedSearch, currentPage);
        setAnimeList(res.results || []);
        setHasNextPage(res.hasNextPage ?? (res.results && res.results.length >= 20));
      } else if (activeTab === 'popular') {
        const res = await anilistApi.getPopular(currentPage, 24);
        setAnimeList(res.results || []);
        setHasNextPage(res.hasNextPage ?? (res.results && res.results.length >= 24));
      } else if (activeTab === 'airing') {
        const res = await anilistApi.getAiringSchedule(currentPage, 24, {
          notYetAired: onlyNotYetAired,
        });
        setAnimeList(res.results || []);
        setHasNextPage(res.hasNextPage ?? (res.results && res.results.length >= 24));
      } else {
        // Default: trending
        const res = await anilistApi.getTrending(currentPage, 24);
        setAnimeList(res.results || []);
        setHasNextPage(res.hasNextPage ?? (res.results && res.results.length >= 24));
      }
    } catch (err: any) {
      console.error('Anime data fetch error:', err);
      setError(err.message || 'Failed to connect to AniList API. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, currentPage, onlyNotYetAired]);

  useEffect(() => {
    fetchAnimeData();
  }, [fetchAnimeData]);

  // Client-side filtration for genres, status, format
  const filteredList = animeList.filter((item) => {
    if (selectedGenre) {
      const itemGenres = item.genres || [];
      const matchGenre = itemGenres.some(
        (g) => g.toLowerCase() === selectedGenre.toLowerCase()
      );
      if (!matchGenre) return false;
    }

    if (selectedStatus && item.status) {
      if (item.status.toUpperCase() !== selectedStatus.toUpperCase()) {
        return false;
      }
    }

    if (selectedFormat && item.type) {
      if (item.type.toUpperCase() !== selectedFormat.toUpperCase()) {
        return false;
      }
    }

    return true;
  });

  const handleTabChange = (tab: AnimeSectionTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab !== 'search') {
      setSearchQuery('');
    }
  };

  const handleResetFilters = () => {
    setSelectedGenre('');
    setSelectedStatus('');
    setSelectedFormat('');
    setOnlyNotYetAired(false);
    setSearchQuery('');
    setCurrentPage(1);
    setActiveTab('trending');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-28 bg-[#07080a]">
      {/* Page Header */}
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#e50914]/20 text-rose-400 border border-[#e50914]/40 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AniList Consumet API Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <span className="w-2 h-7 sm:h-8 bg-[#e50914] rounded-full inline-block" />
              Anime Universe
            </h1>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anime titles (e.g. Demon Slayer, Naruto)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#12131a] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#e50914]/60 focus:ring-1 focus:ring-[#e50914]/50 transition-all shadow-inner"
            />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Stream high-definition anime series, explore weekly airing schedules, characters, staff credits, and community ratings.
        </p>
      </div>

      {/* Primary Section Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 rounded-2xl bg-[#12131a] border border-white/[0.08]">
        <button
          onClick={() => handleTabChange('trending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'trending'
              ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Trending Now</span>
        </button>

        <button
          onClick={() => handleTabChange('popular')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'popular'
              ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>All-Time Popular</span>
        </button>

        <button
          onClick={() => handleTabChange('airing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'airing'
              ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Airing Schedule</span>
        </button>

        {debouncedSearch && (
          <button
            onClick={() => handleTabChange('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search: "{debouncedSearch}"</span>
          </button>
        )}
      </div>

      {/* Genre Grid Selector */}
      <div className="mb-6 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            <span>Anime Genres & Themes</span>
            <span className="text-[10px] text-slate-500 font-normal">({ANIME_GENRES.length} categories)</span>
          </span>
          {selectedGenre && (
            <button
              onClick={() => setSelectedGenre('')}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Reset to All Genres
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 py-1">
          <button
            onClick={() => setSelectedGenre('')}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold text-center truncate transition-all border cursor-pointer ${
              !selectedGenre
                ? 'bg-[#e50914] border-rose-500 text-white shadow-md shadow-rose-950/40 ring-1 ring-rose-500/30'
                : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            All Genres
          </button>
          {ANIME_GENRES.map((genre) => {
            const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(isSelected ? '' : genre)}
                title={genre}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold text-center truncate transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-md shadow-rose-950/40 ring-1 ring-rose-500/30'
                    : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#12131a] border border-white/[0.08] mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#181a26] border border-white/[0.1] rounded-xl px-2.5 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#181a26] text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1.5 bg-[#181a26] border border-white/[0.1] rounded-xl px-2.5 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Format:</span>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {FORMAT_FILTERS.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#181a26] text-white">
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Airing Schedule Toggle */}
          {activeTab === 'airing' && (
            <label className="flex items-center gap-2 cursor-pointer bg-[#181a26] border border-white/[0.1] rounded-xl px-2.5 py-1.5">
              <input
                type="checkbox"
                checked={onlyNotYetAired}
                onChange={(e) => setOnlyNotYetAired(e.target.checked)}
                className="rounded accent-[#e50914]"
              />
              <span className="text-xs text-slate-300 font-medium">Upcoming Only</span>
            </label>
          )}
        </div>

        {/* Reset All */}
        {(selectedGenre || selectedStatus || selectedFormat || onlyNotYetAired || searchQuery) && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-28 gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#e50914]" />
          <p className="text-sm font-semibold tracking-wide">
            Retrieving anime catalog from Consumet AniList API...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-lg mx-auto my-12 space-y-3">
          <p className="text-rose-300 text-sm font-semibold">{error}</p>
          <button
            onClick={fetchAnimeData}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e50914] hover:bg-rose-500 text-white transition-all shadow-md cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredList.length === 0 && (
        <div className="text-center py-24 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <Tv className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Anime Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No anime matched your current filter criteria or search query. Try choosing another genre or clearing filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e50914] text-white hover:bg-rose-500 transition-all cursor-pointer shadow-lg shadow-rose-950/40"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Anime Grid matching Home Page Cards */}
      {!loading && !error && filteredList.length > 0 && (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {filteredList.map((anime) => (
            <MovieCard
              key={anime.id}
              media={anilistApi.toTMDBMedia(anime)}
              mediaType="tv"
              isAnime={true}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && filteredList.length > 0 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
                scrollToTop();
              }
            }}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-[#12131a] border border-white/10 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Page
          </button>

          <span className="text-xs font-bold text-slate-300 bg-[#12131a] px-3.5 py-2 rounded-xl border border-white/10 tabular-nums">
            Page {currentPage}
          </span>

          <button
            onClick={() => {
              if (hasNextPage) {
                setCurrentPage((prev) => prev + 1);
                scrollToTop();
              }
            }}
            disabled={!hasNextPage}
            className="px-4 py-2 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-1 cursor-pointer"
          >
            Next Page
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
