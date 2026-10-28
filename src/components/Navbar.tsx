import React, { useState, useEffect } from 'react';
import { Film, Search, Bookmark, Command, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from '../context/RouterContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { CommandPalette } from './CommandPalette';

export const Navbar: React.FC = () => {
  const { route, navigate } = useRouter();
  const { bookmarks } = useBookmarks();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global shortcut for Cmd+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Movies', path: '/explore/movie' },
    { label: 'TV Series', path: '/explore/tv' },
    { label: 'Categories', path: '/categories' },
    { label: 'My List', path: '/mylist', count: bookmarks.length },
  ];

  const isActive = (path: string) => {
    if (path === '/') return route.type === 'home';
    if (path === '/explore/movie') return route.type === 'explore' && route.params.mediaType === 'movie';
    if (path === '/explore/tv') return route.type === 'explore' && route.params.mediaType === 'tv';
    if (path === '/categories') return route.type === 'categories';
    if (path === '/mylist') return route.type === 'mylist';
    if (path === '/download-app') return route.type === 'download-app';
    return false;
  };

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
            className="flex items-center gap-2.5 text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e50914] to-rose-500 flex items-center justify-center shadow-md shadow-rose-950/50 group-hover:scale-105 transition-transform">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-slate-200 bg-clip-text text-transparent">
              CINE<span className="text-[#e50914]">STREAM</span>
            </span>
          </button>

          {/* Zone 2: Desktop clean text nav links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
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
            {/* Android APK Page Button (Visible on Large PC Screen View Only, Hidden on Mobile View) */}
            <button
              onClick={() => navigate('/download-app')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 group ${
                route.type === 'download-app'
                  ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/80 border border-rose-400/40'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
              }`}
              title="CineStream Android App (APK)"
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>Android App</span>
            </button>
            {/* Command Palette Trigger Button */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/[0.1] text-xs text-slate-300 transition-all group"
              title="Search (Cmd+K)"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline-block font-medium">Search titles...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-semibold text-slate-400 bg-white/10 rounded border border-white/10 ml-1">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>

            {/* Quick Watchlist on Desktop */}
            <button
              onClick={() => navigate('/mylist')}
              className="hidden xl:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors active:scale-95"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#e50914] fill-[#e50914]" />
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

      {/* Global Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
};
