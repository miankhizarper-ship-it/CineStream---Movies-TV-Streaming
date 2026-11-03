import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Plus,
  Check,
  Star,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  tmdb,
  MediaDetails,
  getImageUrl,
  getBackdropUrl,
} from '../lib/tmdb';
import { useBookmarks } from '../hooks/useBookmarks';
import { useRouter } from '../context/RouterContext';
import { useToast } from '../context/ToastContext';
import { MovieCard } from '../components/MovieCard';
import { MovieRow } from '../components/MovieRow';
import { EpisodeListSection } from '../components/episodes/EpisodeListSection';
import { MediaLogo } from '../components/MediaLogo';

interface DetailsViewProps {
  id: string;
  mediaType: 'movie' | 'tv';
}

export const DetailsView: React.FC<DetailsViewProps> = ({ id, mediaType }) => {
  const { navigate, goBack } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { showToast } = useToast();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const castRowRef = useRef<HTMLDivElement>(null);
  const [canScrollCastLeft, setCanScrollCastLeft] = useState(false);
  const [canScrollCastRight, setCanScrollCastRight] = useState(true);

  const checkCastScroll = () => {
    if (castRowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = castRowRef.current;
      setCanScrollCastLeft(scrollLeft > 10);
      setCanScrollCastRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkCastScroll();
    window.addEventListener('resize', checkCastScroll);
    return () => window.removeEventListener('resize', checkCastScroll);
  }, [details]);

  const scrollCast = (direction: 'left' | 'right') => {
    if (castRowRef.current) {
      const clientWidth = castRowRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      castRowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkCastScroll, 350);
    }
  };

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

  if (loading) {
    return (
      <div className="w-full min-h-[70dvh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Loading title details...</p>
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

  const handleToggleBookmark = async () => {
    const isNowSaved = await toggleBookmark(details, mediaType);
    if (isNowSaved) {
      showToast(`Added "${title}" to Watchlist`, 'bookmark');
    } else if (saved) {
      showToast(`Removed "${title}" from Watchlist`, 'bookmark');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Link for "${title}" copied to clipboard!`, 'share');
    } else {
      showToast(`Sharing "${title}"`, 'share');
    }
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white mb-4 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 transition-all"
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

              <MediaLogo
                mediaId={id}
                mediaType={mediaType}
                titleFallback={title}
                imgClassName="max-h-16 sm:max-h-20 md:max-h-28 w-auto object-contain drop-shadow-xl"
              />

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
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-white/10 text-slate-200 border border-white/10">
                  4K HDR
                </span>
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
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.08] text-slate-300 active:bg-white/10 hover:text-white transition-colors"
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3">
                <button
                  onClick={handlePlayNow}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-950/60 active:scale-95 transition-all touch-manipulation"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Now</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleBookmark}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                      saved
                        ? 'bg-[#e50914]/30 border-[#e50914] text-rose-300'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
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
                    className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 active:scale-95 transition-all"
                    title="Share link"
                    aria-label="Share title link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
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
        {/* TV Series Season & Episode Overhauled Section */}
        {mediaType === 'tv' && details.seasons && details.seasons.length > 0 && (
          <EpisodeListSection
            tvShowId={id}
            seasons={details.seasons.map((s) => ({
              id: s.id,
              season_number: s.season_number,
              name: s.name || `Season ${s.season_number}`,
              episode_count: s.episode_count,
            }))}
            backdropFallback={details.backdrop_path}
            initialSeason={selectedSeason}
          />
        )}

        {/* Cast & Crew Horizontal Scroll */}
        {details.credits?.cast && details.credits.cast.length > 0 && (
          <section className="group/row">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
              Top Billed Cast
            </h2>
            <div className="relative">
              {canScrollCastLeft && (
                <button
                  onClick={() => scrollCast('left')}
                  className="hidden md:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/90 hover:bg-[#e50914] text-white items-center justify-center backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-white/20 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div
                ref={castRowRef}
                onScroll={checkCastScroll}
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
                className="flex gap-3.5 overflow-x-auto overflow-y-hidden overscroll-y-auto overscroll-x-contain scrollbar-none sm:snap-x sm:snap-proximity py-1 relative z-10 [touch-action:pan-x_pan-y]"
              >
                {details.credits.cast.slice(0, 16).map((actor) => (
                  <div
                    key={actor.id}
                    onClick={() => navigate(`/person/${actor.id}`)}
                    className="sm:snap-start shrink-0 w-24 sm:w-28 text-center cursor-pointer active:scale-95 group"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden bg-[#181a26] border border-white/10 mb-2 group-hover:border-[#e50914]/60 transition-colors">
                      <img
                        src={getImageUrl(actor.profile_path, 'w185')}
                        alt={actor.name}
                        draggable={false}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none select-none"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                      {actor.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {actor.character}
                    </p>
                  </div>
                ))}
              </div>

              {canScrollCastRight && (
                <button
                  onClick={() => scrollCast('right')}
                  className="hidden md:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/90 hover:bg-[#e50914] text-white items-center justify-center backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-white/20 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </section>
        )}

        {/* Similar & Recommended Titles */}
        {((details.recommendations?.results &&
          details.recommendations.results.length > 0) ||
          (details.similar?.results && details.similar.results.length > 0)) && (
          <MovieRow
            title="More Like This"
            items={
              details.recommendations?.results?.length
                ? details.recommendations.results
                : details.similar?.results || []
            }
            mediaType={mediaType}
          />
        )}
      </div>
    </div>
  );
};
