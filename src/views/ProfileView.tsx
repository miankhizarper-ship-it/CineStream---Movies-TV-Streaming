import React, { useState } from 'react';
import {
  useUser,
  useClerk,
  UserProfile,
  SignInButton,
  SignOutButton,
} from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import {
  User,
  Mail,
  Calendar,
  Bookmark,
  Play,
  Trash2,
  Settings,
  ShieldCheck,
  Film,
  Tv,
  LogIn,
  LogOut,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../lib/tmdb';

export const ProfileView: React.FC = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const { watchlist, removeFromWatchlist, clearWatchlist, isSyncing } = useWatchlist();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'watchlist' | 'settings'>('watchlist');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredWatchlist = watchlist.filter((item) => {
    if (filterType === 'all') return true;
    return item.media_type === filterType;
  });

  const handleRemove = async (id: number, mediaType: 'movie' | 'tv', title: string) => {
    await removeFromWatchlist(id, mediaType);
    showToast(`Removed "${title}" from your Watchlist`, 'bookmark');
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear your entire watchlist?')) {
      await clearWatchlist();
      showToast('Watchlist cleared', 'info');
    }
  };

  const handlePlay = (item: any) => {
    if (item.media_type === 'tv') {
      navigate(`/watch/tv/${item.id}/1/1`);
    } else {
      navigate(`/watch/movie/${item.id}`);
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-wider text-slate-500">Loading Profile...</p>
      </div>
    );
  }

  // Guest / Signed Out State
  if (!isSignedIn || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0e1017] border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#e50914]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#e50914]/15 border border-[#e50914]/30 flex items-center justify-center text-[#e50914] mb-5 shadow-lg shadow-rose-950/40">
              <User className="w-8 h-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Sign In to Your Account
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
              Log in with Clerk to sync your personal Watchlist across all your devices,
              manage security credentials, and access exclusive member features.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Clerk</span>
                </button>
              </SignInButton>

              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-semibold text-sm transition-all cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format joined date
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  const primaryEmail = user.primaryEmailAddress?.emailAddress || 'No email attached';
  const displayName =
    user.fullName || user.username || primaryEmail.split('@')[0] || 'CineStream Streamer';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8 w-full pb-24">
      {/* User Header Profile Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#12141f] via-[#0e1017] to-[#0a0b10] border border-white/10 p-6 sm:p-8 shadow-2xl mb-8">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#e50914]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user.imageUrl}
                alt={displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
              />
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0e1017] flex items-center justify-center text-white"
                title="Active Account"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {displayName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#e50914]/20 border border-[#e50914]/40 text-[#e50914] text-[11px] font-bold">
                  Clerk Verified
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-400 mt-1.5">
                <span className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{primaryEmail}</span>
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Joined {joinedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Sync Badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between sm:justify-start gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">Clerk Metadata Sync</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-white/5 tabular-nums">
                {watchlist.length} saved
              </span>
            </div>

            <SignOutButton>
              <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </SignOutButton>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/50'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Synced Watchlist ({watchlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/50'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Account Security & Clerk Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'watchlist' ? (
        <div>
          {/* Watchlist Sub-header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Filter:</span>
              <div className="flex items-center gap-1.5 p-1 bg-[#12131a] rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === 'all'
                      ? 'bg-[#e50914] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({watchlist.length})
                </button>
                <button
                  onClick={() => setFilterType('movie')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === 'movie'
                      ? 'bg-[#e50914] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Movies
                </button>
                <button
                  onClick={() => setFilterType('tv')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === 'tv'
                      ? 'bg-[#e50914] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TV Series
                </button>
              </div>
            </div>

            {watchlist.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold self-start sm:self-auto flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Watchlist</span>
              </button>
            )}
          </div>

          {/* Watchlist Grid */}
          {filteredWatchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredWatchlist.map((item) => (
                <div
                  key={`profile-wl-${item.media_type}-${item.id}`}
                  className="group relative rounded-2xl overflow-hidden bg-[#101119] border border-white/[0.08] hover:border-rose-500/50 transition-all duration-300 flex flex-col"
                >
                  <div
                    onClick={() => navigate(`/${item.media_type}/${item.id}`)}
                    className="aspect-[2/3] w-full relative overflow-hidden bg-[#161822] cursor-pointer"
                  >
                    <img
                      src={getImageUrl(item.poster_path, 'w500')}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Quick Play & Remove Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(item);
                        }}
                        className="w-11 h-11 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                        title="Watch now"
                      >
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </button>
                    </div>

                    {/* Remove Button Badge */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id, item.media_type, item.title);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-[#e50914] text-white transition-colors z-20 cursor-pointer shadow-md"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Type tag */}
                    <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      {item.media_type}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{(item.release_date || item.first_air_date || '').slice(0, 4)}</span>
                      <span>★ {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#0e1017] rounded-3xl border border-white/10 max-w-md mx-auto p-6">
              <Bookmark className="w-10 h-10 text-[#e50914] mx-auto mb-3" />
              <h3 className="text-base text-white font-bold mb-1">
                {filterType === 'all'
                  ? 'Your Watchlist is empty'
                  : `No ${filterType === 'movie' ? 'movies' : 'TV shows'} in Watchlist`}
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Add titles to your Watchlist by clicking the bookmark icon on any movie or TV show.
                They are automatically synced to your Clerk user profile.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
              >
                Browse Popular Movies
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Clerk UserProfile Section */
        <div className="rounded-3xl bg-[#0e1017] border border-white/10 p-4 sm:p-6 shadow-2xl flex flex-col items-center">
          <div className="w-full max-w-4xl">
            <UserProfile
              routing="hash"
              appearance={{
                baseTheme: dark,
                variables: {
                  colorPrimary: '#e50914',
                  colorBackground: '#0e1017',
                  colorInputBackground: '#161822',
                  colorText: '#f8fafc',
                  colorInputText: '#ffffff',
                },
                elements: {
                  card: 'bg-[#0e1017] border border-white/10 shadow-none text-white',
                  navbar: 'border-r border-white/10 bg-[#0a0b10]',
                  navbarButton: 'text-slate-300 hover:text-white hover:bg-white/5',
                  navbarButtonActive: 'text-white bg-[#e50914]/20 text-[#e50914]',
                  headerTitle: 'text-white font-bold',
                  headerSubtitle: 'text-slate-400',
                  formButtonPrimary: 'bg-[#e50914] hover:bg-rose-600 text-white',
                  badge: 'bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30',
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
