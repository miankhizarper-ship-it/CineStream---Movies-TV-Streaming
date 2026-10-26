/**
 * TMDB API Client & Helper Service with Caching and Extended Endpoints
 */

import { getCachedData, setCachedData } from './cache';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const getAuthHeaders = (): Record<string, string> => {
  const token =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_TMDB_API_READ_ACCESS_TOKEN) ||
    '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  profile_path?: string | null;
  media_type?: 'movie' | 'tv' | 'person';
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  known_for_department?: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TVEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  vote_average: number;
  runtime?: number;
}

export interface TVSeasonDetails {
  _id: string;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episodes: TVEpisode[];
}

export interface VideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface MediaDetails extends TMDBMedia {
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  similar?: {
    results: TMDBMedia[];
  };
  recommendations?: {
    results: TMDBMedia[];
  };
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
    air_date?: string;
  }[];
  videos?: {
    results: VideoResult[];
  };
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  combined_credits?: {
    cast: (TMDBMedia & { character?: string })[];
    crew: (TMDBMedia & { job?: string })[];
  };
}

export interface Genre {
  id: number;
  name: string;
}

/**
 * Fetch wrapper for TMDB with Caching and Error Handling
 */
async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  useCache: boolean = true
): Promise<T> {
  const queryParts = Object.entries(params)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(([key, val]) => `${key}=${encodeURIComponent(String(val))}`)
    .sort()
    .join('&');

  const cacheKey = `${endpoint}?${queryParts}`;

  if (useCache) {
    const cached = getCachedData<T>(cacheKey);
    if (cached) return cached;
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.append(key, String(val));
    }
  });

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `TMDB request failed (${response.status} ${response.statusText}): ${errorBody}`
    );
  }

  const data = await response.json();
  if (useCache) {
    setCachedData(cacheKey, data);
  }

  return data;
}

/**
 * Image URL Generator with size fallbacks
 */
export function getImageUrl(
  path: string | null | undefined,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
  if (!path) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect fill="%2312131a" width="300" height="450"/><text fill="%23475569" font-family="sans-serif" font-size="16" x="50%" y="50%" text-anchor="middle">No Image</text></svg>';
  }
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
): string {
  if (!path) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect fill="%2307080a" width="1280" height="720"/><text fill="%23334155" font-family="sans-serif" font-size="24" x="50%" y="50%" text-anchor="middle">No Backdrop</text></svg>';
  }
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

// API Methods
export const tmdb = {
  // Trending
  getTrending: async (
    mediaType: 'all' | 'movie' | 'tv' = 'all',
    timeWindow: 'day' | 'week' = 'day'
  ): Promise<{ results: TMDBMedia[] }> => {
    return fetchTMDB(`/trending/${mediaType}/${timeWindow}`);
  },

  // Movies
  getPopularMovies: async (page = 1): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
    return fetchTMDB('/movie/popular', { page });
  },

  getTopRatedMovies: async (page = 1): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
    return fetchTMDB('/movie/top_rated', { page });
  },

  getNowPlayingMovies: async (page = 1): Promise<{ results: TMDBMedia[] }> => {
    return fetchTMDB('/movie/now_playing', { page });
  },

  getMovieDetails: async (id: number | string): Promise<MediaDetails> => {
    return fetchTMDB(`/movie/${id}`, {
      append_to_response: 'credits,similar,recommendations,videos',
    });
  },

  // TV Shows
  getPopularTV: async (page = 1): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
    return fetchTMDB('/tv/popular', { page });
  },

  getTopRatedTV: async (page = 1): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
    return fetchTMDB('/tv/top_rated', { page });
  },

  getAnimeSeries: async (page = 1): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
    return fetchTMDB('/discover/tv', {
      with_genres: 16,
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      page,
    });
  },

  getTVDetails: async (id: number | string): Promise<MediaDetails> => {
    return fetchTMDB(`/tv/${id}`, {
      append_to_response: 'credits,similar,recommendations,videos',
    });
  },

  getTVSeason: async (tvId: number | string, seasonNumber: number): Promise<TVSeasonDetails> => {
    return fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`);
  },

  // Videos (YouTube Trailers)
  getVideos: async (
    id: number | string,
    type: 'movie' | 'tv' = 'movie'
  ): Promise<{ results: VideoResult[] }> => {
    return fetchTMDB(`/${type}/${id}/videos`);
  },

  // Recommendations based on a specific watched item
  getRecommendations: async (
    type: 'movie' | 'tv',
    id: number | string
  ): Promise<{ results: TMDBMedia[] }> => {
    return fetchTMDB(`/${type}/${id}/recommendations`);
  },

  // Discover & Explore
  discoverMedia: async (
    type: 'movie' | 'tv',
    params: {
      with_genres?: number | string;
      sort_by?: string;
      page?: number;
      'vote_average.gte'?: number;
      year?: number;
    } = {}
  ): Promise<{ results: TMDBMedia[]; total_pages: number; total_results: number }> => {
    return fetchTMDB(`/discover/${type}`, {
      ...params,
      sort_by: params.sort_by || 'popularity.desc',
      include_adult: false,
    });
  },

  // Search
  multiSearch: async (
    query: string,
    page = 1
  ): Promise<{ results: (TMDBMedia & { known_for?: TMDBMedia[] })[]; total_pages: number; total_results: number }> => {
    return fetchTMDB(
      '/search/multi',
      {
        query,
        page,
        include_adult: false,
      },
      false // do not cache search results
    );
  },

  // Person Details
  getPersonDetails: async (id: number | string): Promise<PersonDetails> => {
    return fetchTMDB(`/person/${id}`, {
      append_to_response: 'combined_credits',
    });
  },

  // Genres
  getGenres: async (type: 'movie' | 'tv' = 'movie'): Promise<{ genres: Genre[] }> => {
    return fetchTMDB(`/genre/${type}/list`);
  },
};

/**
 * Convenience search helper function
 */
export const searchMedia = async (query: string): Promise<TMDBMedia[]> => {
  if (!query.trim()) return [];
  const res = await tmdb.multiSearch(query);
  return res.results || [];
};

