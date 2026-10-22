import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Tv,
  Film,
  Server,
  Check,
  Bookmark,
  Info,
  List,
  X,
  Play,
  Lightbulb,
} from 'lucide-react';
import { tmdb, MediaDetails, TVSeasonDetails, getImageUrl } from '../lib/tmdb';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useBookmarks } from '../hooks/useBookmarks';
import { useRouter } from '../context/RouterContext';

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
  { id: 'default', name: 'FMOV Auto', badge: 'Fastest' },
  { id: 'vector', name: 'Vector', badge: '1080p' },
  { id: 'core', name: 'Core', badge: 'Stable' },
  { id: 'valence', name: 'Valence', badge: 'Multi-Sub' },
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

  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && (data.event === 'timeupdate' || data.type === 'playback_progress')) {
          if (details && data.percentage) {
            addOrUpdateHistory({
              id: details.id,
              media_type: mediaType,
              title: details.title || details.name || 'Untitled',
              poster_path: details.poster_path,
              backdrop_path: details.backdrop_path,
              season: mediaType === 'tv' ? currentSeason : undefined,
              episode: mediaType === 'tv' ? currentEpisode : undefined,
              progress: Math.round(data.percentage),
            });
          }
        }
      } catch {
        // safely ignore
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
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

  return (
    <div
      className={`min-h-[100dvh] transition-colors duration-500 ${
        theaterMode ? 'bg-[#030305]' : 'bg-[#07080a]'
      } text-white pb-12`}
    >
      {/* Top Player Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(`/${mediaType}/${id}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 active:bg-white/10 border border-white/[0.08] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Details</span>
        </button>

        <div className="text-center truncate max-w-xs sm:max-w-md">
          <h2 className="text-xs sm:text-sm font-bold text-white truncate">{title}</h2>
          {mediaType === 'tv' && (
            <p className="text-[11px] text-rose-400 font-semibold">
              S{currentSeason} · E{currentEpisode}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Dim lights toggle */}
          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              theaterMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/[0.08] text-slate-300'
            }`}
            title="Toggle Theater Ambient Dim"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{theaterMode ? 'Dim On' : 'Dim'}</span>
          </button>

          {/* TV Episode Drawer Toggle */}
          {mediaType === 'tv' && (
            <button
              onClick={() => setEpisodeDrawerOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#e50914]/20 border border-[#e50914]/40 text-rose-400 text-xs font-semibold"
            >
              <List className="w-3.5 h-3.5" />
              <span>Episodes</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport Container: aspect-video w-full max-h-[40dvh] sm:max-h-[70vh] */}
      <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-12">
        <div className="relative w-full aspect-video max-h-[40dvh] sm:max-h-[70vh] sm:rounded-2xl overflow-hidden bg-black shadow-2xl border-y sm:border border-white/10">
          <iframe
            ref={iframeRef}
            src={buildPlayerUrl()}
            title={`Streaming Player - ${title}`}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* TV Episode Quick Bar (Next / Prev) */}
        {mediaType === 'tv' && (
          <div className="flex items-center justify-between mt-3 px-4 sm:px-0 text-xs">
            <button
              onClick={handlePrevEpisode}
              disabled={!hasPrev}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                hasPrev
                  ? 'bg-white/5 border-white/10 text-white active:bg-white/10'
                  : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev Episode</span>
            </button>

            <span className="font-semibold text-slate-300 text-xs">
              Season {currentSeason}, Ep {currentEpisode}
            </span>

            <button
              onClick={handleNextEpisode}
              disabled={!hasNext}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                hasNext
                  ? 'bg-[#e50914] border-rose-500 text-white active:bg-rose-500'
                  : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Next Episode</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Server Switcher Controls: horizontal scrollable row of pill buttons */}
        <div className="mt-4 sm:mt-6 mx-4 sm:mx-0 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#12131a] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Server className="w-3.5 h-3.5 text-[#e50914]" />
              <span>Stream Servers</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">● Online</span>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x py-1">
            {SERVERS.map((server) => {
              const active = currentServer === server.id;
              return (
                <button
                  key={server.id}
                  onClick={() => setCurrentServer(server.id)}
                  className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    active
                      ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                      : 'bg-white/5 border-white/[0.08] text-slate-300 active:bg-white/10'
                  }`}
                >
                  <span>{server.name}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                      active ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {server.badge}
                  </span>
                  {active && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Media Details Summary Bar */}
        {details && (
          <div className="mt-4 mx-4 sm:mx-0 p-4 rounded-xl sm:rounded-2xl bg-[#12131a] border border-white/[0.08] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={getImageUrl(details.poster_path, 'w185')}
                alt={title}
                className="w-12 h-16 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{title}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <span className="text-amber-400 font-semibold">
                    ★ {details.vote_average ? details.vote_average.toFixed(1) : 'NR'}
                  </span>
                  <span>·</span>
                  <span>{(details.release_date || details.first_air_date || '').slice(0, 4)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleBookmark(details, mediaType)}
              className={`shrink-0 p-2.5 rounded-xl border transition-colors ${
                saved
                  ? 'bg-[#e50914]/20 border-[#e50914] text-rose-400'
                  : 'bg-white/5 border-white/[0.08] text-slate-200'
              }`}
              aria-label={saved ? 'Remove from My List' : 'Add to My List'}
            >
              {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Episode Selector: Slide-up Bottom Sheet on screens < 640px, Side Drawer on desktop */}
      {episodeDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:flex-row sm:justify-end animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md h-[80dvh] sm:h-full bg-[#0e1017] border-t sm:border-t-0 sm:border-l border-white/10 rounded-t-3xl sm:rounded-none p-5 flex flex-col overflow-hidden pb-safe">
            {/* Sheet Handle on Mobile */}
            <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#e50914]" />
                <h3 className="text-sm font-bold text-white">Select Episode</h3>
              </div>
              <button
                onClick={() => setEpisodeDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Season Selector */}
            {details?.seasons && (
              <div className="my-3">
                <select
                  value={currentSeason}
                  onChange={(e) => {
                    const nextSeason = Number(e.target.value);
                    setCurrentSeason(nextSeason);
                    goToEpisode(1);
                  }}
                  className="w-full bg-[#181a26] border border-white/15 text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e50914]"
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
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {currentEpisodesList.map((ep) => {
                const isSelected = ep.episode_number === currentEpisode;
                return (
                  <button
                    key={ep.id}
                    onClick={() => goToEpisode(ep.episode_number)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-[#e50914]/20 border-[#e50914]/60'
                        : 'bg-[#151722] border-white/5 active:bg-white/10'
                    }`}
                  >
                    <div className="w-16 aspect-video rounded-lg overflow-hidden bg-black/60 shrink-0 relative">
                      <img
                        src={getImageUrl(ep.still_path || details?.backdrop_path, 'w342')}
                        alt={ep.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#e50914]/50 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-rose-400">EP {ep.episode_number}</span>
                        {ep.runtime && <span>{ep.runtime}m</span>}
                      </div>
                      <h4
                        className={`text-xs font-semibold truncate ${
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
          </div>
        </div>
      )}
    </div>
  );
};
