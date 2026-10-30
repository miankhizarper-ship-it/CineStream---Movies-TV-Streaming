import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { TMDBMedia } from '../lib/tmdb';

export interface BookmarkItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  savedAt: number;
}

export interface WatchlistContextType {
  watchlist: BookmarkItem[];
  bookmarks: BookmarkItem[]; // Alias for backward compatibility
  isBookmarked: (id: number, mediaType?: 'movie' | 'tv') => boolean;
  toggleWatchlist: (media: TMDBMedia, forcedType?: 'movie' | 'tv') => Promise<boolean>;
  toggleBookmark: (media: TMDBMedia, forcedType?: 'movie' | 'tv') => Promise<boolean>;
  removeFromWatchlist: (id: number, mediaType: 'movie' | 'tv') => Promise<void>;
  removeBookmark: (id: number, mediaType: 'movie' | 'tv') => Promise<void>;
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

          // Persist to Clerk user unsafeMetadata
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              watchlist: mergedList,
            },
          });
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
    (id: number, mediaType?: 'movie' | 'tv') => {
      return watchlist.some(
        (b) => b.id === id && (!mediaType || b.media_type === mediaType)
      );
    },
    [watchlist]
  );

  // Toggle saving to watchlist
  const toggleWatchlist = useCallback(
    async (media: TMDBMedia, forcedType?: 'movie' | 'tv'): Promise<boolean> => {
      // 1. Guest Mode Check: Require authentication
      if (!isSignedIn || !user) {
        openSignInForWatchlist();
        return false;
      }

      const mediaType: 'movie' | 'tv' =
        forcedType ||
        (media.media_type === 'tv' || media.first_air_date || media.number_of_seasons ? 'tv' : 'movie');

      const existingIndex = watchlist.findIndex(
        (b) => b.id === media.id && b.media_type === mediaType
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
          poster_path: media.poster_path,
          backdrop_path: media.backdrop_path,
          vote_average: media.vote_average,
          release_date: media.release_date,
          first_air_date: media.first_air_date,
          overview: media.overview,
          savedAt: Date.now(),
        };
        updatedList = [newItem, ...watchlist];
        isNowSaved = true;
      }

      // Optimistic update
      setWatchlist(updatedList);
      saveLocalWatchlist(updatedList);

      // Async write to Clerk user unsafeMetadata
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            watchlist: updatedList,
          },
        });
      } catch (err) {
        console.error('Failed to update Clerk watchlist metadata:', err);
      }

      return isNowSaved;
    },
    [isSignedIn, user, watchlist, openSignInForWatchlist]
  );

  // Remove single item
  const removeFromWatchlist = useCallback(
    async (id: number, mediaType: 'movie' | 'tv') => {
      const updatedList = watchlist.filter(
        (b) => !(b.id === id && b.media_type === mediaType)
      );
      setWatchlist(updatedList);
      saveLocalWatchlist(updatedList);

      if (isSignedIn && user) {
        try {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              watchlist: updatedList,
            },
          });
        } catch (err) {
          console.error('Failed to remove item from Clerk metadata:', err);
        }
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
