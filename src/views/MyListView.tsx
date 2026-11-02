import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Play, History, LogIn, Sparkles, RefreshCw } from 'lucide-react';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl, getBackdropUrl } from '../lib/tmdb';

function formatTime(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const MyListView: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const { navigate } = useRouter();
  const {
    watchlist,
    removeBookmark,
    clearBookmarks,
    isSyncing,
    openSignInForWatchlist,
  } = useWatchlist();
  const { history, removeHistoryItem, clearHistory } = useWatchHistory();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'history'>('all');

  // Trigger Clerk sign-in modal if guest tries to view the Watchlist page
  useEffect(() => {
    if (isLoaded && !isSignedIn && activeTab !== 'history') {
      openSignInForWatchlist();
    }
  }, [isLoaded, isSignedIn, activeTab, openSignInForWatchlist]);

  const filteredBookmarks = watchlist.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'movie') return b.media_type === 'movie';
    if (activeTab === 'tv') return b.media_type === 'tv';
    return true;
  });

  const handleRemoveBookmark = (id: number, mediaType: 'movie' | 'tv', title: string) => {
    removeBookmark(id, mediaType);
    showToast(`Removed "${title}" from Watchlist`, 'bookmark');
  };

  const handleClearBookmarks = () => {
    clearBookmarks();
    showToast('Cleared all items from Watchlist', 'info');
  };

  const handleRemoveHistory = (id: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
    removeHistoryItem(id, mediaType, season, episode);
    showToast('Removed title from watch history', 'info');
  };

  const handleClearHistory = () => {
    clearHistory();
    showToast('Watch history cleared', 'info');
  };

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
            {isSignedIn
              ? 'Cloud-synced with your Clerk account across all devices.'
              : 'Sign in to sync your Watchlist across all devices.'}
          </p>
        </div>

        {/* Tab Controls with touch scroll */}
        <div className="flex items-center gap-1 p-1 bg-[#12131a] rounded-xl border border-white/[0.08] self-start sm:self-auto overflow-x-auto scrollbar-none snap-x">
          <button
            onClick={() => setActiveTab('all')}
            className={`snap-start shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Saved ({watchlist.length})
          </button>
          <button
            onClick={() => setActiveTab('movie')}
            className={`snap-start shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'movie'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`snap-start shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'tv'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TV Series
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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

      {/* Guest Mode Notice when browsing watchlist */}
      {!isSignedIn && activeTab !== 'history' && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#171926] via-[#12141f] to-[#171926] border border-[#e50914]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914] shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Save & Sync to Clerk</h3>
              <p className="text-xs text-slate-400">
                Sign in to automatically sync your watchlist across mobile, tablet, and PC.
              </p>
            </div>
          </div>

          <SignInButton mode="modal">
            <button className="px-5 py-2 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/60 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Clerk</span>
            </button>
          </SignInButton>
        </div>
      )}

      {/* Watch History Tab */}
      {activeTab === 'history' ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">
              Showing recent titles played on CineStream. Progress is auto-saved locally and cloud-synced with Clerk.
            </span>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
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
                  className="group relative rounded-2xl overflow-hidden bg-[#12131a] border border-white/[0.08] active:scale-[0.98] transition-all hover:border-white/20 shadow-lg"
                >
                  <div className="aspect-video relative overflow-hidden bg-[#161822]">
                    <img
                      src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        className="w-11 h-11 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                        title="Resume playback"
                      >
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </button>
                    </div>

                    {/* Progress Bar overlay */}
                    {item.progress !== undefined && item.progress > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/70">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 to-[#e50914]"
                          style={{ width: `${Math.min(100, Math.max(2, item.progress))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>
                            {item.media_type === 'tv'
                              ? `S${item.season} · E${item.episode}`
                              : 'Feature Film'}
                          </span>
                          {item.progress !== undefined && item.progress > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-rose-400 font-bold tabular-nums">
                                {item.progress}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveHistory(item.id, item.media_type, item.season, item.episode)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 active:scale-90 cursor-pointer transition-colors shrink-0"
                        title="Remove from history"
                        aria-label="Remove item from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Exact timestamp & Resume action button */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5 text-[10px]">
                      <span className="text-slate-400 font-semibold tabular-nums">
                        {item.currentTime && item.currentTime > 0
                          ? `${formatTime(item.currentTime)}${item.duration ? ` / ${formatTime(item.duration)}` : ''}`
                          : 'Just started'}
                      </span>
                      <button
                        onClick={() => {
                          if (item.media_type === 'tv') {
                            navigate(`/watch/tv/${item.id}/${item.season || 1}/${item.episode || 1}`);
                          } else {
                            navigate(`/watch/movie/${item.id}`);
                          }
                        }}
                        className="text-rose-400 hover:text-white font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Resume</span>
                        <Play className="w-2.5 h-2.5 fill-rose-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#12131a] rounded-2xl border border-white/[0.08]">
              <History className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-semibold">No watch history yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Titles you stream will automatically appear here with saved progress so you can resume anytime.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Saved Bookmarks Tab */
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <span>{filteredBookmarks.length} saved title{filteredBookmarks.length === 1 ? '' : 's'}</span>
              {isSyncing && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#e50914]" />
                  Syncing with Clerk...
                </span>
              )}
            </span>
            {watchlist.length > 0 && (
              <button
                onClick={handleClearBookmarks}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
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
                  className="group relative rounded-2xl overflow-hidden bg-[#12131a] border border-white/[0.08] active:scale-[0.98] transition-all hover:border-white/20"
                >
                  <div
                    onClick={() => navigate(`/${item.media_type}/${item.id}`)}
                    className="aspect-[2/3] w-full relative overflow-hidden bg-[#161822] cursor-pointer"
                  >
                    <img
                      src={getImageUrl(item.poster_path, 'w500')}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                        title="Watch now"
                      >
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark(item.id, item.media_type, item.title);
                      }}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/75 hover:bg-[#e50914] text-white transition-colors z-20 cursor-pointer"
                      title="Remove from My List"
                      aria-label="Remove title from My List"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
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
                className="px-5 py-2.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/50 cursor-pointer"
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
