import React, { useState } from 'react';
import { Play, Plus, Check, Star, Info } from 'lucide-react';
import { TMDBMedia, getImageUrl } from '../lib/tmdb';
import { useBookmarks } from '../hooks/useBookmarks';
import { useRouter } from '../context/RouterContext';

interface MovieCardProps {
  media: TMDBMedia;
  mediaType?: 'movie' | 'tv';
  aspect?: 'poster' | 'backdrop';
}

export const MovieCard: React.FC<MovieCardProps> = ({
  media,
  mediaType: explicitType,
  aspect = 'poster',
}) => {
  const { navigate } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [imageError, setImageError] = useState(false);

  const type: 'movie' | 'tv' =
    explicitType ||
    (media.media_type === 'tv' || media.first_air_date || media.number_of_seasons ? 'tv' : 'movie');

  const title = media.title || media.name || 'Untitled';
  const releaseYear = (media.release_date || media.first_air_date || '').slice(0, 4);
  const rating = media.vote_average ? media.vote_average.toFixed(1) : 'NR';
  const saved = isBookmarked(media.id, type);

  const handleCardClick = () => {
    navigate(`/${type}/${media.id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'tv') {
      navigate(`/watch/tv/${media.id}/1/1`);
    } else {
      navigate(`/watch/movie/${media.id}`);
    }
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(media, type);
  };

  const imageSrc =
    aspect === 'backdrop' && media.backdrop_path
      ? getImageUrl(media.backdrop_path, 'w780')
      : getImageUrl(media.poster_path, 'w500');

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer select-none rounded-xl overflow-hidden bg-[#12131a] border border-white/[0.08] transition-all duration-300 md:hover:scale-105 md:hover:shadow-2xl md:hover:shadow-rose-950/40 md:hover:border-[#e50914]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e50914] touch-manipulation active:scale-[0.98]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Image container */}
      <div
        className={`w-full overflow-hidden bg-[#161822] relative ${
          aspect === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'
        }`}
      >
        {!imageError ? (
          <img
            src={imageSrc}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#181a26] to-[#0f1017]">
            <span className="text-xs font-semibold text-slate-300 line-clamp-2">{title}</span>
            <span className="text-[10px] text-slate-500 mt-1">{releaseYear || 'Cinema'}</span>
          </div>
        )}

        {/* Rating chip on card */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold text-amber-400">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{rating}</span>
        </div>

        {/* Quick Mobile Bookmark Button (Always accessible on touch without hover, 44x44px hitbox) */}
        <button
          onClick={handleBookmarkToggle}
          className="md:hidden absolute top-1 right-1 z-20 w-11 h-11 flex items-center justify-center rounded-full text-white drop-shadow-md touch-manipulation active:scale-90"
          aria-label={saved ? 'Remove from My List' : 'Add to My List'}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border ${
              saved
                ? 'bg-[#e50914] border-[#e50914] text-white shadow-md'
                : 'bg-black/60 border-white/20 text-white'
            }`}
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* Desktop-Only Hover Gradient Overlay (hidden on mobile touch to prevent popping) */}
        <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-end p-3.5 z-20">
          <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow-md">
            {title}
          </h4>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
            {releaseYear && <span>{releaseYear}</span>}
            {releaseYear && <span aria-hidden="true">·</span>}
            <span className="capitalize">{type}</span>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
            <button
              onClick={handlePlayClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#e50914] hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-950/50 transition-colors"
              title="Watch now"
              aria-label={`Play ${title}`}
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch</span>
            </button>

            <button
              onClick={handleBookmarkToggle}
              className={`p-1.5 rounded-lg border transition-colors ${
                saved
                  ? 'bg-[#e50914]/20 border-[#e50914] text-rose-400 hover:bg-[#e50914]/30'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title={saved ? 'Remove from My List' : 'Add to My List'}
              aria-label={saved ? 'Remove from My List' : 'Add to My List'}
            >
              {saved ? <Check className="w-4 h-4 text-rose-400" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Card Footer Details (Always visible on mobile below poster) */}
      <div className="p-2 sm:p-2.5">
        <h3 className="text-xs sm:text-sm font-semibold text-white truncate">{title}</h3>
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
          <span>{releaseYear || 'Cinema'}</span>
          <span className="uppercase text-[9px] font-bold tracking-wider px-1 py-0.2 rounded bg-white/5 text-slate-300">
            {type}
          </span>
        </div>
      </div>
    </div>
  );
};
