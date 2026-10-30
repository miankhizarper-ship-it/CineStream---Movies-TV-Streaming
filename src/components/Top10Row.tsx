import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { TMDBMedia } from '../lib/tmdb';
import { MovieCard } from './MovieCard';

interface Top10RowProps {
  items: TMDBMedia[];
  mediaType?: 'movie' | 'tv';
}

export const Top10Row: React.FC<Top10RowProps> = ({ items, mediaType = 'movie' }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const top10Items = items.slice(0, 10);

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
  }, [top10Items]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const clientWidth = rowRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  if (top10Items.length === 0) return null;

  return (
    <section className="relative my-6 sm:my-8 px-4 sm:px-6 md:px-12 group/top10">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Top 10 Movies & TV Shows Today
          </h2>
        </div>
      </div>

      <div className="relative">
        {/* Left Scroll Button (top front layer z-50) */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/90 hover:bg-[#e50914] text-white items-center justify-center backdrop-blur-md opacity-0 group-hover/top10:opacity-100 transition-all duration-200 border border-white/20 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Carousel containing giant top 10 rank numbers */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory touch-pan-x py-2 scroll-smooth relative z-10"
        >
          {top10Items.map((item, index) => {
            const rank = index + 1;
            return (
              <div
                key={`top10-${item.id}`}
                className="snap-start shrink-0 flex items-end relative min-w-[170px] sm:min-w-[220px] md:min-w-[260px]"
              >
                {/* Giant Outlined Number */}
                <div
                  className="top10-number select-none text-[110px] sm:text-[140px] md:text-[170px] font-black leading-none tracking-tighter -mr-6 sm:-mr-9 md:-mr-12 z-0 translate-y-3 sm:translate-y-4"
                  aria-hidden="true"
                >
                  {rank}
                </div>

                {/* Poster Card */}
                <div className="w-[120px] sm:w-[150px] md:w-[180px] z-10 shrink-0">
                  <MovieCard media={item} mediaType={mediaType} aspect="poster" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Scroll Button (top front layer z-50) */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/90 hover:bg-[#e50914] text-white items-center justify-center backdrop-blur-md opacity-0 group-hover/top10:opacity-100 transition-all duration-200 border border-white/20 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </section>
  );
};
