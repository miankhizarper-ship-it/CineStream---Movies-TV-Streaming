import React, { useState, useEffect } from 'react';
import { Sparkles, Film, Tv, Flame, Compass, Heart, Skull, Smile, Shield, Rocket } from 'lucide-react';
import { tmdb, Genre } from '../lib/tmdb';
import { useRouter } from '../context/RouterContext';

const GENRE_THEMES: Record<string, { bg: string; icon: any }> = {
  Action: { bg: 'from-amber-600 to-rose-700', icon: Flame },
  Adventure: { bg: 'from-emerald-600 to-teal-800', icon: Compass },
  Animation: { bg: 'from-indigo-600 to-purple-800', icon: Sparkles },
  Comedy: { bg: 'from-yellow-500 to-orange-600', icon: Smile },
  Crime: { bg: 'from-stone-700 to-red-900', icon: Shield },
  Documentary: { bg: 'from-sky-600 to-cyan-800', icon: Film },
  Drama: { bg: 'from-purple-700 to-pink-900', icon: Heart },
  Family: { bg: 'from-teal-500 to-blue-700', icon: Smile },
  Fantasy: { bg: 'from-fuchsia-600 to-purple-900', icon: Sparkles },
  History: { bg: 'from-amber-800 to-stone-900', icon: Film },
  Horror: { bg: 'from-red-900 to-black', icon: Skull },
  Music: { bg: 'from-violet-600 to-indigo-900', icon: Sparkles },
  Mystery: { bg: 'from-slate-700 to-zinc-900', icon: Compass },
  Romance: { bg: 'from-rose-500 to-pink-700', icon: Heart },
  'Science Fiction': { bg: 'from-cyan-600 to-blue-900', icon: Rocket },
  'Sci-Fi & Fantasy': { bg: 'from-cyan-600 to-indigo-900', icon: Rocket },
  Thriller: { bg: 'from-red-700 to-zinc-900', icon: Skull },
  War: { bg: 'from-stone-800 to-neutral-900', icon: Shield },
  Western: { bg: 'from-orange-800 to-amber-950', icon: Compass },
};

export const CategoriesView: React.FC = () => {
  const { navigate } = useRouter();
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAllGenres() {
      try {
        setLoading(true);
        const [mRes, tRes] = await Promise.all([
          tmdb.getGenres('movie'),
          tmdb.getGenres('tv'),
        ]);
        if (isMounted) {
          setMovieGenres(mRes.genres || []);
          setTvGenres(tRes.genres || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAllGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeGenres = activeTab === 'movie' ? movieGenres : tvGenres;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#e50914] rounded-full inline-block" />
            Categories & Genres
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore films and television by dedicated thematic genres.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/[0.08] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('movie')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'movie'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movie Genres</span>
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'tv'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Genres</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="w-full min-h-[350px] flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading genre catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {activeGenres.map((genre) => {
            const theme = GENRE_THEMES[genre.name] || {
              bg: 'from-slate-800 to-slate-950',
              icon: Film,
            };
            const Icon = theme.icon;

            return (
              <div
                key={genre.id}
                onClick={() => navigate(`/explore/${activeTab}?genre=${genre.id}`)}
                className={`group relative aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br ${theme.bg} p-3.5 sm:p-4 flex flex-col justify-between border border-white/10 shadow-lg active:scale-95 transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/30 backdrop-blur-md flex items-center justify-center text-white">
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                    {activeTab}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {genre.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-white/75 mt-0.5 truncate">
                    Explore collection →
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
