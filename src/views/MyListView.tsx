import React, { useState } from 'react';
import { Bookmark, Trash2, Play, History } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useRouter } from '../context/RouterContext';
import { getImageUrl, getBackdropUrl } from '../lib/tmdb';

export const MyListView: React.FC = () => {
  const { navigate } = useRouter();
  const { bookmarks, removeBookmark, clearBookmarks } = useBookmarks();
  const { history, removeHistoryItem, clearHistory } = useWatchHistory();
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'history'>('all');

  const filteredBookmarks = bookmarks.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'movie') return b.media_type === 'movie';
    if (activeTab === 'tv') return b.media_type === 'tv';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#e50914] rounded-full inline-block" />
            My Library & Watchlist
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Locally saved bookmarks and playback history.
          </p>
        </div>

        {/* Tab Controls with touch scroll */}
        <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/[0.08] self-start sm:self-auto overflow-x-auto scrollbar-none snap-x">
          <button
            onClick={() => setActiveTab('all')}
            className={`snap-start shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Saved ({bookmarks.length})
          </button>
          <button
            onClick={() => setActiveTab('movie')}
            className={`snap-start shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'movie'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`snap-start shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'tv'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TV Shows
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Watch History Tab */}
      {activeTab === 'history' ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">
              Showing recent titles played on CineStream.
            </span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Clear History
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {history.map((item) => (
                <div
                  key={`history-card-${item.id}-${item.season || 0}-${item.episode || 0}`}
                  className="group relative rounded-xl overflow-hidden bg-[#12131a] border border-white/[0.08] active:scale-[0.98] transition-all"
                >
                  <div className="aspect-video relative overflow-hidden bg-[#161822]">
                    <img
                      src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <button
                        onClick={() => {
                          if (item.media_type === 'tv') {
                            navigate(`/watch/tv/${item.id}/${item.season || 1}/${item.episode || 1}`);
                          } else {
                            navigate(`/watch/movie/${item.id}`);
                          }
                        }}
                        className="w-11 h-11 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                      >
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </button>
                    </div>

                    {item.progress !== undefined && item.progress > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                        <div
                          className="h-full bg-[#e50914]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.media_type === 'tv'
                          ? `S${item.season} · E${item.episode}`
                          : 'Feature Film'}
                      </p>
                    </div>
                    <button
                      onClick={() => removeHistoryItem(item.id, item.media_type)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 active:scale-90"
                      title="Remove from history"
                      aria-label="Remove item from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#12131a] rounded-2xl border border-white/[0.08]">
              <History className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-semibold">No watch history yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Titles you stream will automatically appear here so you can resume anytime.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Saved Bookmarks Tab */
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">
              {filteredBookmarks.length} saved title{filteredBookmarks.length === 1 ? '' : 's'}
            </span>
            {bookmarks.length > 0 && (
              <button
                onClick={clearBookmarks}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {filteredBookmarks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
              {filteredBookmarks.map((item) => (
                <div
                  key={`bm-${item.media_type}-${item.id}`}
                  className="group relative rounded-xl overflow-hidden bg-[#12131a] border border-white/[0.08] active:scale-[0.98] transition-all"
                >
                  <div
                    onClick={() => navigate(`/${item.media_type}/${item.id}`)}
                    className="aspect-[2/3] w-full relative overflow-hidden bg-[#161822] cursor-pointer"
                  >
                    <img
                      src={getImageUrl(item.poster_path, 'w500')}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Quick Play & Delete buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.media_type === 'tv') {
                            navigate(`/watch/tv/${item.id}/1/1`);
                          } else {
                            navigate(`/watch/movie/${item.id}`);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg"
                        title="Watch now"
                      >
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookmark(item.id, item.media_type);
                      }}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/75 hover:bg-[#e50914] text-white transition-colors z-20"
                      title="Remove from My List"
                      aria-label="Remove title from My List"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 sm:p-2.5">
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span className="capitalize">{item.media_type}</span>
                      <span>{(item.release_date || item.first_air_date || '').slice(0, 4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#12131a] rounded-2xl border border-white/[0.08] max-w-md mx-auto p-6">
              <Bookmark className="w-8 h-8 text-[#e50914] mx-auto mb-2.5" />
              <h3 className="text-base text-white font-bold mb-1">Your Watchlist is empty</h3>
              <p className="text-xs text-slate-400 mb-5">
                Explore movies and TV shows, then tap the bookmark icon on any poster to save it here.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/50"
              >
                Browse Trending
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
