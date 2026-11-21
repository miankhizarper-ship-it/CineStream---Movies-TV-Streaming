import React, { useEffect, useState } from 'react';
import { Play, Info, Plus, Check, Star } from 'lucide-react';
import { tmdb, TMDBMedia, getBackdropUrl } from '../lib/tmdb';
import { MovieRow } from '../components/MovieRow';
import { MediaLogo } from '../components/MediaLogo';
import { SEOHead } from '../components/SEOHead';
import { AppLink } from '../components/AppLink';
import { getOrigin } from '../lib/seo';
import { useBookmarks } from '../hooks/useBookmarks';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useRouter } from '../context/RouterContext';

function isTmdbBackdropPath(path: string | null | undefined): path is string {
  return Boolean(
    path &&
      path.startsWith('/') &&
      !path.startsWith('/assets/') &&
      !path.startsWith('/pwa-') &&
      !path.startsWith('http')
  );
}

const HomeSkeleton: React.FC<{ seoNode: React.ReactNode }> = ({ seoNode }) => (
  <div className="w-full flex flex-col pb-24">
    {seoNode}
    <h1 className="sr-only">CineStream – Watch Movies & TV Series Online in HD</h1>

    {/* Matched-height Hero Skeleton to prevent Desktop & Mobile CLS */}
    <section
      aria-label="Loading spotlight"
      className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] max-h-[900px] overflow-hidden bg-[#07080a]"
    >
      <div className="absolute inset-0 skeleton-shimmer opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/40 to-black/60" />
      <div className="absolute inset-0 z-10 flex flex-col justify-end max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-2xl space-y-4">
          <div className="h-14 sm:h-16 md:h-24 w-64 sm:w-80 rounded-xl bg-white/[0.06]" />
          <div className="flex gap-2">
            <div className="h-6 w-14 rounded-lg bg-white/[0.06]" />
            <div className="h-6 w-16 rounded-lg bg-white/[0.06]" />
            <div className="h-6 w-12 rounded-lg bg-white/[0.06]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full max-w-lg rounded bg-white/[0.05]" />
            <div className="h-4 w-4/5 max-w-md rounded bg-white/[0.05]" />
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-32 rounded-2xl bg-[#e50914]/40" />
            <div className="h-11 w-32 rounded-2xl bg-white/[0.07]" />
          </div>
        </div>
      </div>
    </section>

    {/* Matched-height Carousel Row Skeletons */}
    {[0, 1, 2].map((rowIdx) => (
      <section key={rowIdx} className="relative my-5 sm:my-7 md:my-8 px-4 sm:px-6 md:px-12">
        <div className="h-6 w-40 rounded-lg bg-white/[0.06] mb-3.5" />
        <div className="flex gap-2.5 sm:gap-4 overflow-hidden py-2 px-1">
          {[0, 1, 2, 3, 4, 5, 6].map((cardIdx) => (
            <div
              key={cardIdx}
              className="shrink-0 w-[125px] sm:w-[165px] md:w-[200px] aspect-[2/3] rounded-2xl bg-[#101119] border border-white/10 skeleton-shimmer"
            />
          ))}
        </div>
      </section>
    ))}
  </div>
);

export const HomeView: React.FC = () => {
  const { navigate } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { history } = useWatchHistory();

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
  const origin = getOrigin() || 'https://cinestreams.net';
  const heroTitle = heroMedia ? heroMedia.title || heroMedia.name || 'Featured Title' : '';
  const heroType = heroMedia?.media_type === 'tv' ? 'tv' : 'movie';
  const heroBackdropPath = heroMedia ? heroMedia.backdrop_path || heroMedia.poster_path : null;
  const heroSrc = heroBackdropPath ? getBackdropUrl(heroBackdropPath, 'w1280') : undefined;
  const heroSrcSet = isTmdbBackdropPath(heroBackdropPath)
    ? `${getBackdropUrl(heroBackdropPath, 'w780')} 780w, ${getBackdropUrl(heroBackdropPath, 'w1280')} 1280w`
    : undefined;

  const homeStructuredData = [
    {
      '@type': 'WebSite',
      name: 'CineStream',
      url: `${origin}/`,
      description:
        'Stream trending movies and TV shows in 4K Ultra HD, explore curated genres, and sync your personal watchlist on CineStream.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      name: 'CineStream',
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web, Android, Windows',
      url: `${origin}/`,
    },
  ];

  const seoNode = (
    <SEOHead
      title="CineStream – Watch Movies & TV Series Online in HD"
      description="Stream trending movies and TV shows in 4K Ultra HD, explore curated genres, and sync your personal watchlist on CineStream."
      canonicalPath="/"
      ogType="website"
      ogImage={
        heroBackdropPath
          ? getBackdropUrl(heroBackdropPath, 'w1280')
          : '/pwa-512x512.png'
      }
      structuredData={homeStructuredData}
    />
  );

  if (loading) {
    return <HomeSkeleton seoNode={seoNode} />;
  }

  if (error) {
    return (
      <div className="w-full min-h-[75dvh] flex flex-col items-center justify-center gap-4 text-center px-4">
        {seoNode}
        <h1 className="text-lg font-extrabold text-white">CineStream – Movies & TV Series</h1>
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
      {seoNode}

      {/* Hero Showcase Spotlight */}
      {heroMedia ? (
        <section
          aria-label="Featured spotlight"
          className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] max-h-[900px] overflow-hidden select-none"
        >
          {/* Backdrop Image & Vignette Gradients */}
          <div className="absolute inset-0 bg-[#07080a]">
            {heroSrc && (
              <img
                src={heroSrc}
                srcSet={heroSrcSet}
                sizes="100vw"
                width={1280}
                height={720}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                alt={`${heroTitle} featured backdrop`}
                className="w-full h-full object-cover object-center scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/40 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080a] via-transparent to-[#07080a]/80" />
          </div>

          {/* Hero Content Details */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-12 sm:pb-16 md:pb-20">
            <div className="max-w-2xl space-y-3 sm:space-y-4">
              {/* Media Title / Logo with fixed vertical reservation to prevent CLS */}
              <div className="h-14 sm:h-16 md:h-24 flex items-center">
                <MediaLogo
                  as="h1"
                  size="w300"
                  mediaId={heroMedia.id}
                  mediaType={heroType}
                  titleFallback={heroTitle}
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
                <AppLink
                  to={heroType === 'tv' ? `/watch/tv/${heroMedia.id}/1/1` : `/watch/movie/${heroMedia.id}`}
                  className="px-6 sm:px-8 py-3 rounded-2xl bg-[#e50914] hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-950/70 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  <span>Play Now</span>
                </AppLink>

                <AppLink
                  to={`/${heroType}/${heroMedia.id}`}
                  className="px-5 sm:px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-xl border border-white/15 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Info className="w-4 h-4" />
                  <span>More Info</span>
                </AppLink>

                <button
                  onClick={() => toggleBookmark(heroMedia)}
                  className={`p-3 rounded-2xl backdrop-blur-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                    isBookmarked(heroMedia.id)
                      ? 'bg-rose-600/90 border-rose-500 text-white shadow-lg'
                      : 'bg-black/50 border-white/15 text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                  title={isBookmarked(heroMedia.id) ? 'Remove from My List' : 'Add to My List'}
                  aria-label={isBookmarked(heroMedia.id) ? 'Remove from My List' : 'Add to My List'}
                >
                  {isBookmarked(heroMedia.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Carousel Indicators (compositor-only transform + opacity) */}
              {heroList.length > 1 && (
                <div className="flex items-center gap-1.5 pt-4">
                  {heroList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroIndex(idx)}
                      className="relative w-7 h-2 flex items-center justify-center cursor-pointer"
                      aria-label={`Go to slide ${idx + 1}`}
                    >
                      <span
                        className={`block h-1.5 w-full rounded-full origin-center transition-[transform,opacity,background-color] duration-300 ${
                          idx === heroIndex
                            ? 'bg-[#e50914] scale-x-100 opacity-100'
                            : 'bg-white/50 scale-x-[0.28] opacity-60 hover:opacity-90'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <h1 className="sr-only">CineStream – Watch Movies & TV Series Online in HD</h1>
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
      <section className="my-10 px-4 sm:px-6 md:px-12 hidden lg:block cv-auto">
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
                <AppLink
                  to="/download-app"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-950/80 active:scale-95 transition-all"
                >
                  Download APK (v1.0.14)
                </AppLink>
                <AppLink
                  to="/download-app"
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all"
                >
                  View App Screenshots
                </AppLink>
              </div>
            </div>

            {/* Android App Screenshots Preview Stack */}
            <AppLink
              to="/download-app"
              aria-label="Preview CineStream Android App Screenshots"
              className="shrink-0 flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <div className="w-24 sm:w-28 aspect-[9/21] rounded-2xl overflow-hidden border border-white/20 shadow-2xl -rotate-6 transform hover:rotate-0 transition-transform duration-300 bg-black">
                <img
                  src="/assets/aistudio/CineStream Home & Spotlight.webp"
                  alt="CineStream Android App Home & Spotlight screen"
                  width={540}
                  height={1260}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-28 sm:w-32 aspect-[9/21] rounded-2xl overflow-hidden border border-emerald-500/40 shadow-2xl z-10 bg-black">
                <img
                  src="/assets/aistudio/Ultra HD Video Player.webp"
                  alt="CineStream Android App Ultra HD Video Player screen"
                  width={540}
                  height={1260}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-24 sm:w-28 aspect-[9/21] rounded-2xl overflow-hidden border border-white/20 shadow-2xl rotate-6 transform hover:rotate-0 transition-transform duration-300 bg-black">
                <img
                  src="/assets/aistudio/Seasons & Episodes Selector.webp"
                  alt="CineStream Android App Seasons & Episodes Selector screen"
                  width={540}
                  height={1260}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </AppLink>
          </div>
        </div>
      </section>
    </div>
  );
};

