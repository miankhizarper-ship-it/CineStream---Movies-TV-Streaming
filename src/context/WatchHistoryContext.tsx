import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';

export interface WatchHistoryItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  season?: number;
  episode?: number;
  episode_name?: string;
  lastWatched: number; // timestamp in ms
  currentTime?: number; // playback position in seconds
  duration?: number; // total duration in seconds
  progress?: number; // 0 to 100 percentage
}

export interface WatchHistoryContextType {
  history: WatchHistoryItem[];
  addOrUpdateHistory: (item: Omit<WatchHistoryItem, 'lastWatched'> & { lastWatched?: number }) => Promise<void>;
  updateProgress: (
    id: number,
    mediaType: 'movie' | 'tv',
    currentTime: number,
    duration?: number,
    season?: number,
    episode?: number
  ) => Promise<void>;
  getHistoryItem: (
    id: number,
    mediaType: 'movie' | 'tv',
    season?: number,
    episode?: number
  ) => WatchHistoryItem | undefined;
  removeHistoryItem: (id: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  isSyncing: boolean;
}

const STORAGE_KEY = 'cinestream_history';
const EVENT_KEY = 'cinestream_history_updated';

const WatchHistoryContext = createContext<WatchHistoryContextType | null>(null);

function getLocalHistory(): WatchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(items: WatchHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (err) {
    console.error('Failed to write local watch history:', err);
  }
}

function matchesItem(
  a: WatchHistoryItem,
  id: number,
  mediaType: 'movie' | 'tv',
  season?: number,
  episode?: number
): boolean {
  if (a.id !== id || a.media_type !== mediaType) return false;
  if (mediaType === 'tv') {
    if (season !== undefined && a.season !== undefined && a.season !== season) return false;
    if (episode !== undefined && a.episode !== undefined && a.episode !== episode) return false;
  }
  return true;
}

export const WatchHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => getLocalHistory());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const hasMigratedRef = useRef(false);
  const clerkDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingClerkUpdateRef = useRef<WatchHistoryItem[] | null>(null);

  // Helper to commit updates to Clerk with debouncing to prevent rate-limiting on video playback ticks
  const queueClerkSync = useCallback(
    (updatedHistory: WatchHistoryItem[], immediate = false) => {
      if (!isSignedIn || !user) return;
      pendingClerkUpdateRef.current = updatedHistory;

      if (clerkDebounceTimerRef.current) {
        clearTimeout(clerkDebounceTimerRef.current);
        clerkDebounceTimerRef.current = null;
      }

      const performSync = async () => {
        if (!pendingClerkUpdateRef.current) return;
        const payload = pendingClerkUpdateRef.current;
        pendingClerkUpdateRef.current = null;
        try {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              watchHistory: payload.slice(0, 50), // keep top 50 in clerk
            },
          });
        } catch (err) {
          console.error('Failed to sync watch history with Clerk metadata:', err);
        }
      };

      if (immediate) {
        performSync();
      } else {
        clerkDebounceTimerRef.current = setTimeout(performSync, 3000);
      }
    },
    [isSignedIn, user]
  );

  // Flush any pending updates when unloading or unmounting
  useEffect(() => {
    return () => {
      if (clerkDebounceTimerRef.current && pendingClerkUpdateRef.current && user) {
        clearTimeout(clerkDebounceTimerRef.current);
        const payload = pendingClerkUpdateRef.current;
        user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            watchHistory: payload.slice(0, 50),
          },
        }).catch(() => {});
      }
    };
  }, [user]);

  // Sync state with Clerk metadata upon sign in and migration from localStorage
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setHistory(getLocalHistory());
      hasMigratedRef.current = false;
      return;
    }

    const syncClerkMetadata = async () => {
      try {
        setIsSyncing(true);
        const metadata = (user.unsafeMetadata || {}) as { watchHistory?: WatchHistoryItem[] };
        const clerkHistory: WatchHistoryItem[] = Array.isArray(metadata.watchHistory)
          ? metadata.watchHistory
          : [];

        const localItems = getLocalHistory();

        if (localItems.length > 0 && !hasMigratedRef.current) {
          hasMigratedRef.current = true;
          // Merge local history with Clerk history
          const mergedMap = new Map<string, WatchHistoryItem>();

          // Add Clerk items first
          clerkHistory.forEach((item) => {
            const key = `${item.media_type}_${item.id}_${item.season || 0}_${item.episode || 0}`;
            mergedMap.set(key, item);
          });

          // Merge local items if newer or missing
          localItems.forEach((localItem) => {
            const key = `${localItem.media_type}_${localItem.id}_${localItem.season || 0}_${localItem.episode || 0}`;
            const existing = mergedMap.get(key);
            if (!existing || (localItem.lastWatched || 0) > (existing.lastWatched || 0)) {
              mergedMap.set(key, localItem);
            }
          });

          const mergedList = Array.from(mergedMap.values())
            .sort((a, b) => (b.lastWatched || 0) - (a.lastWatched || 0))
            .slice(0, 50);

          setHistory(mergedList);
          saveLocalHistory(mergedList);

          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              watchHistory: mergedList,
            },
          });
        } else {
          setHistory(clerkHistory);
          saveLocalHistory(clerkHistory);
        }
      } catch (err) {
        console.error('Failed to fetch/sync watch history from Clerk:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    syncClerkMetadata();
  }, [isLoaded, isSignedIn, user]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setHistory(getLocalHistory());
      }
    };
    const handleCustom = () => {
      setHistory(getLocalHistory());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_KEY, handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_KEY, handleCustom);
    };
  }, []);

  // Add or update an item in watch history
  const addOrUpdateHistory = useCallback(
    async (item: Omit<WatchHistoryItem, 'lastWatched'> & { lastWatched?: number }) => {
      const currentList = getLocalHistory();
      const existing = currentList.find((h) =>
        matchesItem(h, item.id, item.media_type, item.season, item.episode)
      );

      const entry: WatchHistoryItem = {
        ...item,
        lastWatched: item.lastWatched || Date.now(),
        currentTime: item.currentTime ?? existing?.currentTime ?? 0,
        duration: item.duration ?? existing?.duration ?? 0,
        progress:
          item.progress ??
          existing?.progress ??
          (item.currentTime && item.duration && item.duration > 0
            ? Math.min(100, Math.round((item.currentTime / item.duration) * 100))
            : 0),
      };

      const filtered = currentList.filter(
        (h) => !matchesItem(h, item.id, item.media_type, item.season, item.episode)
      );

      const updated = [entry, ...filtered].slice(0, 50);
      setHistory(updated);
      saveLocalHistory(updated);
      queueClerkSync(updated, false);
    },
    [queueClerkSync]
  );

  // High-performance progress updater for playback ticks
  const updateProgress = useCallback(
    async (
      id: number,
      mediaType: 'movie' | 'tv',
      currentTime: number,
      duration?: number,
      season?: number,
      episode?: number
    ) => {
      const currentList = getLocalHistory();
      const targetIndex = currentList.findIndex((h) =>
        matchesItem(h, id, mediaType, season, episode)
      );

      if (targetIndex === -1) {
        // If not yet in list, do nothing or wait for details
        return;
      }

      const existing = currentList[targetIndex];
      const validDuration = duration && duration > 0 ? duration : existing.duration || 0;
      const progressPercent =
        validDuration > 0
          ? Math.min(100, Math.round((currentTime / validDuration) * 100))
          : existing.progress || 0;

      const updatedItem: WatchHistoryItem = {
        ...existing,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(validDuration),
        progress: progressPercent,
        lastWatched: Date.now(),
      };

      // Move updated item to front of the list
      const remaining = currentList.filter((_, idx) => idx !== targetIndex);
      const updatedList = [updatedItem, ...remaining].slice(0, 50);

      setHistory(updatedList);
      saveLocalHistory(updatedList);
      queueClerkSync(updatedList, false);
    },
    [queueClerkSync]
  );

  // Retrieve progress/history item for a specific media
  const getHistoryItem = useCallback(
    (id: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      return history.find((h) => matchesItem(h, id, mediaType, season, episode));
    },
    [history]
  );

  // Remove single item from history
  const removeHistoryItem = useCallback(
    async (id: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      const currentList = getLocalHistory();
      const updated = currentList.filter(
        (h) => !matchesItem(h, id, mediaType, season, episode)
      );
      setHistory(updated);
      saveLocalHistory(updated);
      queueClerkSync(updated, true);
    },
    [queueClerkSync]
  );

  // Clear all watch history
  const clearHistory = useCallback(async () => {
    setHistory([]);
    saveLocalHistory([]);
    if (isSignedIn && user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            watchHistory: [],
          },
        });
      } catch (err) {
        console.error('Failed to clear Clerk watch history metadata:', err);
      }
    }
  }, [isSignedIn, user]);

  return (
    <WatchHistoryContext.Provider
      value={{
        history,
        addOrUpdateHistory,
        updateProgress,
        getHistoryItem,
        removeHistoryItem,
        clearHistory,
        isSyncing,
      }}
    >
      {children}
    </WatchHistoryContext.Provider>
  );
};

export function useWatchHistory() {
  const context = useContext(WatchHistoryContext);
  if (!context) {
    throw new Error('useWatchHistory must be used within a WatchHistoryProvider');
  }
  return context;
}
