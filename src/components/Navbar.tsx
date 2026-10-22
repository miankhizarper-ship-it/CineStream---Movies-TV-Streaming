import React, { useState, useEffect } from 'react';
import { Film, Search, Bookmark, X, ArrowLeft, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from '../context/RouterContext';
import { useBookmarks } from '../hooks/useBookmarks';

export const Navbar: React.FC = () => {
  const { route, navigate } = useRouter();
  const { bookmarks } = useBookmarks();
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchModalOpen, setMobileSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Movies', path: '/explore/movie' },
    { label: 'TV Shows', path: '/explore/tv' },
    { label: 'Categories', path: '/categories' },
    { label: 'My List', path: '/mylist', count: bookmarks.length },
  ];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setDesktopSearchOpen(false);
      setMobileSearchModalOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return route.type === 'home';
    if (path === '/explore/movie') return route.type === 'explore' && route.params.mediaType === 'movie';
    if (path === '/explore/tv') return route.type === 'explore' && route.params.mediaType === 'tv';
    if (path === '/categories') return route.type === 'categories';
    if (path === '/mylist') return route.type === 'mylist';
    return false;
  };

  const quickSearches = ['Avengers', 'Stranger Things', 'Breaking Bad', 'Anime', 'Batman'];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 transform-gpu ${
          scrolled
            ? 'bg-[#07080a]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/40'
            : 'bg-gradient-to-b from-[#07080a]/95 via-[#07080a]/70 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 h-14 md:h-20 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Single Brand Wordmark */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#e50914] to-rose-500 flex items-center justify-center shadow-md shadow-rose-950/40 group-hover:scale-105 transition-transform">
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-slate-200 bg-clip-text text-transparent">
              CINE<span className="text-[#e50914]">STREAM</span>
            </span>
          </button>

          {/* Zone 2: Desktop 4–5 single-line clean text nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`whitespace-nowrap shrink-0 transition-colors relative py-1 flex items-center gap-1.5 ${
                  isActive(link.path)
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{link.label}</span>
                {link.count !== undefined && link.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#e50914] text-white font-bold tabular-nums">
                    {link.count}
                  </span>
                )}
                {isActive(link.path) && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute -bottom-[25px] left-0 right-0 h-0.5 bg-[#e50914] shadow-sm shadow-[#e50914]"
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Search & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Search Input */}
            <div className="hidden md:block">
              {desktopSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search movies, shows, people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-56 lg:w-64 px-3.5 py-1.5 pl-9 rounded-full bg-[#12131a] border border-white/[0.12] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#e50914]"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setDesktopSearchOpen(false)}
                    className="absolute right-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setDesktopSearchOpen(true)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Search"
                  aria-label="Open search input"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Mobile Fullscreen Search Trigger (<768px) */}
            <button
              onClick={() => setMobileSearchModalOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-300 active:bg-white/10"
              aria-label="Open search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick Watchlist on Desktop */}
            <button
              onClick={() => navigate('/mylist')}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#e50914]" />
              <span>Watchlist</span>
              {bookmarks.length > 0 && (
                <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded bg-[#e50914]/20 text-rose-300 font-bold tabular-nums">
                  {bookmarks.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Dynamic Mobile Search Overlay (<768px) */}
      <AnimatePresence>
        {mobileSearchModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#07080a] flex flex-col p-4 pt-safe md:hidden"
          >
            {/* Search Top Bar */}
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
              <button
                onClick={() => setMobileSearchModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 active:text-white"
                aria-label="Close search"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search movies, shows, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#12131a] border border-white/[0.1] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#e50914]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              <button
                onClick={() => handleSearchSubmit()}
                className="px-3.5 h-11 rounded-xl bg-[#e50914] text-white text-xs font-bold active:scale-95 transition-transform"
              >
                Go
              </button>
            </div>

            {/* Quick Suggestions / Trending Tags */}
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickSearches.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      navigate(`/search?q=${encodeURIComponent(tag)}`);
                      setMobileSearchModalOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#12131a] border border-white/[0.08] text-xs font-medium text-slate-300 active:bg-white/10"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};
