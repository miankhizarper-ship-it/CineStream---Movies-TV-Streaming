import React, { useEffect, useState, useRef } from 'react';
import { Play, Info, Plus, Check, Star, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tmdb, TMDBMedia, getBackdropUrl } from '../lib/tmdb';
import { MovieRow } from '../components/MovieRow';
import { useBookmarks } from '../hooks/useBookmarks';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';

export const HomeView: React.FC = () => {
  const { navigate } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { history } = useWatchHistory();
  const { showToast } = useToast();

  const [heroList, setHeroList] = useState<TMDBMedia[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [trending, setTrending] = useState<TMDBMedia[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBMedia[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<TMDBMedia[]>([]);
  const [anime, setAnime] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const watchRowRef = useRef<HTMLDivElement>(null);
  const [canScrollWatchLeft, setCanScrollWatchLeft] = useState(false);
  const [canScrollWatchRight, setCanScrollWatchRight] = useState(true);

  const checkWatchScroll = () => {
    if (watchRowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = watchRowRef.current;
      setCanScrollWatchLeft(scrollLeft > 10);
      setCanScrollWatchRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkWatchScroll();
    window.addEventListener('resize', checkWatchScroll);
    return () => window.removeEventListener('resize', checkWatchScroll);
  }, [history]);

  const scrollWatch = (direction: 'left' | 'right') => {
    if (watchRowRef.current) {
      const clientWidth = watchRowRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      watchRowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkWatchScroll, 350);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [trendRes, popMovRes, topTvRes, animeRes] = await Promise.all([
          tmdb.getTrending('all', 'day'),
          tmdb.getPopularMovies(1),
          tmdb.getTopRatedTV(1),
          tmdb.getAnimeSeries(1),
        ]);

        if (!isMounted) return;

        const trendList = trendRes.results || [];
        setTrending(trendList);
        setPopularMovies(popMovRes.results || []);
        setTopRatedTV(topTvRes.results || []);
        setAnime(animeRes.results || []);

        const heroes = trendList.filter((item) => item.backdrop_path && item.overview).slice(0, 5);
        setHeroList(heroes.length > 0 ? heroes : trendList.slice(0, 5));
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load home data:', err);
          setError(err.message || 'Unable to connect to TMDB service.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto rotate hero slides every 8 seconds
  useEffect(() => {
    if (heroList.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroList.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [heroList.length]);

  const heroMedia = heroList[heroIndex] || null;

  if (loading) {
    return (
      <div className="w-full min-h-[70dvh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Loading cinema spotlight...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <div className="p-6 rounded-2xl bg-[#12131a] border border-white/[0.08] text-center">
          <h3 className="text-lg font-bold text-white mb-2">Connection Notice</h3>
          <p className="text-xs text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const heroType: 'movie' | 'tv' =
    heroMedia?.media_type === 'tv' || heroMedia?.first_air_date ? 'tv' : 'movie';
  const heroTitle = heroMedia?.title || heroMedia?.name || 'Featured Title';
  const heroSaved = heroMedia ? isBookmarked(heroMedia.id, heroType) : false;

  const handleHeroPlay = () => {
    if (!heroMedia) return;
    if (heroType === 'tv') {
      navigate(`/watch/tv/${heroMedia.id}/1/1`);
    } else {
      navigate(`/watch/movie/${heroMedia.id}`);
    }
  };

  const handleHeroDetails = () => {
    if (!heroMedia) return;
    navigate(`/${heroType}/${heroMedia.id}`);
  };

  const handleToggleHeroBookmark = () => {
    if (!heroMedia) return;
    toggleBookmark(heroMedia, heroType);
    showToast(
      heroSaved ? `Removed "${heroTitle}" from Watchlist` : `Added "${heroTitle}" to Watchlist`,
      'bookmark'
    );
  };

  return (
    <div className="w-full pb-24 space-y-4">
      {/* Mobile-Optimized Hero Spotlight Banner with Ambient Glow */}
      {heroMedia && (
        <div className="relative w-full h-[72dvh] sm:h-[82vh] min-h-[480px] max-h-[850px] overflow-hidden bg-[#07080a]">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroMedia.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              {/* Backdrop Image */}
              <img
                src={getBackdropUrl(heroMedia.backdrop_path, 'original')}
                alt={heroTitle}
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Radial-to-Linear OLED Black Vignette Scrim Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080a] via-[#07080a]/80 to-transparent md:w-3/4" />
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#07080a]/90 to-transparent" />

          {/* Ambient Glow Bleed */}
          <div className="absolute top-1/3 left-10 w-96 h-96 bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />

          {/* Hero Content Container */}
          <div className="absolute bottom-6 sm:bottom-12 md:bottom-16 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 z-10">
            <div className="max-w-2xl space-y-3 sm:space-y-4">
              {/* Metadata Badges */}
              <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-amber-400 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">
                    {heroMedia.vote_average ? heroMedia.vote_average.toFixed(1) : 'NR'}
                  </span>
                </span>
                <span className="uppercase text-[#e50914] font-extrabold tracking-wider text-[11px] px-2 py-0.5 rounded-lg bg-[#e50914]/20 border border-[#e50914]/40">
                  #1 Trending Today
                </span>
                <span className="text-slate-300 text-xs font-medium">
                  {(heroMedia.release_date || heroMedia.first_air_date || '').slice(0, 4)}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-white/10 text-slate-200 border border-white/10">
                  4K Ultra HD
                </span>
              </div>

              {/* Title with responsive text balance */}
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] drop-shadow-2xl text-balance">
                {heroTitle}
              </h1>

              {/* Overview Excerpt */}
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 leading-relaxed max-w-xl drop-shadow">
                {heroMedia.overview}
              </p>

              {/* Action Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={handleHeroPlay}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-rose-950/70 active:scale-95 transition-all touch-manipulation"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Play Now</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleHeroDetails}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/20 active:scale-95 transition-all touch-manipulation"
                  >
                    <Info className="w-4 h-4" />
                    <span>More Info</span>
                  </button>

                  <button
                    onClick={handleToggleHeroBookmark}
                    className={`p-3.5 rounded-xl border backdrop-blur-md active:scale-95 transition-all touch-manipulation ${
                      heroSaved
                        ? 'bg-[#e50914]/30 border-[#e50914] text-rose-300'
                        : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                    }`}
                    title={heroSaved ? 'Remove from My List' : 'Add to My List'}
                    aria-label={heroSaved ? 'Remove from My List' : 'Add to My List'}
                  >
                    {heroSaved ? <Check className="w-5 h-5 text-rose-400" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Slide Indicator Dots */}
              {heroList.length > 1 && (
                <div className="flex items-center gap-2 pt-4">
                  {heroList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === heroIndex ? 'w-8 bg-[#e50914]' : 'w-2 bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching Row */}
      {history.length > 0 && (
        <section className="my-6 sm:my-8 px-4 sm:px-6 md:px-12 group/row">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
              Continue Watching
            </h2>
            <button
              onClick={() => navigate('/mylist')}
              className="text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              View history →
            </button>
          </div>
          <div className="relative">
            {canScrollWatchLeft && (
              <button
                onClick={() => scrollWatch('left')}
                className="hidden md:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/90 hover:bg-[#e50914] text-white items-center justify-center backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-white/20 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div
              ref={watchRowRef}
              onScroll={checkWatchScroll}
              className="flex gap-3 overflow-x-auto overscroll-x-contain scrollbar-none snap-x snap-mandatory touch-pan-x py-4 -my-3 sm:py-6 sm:-my-5 px-1 relative z-10"
            >
              {history.slice(0, 10).map((item) => (
                <div
                  key={`history-${item.id}-${item.season || 0}-${item.episode || 0}`}
                  onClick={() => {
                    if (item.media_type === 'tv') {
                      navigate(`/watch/tv/${item.id}/${item.season || 1}/${item.episode || 1}`);
                    } else {
                      navigate(`/watch/movie/${item.id}`);
                    }
                  }}
                  className="snap-start shrink-0 w-[200px] sm:w-[260px] group relative cursor-pointer rounded-2xl overflow-hidden bg-[#12131a] border border-white/[0.08] active:scale-95 transition-all duration-300 hover:scale-105 hover:z-30 hover:border-rose-500/50 hover:shadow-2xl hover:shadow-black/90 transform-gpu"
                >
                  <div className="aspect-video w-full relative overflow-hidden bg-[#161822]">
                    <img
                      src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Progress Bar overlay */}
                    {item.progress !== undefined && item.progress > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/70">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 to-[#e50914]"
                          style={{ width: `${Math.min(100, Math.max(3, item.progress))}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 sm:p-3">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 mt-0.5">
                      <span>{item.media_type === 'tv' ? `S${item.season} · E${item.episode}` : 'Feature Film'}</span>
                      {item.progress !== undefined && item.progress > 0 && (
                        <span className="text-rose-400 font-bold tabular-nums">{item.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {canScrollWatchRight && (
              <button
                onClick={() => scrollWatch('right')}
                className="hidden md:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/90 hover:bg-[#e50914] text-white items-center justify-center backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-white/20 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* Horizontal Carousels */}
      <MovieRow
        title="Trending Today"
        items={trending}
        exploreLink="/explore/movie"
        onExploreClick={() => navigate('/explore/movie')}
      />

      <MovieRow
        title="Popular Movies"
        items={popularMovies}
        mediaType="movie"
        exploreLink="/explore/movie"
        onExploreClick={() => navigate('/explore/movie')}
      />

      <MovieRow
        title="Top Rated TV Series"
        items={topRatedTV}
        mediaType="tv"
        exploreLink="/explore/tv"
        onExploreClick={() => navigate('/explore/tv')}
      />

      <MovieRow
        title="Anime & Animation"
        items={anime}
        mediaType="tv"
        exploreLink="/explore/tv"
        onExploreClick={() => navigate('/explore/tv')}
      />

      {/* Android App Download Banner (Visible on Large PC Screen View, Hidden on Mobile View) */}
      <section className="my-10 px-4 sm:px-6 md:px-12 hidden lg:block">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-zinc-900 to-emerald-950/70 border border-emerald-500/20 p-6 sm:p-8 md:p-10 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span>Official Mobile App</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Get CineStream on your <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Android Device</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Enjoy ultra-fast 4K streaming, offline episode downloads, customized episode selection drawers, and cinema dark mode on your phone or tablet.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={() => navigate('/download-app')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-950/80 active:scale-95 transition-all"
                >
                  Download APK (v1.0.0)
                </button>
                <button
                  onClick={() => navigate('/download-app')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all"
                >
                  View App Screenshots
                </button>
              </div>
            </div>

            {/* Android App Screenshots Preview Stack */}
            <div
              onClick={() => navigate('/download-app')}
              className="cursor-pointer shrink-0 flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <div className="w-24 sm:w-28 rounded-2xl overflow-hidden border border-white/20 shadow-2xl -rotate-6 transform hover:rotate-0 transition-transform duration-300 bg-black">
                <img
                  src="/assets/aistudio/CineStream Home & Spotlight.png"
                  alt="App Home Screen"
                  className="w-full h-auto"
                />
              </div>
              <div className="w-28 sm:w-32 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-2xl z-10 bg-black">
                <img
                  src="/assets/aistudio/Ultra HD Video Player.png"
                  alt="App Video Player"
                  className="w-full h-auto"
                />
              </div>
              <div className="w-24 sm:w-28 rounded-2xl overflow-hidden border border-white/20 shadow-2xl rotate-6 transform hover:rotate-0 transition-transform duration-300 bg-black">
                <img
                  src="/assets/aistudio/Seasons & Episodes Selector.png"
                  alt="App Episode Selector"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
