import React, { useEffect, useState } from 'react';
import { Play, Info, Plus, Check, Star, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tmdb, TMDBMedia, getBackdropUrl } from '../lib/tmdb';
import { MovieRow } from '../components/MovieRow';
import { MediaLogo } from '../components/MediaLogo';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [trendRes, popMovRes, topTvRes] = await Promise.all([
          tmdb.getTrending('all', 'day'),
          tmdb.getPopularMovies(1),
          tmdb.getTopRatedTV(1),
        ]);

        if (!isMounted) return;

        const trendList = trendRes.results || [];
        setTrending(trendList);
        setPopularMovies(popMovRes.results || []);
        setTopRatedTV(topTvRes.results || []);

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
      <div className="w-full min-h-[60dvh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-sm text-rose-400 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-[#e50914] text-white text-xs font-bold shadow-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pb-24">
      {/* Hero Showcase Spotlight */}
      {heroMedia && (
        <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] max-h-[900px] overflow-hidden select-none">
          {/* Backdrop Image & Vignette Gradients */}
          <div className="absolute inset-0 bg-[#07080a]">
            <img
              src={getBackdropUrl(heroMedia.backdrop_path || heroMedia.poster_path, 'original')}
              alt={heroMedia.title || heroMedia.name || 'Hero'}
              className="w-full h-full object-cover object-center scale-105 animate-fade-in"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/40 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080a] via-transparent to-[#07080a]/80" />
          </div>

          {/* Hero Content Details */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-12 sm:pb-16 md:pb-20">
            <div className="max-w-2xl space-y-3 sm:space-y-4">
              {/* Media Title / Logo */}
              <div className="min-h-[48px] sm:min-h-[64px] flex items-center">
                <MediaLogo
                  mediaId={heroMedia.id}
                  mediaType={heroMedia.media_type === 'tv' ? 'tv' : 'movie'}
                  titleFallback={heroMedia.title || heroMedia.name || 'Featured Title'}
                />
              </div>

              {/* Meta Info Bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-300">
                {heroMedia.vote_average ? (
                  <div className="flex items-center gap-1 text-amber-400 font-bold bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{heroMedia.vote_average.toFixed(1)}</span>
                  </div>
                ) : null}
                <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 uppercase text-[11px] font-bold">
                  {heroMedia.media_type || 'movie'}
                </span>
                <span>{(heroMedia.release_date || heroMedia.first_air_date || '').slice(0, 4)}</span>
                <span className="px-2 py-0.5 rounded border border-white/20 text-[10px] uppercase text-slate-300">
                  HD 4K
                </span>
              </div>

              {/* Overview Paragraph */}
              <p className="text-xs sm:text-sm md:text-base text-slate-300 line-clamp-3 leading-relaxed drop-shadow-md">
                {heroMedia.overview}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const mType = heroMedia.media_type === 'tv' ? 'tv' : 'movie';
                    if (mType === 'tv') {
                      navigate(`/watch/tv/${heroMedia.id}/1/1`);
                    } else {
                      navigate(`/watch/movie/${heroMedia.id}`);
                    }
                  }}
                  className="px-6 sm:px-8 py-3 rounded-2xl bg-[#e50914] hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-950/70 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  <span>Play Now</span>
                </button>

                <button
                  onClick={() => {
                    const mType = heroMedia.media_type === 'tv' ? 'tv' : 'movie';
                    navigate(`/${mType}/${heroMedia.id}`);
                  }}
                  className="px-5 sm:px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-xl border border-white/15 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Info className="w-4 h-4" />
                  <span>More Info</span>
                </button>

                <button
                  onClick={() => toggleBookmark(heroMedia)}
                  className={`p-3 rounded-2xl backdrop-blur-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                    isBookmarked(heroMedia.id)
                      ? 'bg-rose-600/90 border-rose-500 text-white shadow-lg'
                      : 'bg-black/50 border-white/15 text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                  title={isBookmarked(heroMedia.id) ? 'Remove from My List' : 'Add to My List'}
                >
                  {isBookmarked(heroMedia.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Carousel Indicators */}
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
        <MovieRow
          title="Continue Watching"
          items={history.map((item) => ({
            id: item.id,
            media_type: item.media_type,
            title: item.title,
            name: item.title,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            vote_average: 8.0,
            release_date: '',
            first_air_date: '',
            overview: '',
          }))}
          aspect="backdrop"
          exploreLink="/mylist"
          onExploreClick={() => navigate('/mylist')}
        />
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
