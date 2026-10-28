import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Film,
  Tv,
  Flame,
  Compass,
  Heart,
  Skull,
  Smile,
  Shield,
  Rocket,
  Search,
  Clapperboard,
  X,
  Play,
  Star,
  ArrowRight,
  TrendingUp,
  Layers,
  Zap,
  Ghost,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tmdb, Genre, TMDBMedia, getImageUrl, getBackdropUrl } from '../lib/tmdb';
import { useRouter } from '../context/RouterContext';

interface GenreTheme {
  gradient: string;
  glowColor: string;
  icon: React.FC<{ className?: string }>;
  countText: string;
  tagline: string;
  sampleBackdrop?: string;
}

const GENRE_THEMES: Record<string, GenreTheme> = {
  Action: {
    gradient: 'from-[#e50914]/40 via-amber-950/30 to-[#0c0d14]',
    glowColor: 'rgba(229, 9, 20, 0.35)',
    icon: Flame,
    countText: '2,840+ Titles',
    tagline: 'High-octane blockbusters & pulse-pounding thrillers',
  },
  Adventure: {
    gradient: 'from-emerald-950/50 via-teal-950/30 to-[#0c0d14]',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    icon: Compass,
    countText: '1,920+ Titles',
    tagline: 'Epic journeys, uncharted worlds & wild quests',
  },
  Animation: {
    gradient: 'from-purple-950/50 via-indigo-950/30 to-[#0c0d14]',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    icon: Sparkles,
    countText: '1,450+ Titles',
    tagline: 'Masterpiece anime & award-winning 3D animation',
  },
  Comedy: {
    gradient: 'from-amber-950/40 via-orange-950/30 to-[#0c0d14]',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    icon: Smile,
    countText: '2,100+ Titles',
    tagline: 'Laugh-out-loud hits, sitcoms & satirical comedy',
  },
  Crime: {
    gradient: 'from-red-950/50 via-stone-900/40 to-[#0c0d14]',
    glowColor: 'rgba(220, 38, 38, 0.35)',
    icon: Shield,
    countText: '1,680+ Titles',
    tagline: 'Noir mysteries, mafia sagas & gritty police drama',
  },
  Documentary: {
    gradient: 'from-cyan-950/50 via-sky-950/30 to-[#0c0d14]',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    icon: Clapperboard,
    countText: '980+ Titles',
    tagline: 'Real stories, nature sagas & true-crime investigations',
  },
  Drama: {
    gradient: 'from-rose-950/50 via-pink-950/30 to-[#0c0d14]',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    icon: Heart,
    countText: '3,200+ Titles',
    tagline: 'Emotionally charged cinema & critically acclaimed series',
  },
  Family: {
    gradient: 'from-blue-950/50 via-cyan-950/30 to-[#0c0d14]',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    icon: Smile,
    countText: '1,240+ Titles',
    tagline: 'Wholesome entertainment for all ages',
  },
  Fantasy: {
    gradient: 'from-fuchsia-950/50 via-purple-950/30 to-[#0c0d14]',
    glowColor: 'rgba(217, 70, 239, 0.35)',
    icon: Sparkles,
    countText: '1,560+ Titles',
    tagline: 'Mythical realms, magic spells & ancient legends',
  },
  History: {
    gradient: 'from-amber-950/60 via-stone-950/40 to-[#0c0d14]',
    glowColor: 'rgba(217, 119, 6, 0.35)',
    icon: Clapperboard,
    countText: '820+ Titles',
    tagline: 'Historical epics & real event re-enactments',
  },
  Horror: {
    gradient: 'from-rose-950/70 via-black to-[#0c0d14]',
    glowColor: 'rgba(225, 29, 72, 0.45)',
    icon: Skull,
    countText: '1,410+ Titles',
    tagline: 'Spine-chilling scares, supernatural thrillers & slasher classics',
  },
  Music: {
    gradient: 'from-violet-950/50 via-indigo-950/30 to-[#0c0d14]',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    icon: Sparkles,
    countText: '620+ Titles',
    tagline: 'Concert films, musical biographies & rock sagas',
  },
  Mystery: {
    gradient: 'from-slate-900 via-zinc-950 to-[#0c0d14]',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    icon: Ghost,
    countText: '1,150+ Titles',
    tagline: 'Mind-bending puzzles, whodunits & dark secrets',
  },
  Romance: {
    gradient: 'from-pink-950/60 via-rose-950/30 to-[#0c0d14]',
    glowColor: 'rgba(244, 114, 182, 0.35)',
    icon: Heart,
    countText: '1,780+ Titles',
    tagline: 'Passionate love stories & heartwarming rom-coms',
  },
  'Science Fiction': {
    gradient: 'from-cyan-950/60 via-blue-950/40 to-[#0c0d14]',
    glowColor: 'rgba(14, 165, 233, 0.4)',
    icon: Rocket,
    countText: '2,050+ Titles',
    tagline: 'Futuristic dystopias, AI thrillers & interstellar journeys',
  },
  'Sci-Fi & Fantasy': {
    gradient: 'from-cyan-950/60 via-indigo-950/40 to-[#0c0d14]',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    icon: Rocket,
    countText: '2,300+ Titles',
    tagline: 'Sci-Fi innovations combined with magical fantasy',
  },
  Thriller: {
    gradient: 'from-red-950/60 via-zinc-950 to-[#0c0d14]',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    icon: Zap,
    countText: '2,620+ Titles',
    tagline: 'Edge-of-your-seat suspense & psychological games',
  },
  War: {
    gradient: 'from-stone-900 via-neutral-950 to-[#0c0d14]',
    glowColor: 'rgba(120, 113, 108, 0.35)',
    icon: Shield,
    countText: '740+ Titles',
    tagline: 'Heroic battlefield chronicles & military history',
  },
  Western: {
    gradient: 'from-orange-950/60 via-amber-950/40 to-[#0c0d14]',
    glowColor: 'rgba(234, 88, 12, 0.35)',
    icon: Compass,
    countText: '480+ Titles',
    tagline: 'Outlaw legends, frontier tales & classic gunfights',
  },
};

