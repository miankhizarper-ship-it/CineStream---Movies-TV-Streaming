import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Info, Plus, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TMDBMedia, getBackdropUrl } from '../lib/tmdb';
import { useBookmarks } from '../hooks/useBookmarks';
import { useToast } from '../context/ToastContext';
import { useRouter } from '../context/RouterContext';

interface HeroCarouselProps {
  items: TMDBMedia[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
  const slides = items.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const { navigate } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { showToast } = useToast();

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const currentItem = slides[currentIndex] || slides[0];
  const type: 'movie' | 'tv' =
    currentItem?.media_type === 'tv' || currentItem?.first_air_date ? 'tv' : 'movie';
  const title = currentItem?.title || currentItem?.name || 'Featured Title';
  const saved = currentItem ? isBookmarked(currentItem.id, type) : false;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  // Autoplay Timer (8s)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + 1.25;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, slides.length, nextSlide]);

  // Handle Tab Visibility
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  if (!currentItem) return null;

  const handlePlayNow = () => {
    if (type === 'tv') {
      navigate(`/watch/tv/${currentItem.id}/1/1`);
    } else {
      navigate(`/watch/movie/${currentItem.id}`);
    }
  };

  const handleDetailsClick = () => {
    navigate(`/${type}/${currentItem.id}`);
  };

  const handleBookmarkToggle = async () => {
    const isNowSaved = await toggleBookmark(currentItem, type);
    if (isNowSaved) {
      showToast(`Added "${title}" to Watchlist`, 'bookmark');
    } else if (saved) {
      showToast(`Removed "${title}" from Watchlist`, 'bookmark');
    }
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[clamp(260px,38vh,340px)] md:h-[clamp(300px,42vh,400px)] lg:h-[clamp(340px,48vh,480px)] max-h-[480px] overflow-hidden bg-[#07080a] group"
    >
      {/* Background Poster Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={getBackdropUrl(currentItem.backdrop_path, 'original')}
            alt={title}
            className="w-full h-full object-cover object-[center_20%]"
          />
        </motion.div>
      </AnimatePresence>

      {/* Layered Gradient Overlays for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/60 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07080a] via-[#07080a]/80 to-transparent md:w-3/4 z-10" />
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#07080a]/80 to-transparent z-10" />

      {/* Hero Text & Compact Content Block */}
      <div className="absolute bottom-5 sm:bottom-8 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-2 sm:space-y-3"
          >
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1 text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[11px]">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">
                  {currentItem.vote_average ? currentItem.vote_average.toFixed(1) : 'NR'}
                </span>
              </span>

              <span className="px-2 py-0.5 rounded bg-[#e50914] text-white font-extrabold uppercase tracking-wider text-[9px]">
                #1 Trending
              </span>

              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="uppercase text-slate-200 font-bold text-[11px]">
                {type === 'tv' ? 'TV Series' : 'Movie'}
              </span>

              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-[11px]">{(currentItem.release_date || currentItem.first_air_date || '').slice(0, 4)}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-xl line-clamp-1 sm:line-clamp-2">
              {title}
            </h1>

            {/* Overview Excerpt */}
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed max-w-xl drop-shadow">
              {currentItem.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={handlePlayNow}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-950/60 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 btn-sheen"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Now</span>
              </button>

              <button
                onClick={handleDetailsClick}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Info className="w-4 h-4" />
                <span>Details</span>
              </button>

              <button
                onClick={handleBookmarkToggle}
                className={`h-10 sm:h-11 w-10 sm:w-11 rounded-xl border backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                  saved
                    ? 'bg-[#e50914]/30 border-[#e50914] text-rose-300'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
                title={saved ? 'Remove from My List' : 'Add to My List'}
                aria-label={saved ? 'Remove from My List' : 'Add to My List'}
              >
                {saved ? <Check className="w-4 h-4 text-rose-400" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 right-4 sm:right-12 z-20 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
              }}
              className="relative h-1.5 rounded-full overflow-hidden transition-all bg-white/30"
              style={{ width: idx === currentIndex ? '28px' : '10px' }}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {idx === currentIndex && (
                <div
                  className="h-full bg-[#e50914] transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
