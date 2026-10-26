import React, { useState, useEffect, useMemo } from 'react';
import { Tv, LayoutGrid, List, ChevronLeft, ChevronRight, Hash, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tmdb, TVSeasonDetails, TVEpisode } from '../../lib/tmdb';
import { SeasonSelector, SeasonInfo } from './SeasonSelector';
import { EpisodeCard } from './EpisodeCard';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { useRouter } from '../../context/RouterContext';

interface EpisodeListSectionProps {
  tvShowId: number | string;
  seasons: SeasonInfo[];
  backdropFallback: string | null;
  initialSeason?: number;
}

const BATCH_SIZE = 24; // Number of episodes per page/batch for high performance

export const EpisodeListSection: React.FC<EpisodeListSectionProps> = ({
  tvShowId,
  seasons,
  backdropFallback,
  initialSeason = 1,
}) => {
  const { navigate } = useRouter();
  const { history } = useWatchHistory();

  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [seasonData, setSeasonData] = useState<TVSeasonDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [batchIndex, setBatchIndex] = useState<number>(0);

  // Sync selectedSeason when initialSeason prop changes
  useEffect(() => {
    if (initialSeason) setSelectedSeason(initialSeason);
  }, [initialSeason]);

  // Fetch season episodes on season change
  useEffect(() => {
    let isMounted = true;
    async function loadSeason() {
      try {
        setLoading(true);
        setBatchIndex(0); // reset page batch
        const data = await tmdb.getTVSeason(tvShowId, selectedSeason);
        if (isMounted) setSeasonData(data);
      } catch (err) {
        console.error('Failed to load season episodes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSeason();
    return () => {
      isMounted = false;
    };
  }, [tvShowId, selectedSeason]);

  const episodes = seasonData?.episodes || [];
  const totalEpisodes = episodes.length;

  // Calculate episode batches for quick-jump selector (e.g. Ep 1-24, Ep 25-48, Ep 49-72, etc.)
  const episodeBatches = useMemo(() => {
    if (totalEpisodes === 0) return [];
    const batches = [];
    for (let i = 0; i < totalEpisodes; i += BATCH_SIZE) {
      const startEp = episodes[i]?.episode_number || i + 1;
      const endEp = episodes[Math.min(i + BATCH_SIZE - 1, totalEpisodes - 1)]?.episode_number || totalEpisodes;
      batches.push({
        index: Math.floor(i / BATCH_SIZE),
        label: `Ep ${startEp} – ${endEp}`,
      });
    }
    return batches;
  }, [episodes, totalEpisodes]);

  // Slice displayed episodes for active batch
  const currentBatchEpisodes = useMemo(() => {
    const start = batchIndex * BATCH_SIZE;
    return episodes.slice(start, start + BATCH_SIZE);
  }, [episodes, batchIndex]);

  const handlePlayEpisode = (epNumber: number) => {
    navigate(`/watch/tv/${tvShowId}/${selectedSeason}/${epNumber}`);
  };

  // Find watched progress in history for an episode
  const getWatchedProgress = (epNum: number) => {
    const found = history.find(
      (h) => h.id === Number(tvShowId) && h.media_type === 'tv' && h.season === selectedSeason && h.episode === epNum
    );
    return found?.progress;
  };

  return (
    <section className="bg-[#101119]/80 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 border border-white/[0.08] shadow-2xl space-y-6">
      {/* Header & Season Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
            <Tv className="w-5 h-5 text-[#e50914]" />
            <span>Episodes & Arcs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a season or arc to explore episodes with thumbnail previews.
          </p>
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center p-1 bg-[#161822] rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#e50914] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Switch to Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-[#e50914] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
              aria-label="Switch to List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Season Tab Navigation */}
      <SeasonSelector
        seasons={seasons}
        selectedSeason={selectedSeason}
        onSelectSeason={setSelectedSeason}
      />

      {/* Episode Batch Quick-Jump Range Bar (Shown if season has > 20 episodes) */}
      {episodeBatches.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#161822] border border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Layers className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Episode Range ({totalEpisodes} total):</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            {episodeBatches.map((b) => (
              <button
                key={b.index}
                onClick={() => setBatchIndex(b.index)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                  b.index === batchIndex
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episode Cards Display Area */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Loading season {selectedSeason} episodes...
          </p>
        </div>
      ) : currentBatchEpisodes.length > 0 ? (
        <div className="space-y-4">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4'
                : 'space-y-3'
            }
          >
            {currentBatchEpisodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                backdropFallback={backdropFallback}
                viewMode={viewMode}
                watchedProgress={getWatchedProgress(ep.episode_number)}
                onPlay={handlePlayEpisode}
              />
            ))}
          </div>

          {/* Pagination Controls for Episode Batches */}
          {episodeBatches.length > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] text-xs font-semibold">
              <button
                onClick={() => setBatchIndex((p) => Math.max(0, p - 1))}
                disabled={batchIndex === 0}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-colors ${
                  batchIndex > 0
                    ? 'bg-white/5 border-white/10 text-white active:bg-white/10'
                    : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Batch</span>
              </button>

              <span className="text-slate-400 tabular-nums">
                Batch {batchIndex + 1} of {episodeBatches.length}
              </span>

              <button
                onClick={() => setBatchIndex((p) => Math.min(episodeBatches.length - 1, p + 1))}
                disabled={batchIndex === episodeBatches.length - 1}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-colors ${
                  batchIndex < episodeBatches.length - 1
                    ? 'bg-[#e50914] border-rose-500 text-white active:bg-rose-500'
                    : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Next Batch</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 bg-[#141622] rounded-2xl border border-white/5 p-6">
          <p className="text-sm font-bold text-white mb-1">No episodes found for this season</p>
          <p className="text-xs text-slate-500">Try selecting another season from the tab bar above.</p>
        </div>
      )}
    </section>
  );
};
