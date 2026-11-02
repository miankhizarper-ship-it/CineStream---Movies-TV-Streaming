import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AnilistMedia, getAnilistTitle, getAnilistImage, getAnilistBanner } from '../lib/anilist';

export interface AnimeWatchlistItem {
  id: string;
  title: string;
  image: string;
  bannerImage?: string;
  rating?: number;
  totalEpisodes?: number;
  genres?: string[];
  type?: string;
  status?: string;
  savedAt: number;
}

export interface AnimeHistoryItem {
  id: string;
  title: string;
  image: string;
  bannerImage?: string;
  season?: number;
  episode: number;
  episodeTitle?: string;
  lastWatched: number;
  progress?: number;
  duration?: number;
}

export interface AnimeContextType {
  animeWatchlist: AnimeWatchlistItem[];
  animeHistory: AnimeHistoryItem[];
  isAnimeWatchlisted: (id: string) => boolean;
  toggleAnimeWatchlist: (media: AnilistMedia) => Promise<boolean>;
  removeAnimeWatchlist: (id: string) => Promise<void>;
  clearAnimeWatchlist: () => Promise<void>;
  addOrUpdateAnimeHistory: (item: Omit<AnimeHistoryItem, 'lastWatched'> & { lastWatched?: number }) => Promise<void>;
  getAnimeHistoryItem: (id: string) => AnimeHistoryItem | undefined;
  removeAnimeHistoryItem: (id: string) => Promise<void>;
  clearAnimeHistory: () => Promise<void>;
}

const WATCHLIST_STORAGE_KEY = 'cinestream_anime_watchlist';
const HISTORY_STORAGE_KEY = 'cinestream_anime_history';
const EVENT_KEY = 'cinestream_anime_updated';

const AnimeContext = createContext<AnimeContextType | null>(null);

function getLocalAnimeWatchlist(): AnimeWatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAnimeWatchlist(items: AnimeWatchlistItem[]) {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (err) {
    console.error('Failed to save anime watchlist:', err);
  }
}

function getLocalAnimeHistory(): AnimeHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAnimeHistory(items: AnimeHistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (err) {
    console.error('Failed to save anime history:', err);
  }
}

const syncAnimeWatchlistToClerk = async (userObj: any, list: AnimeWatchlistItem[]) => {
  if (!userObj) return;
  try {
    const existing = { ...(userObj.unsafeMetadata || {}) };
    delete existing.animeWatchlist;
    const trimmed = list.slice(0, 20).map((item) => ({
      id: String(item.id),
      title: (item.title || 'Anime').slice(0, 30),
      image: item.image,
      rating: item.rating,
      totalEpisodes: item.totalEpisodes,
      savedAt: item.savedAt,
    }));
    await userObj.update({
      unsafeMetadata: {
        ...existing,
        animeWatchlist: trimmed,
      },
    });
  } catch (err) {
    console.warn('Clerk anime watchlist metadata sync notice:', err);
  }
};

const syncAnimeHistoryToClerk = async (userObj: any, list: AnimeHistoryItem[]) => {
  if (!userObj) return;
  try {
    const existing = { ...(userObj.unsafeMetadata || {}) };
    delete existing.animeHistory;
    const trimmed = list.slice(0, 20).map((item) => ({
      id: String(item.id),
      title: (item.title || 'Anime').slice(0, 30),
      image: item.image,
      episode: item.episode,
      lastWatched: item.lastWatched,
      progress: item.progress,
    }));
    await userObj.update({
      unsafeMetadata: {
        ...existing,
        animeHistory: trimmed,
      },
    });
  } catch (err) {
    console.warn('Clerk anime history metadata sync notice:', err);
  }
};