export const CategoriesView: React.FC = () => {
  const { navigate } = useRouter();
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Slide-over preview modal state
  const [previewGenre, setPreviewGenre] = useState<Genre | null>(null);
  const [previewItems, setPreviewItems] = useState<TMDBMedia[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // Fetch trending preview titles when a genre is clicked for preview modal
  useEffect(() => {
    if (!previewGenre) return;
    const targetGenreId = previewGenre.id;
    let isMounted = true;
    async function loadPreviewData() {
      try {
        setPreviewLoading(true);
        const res = await tmdb.discoverMedia(activeTab, {
          with_genres: targetGenreId,
          sort_by: 'popularity.desc',
          page: 1,
        });
        if (isMounted) {
          setPreviewItems((res.results || []).slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setPreviewLoading(false);
      }
    }
    loadPreviewData();
    return () => {
      isMounted = false;
    };
  }, [previewGenre, activeTab]);

  const activeGenres = activeTab === 'movie' ? movieGenres : tvGenres;

  const filteredGenres = activeGenres.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleOpenPreview = (genre: Genre) => {
    setPreviewGenre(genre);
  };

  const handleExploreFullCollection = (genreId: number) => {
    navigate(`/explore/${activeTab}?genre=${genreId}`);
    setPreviewGenre(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24 space-y-6">
      {/* Header & Segmented Pill Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <span className="w-1.5 h-6 bg-[#e50914] rounded-full inline-block shrink-0" />
            Categories & Genre Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dive into curated cinematic categories across movies and television.
          </p>
        </div>

        {/* Animated Pill Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#12131a] rounded-2xl border border-white/[0.1] self-start md:self-auto shadow-xl">
          <button
            onClick={() => {
              setActiveTab('movie');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'movie'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Movie Vault</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tv');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'tv'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>TV Series Vault</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Filter Bar */}
      <div className="relative max-w-md w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Filter ${activeGenres.length} ${activeTab === 'movie' ? 'movie' : 'TV'} genres (e.g., Action, Sci-Fi, Anime)...`}
          className="w-full h-11 pl-10 pr-9 rounded-2xl bg-[#12131a] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#e50914] shadow-xl"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Genre Grid */}
      {loading ? (
        <div className="w-full min-h-[350px] flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Cataloging genres...
          </p>
        </div>
      ) : filteredGenres.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
          {filteredGenres.map((genre) => {
            const theme = GENRE_THEMES[genre.name] || {
              gradient: 'from-slate-900 via-zinc-900 to-[#0c0d14]',
              glowColor: 'rgba(229, 9, 20, 0.3)',
              icon: Film,
              countText: '1,000+ Titles',
              tagline: 'Curated collection',
            };
            const Icon = theme.icon;

            return (
              <motion.div
                key={genre.id}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenPreview(genre)}
                className={`group relative aspect-[16/11] rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br ${theme.gradient} p-4 sm:p-5 flex flex-col justify-between border border-white/[0.09] hover:border-rose-500/50 shadow-xl transition-all duration-300 transform-gpu`}
                style={{
                  boxShadow: `0 10px 30px -10px ${theme.glowColor}`,
                }}
              >
                {/* Subtle Ambient Radial Glow */}
                <div
                  className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: theme.glowColor }}
                />

                {/* Top Row: Icon Badge & Content Count */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-rose-400" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/5 backdrop-blur-md">
                    {theme.countText}
                  </span>
                </div>

                {/* Bottom Row: Title & Arrow */}
                <div className="relative z-10 space-y-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-white truncate tracking-tight group-hover:text-rose-400 transition-colors">
                    {genre.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1 leading-snug">
                    {theme.tagline}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#12131a] rounded-3xl border border-white/[0.08] max-w-md mx-auto p-6">
          <Layers className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base text-white font-bold mb-1">No matching genres</h3>
          <p className="text-xs text-slate-400 mb-4">
            Try searching another keyword or reset the filter.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 rounded-xl bg-[#e50914] text-white text-xs font-bold"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Slide-Over Genre Preview Modal */}
      <AnimatePresence>
        {previewGenre && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full sm:max-w-lg h-full bg-[#0d0e15] border-l border-white/10 p-5 sm:p-7 flex flex-col overflow-y-auto scrollbar-none shadow-2xl pb-safe"
            >
              {/* Top Drawer Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-rose-400 tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  <span>Genre Showcase</span>
                </div>
                <button
                  onClick={() => setPreviewGenre(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Genre Banner Overview */}
              <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-[#e50914]/20 via-[#141622] to-[#0a0b10] border border-white/10 space-y-2 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e50914] flex items-center justify-center text-white shadow-lg">
                    {React.createElement(GENRE_THEMES[previewGenre.name]?.icon || Film, {
                      className: 'w-5 h-5',
                    })}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{previewGenre.name}</h2>
                    <p className="text-xs text-slate-400">
                      {GENRE_THEMES[previewGenre.name]?.countText || 'Popular Category'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                  {GENRE_THEMES[previewGenre.name]?.tagline ||
                    'Explore popular movies and television series curated for this category.'}
                </p>
              </div>

              {/* Trending Titles in Category */}
              <div className="flex-1 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Popular Right Now</span>
                </h3>

                {previewLoading ? (
                  <div className="py-12 flex justify-center text-slate-400 text-xs">
                    <div className="w-5 h-5 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin mr-2" />
                    Fetching top titles...
                  </div>
                ) : previewItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {previewItems.map((item) => {
                      const itemTitle = item.title || item.name || 'Untitled';
                      const year = (item.release_date || item.first_air_date || '').slice(0, 4);
                      const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            navigate(`/${activeTab}/${item.id}`);
                            setPreviewGenre(null);
                          }}
                          className="group cursor-pointer rounded-xl overflow-hidden bg-[#141622] border border-white/5 hover:border-white/20 transition-all active:scale-95"
                        >
                          <div className="aspect-[2/3] w-full relative overflow-hidden bg-black/60">
                            {item.poster_path ? (
                              <img
                                src={getImageUrl(item.poster_path, 'w342')}
                                alt={itemTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 p-2 text-center">
                                {itemTitle}
                              </div>
                            )}

                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span className="tabular-nums">{rating}</span>
                            </div>
                          </div>

                          <div className="p-2">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                              {itemTitle}
                            </h4>
                            <span className="text-[10px] text-slate-400">{year || 'Cinema'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">No preview titles available.</p>
                )}
              </div>

              {/* Action Button: Explore Full Collection */}
              <div className="pt-6 border-t border-white/[0.08]">
                <button
                  onClick={() => handleExploreFullCollection(previewGenre.id)}
                  className="w-full h-12 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-950/70 active:scale-95 transition-all"
                >
                  <span>Explore Full Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
