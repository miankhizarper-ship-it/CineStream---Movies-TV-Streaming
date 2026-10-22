import React, { useState, useEffect } from 'react';
import { Search, X, Film, Tv, User, Sparkles } from 'lucide-react';
import { tmdb, TMDBMedia, getImageUrl } from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import { useRouter } from '../context/RouterContext';

export const SearchView: React.FC = () => {
  const { route, navigate } = useRouter();
  const [query, setQuery] = useState(route.query.q || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'person'>('all');
  const [results, setResults] = useState<(TMDBMedia & { known_for?: TMDBMedia[] })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.query.q) {
      setQuery(route.query.q);
    }
  }, [route.query.q]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    let isMounted = true;
    async function doSearch() {
      try {
        setLoading(true);
        const data = await tmdb.multiSearch(debouncedQuery, 1);
        if (isMounted) {
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    doSearch();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      {/* Search Input Box */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, shows, actors..."
            className="w-full h-12 sm:h-14 pl-11 pr-11 rounded-2xl bg-[#12131a] border border-white/[0.1] text-white text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:border-[#e50914] shadow-xl"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Filters with touch scrolling */}
        {results.length > 0 && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none snap-x py-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                activeTab === 'all'
                  ? 'bg-[#e50914] border-rose-500 text-white'
                  : 'bg-[#12131a] border-white/[0.08] text-slate-300'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('movie')}
              className={`snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                activeTab === 'movie'
                  ? 'bg-[#e50914] border-rose-500 text-white'
                  : 'bg-[#12131a] border-white/[0.08] text-slate-300'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies ({movieCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('tv')}
              className={`snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                activeTab === 'tv'
                  ? 'bg-[#e50914] border-rose-500 text-white'
                  : 'bg-[#12131a] border-white/[0.08] text-slate-300'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Shows ({tvCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('person')}
              className={`snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                activeTab === 'person'
                  ? 'bg-[#e50914] border-rose-500 text-white'
                  : 'bg-[#12131a] border-white/[0.08] text-slate-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>People ({personCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* Results View */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
          <p className="text-xs font-medium">Searching TMDB database...</p>
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
          {filteredResults.map((item) => {
            if (item.media_type === 'person') {
              return (
                <div
                  key={`person-${item.id}`}
                  onClick={() => navigate(`/person/${item.id}`)}
                  className="group cursor-pointer rounded-xl overflow-hidden bg-[#12131a] border border-white/[0.08] p-3 text-center transition-all active:scale-95"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-[#181a26] border border-white/10 mb-2">
                    <img
                      src={getImageUrl(item.profile_path, 'w185')}
                      alt={item.name || 'Person'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.name}</h4>
                  <p className="text-[10px] sm:text-[11px] text-[#e50914] font-medium truncate">
                    Actor / Creator
                  </p>
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
      ) : debouncedQuery ? (
        <div className="text-center py-20 bg-[#12131a] rounded-2xl border border-white/[0.08] max-w-md mx-auto p-6">
          <p className="text-sm text-white font-semibold mb-1">
            No matches found for "{debouncedQuery}"
          </p>
          <p className="text-xs text-slate-400">
            Check the spelling or try searching for another title.
          </p>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 max-w-sm mx-auto p-4">
          <Sparkles className="w-7 h-7 mx-auto mb-2.5 text-[#e50914]" />
          <h3 className="text-sm font-semibold text-slate-300">
            Discover Titles & Creators
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Search across millions of movies, television episodes, and artists.
          </p>
        </div>
      )}
    </div>
  );
};
