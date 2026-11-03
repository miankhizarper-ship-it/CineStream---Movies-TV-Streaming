import React, { useState } from 'react';
import { Play, Plus, Check, Star, Share2 } from 'lucide-react';
import { TMDBMedia, getImageUrl } from '../lib/tmdb';
import { useBookmarks } from '../hooks/useBookmarks';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import { MediaLogo } from './MediaLogo';

interface MovieCardProps {
  media: TMDBMedia;
  mediaType?: 'movie' | 'tv';
  aspect?: 'poster' | 'backdrop';
  isAnime?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  media,
  mediaType: explicitType,
  aspect = 'poster',
  isAnime = false,
}) => {
  const { navigate } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { showToast } = useToast();
  const [imageError, setImageError] = useState(false);

  const type: 'movie' | 'tv' =
    explicitType ||
    (media.media_type === 'tv' || media.first_air_date || media.number_of_seasons ? 'tv' : 'movie');

  const title = media.title || media.name || 'Untitled';
  const releaseYear = (media.release_date || media.first_air_date || '').slice(0, 4);
  const rating = media.vote_average ? media.vote_average.toFixed(1) : 'NR';
  const saved = isBookmarked(media.id, type);

  // Match percentage simulation based on rating
  const matchPercentage = Math.min(99, Math.max(78, Math.round((media.vote_average || 7.5) * 10)));

  const isDraggingRef = React.useRef(false);
  const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = false;
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    // If movement exceeds small threshold, user is scrolling/panning
    if (dx > 8 || dy > 8) {
      isDraggingRef.current = true;
    }
  };

  const handleCardClick = () => {
    // If user dragged to scroll, cancel navigation
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (isAnime) {
      navigate(`/anime/${media.id}`);
    } else {
      navigate(`/${type}/${media.id}`);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnime) {
      navigate(`/watch/anime/${media.id}/1/1`);
    } else if (type === 'tv') {
      navigate(`/watch/tv/${media.id}/1/1`);
    } else {
      navigate(`/watch/movie/${media.id}`);
    }
  };

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowSaved = await toggleBookmark(media, type);
    if (isNowSaved) {
      showToast(`Added "${title}" to Watchlist`, 'bookmark');
    } else if (saved) {
      showToast(`Removed "${title}" from Watchlist`, 'bookmark');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#/${type}/${media.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Link for "${title}" copied to clipboard!`, 'share');
    } else {
      showToast(`Sharing "${title}"`, 'share');
    }
  };

  const imageSrc =
    aspect === 'backdrop' && media.backdrop_path
      ? getImageUrl(media.backdrop_path, 'w780')
      : getImageUrl(media.poster_path, 'w500');

  return (
    <div
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="group relative cursor-pointer select-none rounded-2xl overflow-hidden bg-[#101119] border border-white/10 transition-transform duration-300 ease-out md:hover:scale-105 md:hover:z-35 md:hover:shadow-[0_20px_50px_rgba(0,0,0,0.9)] md:hover:border-rose-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 md:active:scale-[0.98] transform-gpu"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Image Container */}
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
            className="w-full h-full object-cover transition-transform duration-500 ease-out md:group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#181a26] to-[#0f1017]">
            <span className="text-xs font-semibold text-slate-300 line-clamp-2">{title}</span>
            <span className="text-[10px] text-slate-500 mt-1">{releaseYear || 'Cinema'}</span>
          </div>
        )}

        {/* Rating Badge on Card */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-white/10 shadow-lg">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{rating}</span>
        </div>

        {/* 4K Badge */}
        <div className="absolute top-2.5 right-2.5 z-10 hidden md:block px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-slate-300 border border-white/10 tracking-wider">
          4K HDR
        </div>

        {/* Mobile Bookmark Touch Button */}
        <button
          onClick={handleBookmarkToggle}
          className="md:hidden absolute top-2 right-2 z-20 w-11 h-11 flex items-center justify-center rounded-full text-white active:scale-90"
          aria-label={saved ? 'Remove from My List' : 'Add to My List'}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border ${
              saved
                ? 'bg-[#e50914] border-[#e50914] text-white shadow-md'
                : 'bg-black/60 border-white/20 text-white'
            }`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </div>
        </button>

        {/* Hover Vignette & Micro-Actions Overlay (Desktop only) */}
        <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/60 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 flex-col justify-end p-4 z-20">
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 mb-1.5">
            <span>{matchPercentage}% Match</span>
            <span className="text-slate-400 font-normal">·</span>
            <span className="text-slate-300">{releaseYear}</span>
          </div>

          <div className="h-7 flex items-center mb-1 max-w-[150px] sm:max-w-[180px]">
            <MediaLogo
              mediaId={media.id}
              mediaType={type}
              titleFallback={title}
              imgClassName="max-h-6 w-auto object-contain drop-shadow"
              titleClassName="text-[11px] sm:text-xs font-bold text-white truncate max-w-full"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-3">
            <span className="font-medium">{releaseYear || 'Cinema'}</span>
            <span className="uppercase text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10">
              {type}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-3 border-t border-white/10">
            <button
              onClick={handlePlayClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/70 transition-colors"
              title="Watch now"
              aria-label={`Play ${title}`}
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play</span>
            </button>

            <button
              onClick={handleBookmarkToggle}
              className={`p-2.5 rounded-xl border transition-colors ${
                saved
                  ? 'bg-[#e50914]/25 border-[#e50914] text-rose-400 hover:bg-[#e50914]/40'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title={saved ? 'Remove from My List' : 'Add to My List'}
              aria-label={saved ? 'Remove from My List' : 'Add to My List'}
            >
              {saved ? <Check className="w-4 h-4 text-rose-400" /> : <Plus className="w-4 h-4" />}
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Share"
              aria-label="Share media"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
