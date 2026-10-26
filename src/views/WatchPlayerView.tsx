import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Tv,
  Server,
  Check,
  Bookmark,
  List,
  X,
  Play,
  Lightbulb,
  Film,
  Sparkles,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tmdb, MediaDetails, TVSeasonDetails, getImageUrl } from '../lib/tmdb';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useBookmarks } from '../hooks/useBookmarks';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';

interface WatchPlayerViewProps {
  id: string;
  mediaType: 'movie' | 'tv';
  season?: string;
  episode?: string;
}

interface ServerOption {
  id: string;
  name: string;
  badge: string;
}

const SERVERS: ServerOption[] = [
  { id: 'default', name: 'FMOV Primary', badge: 'Fastest' },
  { id: 'vector', name: 'Vector HD', badge: '1080p' },
  { id: 'core', name: 'Core Server', badge: 'Stable' },
  { id: 'valence', name: 'Valence Multi', badge: 'Multi-Sub' },
  { id: 'stream4k', name: '4K Ultra', badge: 'UHD' },
];

export const WatchPlayerView: React.FC<WatchPlayerViewProps> = ({
  id,
  mediaType,
  season: initialSeason = '1',
  episode: initialEpisode = '1',
}) => {
  const { navigate } = useRouter();
  const { addOrUpdateHistory } = useWatchHistory();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { showToast } = useToast();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [currentSeason, setCurrentSeason] = useState<number>(Number(initialSeason) || 1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(Number(initialEpisode) || 1);
  const [currentServer, setCurrentServer] = useState<string>('default');
  const [seasonData, setSeasonData] = useState<TVSeasonDetails | null>(null);
  const [episodeDrawerOpen, setEpisodeDrawerOpen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCurrentSeason(Number(initialSeason) || 1);
    setCurrentEpisode(Number(initialEpisode) || 1);
  }, [initialSeason, initialEpisode]);

  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      try {
        const data =
          mediaType === 'tv'
            ? await tmdb.getTVDetails(id)
            : await tmdb.getMovieDetails(id);
        if (isMounted) setDetails(data);
      } catch (err) {
        console.error('Failed to load player details:', err);
      }
    }
    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [id, mediaType]);

  useEffect(() => {
    if (mediaType !== 'tv') return;
    let isMounted = true;

    async function loadSeason() {
      try {
        const sData = await tmdb.getTVSeason(id, currentSeason);
        if (isMounted) setSeasonData(sData);
      } catch (err) {
        console.error('Failed to load season data for player:', err);
      }
    }
    loadSeason();
    return () => {
      isMounted = false;
    };
  }, [id, mediaType, currentSeason]);

  useEffect(() => {
    if (!details) return;
    const title = details.title || details.name || 'Untitled';
    addOrUpdateHistory({
      id: details.id,
      media_type: mediaType,
      title,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      season: mediaType === 'tv' ? currentSeason : undefined,
      episode: mediaType === 'tv' ? currentEpisode : undefined,
    });
  }, [details, mediaType, currentSeason, currentEpisode, addOrUpdateHistory]);

  const buildPlayerUrl = () => {
    const colorParam = 'color=e50914';
    const serverParam = currentServer !== 'default' ? `&server=${currentServer}` : '';

    if (mediaType === 'tv') {
      return `https://fmov.my/embed/series/${id}/${currentSeason}/${currentEpisode}?${colorParam}${serverParam}`;
    }
    return `https://fmov.my/embed/movie/${id}?${colorParam}${serverParam}`;
  };

  const title = details?.title || details?.name || 'Streaming Media';
  const saved = details ? isBookmarked(details.id, mediaType) : false;

  const currentEpisodesList = seasonData?.episodes || [];
  const currentEpIndex = currentEpisodesList.findIndex(
    (e) => e.episode_number === currentEpisode
  );
  const hasPrev = currentEpIndex > 0;
  const hasNext =
    currentEpIndex >= 0 && currentEpIndex < currentEpisodesList.length - 1;

  const goToEpisode = (epNum: number) => {
    setCurrentEpisode(epNum);
    setEpisodeDrawerOpen(false);
    navigate(`/watch/tv/${id}/${currentSeason}/${epNum}`);
    showToast(`Loaded Episode ${epNum}`, 'info');
  };

  const handleNextEpisode = () => {
    if (hasNext) {
      goToEpisode(currentEpisodesList[currentEpIndex + 1].episode_number);
    }
  };

  const handlePrevEpisode = () => {
    if (hasPrev) {
      goToEpisode(currentEpisodesList[currentEpIndex - 1].episode_number);
    }
  };

  const handleSelectServer = (serverId: string, serverName: string) => {
    setCurrentServer(serverId);
    showToast(`Switched stream server to ${serverName}`, 'info');
  };

  const handleToggleBookmark = () => {
    if (!details) return;
    toggleBookmark(details, mediaType);
    showToast(
      saved ? `Removed "${title}" from Watchlist` : `Added "${title}" to Watchlist`,
      'bookmark'
    );
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#07080a] text-white pb-16 selection:bg-[#e50914] selection:text-white overflow-x-hidden">
      {/* Theater Dim Ambient Blackout Overlay */}
      <AnimatePresence>
        {theaterMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-20 bg-black/95 backdrop-blur-xl"
            onClick={() => {
              setTheaterMode(false);
              showToast('Dim mode exited', 'info');
            }}
          />
        )}
      </AnimatePresence>

      {/* Minimalist Player Top Header */}
      <header className="sticky top-0 z-40 w-full bg-[#07080a]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 md:px-12 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Left: Back Button */}
        <button
          onClick={() => navigate(`/${mediaType}/${id}`)}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-rose-500" />
          <span>Back to Details</span>
        </button>

        {/* Center: Media Title & Season/Episode */}
        <div className="text-center truncate max-w-xs sm:max-w-md md:max-w-lg">
          <h1 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center justify-center gap-2">
            <Film className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
            <span className="truncate">{title}</span>
          </h1>
          {mediaType === 'tv' && (
            <p className="text-[11px] text-rose-400 font-bold">
              Season {currentSeason} · Episode {currentEpisode}
            </p>
          )}
        </div>

        {/* Right: Actions (Dim Mode Toggle + Episodes Drawer) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Functional Dim Toggle Button */}
          <button
            onClick={() => {
              setTheaterMode((prev) => !prev);
              showToast(theaterMode ? 'Theater dim disabled' : 'Theater dim enabled', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              theaterMode
                ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/50'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Theater Dim Mode"
          >
            <Lightbulb className={`w-3.5 h-3.5 ${theaterMode ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span className="hidden sm:inline">{theaterMode ? 'Dim On' : 'Dim'}</span>
          </button>

          {/* TV Episode Selector Drawer Trigger */}
          {mediaType === 'tv' && (
            <button
              onClick={() => setEpisodeDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/60 active:scale-95"
            >
              <List className="w-3.5 h-3.5" />
              <span>Episodes</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Video Viewport & Controls Container */}
      <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-12 mt-3 sm:mt-6 space-y-4 sm:space-y-6">
        {/* Video Player Frame with Glowing Rim when Dimmed */}
        <div
          className={`relative z-30 w-full aspect-video max-h-[42dvh] sm:max-h-[75vh] sm:rounded-2xl overflow-hidden bg-black transition-all duration-500 border-y sm:border ${
            theaterMode
              ? 'border-rose-500/50 shadow-[0_0_90px_rgba(229,9,20,0.35)]'
              : 'border-white/10 shadow-2xl shadow-black/90'
          }`}
        >
          <iframe
            ref={iframeRef}
            src={buildPlayerUrl()}
            title={`Streaming Player - ${title}`}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Floating Undim Quick Button when Dim Mode is active */}
        <AnimatePresence>
          {theaterMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-6 right-6 z-40"
            >
              <button
                onClick={() => {
                  setTheaterMode(false);
                  showToast('Dim mode exited', 'info');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-extrabold shadow-2xl shadow-rose-950/90 border border-white/20 active:scale-95 transition-all"
              >
                <EyeOff className="w-4 h-4" />
                <span>Exit Dim Mode</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Below-Player UI Section (Dimmed when theaterMode is true) */}
        <div className={`transition-all duration-500 ${theaterMode ? 'opacity-20 filter blur-[1px] pointer-events-none' : 'opacity-100'}`}>
          {/* TV Episode Quick Bar (Next / Prev) */}
          {mediaType === 'tv' && (
            <div className="flex items-center justify-between px-4 sm:px-0 text-xs">
              <button
                onClick={handlePrevEpisode}
                disabled={!hasPrev}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-bold transition-all ${
                  hasPrev
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 active:scale-95'
                    : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4 text-rose-500" />
                <span>Prev Episode</span>
              </button>

              <span className="font-extrabold text-slate-300 text-xs sm:text-sm">
                Season {currentSeason} · Episode {currentEpisode}
              </span>

              <button
                onClick={handleNextEpisode}
                disabled={!hasNext}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-bold transition-all ${
                  hasNext
                    ? 'bg-[#e50914] border-rose-500 text-white hover:bg-rose-500 active:scale-95 shadow-md shadow-rose-950/50'
                    : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Next Episode</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stream Server Selection Bar */}
          <div className="mt-4 mx-4 sm:mx-0 p-4 rounded-2xl bg-[#12131a] border border-white/[0.08] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                <Server className="w-4 h-4 text-[#e50914]" />
                <span>Stream Servers</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                ● Operational
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x py-1">
              {SERVERS.map((server) => {
                const active = currentServer === server.id;
                return (
                  <button
                    key={server.id}
                    onClick={() => handleSelectServer(server.id, server.name)}
                    className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? 'bg-[#e50914] border-rose-500 text-white shadow-lg shadow-rose-950/60'
                        : 'bg-white/5 border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/10 active:scale-95'
                    }`}
                  >
                    <span>{server.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                        active ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {server.badge}
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media Info Summary Card */}
          {details && (
            <div className="mt-4 mx-4 sm:mx-0 p-4 rounded-2xl bg-[#12131a] border border-white/[0.08] flex items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={getImageUrl(details.poster_path, 'w185')}
                  alt={title}
                  className="w-12 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate">{title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="text-amber-400 font-bold tabular-nums">
                      ★ {details.vote_average ? details.vote_average.toFixed(1) : 'NR'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{(details.release_date || details.first_air_date || '').slice(0, 4)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleBookmark}
                className={`shrink-0 p-3 rounded-xl border transition-all active:scale-95 ${
                  saved
                    ? 'bg-[#e50914]/20 border-[#e50914] text-rose-400'
                    : 'bg-white/5 border-white/[0.08] text-slate-200 hover:bg-white/10'
                }`}
                aria-label={saved ? 'Remove from My List' : 'Add to My List'}
              >
                {saved ? <Check className="w-4 h-4 text-rose-400" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side-Drawer Episode Selector Modal */}
      <AnimatePresence>
        {episodeDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:flex-row sm:justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full sm:max-w-md h-[82dvh] sm:h-full bg-[#0d0e15] border-t sm:border-t-0 sm:border-l border-white/10 rounded-t-3xl sm:rounded-none p-5 flex flex-col overflow-hidden pb-safe shadow-2xl"
            >
              {/* Mobile Handle */}
              <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#e50914]" />
                  <h3 className="text-sm font-extrabold text-white">Episode Selector</h3>
                </div>
                <button
                  onClick={() => setEpisodeDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Season Dropdown Selector */}
              {details?.seasons && (
                <div className="my-3">
                  <select
                    value={currentSeason}
                    onChange={(e) => {
                      const nextSeason = Number(e.target.value);
                      setCurrentSeason(nextSeason);
                      goToEpisode(1);
                    }}
                    className="w-full bg-[#161822] border border-white/15 text-white text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#e50914]"
                  >
                    {details.seasons
                      .filter((s) => s.season_number > 0)
                      .map((s) => (
                        <option key={s.id} value={s.season_number}>
                          {s.name || `Season ${s.season_number}`} ({s.episode_count} eps)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Scrollable Episode List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {currentEpisodesList.map((ep) => {
                  const isSelected = ep.episode_number === currentEpisode;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => goToEpisode(ep.episode_number)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'bg-[#e50914]/25 border-[#e50914] shadow-md shadow-rose-950/50'
                          : 'bg-[#141622] border-white/5 hover:border-white/15 active:bg-white/10'
                      }`}
                    >
                      <div className="w-20 aspect-video rounded-xl overflow-hidden bg-black/60 shrink-0 relative">
                        <img
                          src={getImageUrl(ep.still_path || details?.backdrop_path, 'w342')}
                          alt={ep.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#e50914]/50 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-white text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-extrabold text-rose-400">EP {ep.episode_number}</span>
                          {ep.runtime && <span>{ep.runtime}m</span>}
                        </div>
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {ep.name || `Episode ${ep.episode_number}`}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
