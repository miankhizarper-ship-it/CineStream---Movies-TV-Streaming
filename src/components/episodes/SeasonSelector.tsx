import React, { useRef, useState, useEffect } from 'react';
import { Tv, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface SeasonInfo {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
}

interface SeasonSelectorProps {
  seasons: SeasonInfo[];
  selectedSeason: number;
  onSelectSeason: (seasonNumber: number) => void;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  seasons,
  selectedSeason,
  onSelectSeason,
}) => {
  const filteredSeasons = seasons.filter((s) => s.season_number > 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [filteredSeasons]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const clientWidth = scrollRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.5 : clientWidth * 0.5;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  if (filteredSeasons.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {/* Mobile Select Dropdown (< 640px) */}
      <div className="sm:hidden relative">
        <div className="flex items-center gap-2 mb-1.5">
          <Tv className="w-4 h-4 text-[#e50914]" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Season</span>
        </div>
        <div className="relative">
          <select
            value={selectedSeason}
            onChange={(e) => onSelectSeason(Number(e.target.value))}
            className="w-full appearance-none bg-[#161822] border border-white/15 text-white text-xs font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#e50914] shadow-lg"
          >
            {filteredSeasons.map((season) => (
              <option key={season.id} value={season.season_number}>
                {season.name || `Season ${season.season_number}`} ({season.episode_count} episodes)
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* Horizontal Scrolling Tab Bar with <> Scroll Buttons (sm and up) */}
      <div className="hidden sm:flex items-center relative group/seasons">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/80 hover:bg-[#e50914] text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all cursor-pointer"
            aria-label="Scroll seasons left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none py-1 snap-x w-full"
        >
          {filteredSeasons.map((season) => {
            const active = season.season_number === selectedSeason;
            return (
              <button
                key={season.id}
                onClick={() => onSelectSeason(season.season_number)}
                className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  active
                    ? 'bg-[#e50914] border-rose-500 text-white shadow-lg shadow-rose-950/60'
                    : 'bg-[#12131a] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{season.name || `Season ${season.season_number}`}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${
                    active ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {season.episode_count} eps
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/80 hover:bg-[#e50914] text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all cursor-pointer"
            aria-label="Scroll seasons right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
