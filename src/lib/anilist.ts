/**
 * AniList & Anime API Client powered by Consumet
 * Base URL: https://apiconsumetorg-rho-lemon.vercel.app
 */

import { getCachedData, setCachedData } from './cache';
import { TMDBMedia } from './tmdb';

export const ANILIST_BASE_URL = 'https://apiconsumetorg-rho-lemon.vercel.app';

export interface AnilistTitle {
  romaji?: string;
  english?: string;
  native?: string;
  userPreferred?: string;
}

export interface AnilistTrailer {
  id?: string;
  site?: string;
  thumbnail?: string;
  thumbnailHash?: string;
}

export interface AnilistFuzzyDate {
  year?: number;
  month?: number;
  day?: number;
}

export interface AnilistEpisode {
  id: string;
  title?: string;
  description?: string;
  number?: number;
  image?: string;
  imageHash?: string;
  airDate?: string;
  url?: string;
}

export interface AnilistVoiceActor {
  id: string | number;
  language?: string;
  name?: {
    first?: string;
    last?: string;
    full?: string;
    native?: string;
    userPreferred?: string;
  } | string;
  image?: string | { large?: string; medium?: string };
}

export interface AnilistCharacter {
  id: string | number;
  role?: string;
  name?: {
    first?: string;
    last?: string;
    full?: string;
    native?: string;
    userPreferred?: string;
    alternative?: string[];
  } | string;
  image?: string | { large?: string; medium?: string };
  voiceActors?: AnilistVoiceActor[];
}

export interface AnilistStaff {
  id: string | number;
  role?: string;
  name?: {
    first?: string;
    last?: string;
    full?: string;
    native?: string;
    userPreferred?: string;
  } | string;
  image?: string | { large?: string; medium?: string };
  primaryOccupations?: string[];
}

export interface AnilistMedia {
  id: string;
  malId?: number;
  title: string | AnilistTitle;
  image?: string;
  imageHash?: string;
  cover?: string;
  coverHash?: string;
  trailer?: AnilistTrailer;
  description?: string;
  status?: string;
  releaseDate?: string | number;
  startDate?: AnilistFuzzyDate;
  endDate?: AnilistFuzzyDate;
  rating?: number;
  popularity?: number;
  type?: string;
  genres?: string[];
  totalEpisodes?: number;
  currentEpisode?: number;
  duration?: number;
  color?: string;
  studios?: string[];
  season?: string;
  countryOfOrigin?: string;
  episodes?: AnilistEpisode[];
  characters?: AnilistCharacter[];
  staff?: AnilistStaff[];
  relations?: any[];
  recommendations?: any[];
  score?: number;
  year?: number | string;
  coverImage?: string;
  bannerImage?: string;
  // Airing schedule specific fields
  episode?: number;
  airingAt?: number;
}

export interface AnilistPaginatedResponse {
  currentPage: number;
  hasNextPage?: boolean;
  results: AnilistMedia[];
}

export interface CharacterDetails {
  id: string | number;
  name: {
    first?: string;
    last?: string;
    full?: string;
    native?: string;
    userPreferred?: string;
    alternative?: string[];
    alternativeSpoiler?: string[];
  };
  image: string | { large?: string; medium?: string };
  description?: string;
  gender?: string;
  dateOfBirth?: AnilistFuzzyDate;
  bloodType?: string;
  age?: string | number;
  appearances?: string[];
  relations?: Array<{
    id?: string;
    role?: string;
    name?: string;
    image?: string;
  }>;
}

export interface StaffDetails {
  id: string | number;
  name: {
    first?: string;
    last?: string;
    full?: string;
    native?: string;
    userPreferred?: string;
    alternative?: string[];
  };
  image: string | { large?: string; medium?: string };
  description?: string;
  primaryOccupations?: string[];
  gender?: string;
  dateOfBirth?: AnilistFuzzyDate;
  dateOfDeath?: AnilistFuzzyDate;
  age?: number;
  yearsActive?: number[];
  homeTown?: string;
  bloodType?: string;
  isFavourite?: boolean;
  characters?: Array<{
    id?: string;
    role?: string;
    name?: string | string[];
    image?: string;
  }>;
  staff?: Array<{
    id?: string;
    role?: string;
    name?: string | string[];
    image?: string;
  }>;
}

/**
 * Clean HTML markup and source tags from descriptions
 */
export function cleanAnimeDescription(desc?: string): string {
  if (!desc) return 'No synopsis available.';
  return desc
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<[^>]*>?/gm, '')
    .trim();
}

/**
 * Standardize title display
 */
export function getAnimeTitle(title?: string | AnilistTitle, fallback = 'Untitled Anime'): string {
  if (!title) return fallback;
  if (typeof title === 'string') return title;
  return title.english || title.userPreferred || title.romaji || title.native || fallback;
}

/**
 * Standardize image url from either string or nested object
 */
export function getAnimeImageUrl(img?: string | { large?: string; medium?: string }): string {
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img.large || img.medium || '';
}

