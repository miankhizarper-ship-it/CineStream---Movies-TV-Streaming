import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { TMDBMedia } from '../lib/tmdb';

export interface BookmarkItem {
  id: number | string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  savedAt: number;
  isAnime?: boolean;
}

export interface WatchlistContextType {
  watchlist: BookmarkItem[];
  bookmarks: BookmarkItem[]; // Alias for backward compatibility
  isBookmarked: (id: number | string, mediaType?: 'movie' | 'tv' | 'anime') => boolean;
  toggleWatchlist: (media: any, forcedType?: 'movie' | 'tv' | 'anime') => Promise<boolean>;
  toggleBookmark: (media: any, forcedType?: 'movie' | 'tv' | 'anime') => Promise<boolean>;
  removeFromWatchlist: (id: number | string, mediaType?: 'movie' | 'tv' | 'anime') => Promise<void>;
  removeBookmark: (id: number | string, mediaType?: 'movie' | 'tv' | 'anime') => Promise<void>;
  clearWatchlist: () => Promise<void>;
  clearBookmarks: () => Promise<void>;
  isSyncing: boolean;
  openSignInForWatchlist: () => void;
}

const STORAGE_KEY = 'cinestream_bookmarks';
const EVENT_KEY = 'cinestream_bookmarks_updated';

const WatchlistContext = createContext<WatchlistContextType | null>(null);

