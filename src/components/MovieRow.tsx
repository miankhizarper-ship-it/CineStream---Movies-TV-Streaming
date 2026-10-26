import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TMDBMedia } from '../lib/tmdb';
import { MovieCard } from './MovieCard';

interface MovieRowProps {
  title: React.ReactNode;
  items: TMDBMedia[];
  mediaType?: 'movie' | 'tv';
  aspect?: 'poster' | 'backdrop';
  exploreLink?: string;
  onExploreClick?: () => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  items,
  mediaType,
  aspect = 'poster',
  exploreLink,
  onExploreClick,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const clientWidth = rowRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative my-5 sm:my-7 md:my-8 px-4 sm:px-6 md:px-12 group/row">
      {/* Row Header */}
      {title && (
        <div className="flex items-baseline justify-between mb-2.5 sm:mb-3.5">
          <div className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {typeof title === 'string' ? (
              <>
                <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block shrink-0" />
                <span>{title}</span>
              </>
            ) : (
              title
            )}
          </div>
          {exploreLink && onExploreClick && (
            <button
              onClick={onExploreClick}
              className="text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors whitespace-nowrap active:scale-95 shrink-0 ml-2"
            >
              See all →
            </button>
          )}
        </div>
      )}

      {/* Relative container for row & arrow buttons */}
      <div className="relative">
        {/* Left Arrow Button (hidden on mobile, visible on desktop hover) */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/80 hover:bg-[#e50914] text-white items-center justify-center backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-white/10 shadow-xl"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Touch-Optimized Horizontal Carousel */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex gap-2.5 sm:gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none snap-x snap-mandatory touch-pan-x py-1"
        >
          {items.map((item) => (
            <div
              key={`${item.media_type || mediaType || 'item'}-${item.id}`}
              className={`snap-start shrink-0 ${
                aspect === 'backdrop'
                  ? 'w-[200px] sm:w-[260px] md:w-[300px]'
                  : 'w-[125px] sm:w-[165px] md:w-[200px]'
              }`}
            >
              <MovieCard media={item} mediaType={mediaType} aspect={aspect} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button (hidden on mobile, visible on desktop hover) */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/80 hover:bg-[#e50914] text-white items-center justify-center backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-white/10 shadow-xl"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};
