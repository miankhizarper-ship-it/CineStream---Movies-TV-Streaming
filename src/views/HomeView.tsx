import React, { useEffect, useState } from 'react';
import { Play, Info, Plus, Check, Star, RefreshCw } from 'lucide-react';
import { tmdb, TMDBMedia, getBackdropUrl } from '../lib/tmdb';
import { MovieRow } from '../components/MovieRow';
import { useBookmarks } from '../hooks/useBookmarks';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useRouter } from '../context/RouterContext';

export const HomeView: React.FC = () => {
  const { navigate } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { history } = useWatchHistory();

  const [heroMedia, setHeroMedia] = useState<TMDBMedia | null>(null);
  const [trending, setTrending] = useState<TMDBMedia[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBMedia[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<TMDBMedia[]>([]);
  const [anime, setAnime] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const heroCandidate =
          trendList.find((item) => item.backdrop_path && item.overview) || trendList[0];
        setHeroMedia(heroCandidate || null);
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

  if (loading) {
    return (
      <div className="w-full min-h-[70dvh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading cinema spotlight...</p>
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

  return (
    <div className="w-full pb-24">
      {/* Mobile-Optimized Hero Spotlight Banner */}
      {heroMedia && (
        <div className="relative w-full h-[70dvh] sm:h-[80vh] min-h-[460px] max-h-[820px] overflow-hidden bg-[#07080a]">
          {/* Backdrop Image */}
          <img
            src={getBackdropUrl(heroMedia.backdrop_path, 'original')}
            alt={heroTitle}
            className="w-full h-full object-cover object-center scale-105"
          />

          {/* Radial-to-Linear Gradient Scrim Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080a] via-[#07080a]/70 to-transparent md:w-3/4" />
          <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#07080a]/80 to-transparent" />

          {/* Hero Content Container */}
          <div className="absolute bottom-6 sm:bottom-12 md:bottom-16 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 z-10">
            <div className="max-w-2xl space-y-2 sm:space-y-3.5">
              {/* Unboxed Metadata */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">
                    {heroMedia.vote_average ? heroMedia.vote_average.toFixed(1) : 'NR'}
                  </span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="uppercase text-[#e50914] font-bold tracking-wider text-[11px]">
                  #1 Trending
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{(heroMedia.release_date || heroMedia.first_air_date || '').slice(0, 4)}</span>
              </div>

              {/* Title with responsive clamp */}
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] drop-shadow-xl text-balance">
                {heroTitle}
              </h1>

              {/* Overview Excerpt: max 2 lines on mobile screens */}
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 leading-relaxed max-w-xl drop-shadow">
                {heroMedia.overview}
              </p>

              {/* Action Buttons: Play takes full width on small screens */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                <button
                  onClick={handleHeroPlay}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950/60 active:scale-95 transition-all touch-manipulation"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play Now</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleHeroDetails}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/20 active:scale-95 transition-all touch-manipulation"
                  >
                    <Info className="w-4 h-4" />
                    <span>Details</span>
                  </button>

                  <button
                    onClick={() => toggleBookmark(heroMedia, heroType)}
                    className={`p-3 rounded-xl border backdrop-blur-md active:scale-95 transition-all touch-manipulation ${
                      heroSaved
                        ? 'bg-[#e50914]/30 border-[#e50914] text-rose-300'
                        : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                    }`}
                    title={heroSaved ? 'Remove from My List' : 'Add to My List'}
                    aria-label={heroSaved ? 'Remove from My List' : 'Add to My List'}
                  >
                    {heroSaved ? <Check className="w-4 h-4 text-rose-400" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching Row (from watch history) */}
      {history.length > 0 && (
        <section className="my-6 sm:my-8 px-4 sm:px-6 md:px-12">
          <div className="flex items-baseline justify-between mb-2.5 sm:mb-3.5">
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
          <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory touch-pan-x py-1">
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
                className="snap-start shrink-0 w-[200px] sm:w-[260px] group relative cursor-pointer rounded-xl overflow-hidden bg-[#12131a] border border-white/[0.08] active:scale-95 transition-all"
              >
                <div className="aspect-video w-full relative overflow-hidden bg-[#161822]">
                  <img
                    src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-2 sm:p-2.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</h4>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                    {item.media_type === 'tv' ? `S${item.season} · E${item.episode}` : 'Movie'}
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  );
};
