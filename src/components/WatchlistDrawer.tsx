import React from 'react';
import { Bookmark, X, Play, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useQuickView } from '../context/QuickViewContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../lib/tmdb';

export const WatchlistDrawer: React.FC = () => {
  const { isWatchlistPanelOpen, closeWatchlistPanel } = useQuickView();
  const { bookmarks, removeBookmark } = useBookmarks();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  const handleRemove = (item: any) => {
    removeBookmark(item.id, item.media_type);
    showToast(`Removed "${item.title}" from My List`, 'info');
  };

  const handlePlay = (item: any) => {
    closeWatchlistPanel();
    if (item.media_type === 'tv') {
      navigate(`/watch/tv/${item.id}/1/1`);
    } else {
      navigate(`/watch/movie/${item.id}`);
    }
  };

  return (
    <AnimatePresence>
      {isWatchlistPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={closeWatchlistPanel} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md h-full bg-[#0c0d12] border-l border-white/10 flex flex-col p-6 shadow-2xl text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-[#e50914]" />
                <h3 className="text-base font-bold text-white">My Watchlist</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#e50914]/20 text-rose-400 font-bold tabular-nums border border-[#e50914]/30">
                  {bookmarks.length}
                </span>
              </div>
              <button
                onClick={closeWatchlistPanel}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                aria-label="Close watchlist drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
              {bookmarks.length > 0 ? (
                bookmarks.map((item) => (
                  <div
                    key={`drawer-bm-${item.media_type}-${item.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#12131a] border border-white/5 hover:border-white/20 transition-all group"
                  >
                    <img
                      src={getImageUrl(item.poster_path, 'w185')}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded-lg shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="capitalize text-rose-400 font-medium">
                          {item.media_type}
                        </span>
                        <span>·</span>
                        <span>★ {item.vote_average?.toFixed(1) || 'NR'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handlePlay(item)}
                        className="p-2 rounded-xl bg-[#e50914] text-white hover:bg-rose-500 active:scale-95 transition-all shadow-md"
                        title="Watch now"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </button>

                      <button
                        onClick={() => handleRemove(item)}
                        className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-white/10 active:scale-95 transition-all"
                        title="Remove from My List"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-500 space-y-3">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">
                    Your Watchlist is empty
                  </p>
                  <p className="text-xs text-slate-500">
                    Explore movies and TV shows, then tap "+" to save them here for quick access.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  closeWatchlistPanel();
                  navigate('/mylist');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                <span>View Full My List Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
