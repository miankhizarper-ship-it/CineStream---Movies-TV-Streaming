import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  EyeOff,
  Settings,
  Subtitles,
  HelpCircle,
  Radio,
  Sparkles,
  Smartphone,
  Tv2,
  Sliders,
  Palette,
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
  desc: string;
}

const SERVERS: ServerOption[] = [
  { id: 'auto', name: 'Auto Failover', badge: 'Smart', desc: 'Automatic client-side failover without reloading' },
  { id: 'vector', name: 'Vector HD', badge: '1080p', desc: 'Primary global high-speed edge' },
  { id: 'core', name: 'Core Server', badge: 'Stable', desc: 'Ultra-reliable resilient node' },
  { id: 'valence', name: 'Valence Multi', badge: 'Multi-Sub', desc: 'Multi-source bandwidth mirror' },
  { id: '4kstream', name: '4K Ultra HD', badge: '2160p', desc: 'Ultra HD 2160p direct stream' },
  { id: 'apex', name: 'Apex Edge', badge: 'Mirror', desc: 'Low-latency edge relay' },
  { id: 'pulse', name: 'Pulse Node', badge: 'Fast', desc: 'Real-time fallback stream' },
];

const COLOR_PRESETS = [
  { id: 'e50914', name: 'CineStream Red', hex: '#e50914' },
  { id: '14b8a6', name: 'Cyber Teal', hex: '#14b8a6' },
  { id: 'f59e0b', name: 'Golden Amber', hex: '#f59e0b' },
  { id: '06b6d4', name: 'Electric Cyan', hex: '#06b6d4' },
  { id: '8b5cf6', name: 'Neon Violet', hex: '#8b5cf6' },
];

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const WatchPlayerView: React.FC<WatchPlayerViewProps> = ({
  id,
  mediaType,
  season: initialSeason = '1',
  episode: initialEpisode = '1',
}) => {
  const { navigate } = useRouter();
  const { addOrUpdateHistory, updateProgress, getHistoryItem } = useWatchHistory();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { showToast } = useToast();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [currentSeason, setCurrentSeason] = useState<number>(Number(initialSeason) || 1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(Number(initialEpisode) || 1);
  const [seasonData, setSeasonData] = useState<TVSeasonDetails | null>(null);

  // Player UI states
  const [episodeDrawerOpen, setEpisodeDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [gesturesModalOpen, setGesturesModalOpen] = useState(false);
  const [subtitlesHelpOpen, setSubtitlesHelpOpen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Playback & Resume State
  const [resumeTime, setResumeTime] = useState<number | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const positionRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  // Auto Up-Next transition state
  const [upNextCountdown, setUpNextCountdown] = useState<number | null>(null);

  // Player Configuration Preferences (saved to localStorage)
  const [server, setServer] = useState<string>(() => {
    return localStorage.getItem('fmov_server') || 'auto';
  });
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem('fmov_color') || 'e50914';
  });
  const [autoplayNextEpisode, setAutoplayNextEpisode] = useState<boolean>(() => {
    return localStorage.getItem('fmov_autoplay_next') !== 'false';
  });
  const [upNextOverlay, setUpNextOverlay] = useState<boolean>(() => {
    return localStorage.getItem('fmov_overlay') === 'true';
  });
  const [showWatermark, setShowWatermark] = useState<boolean>(() => {
    return localStorage.getItem('fmov_watermark') !== 'false';
  });
  const [inPlayerEpisodeSelector, setInPlayerEpisodeSelector] = useState<boolean>(() => {
    return localStorage.getItem('fmov_ep_selector') !== 'false';
  });
  const [animeMode, setAnimeMode] = useState<boolean>(false);

  // Update refs when state changes
  useEffect(() => {
    positionRef.current = playbackPosition;
  }, [playbackPosition]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Sync seasons/episodes when props change
  useEffect(() => {
    setCurrentSeason(Number(initialSeason) || 1);
    setCurrentEpisode(Number(initialEpisode) || 1);
    setUpNextCountdown(null);
  }, [initialSeason, initialEpisode]);

  // Load media details
  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      try {
        const data =
          mediaType === 'tv'
            ? await tmdb.getTVDetails(id)
            : await tmdb.getMovieDetails(id);
        if (isMounted) {
          setDetails(data);
          if (mediaType === 'movie' && data.runtime) {
            setDuration(data.runtime * 60);
          }
          // Detect anime from genres (Animation = 16) and Japanese language
          const isAnime =
            data.genres?.some((g) => g.id === 16 || g.name.toLowerCase() === 'animation') &&
            ((data as any).original_language === 'ja' || data.name?.toLowerCase().includes('anime'));
          if (isAnime) {
            setAnimeMode(true);
          }
        }
      } catch (err) {
        console.error('Failed to load player details:', err);
      }
    }
    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [id, mediaType]);

  // Load TV Season details if TV series
  useEffect(() => {
    if (mediaType !== 'tv') return;
    let isMounted = true;

    async function loadSeason() {
      try {
        const sData = await tmdb.getTVSeason(id, currentSeason);
        if (isMounted) {
          setSeasonData(sData);
          const ep = sData.episodes?.find((e) => e.episode_number === currentEpisode);
          if (ep?.runtime) {
            setDuration(ep.runtime * 60);
          } else if (details?.episode_run_time?.[0]) {
            setDuration(details.episode_run_time[0] * 60);
          } else {
            setDuration(45 * 60);
          }
        }
      } catch (err) {
        console.error('Failed to load season data for player:', err);
      }
    }
    loadSeason();
    return () => {
      isMounted = false;
    };
  }, [id, mediaType, currentSeason, currentEpisode, details]);

  // Check saved progress and restore last timestamp automatically (Session Recovery)
  useEffect(() => {
    const numericId = Number(id);
    const existing = getHistoryItem(
      numericId,
      mediaType,
      mediaType === 'tv' ? currentSeason : undefined,
      mediaType === 'tv' ? currentEpisode : undefined
    );

    if (existing && existing.currentTime && existing.currentTime > 15) {
      setResumeTime(existing.currentTime);
      setPlaybackPosition(existing.currentTime);
      if (existing.duration && existing.duration > 0) {
        setDuration(existing.duration);
      }
      showToast(
        `Auto-resumed from ${formatTime(existing.currentTime)} (${existing.progress || 0}%)`,
        'info'
      );
    } else {
      setResumeTime(null);
      setPlaybackPosition(0);
    }
  }, [id, mediaType, currentSeason, currentEpisode, getHistoryItem, showToast]);

  // Ensure item exists in history immediately on viewing
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
      currentTime: playbackPosition,
      duration: duration,
    });
  }, [details, mediaType, currentSeason, currentEpisode, addOrUpdateHistory]);

  const currentEpisodesList = seasonData?.episodes || [];
  const currentEpIndex = currentEpisodesList.findIndex(
    (e) => e.episode_number === currentEpisode
  );
  const hasPrev = currentEpIndex > 0;
  const hasNext =
    currentEpIndex >= 0 && currentEpIndex < currentEpisodesList.length - 1;

  const goToEpisode = useCallback(
    (epNum: number) => {
      setCurrentEpisode(epNum);
      setEpisodeDrawerOpen(false);
      setUpNextCountdown(null);
      navigate(`/watch/tv/${id}/${currentSeason}/${epNum}`);
      showToast(`Loaded Episode ${epNum}`, 'info');
    },
    [id, currentSeason, navigate, showToast]
  );

  const handleNextEpisode = useCallback(() => {
    if (hasNext) {
      goToEpisode(currentEpisodesList[currentEpIndex + 1].episode_number);
    }
  }, [hasNext, currentEpisodesList, currentEpIndex, goToEpisode]);

  const handlePrevEpisode = useCallback(() => {
    if (hasPrev) {
      goToEpisode(currentEpisodesList[currentEpIndex - 1].episode_number);
    }
  }, [hasPrev, currentEpisodesList, currentEpIndex, goToEpisode]);

  // FMOV Official JavaScript postMessage API Handler
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;

        // 1. Official FMOV postMessage event protocol (source === 'fmov')
        if (data.source === 'fmov') {
          switch (data.event) {
            case 'ready':
              console.log('[FMOV] Player initialized and ready');
              break;
            case 'play':
              console.log('[FMOV] Playback started');
              break;
            case 'pause':
              if (typeof data.data?.currentTime === 'number') {
                const pauseTime = Math.floor(data.data.currentTime);
                setPlaybackPosition(pauseTime);
                updateProgress(
                  Number(id),
                  mediaType,
                  pauseTime,
                  durationRef.current,
                  mediaType === 'tv' ? currentSeason : undefined,
                  mediaType === 'tv' ? currentEpisode : undefined
                );
              }
              break;
            case 'timeupdate':
              if (typeof data.data?.currentTime === 'number') {
                const cur = Math.floor(data.data.currentTime);
                const dur = data.data.duration ? Math.floor(data.data.duration) : durationRef.current;
                setPlaybackPosition(cur);
                if (dur > 0) setDuration(dur);

                updateProgress(
                  Number(id),
                  mediaType,
                  cur,
                  dur,
                  mediaType === 'tv' ? currentSeason : undefined,
                  mediaType === 'tv' ? currentEpisode : undefined
                );
              }
              break;
            case 'ended':
              console.log('[FMOV] Video finished');
              // Mark fully watched
              if (durationRef.current > 0) {
                updateProgress(
                  Number(id),
                  mediaType,
                  durationRef.current,
                  durationRef.current,
                  mediaType === 'tv' ? currentSeason : undefined,
                  mediaType === 'tv' ? currentEpisode : undefined
                );
              }
              // Auto transition to next episode if TV
              if (mediaType === 'tv' && hasNext && autoplayNextEpisode) {
                showToast('Next episode starting automatically...', 'info');
                handleNextEpisode();
              }
              break;
          }
          return;
        }

        // 2. Generic fallback message parsing
        let time: number | undefined;
        let dur: number | undefined;

        if (typeof data.currentTime === 'number') time = data.currentTime;
        else if (typeof data.time === 'number') time = data.time;
        else if (typeof data.seconds === 'number') time = data.seconds;
        else if (data.data && typeof data.data.currentTime === 'number') time = data.data.currentTime;

        if (typeof data.duration === 'number') dur = data.duration;
        else if (data.data && typeof data.data.duration === 'number') dur = data.data.duration;

        if (time !== undefined && time >= 0) {
          const validTime = Math.floor(time);
          setPlaybackPosition(validTime);
          if (dur && dur > 0) setDuration(Math.floor(dur));

          updateProgress(
            Number(id),
            mediaType,
            validTime,
            dur || durationRef.current,
            mediaType === 'tv' ? currentSeason : undefined,
            mediaType === 'tv' ? currentEpisode : undefined
          );
        }
      } catch {
        // Cross-origin message parse fallback
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    id,
    mediaType,
    currentSeason,
    currentEpisode,
    hasNext,
    autoplayNextEpisode,
    handleNextEpisode,
    updateProgress,
    showToast,
  ]);

  // Active Playback Heartbeat Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      setPlaybackPosition((prev) => {
        const next = prev + 1;
        if (next % 5 === 0) {
          updateProgress(
            Number(id),
            mediaType,
            next,
            durationRef.current,
            mediaType === 'tv' ? currentSeason : undefined,
            mediaType === 'tv' ? currentEpisode : undefined
          );
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [id, mediaType, currentSeason, currentEpisode, updateProgress]);

  // Save latest progress on tab unload or component unmount
  useEffect(() => {
    const commitFinalProgress = () => {
      const finalPos = positionRef.current;
      const finalDur = durationRef.current;
      if (finalPos > 0) {
        updateProgress(
          Number(id),
          mediaType,
          finalPos,
          finalDur,
          mediaType === 'tv' ? currentSeason : undefined,
          mediaType === 'tv' ? currentEpisode : undefined
        );
      }
    };

    window.addEventListener('beforeunload', commitFinalProgress);
    return () => {
      window.removeEventListener('beforeunload', commitFinalProgress);
      commitFinalProgress();
    };
  }, [id, mediaType, currentSeason, currentEpisode, updateProgress]);

  // Build FMOV embed URL matching documentation specifications
  const buildPlayerUrl = () => {
    // Determine route based on media type & anime mode
    let baseUrl: string;
    if (mediaType === 'movie') {
      baseUrl = `https://fmov.my/embed/movie/${id}`;
    } else if (animeMode) {
      // FMOV Anime route: /embed/anime/{id}/{season}/{episode}
      baseUrl = `https://fmov.my/embed/anime/${id}/${currentSeason}/${currentEpisode}`;
    } else {
      // FMOV Series route: /embed/series/{id}/{season}/{episode}
      baseUrl = `https://fmov.my/embed/series/${id}/${currentSeason}/${currentEpisode}`;
    }

    const params = new URLSearchParams();

    // 1. Accent Color
    params.set('color', accentColor);

    // 2. Server Pinning (omit for 'auto' intelligent priority)
    if (server && server !== 'auto') {
      params.set('server', server);
    }

    // 3. Custom Watermark Logo & Click-through link
    if (showWatermark) {
      const logoUrl = `${window.location.origin}/favicon.png`;
      params.set('logo', logoUrl);
      params.set('logoLink', window.location.origin);
    }

    // 4. Autoplay (1 or 0)
    params.set('autoplay', '1');

    // 5. TV-specific parameters
    if (mediaType === 'tv') {
      params.set('autoplayNextEpisode', autoplayNextEpisode ? 'true' : 'false');
      params.set('episodeSelector', inPlayerEpisodeSelector ? 'true' : 'false');
      params.set('nextEpisode', hasNext ? 'true' : 'false');
      if (upNextOverlay) {
        params.set('overlay', 'true');
      }
    }

    // 6. Resume Timestamp
    if (resumeTime && resumeTime > 15) {
      params.set('start', Math.floor(resumeTime).toString());
    }

    const queryString = params.toString();
    const hash = resumeTime && resumeTime > 15 ? `#t=${Math.floor(resumeTime)}` : '';

    return `${baseUrl}?${queryString}${hash}`;
  };

  const title = details?.title || details?.name || 'Streaming Media';
  const saved = details ? isBookmarked(details.id, mediaType) : false;

  const handleSelectServer = (serverId: string, serverName: string) => {
    setServer(serverId);
    localStorage.setItem('fmov_server', serverId);
    showToast(`Stream server set to ${serverName}`, 'info');
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
            className="fixed inset-0 z-20 bg-black/95 backdrop-blur-xl cursor-pointer"
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
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 shrink-0 cursor-pointer"
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
              {animeMode && ' (Anime Stream Mode)'}
            </p>
          )}
        </div>

        {/* Right Actions: Dim, Settings & Episode Drawer */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Subtitles Guide Button */}
          <button
            onClick={() => setSubtitlesHelpOpen(true)}
            className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold items-center gap-1.5 transition-all cursor-pointer"
            title="Subtitles & Custom File Drag-and-Drop"
          >
            <Subtitles className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Subtitles</span>
          </button>

          {/* Gestures & Smart TV Shortcuts Button */}
          <button
            onClick={() => setGesturesModalOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            title="Mobile Gestures & Smart TV Remote Navigation"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Player Configuration Settings Button */}
          <button
            onClick={() => setSettingsDrawerOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            title="Player Configuration & Stream Settings"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
          </button>

          {/* Functional Dim Toggle Button */}
          <button
            onClick={() => {
              setTheaterMode((prev) => !prev);
              showToast(theaterMode ? 'Theater dim disabled' : 'Theater dim enabled', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/60 active:scale-95 cursor-pointer"
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
            key={`${id}-${mediaType}-${currentSeason}-${currentEpisode}-${server}-${accentColor}-${animeMode}-${showWatermark}-${upNextOverlay}`}
            src={buildPlayerUrl()}
            title={`FMOV Player - ${title}`}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-extrabold shadow-2xl shadow-rose-950/90 border border-white/20 active:scale-95 transition-all cursor-pointer"
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
            <div className="flex items-center justify-between px-4 sm:px-0 text-xs mt-2">
              <button
                onClick={handlePrevEpisode}
                disabled={!hasPrev}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-bold transition-all ${
                  hasPrev
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 active:scale-95 cursor-pointer'
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
                    ? 'bg-[#e50914] border-rose-500 text-white hover:bg-rose-500 active:scale-95 shadow-md shadow-rose-950/50 cursor-pointer'
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
                <span>FMOV Multi-Server Priority & Failover</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  ● Auto-Failover Active
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x py-1">
              {SERVERS.map((s) => {
                const active = server === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectServer(s.id, s.name)}
                    className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      active
                        ? 'bg-[#e50914] border-rose-500 text-white shadow-lg shadow-rose-950/60'
                        : 'bg-white/5 border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/10 active:scale-95'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                        active ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {s.badge}
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
                    {details.runtime && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{details.runtime}m</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleToggleBookmark}
                  className={`p-3 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    saved
                      ? 'bg-[#e50914]/20 border-[#e50914] text-rose-400'
                      : 'bg-white/5 border-white/[0.08] text-slate-200 hover:bg-white/10'
                  }`}
                  aria-label={saved ? 'Remove from My List' : 'Add to My List'}
                >
                  {saved ? <Check className="w-4 h-4 text-rose-400" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>
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
              <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#e50914]" />
                  <h3 className="text-sm font-extrabold text-white">Episode Selector</h3>
                </div>
                <button
                  onClick={() => setEpisodeDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {currentEpisodesList.map((ep) => {
                  const isSelected = ep.episode_number === currentEpisode;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => goToEpisode(ep.episode_number)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
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

      {/* FMOV Player Configuration & Customization Drawer */}
      <AnimatePresence>
        {settingsDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:flex-row sm:justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full sm:max-w-md h-[85dvh] sm:h-full bg-[#0d0e15] border-t sm:border-t-0 sm:border-l border-white/10 rounded-t-3xl sm:rounded-none p-5 flex flex-col overflow-y-auto pb-safe shadow-2xl space-y-5"
            >
              <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-2 sm:hidden" />
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#e50914]" />
                  <h3 className="text-sm font-extrabold text-white">Player Configuration</h3>
                </div>
                <button
                  onClick={() => setSettingsDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Accent Color Customizer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-rose-400" />
                  <span>Player Accent Color</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setAccentColor(c.id);
                        localStorage.setItem('fmov_color', c.id);
                        showToast(`Theme updated to ${c.name}`, 'info');
                      }}
                      className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        accentColor === c.id
                          ? 'border-white ring-2 ring-white/50 scale-105'
                          : 'border-white/10 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {accentColor === c.id && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Server Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-rose-400" />
                  <span>Pin Streaming Server</span>
                </label>
                <div className="space-y-1.5">
                  {SERVERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectServer(s.id, s.name)}
                      className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between text-xs transition-all cursor-pointer ${
                        server === s.id
                          ? 'bg-[#e50914]/20 border-[#e50914] text-white'
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.desc}</div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        {s.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Toggles */}
              <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
                {/* Netflix-style Up Next Overlay */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">"Up Next" Countdown Overlay</div>
                    <div className="text-[11px] text-slate-400">
                      Netflix-style popup countdown during the final 15 seconds
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={upNextOverlay}
                    onChange={(e) => {
                      setUpNextOverlay(e.target.checked);
                      localStorage.setItem('fmov_overlay', e.target.checked ? 'true' : 'false');
                    }}
                    className="w-4 h-4 accent-[#e50914] cursor-pointer"
                  />
                </div>

                {/* Autoplay Next Episode */}
                {mediaType === 'tv' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Autoplay Next Episode</div>
                      <div className="text-[11px] text-slate-400">
                        Automatically advance when the current episode ends
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoplayNextEpisode}
                      onChange={(e) => {
                        setAutoplayNextEpisode(e.target.checked);
                        localStorage.setItem('fmov_autoplay_next', e.target.checked ? 'true' : 'false');
                      }}
                      className="w-4 h-4 accent-[#e50914] cursor-pointer"
                    />
                  </div>
                )}

                {/* Custom Brand Watermark */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">CineStream Watermark</div>
                    <div className="text-[11px] text-slate-400">
                      Display custom brand watermark in upper right corner
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => {
                      setShowWatermark(e.target.checked);
                      localStorage.setItem('fmov_watermark', e.target.checked ? 'true' : 'false');
                    }}
                    className="w-4 h-4 accent-[#e50914] cursor-pointer"
                  />
                </div>

                {/* Anime Engine Endpoint */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">FMOV Anime Engine</div>
                    <div className="text-[11px] text-slate-400">
                      Route through dedicated AniList & Anime stream engine
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={animeMode}
                    onChange={(e) => {
                      setAnimeMode(e.target.checked);
                      showToast(
                        e.target.checked ? 'Switched to Anime Engine' : 'Standard stream engine active',
                        'info'
                      );
                    }}
                    className="w-4 h-4 accent-[#e50914] cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subtitle Drag-and-Drop Guidance Modal */}
      <AnimatePresence>
        {subtitlesHelpOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[#12131d] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Subtitles className="w-5 h-5 text-[#e50914]" />
                  <h3 className="text-sm font-extrabold text-white">Subtitles & Custom Uploads</h3>
                </div>
                <button
                  onClick={() => setSubtitlesHelpOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>Drag & Drop Custom Subtitle Files</span>
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    You can drag and drop any subtitle file (<code className="text-rose-400">.srt</code>,{' '}
                    <code className="text-rose-400">.vtt</code>, <code className="text-rose-400">.ass</code>,{' '}
                    <code className="text-rose-400">.sub</code>) directly onto the video player. It immediately loads into the player with instant feedback.
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="font-bold text-white">Player Subtitle Settings:</div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Dynamic multi-language aggregation from TMDB & OpenSubtitles</li>
                    <li>Full UTF-8 encoding support for Balkan diacritics, Cyrillic, and Asian scripts</li>
                    <li>Interactive custom font sizing (50% – 200%)</li>
                    <li>Background opacity, custom colors, and vertical offset (top/bottom)</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setSubtitlesHelpOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Touch Gestures & Smart TV Remote Cheatsheet Modal */}
      <AnimatePresence>
        {gesturesModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[#12131d] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#e50914]" />
                  <h3 className="text-sm font-extrabold text-white">Controls & Remote Shortcuts</h3>
                </div>
                <button
                  onClick={() => setGesturesModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Mobile Touch Gestures */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                    <span>Mobile & Tablet Touch Gestures</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Single Tap</span>
                      <span className="font-bold text-white">Toggle control bar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Double-Tap Left</span>
                      <span className="font-bold text-rose-400">Rewind 10s ripple</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Double-Tap Right</span>
                      <span className="font-bold text-rose-400">Fast Forward 10s ripple</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bottom Sheet</span>
                      <span className="font-bold text-white">Subtitles & server drawers</span>
                    </div>
                  </div>
                </div>

                {/* Smart TV Remote Navigation */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Tv2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Smart TV Remote & Keyboard D-Pad</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Enter / OK / Space</span>
                      <span className="font-bold text-white">Toggle Play / Pause</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Left / Right Arrows</span>
                      <span className="font-bold text-rose-400">Fast Seek ±10 seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Up / Down Arrows</span>
                      <span className="font-bold text-white">Volume Up / Down</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Back / ESC</span>
                      <span className="font-bold text-white">Exit Fullscreen or menu</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setGesturesModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
