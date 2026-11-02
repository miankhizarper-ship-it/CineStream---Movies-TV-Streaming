import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { AnilistMedia } from '../lib/anilist';
import { AnimeCard } from './AnimeCard';

interface AnimeRowProps {
  title: string;
  subtitle?: string;
  animeList: AnilistMedia[];
  loading?: boolean;
  badge?: string;
  onSeeAll?: () => void;
}

export const AnimeRow: React.FC<AnimeRowProps> = ({
  title,
  subtitle,
  animeList,
  loading = false,
  badge,
  onSeeAll,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!loading && (!animeList || animeList.length === 0)) {
    return null;
  }

  return (
    <section className="relative my-8 px-4 md:px-8 xl:px-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{title}</span>
              {badge && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-rose-600 text-white uppercase tracking-wider shadow-sm">
                  {badge}
                </span>
              )}
            </h2>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors mr-2 cursor-pointer"
            >
              See All &rarr;
            </button>
          )}

          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-[#12131c] border border-white/10 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 hidden sm:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-[#12131c] border border-white/10 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 hidden sm:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row Container */}
      <div
        ref={rowRef}
        className="flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-none py-2 snap-x scroll-smooth"
      >
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-36 sm:w-44 md:w-52 aspect-[2/3] shrink-0 rounded-xl bg-slate-900/80 animate-pulse border border-white/[0.05]"
              />
            ))
          : animeList.map((anime) => (
              <div key={anime.id} className="w-36 sm:w-44 md:w-52 shrink-0 snap-start">
                <AnimeCard anime={anime} />
              </div>
            ))}
      </div>
    </section>
  );
};
