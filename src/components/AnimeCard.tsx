import React from 'react';
import { Play, Star, Plus, Check, Tv, Calendar } from 'lucide-react';
import { AnilistMedia, getAnilistTitle, getAnilistImage } from '../lib/anilist';
import { useAnime } from '../context/AnimeContext';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';

interface AnimeCardProps {
  anime: AnilistMedia;
  aspectRatio?: 'portrait' | 'landscape';
  showRating?: boolean;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  aspectRatio = 'portrait',
  showRating = true,
}) => {
  const { navigate } = useRouter();
  const { isAnimeWatchlisted, toggleAnimeWatchlist } = useAnime();
  const { showToast } = useToast();

  const id = String(anime.id);
  const title = getAnilistTitle(anime.title);
  const imageUrl = getAnilistImage(anime);
  const isSaved = isAnimeWatchlisted(id);
  const score = anime.score || anime.rating;
  const ratingFormatted = score ? (score > 10 ? (score / 10).toFixed(1) : score.toFixed(1)) : null;

  const handleCardClick = () => {
    navigate(`/anime/${id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/watch/anime/${id}/1/1`);
  };

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await toggleAnimeWatchlist(anime);
    showToast(
      added ? `Added "${title}" to Anime Watchlist` : `Removed "${title}" from Anime Watchlist`,
      'bookmark'
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex-shrink-0 cursor-pointer select-none rounded-xl overflow-hidden bg-[#12131c] border border-white/[0.08] hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/40 hover:-translate-y-1.5"
    >
      {/* Poster Container */}
      <div
        className={`relative w-full overflow-hidden bg-slate-900 ${
          aspectRatio === 'portrait' ? 'aspect-[2/3]' : 'aspect-[16/9]'
        }`}
      >
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d14] via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          {ratingFormatted ? (
            <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[11px] font-bold text-amber-300 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{ratingFormatted}</span>
            </div>
          ) : (
            <div />
          )}

          {anime.status && (
            <div
              className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md border shadow-md ${
                anime.status === 'RELEASING'
                  ? 'bg-emerald-500/80 text-white border-emerald-400/30'
                  : 'bg-purple-950/80 text-purple-200 border-purple-500/30'
              }`}
            >
              {anime.status === 'RELEASING' ? 'Airing' : anime.status}
            </div>
          )}
        </div>

        {/* Quick Action Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
          <button
            onClick={handlePlayClick}
            className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 transform scale-90 group-hover:scale-100 transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Watch Episode 1"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
          <button
            onClick={handleBookmarkToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md transform scale-90 group-hover:scale-100 transition-all cursor-pointer hover:scale-110 active:scale-95 ${
              isSaved
                ? 'bg-purple-600 border-purple-400 text-white'
                : 'bg-black/60 border-white/20 text-slate-200 hover:text-white hover:bg-white/20'
            }`}
            title={isSaved ? 'Remove from Anime Watchlist' : 'Add to Anime Watchlist'}
          >
            {isSaved ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 bg-[#0d0e15] flex flex-col gap-1">
        <h3
          className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1"
          title={title}
        >
          {title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Tv className="w-3 h-3 text-purple-400" />
            <span>{anime.totalEpisodes ? `${anime.totalEpisodes} eps` : anime.type || 'Anime'}</span>
          </span>
          {anime.releaseDate || anime.year ? (
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>{anime.releaseDate || anime.year}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