function getLocalWatchlist(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWatchlist(items: BookmarkItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (err) {
    console.error('Failed to write local watchlist:', err);
  }
}

function prepareClerkWatchlist(list: BookmarkItem[]): BookmarkItem[] {
  let trimmed: BookmarkItem[] = list.map((item) => ({
    id: item.id,
    media_type: item.media_type,
    title: item.title ? item.title.slice(0, 35) : 'Untitled',
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    savedAt: item.savedAt,
  }));

  if (trimmed.length > 20) {
    trimmed = trimmed.slice(0, 20);
  }

  while (JSON.stringify(trimmed).length > 3500 && trimmed.length > 2) {
    trimmed.pop();
  }

  return trimmed;
}

const syncToClerk = async (userObj: any, list: BookmarkItem[]) => {
  if (!userObj) return;
  try {
    const existing = { ...(userObj.unsafeMetadata || {}) };
    delete existing.watchlist;
    await userObj.update({
      unsafeMetadata: {
        ...existing,
        watchlist: prepareClerkWatchlist(list),
      },
    });
  } catch (err) {
    console.warn('Clerk metadata sync limit notice:', err);
  }
};

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const [watchlist, setWatchlist] = useState<BookmarkItem[]>(() => getLocalWatchlist());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const hasMigratedRef = useRef(false);

  // Sync state with Clerk user metadata when authenticated, with local storage migration
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      // Guest mode - load from localStorage
      setWatchlist(getLocalWatchlist());
      hasMigratedRef.current = false;
      return;
    }

    // Authenticated Mode:
    const syncClerkMetadata = async () => {
      try {
        setIsSyncing(true);
        const metadata = (user.unsafeMetadata || {}) as { watchlist?: BookmarkItem[] };
        const clerkWatchlist: BookmarkItem[] = Array.isArray(metadata.watchlist)
          ? metadata.watchlist
          : [];

        // Check if there are local storage items to migrate / merge
        const localItems = getLocalWatchlist();

        if (localItems.length > 0 && !hasMigratedRef.current) {
          hasMigratedRef.current = true;
          // Merge local items with Clerk items (deduplicated by id + media_type)
          const mergedMap = new Map<string, BookmarkItem>();

          // Put Clerk items first
          clerkWatchlist.forEach((item) => {
            mergedMap.set(`${item.media_type}_${item.id}`, item);
          });

          // Merge local items if not already present
          localItems.forEach((item) => {
            const key = `${item.media_type}_${item.id}`;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, item);
            }
          });

          const mergedList = Array.from(mergedMap.values()).sort(
            (a, b) => (b.savedAt || 0) - (a.savedAt || 0)
          );

          // Update state immediately for instant feedback
          setWatchlist(mergedList);
          saveLocalWatchlist(mergedList);

          // Persist to Clerk user unsafeMetadata safely
          await syncToClerk(user, mergedList);
        } else {
          // If no migration needed or already migrated, populate from Clerk metadata
          setWatchlist(clerkWatchlist);
          saveLocalWatchlist(clerkWatchlist);
        }
      } catch (err) {
        console.error('Failed to sync watchlist with Clerk metadata:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    syncClerkMetadata();
  }, [isLoaded, isSignedIn, user]);

  // Open sign in prompt for guest watchlist actions
  const openSignInForWatchlist = useCallback(() => {
    try {
      openSignIn({
        appearance: {
          variables: {
            colorPrimary: '#e50914',
          },
        },
      });
    } catch (err) {
      console.warn('Could not open Clerk sign-in modal:', err);
    }
  }, [openSignIn]);

  // Check if a media is saved
  const isBookmarked = useCallback(
    (id: number | string, mediaType?: 'movie' | 'tv' | 'anime') => {
      return watchlist.some(
        (b) => String(b.id) === String(id) && (!mediaType || b.media_type === mediaType || (mediaType === 'anime' && b.isAnime))
      );
    },
    [watchlist]
  );

  // Toggle saving to watchlist
  const toggleWatchlist = useCallback(
    async (media: any, forcedType?: 'movie' | 'tv' | 'anime'): Promise<boolean> => {
      // 1. Guest Mode Check: Require authentication
      if (!isSignedIn || !user) {
        openSignInForWatchlist();
        return false;
      }

      const isAnime = Boolean(media.isAnime || forcedType === 'anime' || media.media_type === 'anime');
      const mediaType: 'movie' | 'tv' | 'anime' =
        forcedType || (isAnime ? 'anime' : (media.media_type === 'tv' || media.first_air_date || media.number_of_seasons ? 'tv' : 'movie'));

      const existingIndex = watchlist.findIndex(
        (b) => String(b.id) === String(media.id) && (b.media_type === mediaType || (isAnime && (b.isAnime || b.media_type === 'anime')))
      );

      let updatedList: BookmarkItem[];
      let isNowSaved = false;

      if (existingIndex >= 0) {
        // Remove item
        updatedList = watchlist.filter((_, i) => i !== existingIndex);
        isNowSaved = false;
      } else {
        // Add new item
        const newItem: BookmarkItem = {
          id: media.id,
          media_type: mediaType,
          title: media.title || media.name || 'Untitled',
          poster_path: media.poster_path || media.image || null,
          backdrop_path: media.backdrop_path || media.bannerImage || media.poster_path || media.image || null,
          vote_average: typeof media.vote_average === 'number' ? media.vote_average : 8.0,
          release_date: media.release_date || media.first_air_date,
          first_air_date: media.first_air_date || media.release_date,
          overview: media.overview,
          savedAt: Date.now(),
          isAnime: isAnime || mediaType === 'anime',
        };
        updatedList = [newItem, ...watchlist];
        isNowSaved = true;
      }

      // Optimistic update
      setWatchlist(updatedList);
      saveLocalWatchlist(updatedList);

      // Async write to Clerk user unsafeMetadata safely
      await syncToClerk(user, updatedList);

      return isNowSaved;
    },
    [isSignedIn, user, watchlist, openSignInForWatchlist]
  );

  // Remove single item
  const removeFromWatchlist = useCallback(
    async (id: number | string, mediaType?: 'movie' | 'tv' | 'anime') => {
      const updatedList = watchlist.filter(
        (b) => !(String(b.id) === String(id) && (!mediaType || b.media_type === mediaType))
      );
      setWatchlist(updatedList);
      saveLocalWatchlist(updatedList);

      if (isSignedIn && user) {
        await syncToClerk(user, updatedList);
      }
    },
    [isSignedIn, user, watchlist]
  );

  // Clear all items
  const clearWatchlist = useCallback(async () => {
    setWatchlist([]);
    saveLocalWatchlist([]);

    if (isSignedIn && user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            watchlist: [],
          },
        });
      } catch (err) {
        console.error('Failed to clear Clerk metadata watchlist:', err);
      }
    }
  }, [isSignedIn, user]);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        bookmarks: watchlist,
        isBookmarked,
        toggleWatchlist,
        toggleBookmark: toggleWatchlist,
        removeFromWatchlist,
        removeBookmark: removeFromWatchlist,
        clearWatchlist,
        clearBookmarks: clearWatchlist,
        isSyncing,
        openSignInForWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