export const getAnilistTitle = getAnimeTitle;

export function getAnilistImage(item?: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.image || item.coverImage || item.large || item.medium || getAnimeImageUrl(item);
}

export function getAnilistBanner(item?: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.cover || item.bannerImage || item.image || item.coverImage || '';
}

export const cleanDescription = cleanAnimeDescription;

export type AiringScheduleItem = AnilistMedia;

export const ANIME_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

/**
 * Generic fetch with caching and timeout
 */
async function fetchWithTimeout<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data as T;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Main AniList API Service
 */
export const anilistApi = {
  /**
   * Trending Anime
   * /meta/anilist/trending?page={page}&perPage={perPage}
   */
  async getTrending(page = 1, perPage = 20): Promise<AnilistPaginatedResponse> {
    const cacheKey = `anilist_trending_${page}_${perPage}`;
    const cached = getCachedData<AnilistPaginatedResponse>(cacheKey);
    if (cached) return cached;

    const url = `${ANILIST_BASE_URL}/meta/anilist/trending?page=${page}&perPage=${perPage}`;
    const data = await fetchWithTimeout<AnilistPaginatedResponse>(url);
    setCachedData(cacheKey, data, 10 * 60 * 1000); // 10 min cache
    return data;
  },

  /**
   * Popular Anime
   * /meta/anilist/popular?page={page}&perPage={perPage}
   */
  async getPopular(page = 1, perPage = 20): Promise<AnilistPaginatedResponse> {
    const cacheKey = `anilist_popular_${page}_${perPage}`;
    const cached = getCachedData<AnilistPaginatedResponse>(cacheKey);
    if (cached) return cached;

    const url = `${ANILIST_BASE_URL}/meta/anilist/popular?page=${page}&perPage=${perPage}`;
    const data = await fetchWithTimeout<AnilistPaginatedResponse>(url);
    setCachedData(cacheKey, data, 10 * 60 * 1000);
    return data;
  },

  /**
   * Airing Schedule
   * /meta/anilist/airing-schedule
   */
  async getAiringSchedule(
    pageOrOptions:
      | number
      | {
          page?: number;
          perPage?: number;
          notYetAired?: boolean;
          weekStart?: string | number;
          weekEnd?: string | number;
        } = 1,
    perPageParam = 20,
    optionsParam?: {
      notYetAired?: boolean;
      weekStart?: string | number;
      weekEnd?: string | number;
    }
  ): Promise<AnilistPaginatedResponse> {
    let page = 1;
    let perPage = 20;
    let notYetAired: boolean | undefined = undefined;
    let weekStart: string | number | undefined = undefined;
    let weekEnd: string | number | undefined = undefined;

    if (typeof pageOrOptions === 'object') {
      page = pageOrOptions.page || 1;
      perPage = pageOrOptions.perPage || 20;
      notYetAired = pageOrOptions.notYetAired;
      weekStart = pageOrOptions.weekStart;
      weekEnd = pageOrOptions.weekEnd;
    } else {
      page = pageOrOptions || 1;
      perPage = perPageParam || 20;
      notYetAired = optionsParam?.notYetAired;
      weekStart = optionsParam?.weekStart;
      weekEnd = optionsParam?.weekEnd;
    }

    const cacheKey = `anilist_airing_${page}_${perPage}_${notYetAired || false}`;
    const cached = getCachedData<AnilistPaginatedResponse>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });

    if (notYetAired !== undefined) {
      params.set('notYetAired', String(notYetAired));
    }
    if (weekStart) params.set('weekStart', String(weekStart));
    if (weekEnd) params.set('weekEnd', String(weekEnd));

    const url = `${ANILIST_BASE_URL}/meta/anilist/airing-schedule?${params.toString()}`;
    const data = await fetchWithTimeout<AnilistPaginatedResponse>(url);
    setCachedData(cacheKey, data, 10 * 60 * 1000);
    return data;
  },

  /**
   * Advanced search helper
   */
  async advancedSearch(params: {
    query?: string;
    page?: number;
    perPage?: number;
    genres?: string;
    sort?: string;
  }): Promise<AnilistPaginatedResponse> {
    const page = params.page || 1;
    const perPage = params.perPage || 20;
    if (params.query) {
      return this.searchAnime(params.query, page);
    }
    if (params.sort?.includes('SCORE') || params.sort?.includes('POPULARITY')) {
      return this.getPopular(page, perPage);
    }
    return this.getTrending(page, perPage);
  },

  /**
   * Search Anime
   * /meta/anilist/{query}?page={page}
   */
  async searchAnime(query: string, page = 1): Promise<AnilistPaginatedResponse> {
    const trimmed = query.trim();
    if (!trimmed) return { currentPage: 1, results: [] };

    const cacheKey = `anilist_search_${trimmed.toLowerCase()}_${page}`;
    const cached = getCachedData<AnilistPaginatedResponse>(cacheKey);
    if (cached) return cached;

    const url = `${ANILIST_BASE_URL}/meta/anilist/${encodeURIComponent(trimmed)}?page=${page}`;
    const data = await fetchWithTimeout<AnilistPaginatedResponse>(url);
    setCachedData(cacheKey, data, 5 * 60 * 1000);
    return data;
  },

  /**
   * Quick Anime Data (instant, returns AniList metadata, characters, relations)
   * /meta/anilist/data/{id}
   */
  async getAnimeData(id: string | number): Promise<AnilistMedia> {
    const cacheKey = `anilist_data_${id}`;
    const cached = getCachedData<AnilistMedia>(cacheKey);
    if (cached) return cached;

    const url = `${ANILIST_BASE_URL}/meta/anilist/data/${id}`;
    const data = await fetchWithTimeout<AnilistMedia>(url, 6000);
    setCachedData(cacheKey, data, 30 * 60 * 1000);
    return data;
  },

  /**
   * Full Anime Info with Provider
   * /meta/anilist/info/{id}?provider={provider}
   * Automatically falls back to /meta/anilist/data/{id} if provider takes too long or fails
   */
  async getAnimeInfo(id: string | number, provider?: string): Promise<AnilistMedia> {
    const cacheKey = `anilist_info_${id}_${provider || 'default'}`;
    const cached = getCachedData<AnilistMedia>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${ANILIST_BASE_URL}/meta/anilist/info/${id}${
        provider ? `?provider=${encodeURIComponent(provider)}` : ''
      }`;
      // Fast 4.5 second timeout for external scrapers
      const data = await fetchWithTimeout<AnilistMedia>(url, 4500);
      setCachedData(cacheKey, data, 30 * 60 * 1000);
      return data;
    } catch {
      // Fallback to data endpoint which is always fast and contains full AniList metadata
      const data = await this.getAnimeData(id);
      return data;
    }
  },

  /**
   * Character Info
   * /meta/anilist/character/{id}
   */
  async getCharacterInfo(id: string | number): Promise<CharacterDetails> {
    const cacheKey = `anilist_char_${id}`;
    const cached = getCachedData<CharacterDetails>(cacheKey);
    if (cached) return cached;

    const url = `${ANILIST_BASE_URL}/meta/anilist/character/${id}`;
    const data = await fetchWithTimeout<CharacterDetails>(url, 8000);
    setCachedData(cacheKey, data, 60 * 60 * 1000);
    return data;
  },

  /**
   * Staff Info
   * /meta/anilist/staff/{id}
   */
  async getStaffInfo(id: string | number): Promise<StaffDetails> {
    const cacheKey = `anilist_staff_${id}`;
    const cached = getCachedData<StaffDetails>(cacheKey);
    if (cached) return cached;

    const url = `${ANILIST_BASE_URL}/meta/anilist/staff/${id}`;
    const data = await fetchWithTimeout<StaffDetails>(url, 8000);
    setCachedData(cacheKey, data, 60 * 60 * 1000);
    return data;
  },

  /**
   * Convert an AniList media item to TMDBMedia compatibility object
   * so it can be seamlessly used in existing CineStream components
   */
  toTMDBMedia(item: AnilistMedia): TMDBMedia {
    const title = getAnimeTitle(item.title);
    const poster = item.image || '';
    const backdrop = item.cover || item.image || '';
    const rating = typeof item.rating === 'number' ? item.rating / 10 : 8.0;

    return {
      id: Number(item.id) || 0,
      title,
      name: title,
      overview: cleanAnimeDescription(item.description),
      poster_path: poster,
      backdrop_path: backdrop,
      vote_average: rating,
      release_date: String(item.releaseDate || ''),
      first_air_date: String(item.releaseDate || ''),
      media_type: 'tv',
      genres: (item.genres || []).map((g, idx) => ({ id: idx, name: g })),
      number_of_episodes: item.totalEpisodes || item.currentEpisode || (item.episodes?.length || 12),
      number_of_seasons: 1,
      status: item.status || 'Ongoing',
    };
  },

  /**
   * Build embed player URL as requested
   * https://fmov.my/embed/anime/{id}/1/1?color=14b8a6&nextEpisode=true&episodeSelector=false&autoplayNextEpisode=true&overlay=false
   */
  buildEmbedUrl(
    id: string | number,
    season = 1,
    episode = 1,
    options?: {
      color?: string;
      nextEpisode?: boolean;
      episodeSelector?: boolean;
      autoplayNextEpisode?: boolean;
      overlay?: boolean;
    }
  ): string {
    const color = options?.color || '14b8a6';
    const nextEpisode = options?.nextEpisode !== false;
    const episodeSelector = options?.episodeSelector === true;
    const autoplayNextEpisode = options?.autoplayNextEpisode !== false;
    const overlay = options?.overlay === true;

    const params = new URLSearchParams({
      color,
      nextEpisode: String(nextEpisode),
      episodeSelector: String(episodeSelector),
      autoplayNextEpisode: String(autoplayNextEpisode),
      overlay: String(overlay),
    });

    return `https://fmov.my/embed/anime/${id}/${season}/${episode}?${params.toString()}`;
  },
};
