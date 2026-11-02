import React, { useState, useEffect } from 'react';
import { Play, Star, Calendar } from 'lucide-react';
import { tmdb, TVSeasonDetails, getImageUrl } from '../../lib/tmdb';
import { useRouter } from '../../context/RouterContext';

interface EpisodeListSectionProps {
  tvShowId: string;
  seasons: Array<{
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
  }>;
  backdropFallback: string | null;
  initialSeason?: number;
}

export const EpisodeListSection: React.FC<EpisodeListSectionProps> = ({
  tvShowId,
  seasons,
  backdropFallback,
  initialSeason = 1,
}) => {
  const { navigate } = useRouter();
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(initialSeason);
  const [seasonDetails, setSeasonDetails] = useState<TVSeasonDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter out specials (season 0) if desired or keep them
  const validSeasons = seasons.filter((s) => s.season_number >= 0);

  useEffect(() => {
    let isMounted = true;
    async function loadSeason() {
      try {
        setLoading(true);
        const data = await tmdb.getTVSeason(tvShowId, selectedSeasonNum);
        if (isMounted) {
          setSeasonDetails(data);
        }
      } catch (err) {
        console.error('Failed to load season details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSeason();
    return () => {
      isMounted = false;
    };
  }, [tvShowId, selectedSeasonNum]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
          Episodes & Seasons
        </h2>

        {/* Season Selector Tabs */}
        {validSeasons.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {validSeasons.map((season) => (
              <button
                key={season.id}
                onClick={() => setSelectedSeasonNum(season.season_number)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSeasonNum === season.season_number
                    ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/50'
                    : 'bg-[#12131a] text-slate-400 hover:text-white border border-white/[0.08]'
                }`}
              >
                {season.name} ({season.episode_count})
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        </div>
      ) : seasonDetails && seasonDetails.episodes && seasonDetails.episodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {seasonDetails.episodes.map((ep) => (
            <div
              key={ep.id}
              onClick={() => navigate(`/watch/tv/${tvShowId}/${selectedSeasonNum}/${ep.episode_number}`)}
              className="group relative rounded-2xl overflow-hidden bg-[#12131a] border border-white/[0.08] hover:border-rose-500/40 transition-all cursor-pointer flex flex-col shadow-lg"
            >
              <div className="aspect-video relative overflow-hidden bg-slate-900">
                <img
                  src={getImageUrl(ep.still_path || backdropFallback, 'w780')}
                  alt={ep.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                  Ep {ep.episode_number}
                </div>
                {ep.runtime ? (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-semibold text-slate-300">
                    {ep.runtime}m
                  </div>
                ) : null}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                      {ep.episode_number}. {ep.name}
                    </h4>
                    {ep.vote_average ? (
                      <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold shrink-0">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{ep.vote_average.toFixed(1)}</span>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {ep.overview || 'No description available for this episode.'}
                  </p>
                </div>

                {ep.air_date && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-white/5">
                    <Calendar className="w-3 h-3" />
                    <span>{ep.air_date}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#12131a] rounded-2xl border border-white/[0.08]">
          <p className="text-xs text-slate-400">No episodes found for this season.</p>
        </div>
      )}
    </section>
  );
};
