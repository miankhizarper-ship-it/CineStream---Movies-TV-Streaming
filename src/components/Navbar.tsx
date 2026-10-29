import React, { useState, useEffect } from 'react';
import { Film, Search, Bookmark, Command, Menu, X, Home, Tv, Layers, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from '../context/RouterContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { CommandPalette } from './CommandPalette';

export const Navbar: React.FC = () => {
  const { route, navigate } = useRouter();
  const { bookmarks } = useBookmarks();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    { label: 'Home', path: '/', icon: Home },
    { label: 'Movies', path: '/explore/movie', icon: Film },
    { label: 'TV Series', path: '/explore/tv', icon: Tv },
    { label: 'Categories', path: '/categories', icon: Layers },
    { label: 'My List', path: '/mylist', icon: Bookmark, count: bookmarks.length },
    { label: 'Android App', path: '/download-app', icon: Smartphone },
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

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
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
          {/* Brand Wordmark */}
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

          {/* Desktop Navigation Links (Visible on Medium screens and up) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`whitespace-nowrap shrink-0 transition-colors relative py-1 flex items-center gap-1.5 ${
                    active ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.count !== undefined && link.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#e50914] text-white font-bold tabular-nums">
                      {link.count}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute -bottom-[25px] left-0 right-0 h-0.5 bg-[#e50914] shadow-sm shadow-[#e50914]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Top Right Actions: Search Button & Mobile Hamburger Menu Icon */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Trigger Button */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.1] text-xs text-slate-300 transition-all group"
              title="Search titles (Cmd+K)"
              aria-label="Search titles"
            >
              <Search className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline-block font-medium">Search</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-semibold text-slate-400 bg-white/10 rounded border border-white/10 ml-1">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>

            {/* Hamburger Menu Toggle Button (Visible on small screens only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-all active:scale-95"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer Menu (Mobile Screens) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 right-0 max-w-xs w-full bg-[#0d0e14] border-l border-white/10 shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-base font-black text-white">
                  <div className="w-7 h-7 rounded-lg bg-[#e50914] flex items-center justify-center">
                    <Film className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>CINE<span className="text-[#e50914]">STREAM</span></span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <button
                      key={link.path}
                      onClick={() => handleNavClick(link.path)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
                        active
                          ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/50'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span>{link.label}</span>
                      </div>
                      {link.count !== undefined && link.count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-black/30 text-white text-xs font-bold tabular-nums">
                          {link.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer Info */}
              <div className="p-4 border-t border-white/10 bg-black/40 text-[11px] text-slate-500 text-center">
                CineStream v1.0.0 · Cinematic Streaming
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
};
