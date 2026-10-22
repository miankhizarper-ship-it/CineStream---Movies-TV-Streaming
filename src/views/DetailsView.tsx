import React, { useEffect, useState } from 'react';
import {
  Play,
  Plus,
  Check,
  Star,
  Clock,
  Calendar,
  Share2,
  ChevronLeft,
  Tv,
} from 'lucide-react';
import {
  tmdb,
  MediaDetails,
  TVSeasonDetails,
  TVEpisode,
  getImageUrl,
  getBackdropUrl,
} from '../lib/tmdb';
import { useBookmarks } from '../hooks/useBookmarks';
import { useRouter } from '../context/RouterContext';
import { MovieCard } from '../components/MovieCard';

interface DetailsViewProps {
  id: string;
  mediaType: 'movie' | 'tv';
}

export const DetailsView: React.FC<DetailsViewProps> = ({ id, mediaType }) => {
  const { navigate, goBack } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<TVSeasonDetails | null>(null);
  const [loadingSeason, setLoadingSeason] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchDetails() {
      try {
        setLoading(true);
        setError(null);
        const data =
          mediaType === 'tv'
            ? await tmdb.getTVDetails(id)
            : await tmdb.getMovieDetails(id);

        if (!isMounted) return;
        setDetails(data);

        if (mediaType === 'tv' && data.seasons && data.seasons.length > 0) {
          const firstRegularSeason =
            data.seasons.find((s) => s.season_number > 0) || data.seasons[0];
          setSelectedSeason(firstRegularSeason.season_number);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load media details:', err);
          setError(err.message || 'Unable to load media details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [id, mediaType]);

  useEffect(() => {
    if (mediaType !== 'tv') return;
    let isMounted = true;

    async function fetchSeason() {
      try {
        setLoadingSeason(true);
        const sData = await tmdb.getTVSeason(id, selectedSeason);
        if (isMounted) setSeasonData(sData);
      } catch (err) {
        console.error('Failed to fetch season:', err);
      } finally {
        if (isMounted) setLoadingSeason(false);
      }
    }

    fetchSeason();
    return () => {
      isMounted = false;
    };
  }, [id, mediaType, selectedSeason]);

  if (loading) {
    return (
      <div className="w-full min-h-[70dvh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading title details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="p-6 rounded-2xl bg-[#12131a] border border-white/[0.08] text-center">
          <h3 className="text-base font-bold text-white mb-2">Notice</h3>
          <p className="text-xs text-slate-400 mb-6">{error || 'Media not found.'}</p>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const title = details.title || details.name || 'Untitled';
  const releaseDate = details.release_date || details.first_air_date || '';
  const releaseYear = releaseDate.slice(0, 4);
  const rating = details.vote_average ? details.vote_average.toFixed(1) : 'NR';
  const saved = isBookmarked(details.id, mediaType);
  const runtimeDisplay = details.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : details.number_of_seasons
    ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`
    : null;

  const handlePlayNow = () => {
    if (mediaType === 'tv') {
      navigate(`/watch/tv/${id}/${selectedSeason}/1`);
    } else {
      navigate(`/watch/movie/${id}`);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full pb-24">
      {/* Immersive Hero Header with Backdrop Blur */}
      <div className="relative w-full min-h-[460px] md:min-h-[580px] overflow-hidden bg-[#07080a] flex items-end">
        {/* Full Backdrop */}
        <div className="absolute inset-0">
          <img
            src={getBackdropUrl(details.backdrop_path, 'original')}
            alt={title}
            className="w-full h-full object-cover object-center filter blur-xs scale-105 opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080a] via-[#07080a]/60 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12 w-full">
          {/* Back button */}
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white mb-4 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-start">
            {/* Poster Thumbnail */}
            <div className="w-36 sm:w-48 md:w-60 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#12131a] relative group">
              <img
                src={getImageUrl(details.poster_path, 'w500')}
                alt={title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-[#e50914]/20 border border-[#e50914]/40 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                  {mediaType === 'tv' ? 'TV Series' : 'Movie'}
                </span>
                {details.status && (
                  <span className="text-slate-400 text-[11px]">{details.status}</span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight">
                {title}
              </h1>

              {details.tagline && (
                <p className="text-xs sm:text-sm italic text-slate-400 font-light line-clamp-2">
                  "{details.tagline}"
                </p>
              )}

              {/* Unboxed metadata with typographic separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">{rating}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                {releaseYear && <span>{releaseYear}</span>}
                {runtimeDisplay && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>{runtimeDisplay}</span>
                  </>
                )}
              </div>

              {/* Genres */}
              {details.genres && details.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {details.genres.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() =>
                        navigate(`/explore/${mediaType}?genre=${genre.id}`)
                      }
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.08] text-slate-300 active:bg-white/10"
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons: Play full width on mobile screens */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3">
                <button
                  onClick={handlePlayNow}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-950/60 active:scale-95 transition-all touch-manipulation"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Now</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(details, mediaType)}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                      saved
                        ? 'bg-[#e50914]/30 border-[#e50914] text-rose-300'
                        : 'bg-white/10 border-white/20 text-white'
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="w-4 h-4 text-rose-400" />
                        <span>In My List</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to List</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-3 rounded-xl bg-white/10 border border-white/20 text-white active:scale-95"
                    title="Share link"
                    aria-label="Share title link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {copied && (
                    <span className="text-[11px] text-rose-400 font-semibold animate-pulse">
                      Copied!
                    </span>
                  )}
                </div>
              </div>

              {/* Overview */}
              <div className="pt-2">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                  {details.overview || 'No synopsis provided for this title.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mt-8 space-y-10">
        {/* TV Series Season & Episode Picker */}
        {mediaType === 'tv' && details.seasons && details.seasons.length > 0 && (
          <section className="bg-[#12131a] rounded-2xl p-4 sm:p-6 border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#e50914]" />
                  <span>Episodes & Seasons</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a season and tap any episode to play immediately.
                </p>
              </div>

              {/* Season Dropdown */}
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="bg-[#181a26] border border-white/15 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#e50914] self-start sm:self-auto"
              >
                {details.seasons
                  .filter((s) => s.season_number > 0)
                  .map((season) => (
                    <option key={season.id} value={season.season_number}>
                      {season.name || `Season ${season.season_number}`} ({season.episode_count} eps)
                    </option>
                  ))}
              </select>
            </div>

            {/* Episode Grid */}
            {loadingSeason ? (
              <div className="py-8 flex justify-center text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin mr-2" />
                Loading season {selectedSeason} episodes...
              </div>
            ) : seasonData && seasonData.episodes && seasonData.episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {seasonData.episodes.map((ep: TVEpisode) => (
                  <div
                    key={ep.id}
                    onClick={() =>
                      navigate(`/watch/tv/${id}/${selectedSeason}/${ep.episode_number}`)
                    }
                    className="group cursor-pointer rounded-xl overflow-hidden bg-[#161822] border border-white/5 active:border-[#e50914]/50 transition-all active:scale-[0.98]"
                  >
                    <div className="aspect-video relative overflow-hidden bg-[#1c1f2e]">
                      <img
                        src={getImageUrl(ep.still_path || details.backdrop_path, 'w500')}
                        alt={ep.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#e50914] flex items-center justify-center shadow-md">
                          <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.2 rounded bg-black/80 text-[10px] font-bold text-white tabular-nums">
                        EP {ep.episode_number}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>{ep.air_date || `Episode ${ep.episode_number}`}</span>
                        {ep.runtime && <span>{ep.runtime}m</span>}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {ep.name || `Episode ${ep.episode_number}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {ep.overview || 'No description available.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No episodes found for this season.
              </p>
            )}
          </section>
        )}

        {/* Cast & Crew Horizontal Scroll */}
        {details.credits?.cast && details.credits.cast.length > 0 && (
          <section>
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
              Top Billed Cast
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x touch-pan-x py-1">
              {details.credits.cast.slice(0, 16).map((actor) => (
                <div
                  key={actor.id}
                  onClick={() => navigate(`/person/${actor.id}`)}
                  className="snap-start shrink-0 w-24 sm:w-28 text-center cursor-pointer active:scale-95"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden bg-[#181a26] border border-white/10 mb-2">
                    <img
                      src={getImageUrl(actor.profile_path, 'w185')}
                      alt={actor.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">
                    {actor.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {actor.character}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar & Recommended Titles */}
        {((details.recommendations?.results &&
          details.recommendations.results.length > 0) ||
          (details.similar?.results && details.similar.results.length > 0)) && (
          <section>
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
              More Like This
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
              {(
                details.recommendations?.results?.length
                  ? details.recommendations.results
                  : details.similar?.results || []
              )
                .slice(0, 12)
                .map((item) => (
                  <MovieCard
                    key={`similar-${item.id}`}
                    media={item}
                    mediaType={mediaType}
                  />
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