export const AnimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const [animeWatchlist, setAnimeWatchlist] = useState<AnimeWatchlistItem[]>(() => getLocalAnimeWatchlist());
  const [animeHistory, setAnimeHistory] = useState<AnimeHistoryItem[]>(() => getLocalAnimeHistory());
  const hasMigratedRef = useRef(false);

  // Sync with Clerk metadata when logged in
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      setAnimeWatchlist(getLocalAnimeWatchlist());
      setAnimeHistory(getLocalAnimeHistory());
      hasMigratedRef.current = false;
      return;
    }

    const syncUserMetadata = async () => {
      try {
        const metadata = (user.unsafeMetadata || {}) as {
          animeWatchlist?: AnimeWatchlistItem[];
          animeHistory?: AnimeHistoryItem[];
        };

        const clerkWatchlist = Array.isArray(metadata.animeWatchlist) ? metadata.animeWatchlist : [];
        const clerkHistory = Array.isArray(metadata.animeHistory) ? metadata.animeHistory : [];
        const localWatchlist = getLocalAnimeWatchlist();
        const localHistory = getLocalAnimeHistory();

        if (!hasMigratedRef.current) {
          hasMigratedRef.current = true;

          // Merge watchlists
          const watchlistMap = new Map<string, AnimeWatchlistItem>();
          clerkWatchlist.forEach((item) => watchlistMap.set(String(item.id), item));
          localWatchlist.forEach((item) => {
            if (!watchlistMap.has(String(item.id))) {
              watchlistMap.set(String(item.id), item);
            }
          });
          const mergedWatchlist = Array.from(watchlistMap.values());

          // Merge histories
          const historyMap = new Map<string, AnimeHistoryItem>();
          clerkHistory.forEach((item) => historyMap.set(String(item.id), item));
          localHistory.forEach((item) => {
            if (!historyMap.has(String(item.id))) {
              historyMap.set(String(item.id), item);
            }
          });
          const mergedHistory = Array.from(historyMap.values()).sort((a, b) => b.lastWatched - a.lastWatched);

          setAnimeWatchlist(mergedWatchlist);
          saveLocalAnimeWatchlist(mergedWatchlist);
          setAnimeHistory(mergedHistory);
          saveLocalAnimeHistory(mergedHistory);

          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              animeWatchlist: mergedWatchlist,
              animeHistory: mergedHistory,
            },
          });
        }
      } catch (err) {
        console.error('Error syncing anime metadata:', err);
      }
    };

    syncUserMetadata();
  }, [isLoaded, isSignedIn, user]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setAnimeWatchlist(getLocalAnimeWatchlist());
      setAnimeHistory(getLocalAnimeHistory());
    };

    window.addEventListener(EVENT_KEY, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(EVENT_KEY, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isAnimeWatchlisted = useCallback(
    (id: string): boolean => {
      return animeWatchlist.some((item) => String(item.id) === String(id));
    },
    [animeWatchlist]
  );

  const toggleAnimeWatchlist = useCallback(
    async (media: AnilistMedia): Promise<boolean> => {
      const id = String(media.id);
      const title = getAnilistTitle(media.title);
      const image = getAnilistImage(media);
      const bannerImage = getAnilistBanner(media);

      let nextWatchlist: AnimeWatchlistItem[];
      let isAdded = false;

      if (animeWatchlist.some((item) => String(item.id) === id)) {
        nextWatchlist = animeWatchlist.filter((item) => String(item.id) !== id);
        isAdded = false;
      } else {
        const newItem: AnimeWatchlistItem = {
          id,
          title,
          image,
          bannerImage,
          rating: media.score || media.rating,
          totalEpisodes: media.totalEpisodes,
          genres: media.genres,
          type: media.type,
          status: media.status,
          savedAt: Date.now(),
        };
        nextWatchlist = [newItem, ...animeWatchlist];
        isAdded = true;
      }

      setAnimeWatchlist(nextWatchlist);
      saveLocalAnimeWatchlist(nextWatchlist);

      if (isSignedIn && user) {
        await syncAnimeWatchlistToClerk(user, nextWatchlist);
      }

      return isAdded;
    },
    [animeWatchlist, isSignedIn, user]
  );

  const removeAnimeWatchlist = useCallback(
    async (id: string): Promise<void> => {
      const nextWatchlist = animeWatchlist.filter((item) => String(item.id) !== String(id));
      setAnimeWatchlist(nextWatchlist);
      saveLocalAnimeWatchlist(nextWatchlist);

      if (isSignedIn && user) {
        await syncAnimeWatchlistToClerk(user, nextWatchlist);
      }
    },
    [animeWatchlist, isSignedIn, user]
  );

  const clearAnimeWatchlist = useCallback(async (): Promise<void> => {
    setAnimeWatchlist([]);
    saveLocalAnimeWatchlist([]);
    if (isSignedIn && user) {
      await syncAnimeWatchlistToClerk(user, []);
    }
  }, [isSignedIn, user]);

  const addOrUpdateAnimeHistory = useCallback(
    async (item: Omit<AnimeHistoryItem, 'lastWatched'> & { lastWatched?: number }): Promise<void> => {
      const id = String(item.id);
      const newItem: AnimeHistoryItem = {
        ...item,
        id,
        lastWatched: item.lastWatched || Date.now(),
      };

      const existingIndex = animeHistory.findIndex((h) => String(h.id) === id);
      let nextHistory: AnimeHistoryItem[];

      if (existingIndex >= 0) {
        nextHistory = [...animeHistory];
        nextHistory[existingIndex] = { ...nextHistory[existingIndex], ...newItem };
      } else {
        nextHistory = [newItem, ...animeHistory];
      }

      // Sort by latest watched first
      nextHistory.sort((a, b) => b.lastWatched - a.lastWatched);

      setAnimeHistory(nextHistory);
      saveLocalAnimeHistory(nextHistory);

      if (isSignedIn && user) {
        await syncAnimeHistoryToClerk(user, nextHistory);
      }
    },
    [animeHistory, isSignedIn, user]
  );

  const getAnimeHistoryItem = useCallback(
    (id: string): AnimeHistoryItem | undefined => {
      return animeHistory.find((item) => String(item.id) === String(id));
    },
    [animeHistory]
  );

  const removeAnimeHistoryItem = useCallback(
    async (id: string): Promise<void> => {
      const nextHistory = animeHistory.filter((item) => String(item.id) !== String(id));
      setAnimeHistory(nextHistory);
      saveLocalAnimeHistory(nextHistory);

      if (isSignedIn && user) {
        await syncAnimeHistoryToClerk(user, nextHistory);
      }
    },
    [animeHistory, isSignedIn, user]
  );

  const clearAnimeHistory = useCallback(async (): Promise<void> => {
    setAnimeHistory([]);
    saveLocalAnimeHistory([]);
    if (isSignedIn && user) {
      await syncAnimeHistoryToClerk(user, []);
    }
  }, [isSignedIn, user]);

  return (
    <AnimeContext.Provider
      value={{
        animeWatchlist,
        animeHistory,
        isAnimeWatchlisted,
        toggleAnimeWatchlist,
        removeAnimeWatchlist,
        clearAnimeWatchlist,
        addOrUpdateAnimeHistory,
        getAnimeHistoryItem,
        removeAnimeHistoryItem,
        clearAnimeHistory,
      }}
    >
      {children}
    </AnimeContext.Provider>
  );
};

export function useAnime() {
  const context = useContext(AnimeContext);
  if (!context) {
    throw new Error('useAnime must be used within an AnimeProvider');
  }
  return context;
}
