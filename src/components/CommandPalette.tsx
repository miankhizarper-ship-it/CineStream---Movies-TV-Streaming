import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, Bookmark, Star, Sparkles, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tmdb, TMDBMedia, getImageUrl } from '../lib/tmdb';
import { useRouter } from '../context/RouterContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useToast } from '../context/ToastContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { navigate } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMedia[]>([]);
  const [trending, setTrending] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Stop background scrolling when the search modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  // Auto focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (trending.length === 0) {
        tmdb.getTrending('all', 'week')
          .then((res) => setTrending((res.results || []).slice(0, 6)))
          .catch(() => {});
      }
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await tmdb.multiSearch(query.trim());
        const filtered = (data.results || []).filter(
          (item) => item.media_type === 'movie' || item.media_type === 'tv'
        );
        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayedResults = results.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.media_type === activeFilter;
  });

  const handleSelectMedia = (media: TMDBMedia) => {
    const type = media.media_type === 'tv' ? 'tv' : 'movie';
    navigate(`/${type}/${media.id}`);
    onClose();
  };

  const handlePlayMedia = (e: React.MouseEvent, media: TMDBMedia) => {
    e.stopPropagation();
    const type = media.media_type === 'tv' ? 'tv' : 'movie';
    if (type === 'tv') {
      navigate(`/watch/tv/${media.id}/1/1`);
    } else {
      navigate(`/watch/movie/${media.id}`);
    }
    onClose();
  };

  const handleToggleSave = (e: React.MouseEvent, media: TMDBMedia) => {
    e.stopPropagation();
    const type = media.media_type === 'tv' ? 'tv' : 'movie';
    const saved = isBookmarked(media.id, type);
    toggleBookmark(media, type);
    showToast(
      saved ? `Removed "${media.title || media.name}"` : `Added "${media.title || media.name}" to My List`,
      'bookmark'
    );
  };

  const quickGenres = [
    { name: 'Action', path: '/explore/movie?genre=28' },
    { name: 'Sci-Fi', path: '/explore/movie?genre=878' },
    { name: 'Comedy', path: '/explore/movie?genre=35' },
    { name: 'Drama', path: '/explore/movie?genre=18' },
    { name: 'Animation', path: '/explore/movie?genre=16' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#0f1017] border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[85vh] z-10 overscroll-contain"
        >
          {/* Top Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-[#121420]/80 gap-3">
            <Search className="w-5 h-5 text-rose-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, TV series, actors, genres..."
              className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-white/5 rounded border border-white/10">
              <Command className="w-3 h-3" /> K
            </kbd>
          </div>

          {/* Filter Bar (When searching) */}
          {query.trim() && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-[#0c0d14]">
              <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
              {(['all', 'movie', 'tv'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    activeFilter === type
                      ? 'bg-[#e50914] text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type === 'movie' ? 'Movies' : 'TV Series'}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-500 tabular-nums">
                {displayedResults.length} results
              </span>
            </div>
          )}

          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 scrollbar-none">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Searching TMDB...</span>
              </div>
            ) : query.trim() ? (
              displayedResults.length > 0 ? (
                <div className="space-y-2">
                  {displayedResults.map((item) => {
                    const type = item.media_type === 'tv' ? 'tv' : 'movie';
                    const title = item.title || item.name || 'Untitled';
                    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
                    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                    const saved = isBookmarked(item.id, type);

                    return (
                      <div
                        key={`${type}-${item.id}`}
                        onClick={() => handleSelectMedia(item)}
                        className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#141622]/60 hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer transition-all"
                      >
                        {/* Poster */}
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#1c1e2e] shrink-0 relative">
                          {item.poster_path ? (
                            <img
                              src={getImageUrl(item.poster_path, 'w185')}
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 text-center p-1">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white truncate group-hover:text-rose-400 transition-colors">
                              {title}
                            </h4>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                              {type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            {year && <span>{year}</span>}
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="tabular-nums">{rating}</span>
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handlePlayMedia(e, item)}
                            className="p-2 rounded-lg bg-[#e50914] text-white hover:bg-rose-500 transition-colors"
                            title="Play Now"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </button>
                          <button
                            onClick={(e) => handleToggleSave(e, item)}
                            className={`p-2 rounded-lg border transition-colors ${
                              saved
                                ? 'bg-[#e50914]/20 border-[#e50914] text-rose-400'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                            }`}
                            title={saved ? 'Remove from My List' : 'Save to My List'}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">No titles found for "{query}"</p>
                  <p className="text-xs text-slate-500 mt-1">Try checking for typos or searching another term.</p>
                </div>
              )
            ) : (
              /* Trending & Genre Quick Discovery when query is empty */
              <div className="space-y-5">
                {/* Genre Quick Links */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>Popular Categories</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {quickGenres.map((g) => (
                      <button
                        key={g.name}
                        onClick={() => {
                          navigate(g.path);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trending Items List */}
                {trending.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                      Trending This Week
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trending.map((item) => {
                        const type = item.media_type === 'tv' ? 'tv' : 'movie';
                        const title = item.title || item.name || 'Untitled';
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';

                        return (
                          <div
                            key={`trending-${item.id}`}
                            onClick={() => handleSelectMedia(item)}
                            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] cursor-pointer transition-colors"
                          >
                            <div className="w-10 h-14 rounded overflow-hidden bg-slate-800 shrink-0">
                              {item.poster_path && (
                                <img
                                  src={getImageUrl(item.poster_path, 'w92')}
                                  alt={title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-semibold text-white truncate">{title}</h5>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="capitalize">{type}</span>
                                <span className="text-amber-400 font-semibold">★ {rating}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 bg-[#090a10] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 text-slate-300 rounded">Esc</kbd> to close</span>
            <span>Search powered by TMDB</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
