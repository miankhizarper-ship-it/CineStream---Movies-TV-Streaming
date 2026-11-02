import React, { useEffect, useState } from 'react';
import {
  Play,
  Plus,
  Check,
  Star,
  Sparkles,
  Flame,
  Search,
  ChevronLeft,
  ChevronRight,
  Tv,
  Calendar,
  Zap,
  Clock,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  anilistApi,
  AnilistMedia,
  getAnilistTitle,
  getAnilistBanner,
  getAnilistImage,
  cleanDescription,
  ANIME_GENRES,
  AiringScheduleItem,
} from '../lib/anilist';
import { AnimeRow } from '../components/AnimeRow';
import { useAnime } from '../context/AnimeContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';

export const AnimeHomeView: React.FC = () => {
  const { navigate } = useRouter();
  const { isAnimeWatchlisted, toggleAnimeWatchlist, animeHistory } = useAnime();
  const { showToast } = useToast();

  const [heroList, setHeroList] = useState<AnilistMedia[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const [trending, setTrending] = useState<AnilistMedia[]>([]);
  const [popular, setPopular] = useState<AnilistMedia[]>([]);
  const [airing, setAiring] = useState<AiringScheduleItem[]>([]);
  const [actionAnime, setActionAnime] = useState<AnilistMedia[]>([]);
  const [fantasyAnime, setFantasyAnime] = useState<AnilistMedia[]>([]);
  const [romanceAnime, setRomanceAnime] = useState<AnilistMedia[]>([]);
  const [scifiAnime, setScifiAnime] = useState<AnilistMedia[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAnimeData() {
      try {
        setLoading(true);
        const [
          trendRes,
          popRes,
          airingRes,
          actionRes,
          fantasyRes,
          romanceRes,
          scifiRes,
        ] = await Promise.all([
          anilistApi.getTrending(1, 15),
          anilistApi.getPopular(1, 15),
          anilistApi.getAiringSchedule({ page: 1, perPage: 12, notYetAired: true }),
          anilistApi.advancedSearch({ genres: 'Action', perPage: 15, sort: 'POPULARITY_DESC' }),
          anilistApi.advancedSearch({ genres: 'Fantasy', perPage: 15, sort: 'SCORE_DESC' }),
          anilistApi.advancedSearch({ genres: 'Romance', perPage: 15, sort: 'POPULARITY_DESC' }),
          anilistApi.advancedSearch({ genres: 'Sci-Fi', perPage: 15, sort: 'POPULARITY_DESC' }),
        ]);

        if (!isMounted) return;

        const trendResults = trendRes.results || [];
        setTrending(trendResults);
        setPopular(popRes.results || []);
        setAiring(airingRes.results || []);
        setActionAnime(actionRes.results || []);
        setFantasyAnime(fantasyRes.results || []);
        setRomanceAnime(romanceRes.results || []);
        setScifiAnime(scifiRes.results || []);

        const heroes = trendResults
          .filter((item: AnilistMedia) => (item.bannerImage || item.image) && item.description)
          .slice(0, 5);
        setHeroList(heroes.length > 0 ? heroes : trendResults.slice(0, 5));
      } catch (err) {
        console.error('Failed to load anime home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAnimeData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-rotate hero slider
  useEffect(() => {
    if (heroList.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroList.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [heroList.length]);

  const currentHero = heroList[heroIndex];
  const isHeroSaved = currentHero ? isAnimeWatchlisted(String(currentHero.id)) : false;

  const handleToggleHeroSave = async () => {
    if (!currentHero) return;
    const added = await toggleAnimeWatchlist(currentHero);
    showToast(
      added
        ? `Added "${getAnilistTitle(currentHero.title)}" to Anime Watchlist`
        : `Removed from Anime Watchlist`,
      'bookmark'
    );
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-white pt-16 pb-20">
      {/* Anime Hero Banner */}
      {currentHero && (
        <section className="relative w-full h-[70vh] sm:h-[78vh] md:h-[84vh] overflow-hidden">
          {/* Backdrop Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHero.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={getAnilistBanner(currentHero)}
                alt={getAnilistTitle(currentHero.title)}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/60 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07080d] via-[#07080d]/80 to-transparent w-full md:w-3/4" />
            </motion.div>
          </AnimatePresence>

          {/* Hero Content */}
          <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 xl:px-12 flex flex-col justify-end pb-12 sm:pb-16">
            <div className="max-w-2xl space-y-3 sm:space-y-4">
              {/* Anime Badge */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-rose-600 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-lg shadow-purple-950/60">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>FEATURED ANIME</span>
                </span>
                {currentHero.rating || currentHero.score ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-xs font-bold text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>
                      {(
                        (currentHero.rating || currentHero.score || 0) > 10
                          ? (currentHero.rating || currentHero.score || 0) / 10
                          : currentHero.rating || currentHero.score || 0
                      ).toFixed(1)}
                    </span>
                  </span>
                ) : null}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-black tracking-tight leading-none text-white drop-shadow-xl line-clamp-2">
                {getAnilistTitle(currentHero.title)}
              </h1>

              {/* Genres & Meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-purple-200">
                {currentHero.type && (
                  <span className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-md border border-white/10">
                    {currentHero.type}
                  </span>
                )}
                {currentHero.totalEpisodes && (
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-bold">
                    {currentHero.totalEpisodes} Episodes
                  </span>
                )}
                {currentHero.status && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold">
                    {currentHero.status}
                  </span>
                )}
                {currentHero.genres?.slice(0, 3).map((g) => (
                  <span key={g} className="text-slate-300 font-normal">
                    • {g}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 sm:line-clamp-3 font-normal max-w-xl leading-relaxed">
                {cleanDescription(currentHero.description)}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => navigate(`/watch/anime/${currentHero.id}/1/1`)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-950/60 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                  <span>Start Episode 1</span>
                </button>

                <button
                  onClick={() => navigate(`/anime/${currentHero.id}`)}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Overview</span>
                </button>

                <button
                  onClick={handleToggleHeroSave}
                  className={`p-3 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                    isHeroSaved
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-black/60 border-white/20 text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                  title={isHeroSaved ? 'Remove from Anime Watchlist' : 'Add to Anime Watchlist'}
                >
                  {isHeroSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="absolute bottom-6 right-4 sm:right-12 z-20 flex items-center gap-2">
            {heroList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === heroIndex ? 'w-8 bg-purple-500 shadow-md shadow-purple-500/50' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Anime Quick Genre Chips & Filter Hub */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 xl:px-12 my-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Browse Anime Genres
            </span>
          </div>
          <button
            onClick={() => navigate('/anime-explore')}
            className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Advanced Anime Search & Filter &rarr;</span>
          </button>
        </div>

        <div className="flex overflow-x-auto gap-2 py-1 scrollbar-none">
          <button
            onClick={() => navigate('/anime-explore')}
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 text-white text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            All Categories
          </button>
          {ANIME_GENRES.map((g: string) => (
            <button
              key={g}
              onClick={() => navigate(`/anime-explore?genre=${encodeURIComponent(g)}`)}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-[#12131d] border border-white/[0.08] text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-purple-950/40 text-xs font-semibold transition-all cursor-pointer"
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Continue Watching Anime Row (if history exists) */}
      {animeHistory && animeHistory.length > 0 && (
        <section className="my-8 px-4 md:px-8 xl:px-12">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg md:text-xl font-black text-white">Continue Watching Anime</h2>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-2 snap-x">
            {animeHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/watch/anime/${item.id}/1/${item.episode || 1}`)}
                className="w-48 sm:w-60 shrink-0 snap-start bg-[#12131d] border border-white/10 hover:border-rose-500/50 rounded-xl overflow-hidden cursor-pointer group transition-all"
              >
                <div className="relative aspect-[16/9] bg-slate-900">
                  <img
                    src={item.bannerImage || item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-rose-400">
                    Ep {item.episode || 1}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                  <p className="text-[11px] text-slate-400">Episode {item.episode || 1}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Anime Row */}
      <AnimeRow
        title="Trending Anime"
        subtitle="Most watched series this week"
        animeList={trending}
        loading={loading}
        badge="HOT"
        onSeeAll={() => navigate('/anime-explore?sort=TRENDING_DESC')}
      />

      {/* Airing Schedule / Weekly Releases */}
      {airing.length > 0 && (
        <section className="my-8 px-4 md:px-8 xl:px-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                <span>Top Airing Anime</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE SCHEDULE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Currently airing new episodes</p>
            </div>
            <button
              onClick={() => navigate('/anime-explore?status=RELEASING')}
              className="text-xs text-purple-400 font-bold hover:underline cursor-pointer"
            >
              All Airing Anime &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {airing.slice(0, 6).map((item) => {
              const media = (item as any).media || item;
              if (!media) return null;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/anime/${media.id}`)}
                  className="bg-[#12131d] border border-white/[0.08] hover:border-purple-500/50 rounded-xl overflow-hidden cursor-pointer group transition-all"
                >
                  <div className="relative aspect-[2/3] bg-slate-900">
                    <img
                      src={getAnilistImage(media)}
                      alt={getAnilistTitle(media.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Ep {item.episode}
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-xs font-bold text-white truncate">
                      {getAnilistTitle(media.title)}
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-medium">Airing now</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Popular Anime Row */}
      <AnimeRow
        title="Most Popular Anime"
        subtitle="All-time fan favorites"
        animeList={popular}
        loading={loading}
        onSeeAll={() => navigate('/anime-explore?sort=POPULARITY_DESC')}
      />

      {/* Action Anime Row */}
      <AnimeRow
        title="Action & Shonen Blockbusters"
        subtitle="High-octane fights & legendary sagas"
        animeList={actionAnime}
        loading={loading}
        onSeeAll={() => navigate('/anime-explore?genre=Action')}
      />

      {/* Fantasy Anime Row */}
      <AnimeRow
        title="Epic Fantasy & Isekai"
        subtitle="Magic realms & alternate worlds"
        animeList={fantasyAnime}
        loading={loading}
        onSeeAll={() => navigate('/anime-explore?genre=Fantasy')}
      />

      {/* Romance Anime Row */}
      <AnimeRow
        title="Romance & Slice of Life"
        subtitle="Heartwarming stories & school drama"
        animeList={romanceAnime}
        loading={loading}
        onSeeAll={() => navigate('/anime-explore?genre=Romance')}
      />

      {/* Sci-Fi Anime Row */}
      <AnimeRow
        title="Sci-Fi & Cyberpunk"
        subtitle="Futuristic worlds, mecha & space sagas"
        animeList={scifiAnime}
        loading={loading}
        onSeeAll={() => navigate('/anime-explore?genre=Sci-Fi')}
      />
    </div>
  );
};
