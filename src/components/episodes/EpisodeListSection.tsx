import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Star,
  Calendar,
  LayoutGrid,
  List,
  ChevronDown,
  Check,
  Tv,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tmdb, TVSeasonDetails, getImageUrl } from '../../lib/tmdb';
import { useRouter } from '../../context/RouterContext';

interface EpisodeListSectionProps {
  tvShowId: string;
  seasons: Array<{
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
  }>;
  backdropFallback: string | null;
  initialSeason?: number;
  onSeasonChange?: (seasonNumber: number) => void;
}

export const EpisodeListSection: React.FC<EpisodeListSectionProps> = ({
  tvShowId,
  seasons,
  backdropFallback,
  initialSeason = 1,
  onSeasonChange,
}) => {
  const { navigate } = useRouter();
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(initialSeason);
  const [seasonDetails, setSeasonDetails] = useState<TVSeasonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with initialSeason prop if it changes
  useEffect(() => {
    if (initialSeason !== undefined) {
      setSelectedSeasonNum(initialSeason);
    }
  }, [initialSeason]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isSeasonDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSeasonDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSeasonDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSeasonDropdownOpen]);

  // View mode toggle: 'grid' or 'list' with local persistence
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('stream_episode_view_mode');
      return saved === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('stream_episode_view_mode', mode);
    } catch {
      // ignore storage failure
    }
  };

  // Filter out specials (season 0) if desired or keep them (season_number >= 0)
  const validSeasons = seasons.filter((s) => s.season_number >= 0);

  // Current active season object
  const activeSeason =
    validSeasons.find((s) => s.season_number === selectedSeasonNum) ||
    validSeasons[0] || {
      id: 0,
      season_number: selectedSeasonNum,
      name: `Season ${selectedSeasonNum}`,
      episode_count: 0,
    };

  useEffect(() => {
    let isMounted = true;
    async function loadSeason() {
      try {
        setLoading(true);
        const data = await tmdb.getTVSeason(tvShowId, selectedSeasonNum);
        if (isMounted) {
          setSeasonDetails(data);
        }
      } catch (err) {
        console.error('Failed to load season details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSeason();
    return () => {
      isMounted = false;
    };
  }, [tvShowId, selectedSeasonNum]);

  return (
    <section className="space-y-4">
      {/* Header with Title, Season Selector Dropdown & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
            Episodes & Seasons
          </h2>

          {/* View Mode Toggle (Grid / List) */}
          <div className="flex items-center bg-[#12131a] p-1 rounded-xl border border-white/[0.08] shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              aria-label="Grid layout"
              aria-pressed={viewMode === 'grid'}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none ${
                viewMode === 'grid' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {viewMode === 'grid' && (
                <motion.div
                  layoutId="episodes-view-mode-pill"
                  className="absolute inset-0 bg-[#e50914] rounded-lg shadow-md shadow-rose-950/40"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10" />
              <span className="hidden sm:inline relative z-10">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              aria-label="List layout"
              aria-pressed={viewMode === 'list'}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none ${
                viewMode === 'list' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {viewMode === 'list' && (
                <motion.div
                  layoutId="episodes-view-mode-pill"
                  className="absolute inset-0 bg-[#e50914] rounded-lg shadow-md shadow-rose-950/40"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <List className="w-3.5 h-3.5 relative z-10" />
              <span className="hidden sm:inline relative z-10">List</span>
            </button>
          </div>
        </div>

        {/* Season Selector Dropdown Menu Option (Responsive) */}
        <div ref={dropdownRef} className="relative z-30 w-full sm:w-auto">
          {/* Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setIsSeasonDropdownOpen((prev) => !prev)}
            aria-expanded={isSeasonDropdownOpen}
            aria-haspopup="listbox"
            className={`w-full sm:w-auto min-w-[210px] flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${
              isSeasonDropdownOpen
                ? 'bg-[#181a26] border-[#e50914]/60 text-white shadow-lg shadow-rose-950/30'
                : 'bg-[#12131a] hover:bg-[#161824] border-white/[0.1] text-slate-200 hover:border-white/20 active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#e50914]/15 border border-[#e50914]/30 flex items-center justify-center text-[#e50914] shrink-0">
                <Tv className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="truncate font-bold text-white">
                  {activeSeason.name}
                </span>
                <span className="text-[11px] font-normal text-slate-400 shrink-0">
                  ({activeSeason.episode_count} eps)
                </span>
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                isSeasonDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Animated Popover Menu */}
          <AnimatePresence>
            {isSeasonDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute right-0 sm:right-0 top-full mt-2 w-full sm:w-72 bg-[#12141f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 py-1.5 z-50 overflow-hidden"
                role="listbox"
                aria-label="Season selection"
              >
                {/* Header info */}
                <div className="px-3.5 py-2 border-b border-white/[0.08] flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Select Season</span>
                  <span className="text-slate-500 font-medium normal-case">
                    {validSeasons.length} {validSeasons.length === 1 ? 'Season' : 'Seasons'}
                  </span>
                </div>

                {/* Season list */}
                <div className="max-h-64 sm:max-h-72 overflow-y-auto overscroll-contain p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {validSeasons.map((season) => {
                    const isSelected = selectedSeasonNum === season.season_number;
                    return (
                      <button
                        key={season.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedSeasonNum(season.season_number);
                          setIsSeasonDropdownOpen(false);
                          if (onSeasonChange) {
                            onSeasonChange(season.season_number);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/40'
                            : 'text-slate-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="truncate">{season.name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                              isSelected
                                ? 'bg-black/30 text-rose-100'
                                : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {season.episode_count} eps
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-white shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        </div>
      ) : seasonDetails && seasonDetails.episodes && seasonDetails.episodes.length > 0 ? (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            /* ================= GRID VIEW ================= */
            <motion.div
              key={`grid-season-${selectedSeasonNum}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
            >
              {seasonDetails.episodes.map((ep, idx) => (
                <motion.div
                  key={ep.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, delay: Math.min(idx * 0.015, 0.25) }}
                  onClick={() => navigate(`/watch/tv/${tvShowId}/${selectedSeasonNum}/${ep.episode_number}`)}
                  className="group relative rounded-2xl overflow-hidden bg-[#12131a] border border-white/[0.08] hover:border-rose-500/40 hover:bg-[#151722] transition-all cursor-pointer flex flex-col shadow-lg"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-900">
                    <img
                      src={getImageUrl(ep.still_path || backdropFallback, 'w780')}
                      alt={ep.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                      Ep {ep.episode_number}
                    </div>
                    {ep.runtime ? (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-semibold text-slate-300">
                        {ep.runtime}m
                      </div>
                    ) : null}
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                          {ep.episode_number}. {ep.name}
                        </h4>
                        {ep.vote_average ? (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold shrink-0">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{ep.vote_average.toFixed(1)}</span>
                          </div>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {ep.overview || 'No description available for this episode.'}
                      </p>
                    </div>

                    {ep.air_date && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-white/5">
                        <Calendar className="w-3 h-3" />
                        <span>{ep.air_date}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* ================= LIST VIEW ================= */
            <motion.div
              key={`list-season-${selectedSeasonNum}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="flex flex-col gap-3"
            >
              {seasonDetails.episodes.map((ep, idx) => (
                <motion.div
                  key={ep.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(idx * 0.015, 0.25) }}
                  onClick={() => navigate(`/watch/tv/${tvShowId}/${selectedSeasonNum}/${ep.episode_number}`)}
                  className="group relative rounded-2xl overflow-hidden bg-[#12131a] border border-white/[0.08] hover:border-rose-500/40 hover:bg-[#161824] transition-all cursor-pointer p-3 sm:p-4 flex flex-col sm:flex-row gap-3.5 sm:gap-4.5 items-start sm:items-center shadow-lg"
                >
                  {/* Thumbnail */}
                  <div className="w-full sm:w-52 md:w-64 aspect-video shrink-0 rounded-xl overflow-hidden bg-slate-900 relative">
                    <img
                      src={getImageUrl(ep.still_path || backdropFallback, 'w780')}
                      alt={ep.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                      Ep {ep.episode_number}
                    </div>
                    {ep.runtime ? (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-semibold text-slate-300">
                        {ep.runtime}m
                      </div>
                    ) : null}
                  </div>

                  {/* Metadata and synopsis */}
                  <div className="flex-1 min-w-0 w-full flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-[11px] font-bold text-[#e50914] bg-[#e50914]/15 px-2 py-0.5 rounded-md border border-[#e50914]/25 shrink-0">
                            Episode {ep.episode_number}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                            {ep.name}
                          </h4>
                        </div>
                        {ep.vote_average ? (
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-bold shrink-0 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{ep.vote_average.toFixed(1)}</span>
                          </div>
                        ) : null}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 sm:line-clamp-3 leading-relaxed mt-1">
                        {ep.overview || 'No synopsis available for this episode.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/5 text-[11px]">
                      <div className="flex items-center gap-3 text-slate-500">
                        {ep.air_date && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{ep.air_date}</span>
                          </div>
                        )}
                        {ep.runtime ? (
                          <span className="hidden sm:inline">
                            · {ep.runtime} mins
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 text-rose-400 font-semibold group-hover:translate-x-1 transition-transform">
                        <Play className="w-3 h-3 fill-rose-400" />
                        <span className="text-xs">Play Episode</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className="text-center py-12 bg-[#12131a] rounded-2xl border border-white/[0.08]">
          <p className="text-xs text-slate-400">No episodes found for this season.</p>
        </div>
      )}
    </section>
  );
};
