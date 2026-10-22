import React, { useState, useEffect } from 'react';
import { Filter, ArrowUpDown, ChevronLeft, ChevronRight, Film, Tv } from 'lucide-react';
import { tmdb, TMDBMedia, Genre } from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import { useRouter } from '../context/RouterContext';

interface ExploreViewProps {
  initialType?: 'movie' | 'tv';
  initialGenreId?: string;
}

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popularity.desc' },
  { label: 'Highest Rated', value: 'vote_average.desc' },
  { label: 'Newest Release', value: 'primary_release_date.desc' },
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  initialType = 'movie',
  initialGenreId,
}) => {
  const { route, navigate } = useRouter();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(initialType);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>(
    initialGenreId || route.query.genre || ''
  );
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [items, setItems] = useState<TMDBMedia[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialType) setMediaType(initialType);
  }, [initialType]);

  useEffect(() => {
    let isMounted = true;
    async function loadGenres() {
      try {
        const data = await tmdb.getGenres(mediaType);
        if (isMounted) setGenres(data.genres || []);
      } catch (err) {
        console.error('Failed to load genres:', err);
      }
    }
    loadGenres();
    return () => {
      isMounted = false;
    };
  }, [mediaType]);

  useEffect(() => {
    let isMounted = true;
    async function loadMedia() {
      try {
        setLoading(true);
        const data = await tmdb.discoverMedia(mediaType, {
          with_genres: selectedGenre || undefined,
          sort_by: sortBy,
          page,
          'vote_average.gte': sortBy.includes('vote_average') ? 6 : undefined,
        });

        if (!isMounted) return;
        setItems(data.results || []);
        setTotalPages(Math.min(data.total_pages || 1, 500));
      } catch (err) {
        console.error('Failed to load explore items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMedia();
    return () => {
      isMounted = false;
    };
  }, [mediaType, selectedGenre, sortBy, page]);

  const handleTypeChange = (type: 'movie' | 'tv') => {
    setMediaType(type);
    setSelectedGenre('');
    setPage(1);
    navigate(`/explore/${type}`);
  };

  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      {/* Header & Segmented Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#e50914] rounded-full inline-block" />
            Explore {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover titles filtered by genre, popularity, and score.
          </p>
        </div>

        {/* Media Type Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/[0.08] self-start sm:self-auto">
          <button
            onClick={() => handleTypeChange('movie')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mediaType === 'movie'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies</span>
          </button>
          <button
            onClick={() => handleTypeChange('tv')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mediaType === 'tv'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Series</span>
          </button>
        </div>
      </div>

      {/* Touch-Friendly Horizontal Scrollable Genre Chips (snap-x) */}
      <div className="mb-4">
        <div className="flex overflow-x-auto py-2 scrollbar-none gap-2 snap-x">
          <button
            onClick={() => handleGenreChange('')}
            className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
              !selectedGenre
                ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:bg-white/10'
            }`}
          >
            All Genres
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => handleGenreChange(String(g.id))}
              className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedGenre === String(g.id)
                  ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                  : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:bg-white/10'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Bar */}
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-[#12131a] border border-white/[0.08] mb-6">
        <span className="text-xs text-slate-400 font-medium">
          {items.length} titles listed
        </span>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-[#181a26] border border-white/[0.1] text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#e50914]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Results: grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 */}
      {loading ? (
        <div className="w-full min-h-[350px] flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
          <p className="text-xs font-medium">Fetching catalogue...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
          {items.map((item) => (
            <MovieCard
              key={`${mediaType}-${item.id}`}
              media={item}
              mediaType={mediaType}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#12131a] rounded-2xl border border-white/[0.08]">
          <p className="text-sm text-slate-300 font-semibold mb-1">No titles found</p>
          <p className="text-xs text-slate-500 mb-4">
            Try choosing a different genre or sort option.
          </p>
          <button
            onClick={() => handleGenreChange('')}
            className="px-4 py-2 rounded-xl bg-[#e50914] text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => {
              setPage((p) => Math.max(p - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page === 1}
            className={`flex items-center gap-1 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              page > 1
                ? 'bg-white/5 border-white/[0.08] text-white active:bg-white/10'
                : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="text-xs font-semibold text-slate-400 tabular-nums">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => {
              setPage((p) => Math.min(p + 1, totalPages));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page === totalPages}
            className={`flex items-center gap-1 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              page < totalPages
                ? 'bg-[#e50914] border-rose-500 text-white active:bg-rose-500'
                : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
