import React, { useState } from 'react';
import { Play, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { TVEpisode, getImageUrl } from '../../lib/tmdb';

interface EpisodeCardProps {
  episode: TVEpisode;
  backdropFallback: string | null;
  viewMode: 'grid' | 'list';
  watchedProgress?: number;
  onPlay: (epNumber: number) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  backdropFallback,
  viewMode,
  watchedProgress,
  onPlay,
}) => {
  const [imageError, setImageError] = useState(false);

  const title = episode.name || `Episode ${episode.episode_number}`;
  const runtime = episode.runtime ? `${episode.runtime}m` : null;
  const imageSrc = getImageUrl(episode.still_path || backdropFallback, 'w500');

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onPlay(episode.episode_number)}
        className="group relative flex flex-col sm:flex-row items-stretch gap-3.5 p-3 rounded-2xl bg-[#12131a]/90 backdrop-blur-md border border-white/[0.08] hover:border-rose-500/50 hover:bg-white/[0.06] cursor-pointer transition-all duration-200 active:scale-[0.99]"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlay(episode.episode_number);
          }
        }}
      >
        {/* Thumbnail Preview Column */}
        <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-[#161822] relative shrink-0">
          {!imageError ? (
            <img
              src={imageSrc}
              alt={title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-b from-[#181a26] to-[#0f1017]">
              <span className="text-xs font-bold text-slate-300">Ep {episode.episode_number}</span>
            </div>
          )}

          {/* Hover Play Button */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg shadow-rose-950/80 group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </div>
          </div>

          {/* Episode Number Badge */}
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-white tabular-nums border border-white/10">
            EP {episode.episode_number}
          </span>

          {/* Watched Progress Line */}
          {watchedProgress !== undefined && watchedProgress > 0 && (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
              <div
                className="h-full bg-[#e50914]"
                style={{ width: `${Math.min(100, watchedProgress)}%` }}
              />
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 flex flex-col justify-center min-w-0 pr-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-1">
            <span className="font-bold text-rose-400">Episode {episode.episode_number}</span>
            {episode.air_date && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{episode.air_date}</span>
                </span>
              </>
            )}
            {runtime && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{runtime}</span>
                </span>
              </>
            )}
            {watchedProgress !== undefined && watchedProgress >= 80 && (
              <span className="ml-auto text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Watched
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
            {title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {episode.overview || 'No overview synopsis provided for this episode.'}
          </p>
        </div>
      </div>
    );
  }

  // Grid View Card
  return (
    <div
      onClick={() => onPlay(episode.episode_number)}
      className="group relative cursor-pointer select-none rounded-2xl overflow-hidden bg-[#12131a]/90 backdrop-blur-md border border-white/[0.08] hover:border-rose-500/50 hover:bg-white/[0.06] transition-all duration-300 md:hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(episode.episode_number);
        }
      }}
    >
      {/* Thumbnail Aspect Video */}
      <div className="aspect-video w-full relative overflow-hidden bg-[#161822]">
        {!imageError ? (
          <img
            src={imageSrc}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-b from-[#181a26] to-[#0f1017]">
            <span className="text-xs font-bold text-slate-300">EP {episode.episode_number}</span>
          </div>
        )}

        {/* Center Hover Play Glow Icon */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
          <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg shadow-rose-950/80 group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
        </div>

        {/* EP Number Badge */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-white tabular-nums border border-white/10">
          EP {episode.episode_number}
        </span>

        {/* Duration Badge */}
        {runtime && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-semibold text-slate-300 tabular-nums border border-white/10">
            {runtime}
          </span>
        )}

        {/* Progress Bar */}
        {watchedProgress !== undefined && watchedProgress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
            <div
              className="h-full bg-[#e50914]"
              style={{ width: `${Math.min(100, watchedProgress)}%` }}
            />
          </div>
        )}
      </div>

      {/* Footer Text */}
      <div className="p-3">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 font-medium">
          <span>{episode.air_date || `Episode ${episode.episode_number}`}</span>
          {episode.vote_average > 0 && (
            <span className="text-amber-400 font-semibold tabular-nums">★ {episode.vote_average.toFixed(1)}</span>
          )}
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
          {title}
        </h3>
        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {episode.overview || 'No synopsis provided.'}
        </p>
      </div>
    </div>
  );
};
