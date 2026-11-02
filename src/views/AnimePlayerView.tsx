import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Tv,
  Server,
  Sparkles,
  Info,
  Check,
  Plus,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { anilistApi, AnilistMedia, getAnilistTitle, cleanDescription } from '../lib/anilist';
import { AnimeCard } from '../components/AnimeCard';
import { useAnime } from '../context/AnimeContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';

interface AnimePlayerViewProps {
  id: string;
  season?: string;
  episode?: string;
}

export const AnimePlayerView: React.FC<AnimePlayerViewProps> = ({
  id,
  season = '1',
  episode = '1',
}) => {
  const { navigate, goBack } = useRouter();
  const { isAnimeWatchlisted, toggleAnimeWatchlist, addOrUpdateAnimeHistory } = useAnime();
  const { showToast } = useToast();

  const currentEpNum = parseInt(episode, 10) || 1;
  const currentSeasonNum = parseInt(season, 10) || 1;

  const [anime, setAnime] = useState<AnilistMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeServer, setActiveServer] = useState<'fmov' | 'vidsrc' | 'autoembed'>('fmov');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await anilistApi.getAnimeInfo(id);
        if (!isMounted) return;
        if (data) {
          setAnime(data);
          // Save to anime history
          addOrUpdateAnimeHistory({
            id: String(data.id),
            title: getAnilistTitle(data.title),
            image: data.image || data.coverImage || '',
            bannerImage: data.bannerImage || data.image,
            season: currentSeasonNum,
            episode: currentEpNum,
            lastWatched: Date.now(),
          });
        }
      } catch (err) {
        console.error('Error loading anime for player:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, currentEpNum, currentSeasonNum]);

  const totalEps = anime?.totalEpisodes || anime?.episodes?.length || 24;
  const title = anime ? getAnilistTitle(anime.title) : 'Anime Stream';
  const isSaved = isAnimeWatchlisted(id);

  // Embed URL generator
  const getEmbedUrl = () => {
    if (activeServer === 'fmov') {
      return `https://fmov.my/embed/anime/${id}/${currentSeasonNum}/${currentEpNum}?color=14b8a6&nextEpisode=true&episodeSelector=false&autoplayNextEpisode=true&overlay=false`;
    }
    if (activeServer === 'vidsrc') {
      return `https://vidsrc.cc/v2/embed/anime/${id}/${currentEpNum}?autoPlay=true`;
    }
    return `https://player.autoembed.cc/embed/anime/${id}/${currentEpNum}`;
  };

  const handleNextEp = () => {
    if (currentEpNum < totalEps) {
      navigate(`/watch/anime/${id}/${currentSeasonNum}/${currentEpNum + 1}`);
    } else {
      showToast('You are on the latest episode', 'info');
    }
  };

  const handlePrevEp = () => {
    if (currentEpNum > 1) {
      navigate(`/watch/anime/${id}/${currentSeasonNum}/${currentEpNum - 1}`);
    }
  };

  const handleToggleSave = async () => {
    if (!anime) return;
    const added = await toggleAnimeWatchlist(anime);
    showToast(
      added ? `Added "${title}" to Anime Watchlist` : `Removed from Anime Watchlist`,
      'bookmark'
    );
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white pt-16 pb-20">
      {/* Top Header Controls Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/anime/${id}`)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Back to Anime Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm md:text-base font-extrabold text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
              {title}
            </h1>
            <p className="text-[11px] text-purple-400 font-semibold flex items-center gap-1.5">
              <span>Episode {currentEpNum}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Season {currentSeasonNum}</span>
            </p>
          </div>
        </div>

        {/* Server & Bookmark Controls */}
        <div className="flex items-center gap-2">
          {/* Server Select */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#10121d] border border-white/10 rounded-xl px-2.5 py-1 text-xs">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400 font-medium">Server:</span>
            <select
              value={activeServer}
              onChange={(e: any) => setActiveServer(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="fmov" className="bg-[#10121d]">
                FMov Server (Primary)
              </option>
              <option value="vidsrc" className="bg-[#10121d]">
                VidSrc Server
              </option>
              <option value="autoembed" className="bg-[#10121d]">
                AutoEmbed Server
              </option>
            </select>
          </div>

          <button
            onClick={handleToggleSave}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isSaved
                ? 'bg-purple-600 border-purple-400 text-white'
                : 'bg-white/10 border-white/15 text-slate-200 hover:text-white'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isSaved ? 'In Watchlist' : 'Watchlist'}</span>
          </button>
        </div>
      </div>

      {/* Primary Video Container */}
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6 my-4">
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/15">
          <iframe
            key={`${id}-${currentSeasonNum}-${currentEpNum}-${activeServer}`}
            src={getEmbedUrl()}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            className="w-full h-full"
            title={`${title} - Episode ${currentEpNum}`}
          />
        </div>

        {/* Player Navigation Buttons Bar */}
        <div className="flex items-center justify-between my-4 px-1 gap-2">
          <button
            onClick={handlePrevEp}
            disabled={currentEpNum <= 1}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentEpNum <= 1
                ? 'opacity-40 cursor-not-allowed border-white/5 text-slate-600 bg-white/5'
                : 'bg-[#12131f] border-white/10 hover:border-purple-500 text-white cursor-pointer hover:bg-purple-950/40'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Episode</span>
          </button>

          <div className="text-xs font-extrabold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            Episode {currentEpNum} of {totalEps}
          </div>

          <button
            onClick={handleNextEp}
            disabled={currentEpNum >= totalEps}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentEpNum >= totalEps
                ? 'opacity-40 cursor-not-allowed border-white/5 text-slate-600 bg-white/5'
                : 'bg-gradient-to-r from-rose-600 to-purple-600 border-rose-500 text-white cursor-pointer hover:from-rose-500 hover:to-purple-500 shadow-md'
            }`}
          >
            <span>Next Episode</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Episode Selector Drawer */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 my-8">
        <div className="p-5 rounded-2xl bg-[#0b0c14] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" />
              <span>Select Episode ({totalEps} Total)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Click to switch episode</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
            {Array.from({ length: totalEps }, (_, i) => i + 1).map((ep) => {
              const isCurrent = ep === currentEpNum;
              return (
                <button
                  key={ep}
                  onClick={() => navigate(`/watch/anime/${id}/${currentSeasonNum}/${ep}`)}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isCurrent
                      ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/60 ring-2 ring-rose-400/40'
                      : 'bg-[#121320] border-white/10 text-slate-300 hover:bg-purple-950/60 hover:text-white hover:border-purple-400'
                  }`}
                >
                  <span className="text-[9px] opacity-70">EP</span>
                  <span className="text-sm font-black">{ep}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Related Anime Recommendations */}
      {anime?.recommendations && anime.recommendations.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 my-8">
          <h3 className="text-base font-extrabold text-white mb-4">Recommended Anime</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {anime.recommendations.slice(0, 6).map((rec) => (
              <AnimeCard key={rec.id} anime={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
