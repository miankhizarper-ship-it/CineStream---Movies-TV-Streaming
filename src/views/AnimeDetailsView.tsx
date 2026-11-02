import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Play,
  Plus,
  Check,
  Star,
  Share2,
  ChevronLeft,
  ChevronRight,
  Users,
  Briefcase,
  Sparkles,
  Tv,
  Film,
  Info,
  LayoutGrid,
  List,
  Layers,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  anilistApi,
  AnilistMedia,
  cleanAnimeDescription,
  getAnimeTitle,
  getAnimeImageUrl,
  getAnilistBanner,
  AnilistCharacter,
  AnilistStaff,
} from '../lib/anilist';
import { useRouter } from '../context/RouterContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useToast } from '../context/ToastContext';
import { MovieCard } from '../components/MovieCard';
import { CharacterModal } from '../components/CharacterModal';
import { StaffModal } from '../components/StaffModal';

interface AnimeDetailsViewProps {
  id: string;
}

export const AnimeDetailsView: React.FC<AnimeDetailsViewProps> = ({ id }) => {
  const { navigate, goBack } = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { history } = useWatchHistory();
  const { showToast } = useToast();

  const [data, setData] = useState<AnilistMedia | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active section tab: 'episodes' | 'characters' | 'staff' | 'recommendations'
  const [activeTab, setActiveTab] = useState<'episodes' | 'characters' | 'staff' | 'recommendations'>('episodes');

  // View mode for episodes: grid or list
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [batchIndex, setBatchIndex] = useState<number>(0);

  // Sub-modals for character and staff inspection
  const [selectedCharId, setSelectedCharId] = useState<string | number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | number | null>(null);

  // Scroll ref for horizontal cast if rendered
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
  }, [data]);

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
    async function loadAnimeDetails() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const item = await anilistApi.getAnimeInfo(id);
        if (isMounted) {
          setData(item);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to load anime details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAnimeDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const title = data ? getAnimeTitle(data.title) : '';
  const posterUrl = data ? getAnimeImageUrl(data.image || data.coverImage || data.cover) : '';
  const bannerUrl = data ? (getAnilistBanner(data) || posterUrl) : '';
  
  // Format rating
  const rawScore = data ? (data.rating || data.score || (data.popularity ? Math.min(10, Math.round(data.popularity / 100)) : 8.5)) : 8.5;
  const rating = (rawScore > 10 ? rawScore / 10 : rawScore).toFixed(1);

  // Year & Format
  const releaseYear = data ? (data.startDate?.year || data.year || (typeof data.releaseDate === 'number' ? data.releaseDate : '') || '') : '';
  const animeFormat = data ? (data.type || (data as any).format || 'TV') : 'TV';
  
  // Episode count & normalization
  const episodeCount = data ? (data.episodes?.length || data.totalEpisodes || (typeof data.episodes === 'number' ? data.episodes : 12)) : 12;
  const studioName = data ? (data.studios?.[0] || 'Animation Studio') : '';

  const BATCH_SIZE = 24;

  const allEpisodes = useMemo(() => {
    if (!data) return [];
    if (data.episodes && data.episodes.length > 0) {
      return data.episodes.map((ep, idx) => ({
        id: ep.id || `ep-${idx + 1}`,
        number: ep.number || idx + 1,
        title: ep.title || `Episode ${ep.number || idx + 1}`,
        description: ep.description || '',
        image: ep.image || bannerUrl || posterUrl,
        airDate: ep.airDate || '',
      }));
    }
    const count = episodeCount || 12;
    return Array.from({ length: Math.min(count, 150) }, (_, i) => ({
      id: `ep-${i + 1}`,
      number: i + 1,
      title: `Episode ${i + 1}`,
      description: '',
      image: bannerUrl || posterUrl,
      airDate: '',
    }));
  }, [data, episodeCount, bannerUrl, posterUrl]);

  const totalEpisodesCount = allEpisodes.length;

  const episodeBatches = useMemo(() => {
    if (totalEpisodesCount === 0) return [];
    const batches = [];
    for (let i = 0; i < totalEpisodesCount; i += BATCH_SIZE) {
      const startEp = allEpisodes[i]?.number || i + 1;
      const endEp = allEpisodes[Math.min(i + BATCH_SIZE - 1, totalEpisodesCount - 1)]?.number || totalEpisodesCount;
      batches.push({
        index: Math.floor(i / BATCH_SIZE),
        label: `Ep ${startEp} – ${endEp}`,
      });
    }
    return batches;
  }, [allEpisodes, totalEpisodesCount]);

  const currentBatchEpisodes = useMemo(() => {
    const start = batchIndex * BATCH_SIZE;
    return allEpisodes.slice(start, start + BATCH_SIZE);
  }, [allEpisodes, batchIndex]);

  const getWatchedProgress = (epNum: number) => {
    if (!data) return undefined;
    const found = history.find(
      (h) => (h.id === Number(data.id) || String(h.id) === String(data.id)) && h.episode === epNum
    );
    return found?.progress;
  };

  if (loading) {
    return (
      <div className="w-full min-h-[70dvh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Loading anime details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="p-6 rounded-2xl bg-[#12131a] border border-white/[0.08] text-center">
          <h3 className="text-base font-bold text-white mb-2">Notice</h3>
          <p className="text-xs text-slate-400 mb-6">{error || 'Anime details not found.'}</p>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Bookmark compatibility object
  const bookmarkMediaObj: any = {
    id: data.id,
    title: title,
    poster_path: posterUrl,
    backdrop_path: bannerUrl,
    vote_average: parseFloat(rating),
    release_date: releaseYear ? `${releaseYear}-01-01` : '',
    overview: cleanAnimeDescription(data.description),
    media_type: 'anime',
    isAnime: true,
  };

  const saved = isBookmarked(data.id, 'anime') || isBookmarked(data.id);

  const handlePlayNow = (episodeNumber = 1) => {
    navigate(`/watch/anime/${data.id}/${episodeNumber}/1`);
  };

  const handleToggleBookmark = async () => {
    const isNowSaved = await toggleBookmark(bookmarkMediaObj, 'anime');
    if (isNowSaved) {
      showToast(`Added "${title}" to Watchlist`, 'bookmark');
    } else {
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

  // Helper to safely get character name & image
  const getCharName = (char: AnilistCharacter): string => {
    if (!char.name) return 'Unknown Character';
    if (typeof char.name === 'string') return char.name;
    return char.name.full || char.name.userPreferred || char.name.first || 'Unknown Character';
  };

  const getCharImg = (char: AnilistCharacter): string => {
    if (!char.image) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
    if (typeof char.image === 'string') return char.image;
    return char.image.large || char.image.medium || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
  };

  // Helper to safely get staff name, image, role
  const getStaffName = (st: AnilistStaff): string => {
    if (!st.name) return 'Unknown Staff';
    if (typeof st.name === 'string') return st.name;
    return st.name.full || st.name.userPreferred || st.name.first || 'Unknown Staff';
  };

  const getStaffImg = (st: AnilistStaff): string => {
    if (!st.image) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300';
    if (typeof st.image === 'string') return st.image;
    return st.image.large || st.image.medium || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300';
  };

  // Process recommendation list into TMDB compatibility
  const rawRecommendations = data.recommendations || data.relations || [];
  const recommendationList = rawRecommendations.map((item: any) => {
    const rec = item.mediaRecommendation || item;
    const recTitle = getAnimeTitle(rec.title || rec);
    const recImage = getAnimeImageUrl(rec.image || rec.coverImage || rec.cover);
    return {
      id: rec.id || Math.floor(Math.random() * 1000000),
      title: recTitle,
      name: recTitle,
      poster_path: recImage,
      backdrop_path: getAnilistBanner(rec) || recImage,
      vote_average: parseFloat(((rec.rating || rec.score || 85) / 10).toFixed(1)),
      release_date: rec.releaseDate || rec.year ? `${rec.releaseDate || rec.year}-01-01` : '',
      first_air_date: rec.releaseDate || rec.year ? `${rec.releaseDate || rec.year}-01-01` : '',
      overview: cleanAnimeDescription(rec.description),
      media_type: 'tv',
    };
  });

  return (
    <div className="w-full pb-24 bg-[#07080a]">
      {/* Immersive Hero Header */}
      <div className="relative w-full min-h-[460px] md:min-h-[580px] overflow-hidden bg-[#07080a] flex items-end">
        {/* Full Backdrop */}
        <div className="absolute inset-0">
          <img
            src={bannerUrl}
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white mb-4 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-start">
            {/* Poster Thumbnail */}
            <div className="w-36 sm:w-48 md:w-60 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#12131a] relative group">
              <img
                src={posterUrl}
                alt={title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-[#e50914]/20 border border-[#e50914]/40 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                  Anime Series
                </span>
                {data.status && (
                  <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wide">
                    {data.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {title}
              </h1>

              {/* Alternative Romaji/Native Title */}
              {typeof data.title === 'object' && (data.title.romaji || data.title.native) && (
                <p className="text-xs sm:text-sm italic text-slate-400 font-light line-clamp-1">
                  {data.title.romaji && data.title.native
                    ? `${data.title.romaji} (${data.title.native})`
                    : data.title.romaji || data.title.native}
                </p>
              )}

              {/* Unboxed metadata line with dot separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">{rating}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                {releaseYear && <span>{releaseYear}</span>}
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="uppercase font-semibold text-rose-300">{animeFormat}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{episodeCount} Ep</span>
                {studioName && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-300 font-medium">{studioName}</span>
                  </>
                )}
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-white/10 text-slate-200 border border-white/10">
                  1080P HD
                </span>
              </div>

              {/* Genres */}
              {data.genres && data.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.genres.map((genre, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/explore/anime?genre=${encodeURIComponent(genre)}`)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.08] text-slate-300 active:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3">
                <button
                  onClick={() => handlePlayNow(1)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-950/60 active:scale-95 transition-all touch-manipulation cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Episode 1</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleBookmark}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 touch-manipulation cursor-pointer ${
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
                    className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                    title="Share link"
                    aria-label="Share anime link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Overview */}
              <div className="pt-2">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl line-clamp-4 hover:line-clamp-none transition-all">
                  {cleanAnimeDescription(data.description)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body with Section Toggles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mt-8 space-y-8">
        {/* Section Toggle Pill Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#12131a] border border-white/[0.08] w-full sm:w-fit overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('episodes')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'episodes'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Episodes</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-black/30 font-extrabold">
              {episodeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Characters</span>
            {data.characters && data.characters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-black/30 font-extrabold">
                {data.characters.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Staff & Crew</span>
            {data.staff && data.staff.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-black/30 font-extrabold">
                {data.staff.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'recommendations'
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>More Like This</span>
          </button>
        </div>

        {/* Tab 1: Episodes Section */}
        {activeTab === 'episodes' && (
          <section className="bg-[#101119]/80 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 border border-white/[0.08] shadow-2xl space-y-6">
            {/* Header & Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                  <Tv className="w-5 h-5 text-[#e50914]" />
                  <span>Episodes & Arcs</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select an episode to watch. Toggle between Grid and List view options.
                </p>
              </div>

              {/* View Mode Toggle (Grid vs List) */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <div className="flex items-center p-1 bg-[#161822] rounded-xl border border-white/10">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#e50914] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Grid View"
                    aria-label="Switch to Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#e50914] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="List View"
                    aria-label="Switch to List View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Episode Range Quick-Jump Bar (Shown if anime has > 24 episodes) */}
            {episodeBatches.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#161822] border border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                  <Layers className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Episode Range ({totalEpisodesCount} total):</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                  {episodeBatches.map((b) => (
                    <button
                      key={b.index}
                      onClick={() => setBatchIndex(b.index)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        batchIndex === b.index
                          ? 'bg-[#e50914] text-white shadow-md'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Episode Items Render */}
            {viewMode === 'list' ? (
              /* List View Mode */
              <div className="flex flex-col gap-3">
                {currentBatchEpisodes.map((ep) => {
                  const epProgress = getWatchedProgress(ep.number);
                  return (
                    <div
                      key={ep.id}
                      onClick={() => handlePlayNow(ep.number)}
                      className="group relative flex flex-col sm:flex-row items-stretch gap-3.5 p-3 rounded-2xl bg-[#12131a]/90 backdrop-blur-md border border-white/[0.08] hover:border-rose-500/50 hover:bg-white/[0.06] cursor-pointer transition-all duration-200 active:scale-[0.99]"
                      role="button"
                      tabIndex={0}
                    >
                      {/* Thumbnail Preview Column */}
                      <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-[#161822] relative shrink-0">
                        <img
                          src={ep.image}
                          alt={ep.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg shadow-rose-950/80 group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>

                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-white tabular-nums border border-white/10">
                          EP {ep.number}
                        </span>

                        {epProgress !== undefined && epProgress > 0 && (
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                            <div
                              className="h-full bg-[#e50914]"
                              style={{ width: `${Math.min(100, epProgress)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Info Column */}
                      <div className="flex-1 flex flex-col justify-center min-w-0 pr-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-1">
                          <span className="font-bold text-rose-400">Episode {ep.number}</span>
                          {ep.airDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{ep.airDate}</span>
                              </span>
                            </>
                          )}
                          {epProgress !== undefined && epProgress >= 80 && (
                            <span className="ml-auto text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Watched
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                          {ep.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {ep.description || 'No overview synopsis provided for this episode.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Grid View Mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {currentBatchEpisodes.map((ep) => {
                  const epProgress = getWatchedProgress(ep.number);
                  return (
                    <div
                      key={ep.id}
                      onClick={() => handlePlayNow(ep.number)}
                      className="group relative cursor-pointer select-none rounded-2xl overflow-hidden bg-[#12131a]/90 backdrop-blur-md border border-white/[0.08] hover:border-rose-500/50 hover:bg-white/[0.06] transition-all duration-300 md:hover:scale-[1.02] active:scale-[0.98]"
                      role="button"
                      tabIndex={0}
                    >
                      {/* Thumbnail Aspect Video */}
                      <div className="aspect-video w-full relative overflow-hidden bg-[#161822]">
                        <img
                          src={ep.image}
                          alt={ep.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg shadow-rose-950/80 group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>

                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-white tabular-nums border border-white/10">
                          EP {ep.number}
                        </span>

                        {epProgress !== undefined && epProgress > 0 && (
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                            <div
                              className="h-full bg-[#e50914]"
                              style={{ width: `${Math.min(100, epProgress)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Footer Text */}
                      <div className="p-3">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 font-medium">
                          <span>Episode {ep.number}</span>
                          {ep.airDate && <span>{ep.airDate}</span>}
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                          {ep.title}
                        </h3>
                        {ep.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {ep.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Characters Section */}
        {activeTab === 'characters' && (
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
              Characters & Cast
            </h2>

            {data.characters && data.characters.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {data.characters.map((char, index) => {
                  const cName = getCharName(char);
                  const cImg = getCharImg(char);
                  const va = char.voiceActors?.[0];
                  const vaName = va?.name ? (typeof va.name === 'string' ? va.name : va.name.full || va.name.userPreferred) : null;

                  return (
                    <div
                      key={char.id || index}
                      onClick={() => setSelectedCharId(char.id)}
                      className="p-3 rounded-2xl bg-[#12131a] border border-white/[0.08] hover:border-[#e50914]/60 transition-all text-center group cursor-pointer active:scale-95"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-[#181a26] border border-white/10 mb-2 group-hover:border-[#e50914]/60 transition-colors">
                        <img
                          src={cImg}
                          alt={cName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                        {cName}
                      </h4>
                      {char.role && (
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase mt-1 ${
                          char.role.toUpperCase() === 'MAIN'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {char.role}
                        </span>
                      )}
                      {vaName && (
                        <p className="text-[10px] text-slate-400 truncate mt-1">
                          VA: {vaName}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#12131a] border border-white/[0.08] text-center text-slate-400">
                <Info className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                <p className="text-xs">No character information available for this title.</p>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Staff Section */}
        {activeTab === 'staff' && (
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
              Staff & Production Crew
            </h2>

            {data.staff && data.staff.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {data.staff.map((st, index) => {
                  const sName = getStaffName(st);
                  const sImg = getStaffImg(st);

                  return (
                    <div
                      key={st.id || index}
                      onClick={() => setSelectedStaffId(st.id)}
                      className="p-3 rounded-2xl bg-[#12131a] border border-white/[0.08] hover:border-[#e50914]/60 transition-all text-center group cursor-pointer active:scale-95"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-[#181a26] border border-white/10 mb-2 group-hover:border-[#e50914]/60 transition-colors">
                        <img
                          src={sImg}
                          alt={sName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                        {sName}
                      </h4>
                      {st.role && (
                        <p className="text-[10px] font-medium text-rose-300/80 truncate mt-0.5">
                          {st.role}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#12131a] border border-white/[0.08] text-center text-slate-400">
                <Info className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                <p className="text-xs">No staff information available for this title.</p>
              </div>
            )}
          </section>
        )}

        {/* Tab 4: Recommendations Section */}
        {activeTab === 'recommendations' && (
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
              More Like This
            </h2>

            {recommendationList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {recommendationList.map((recItem) => (
                  <MovieCard
                    key={recItem.id}
                    media={recItem as any}
                    mediaType="tv"
                    isAnime={true}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#12131a] border border-white/[0.08] text-center text-slate-400">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                <p className="text-xs">No recommendations found for this title.</p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Character Modal Trigger */}
      {selectedCharId && (
        <CharacterModal
          characterId={selectedCharId}
          onClose={() => setSelectedCharId(null)}
        />
      )}

      {/* Staff Modal Trigger */}
      {selectedStaffId && (
        <StaffModal
          staffId={selectedStaffId}
          onClose={() => setSelectedStaffId(null)}
        />
      )}
    </div>
  );
};
