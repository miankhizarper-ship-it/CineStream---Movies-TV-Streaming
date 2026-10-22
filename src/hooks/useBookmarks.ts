import { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEY = 'cinestream_bookmarks';
const EVENT_KEY = 'cinestream_bookmarks_updated';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const sync = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setBookmarks(stored ? JSON.parse(stored) : []);
    } catch {
      setBookmarks([]);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    const handleCustom = () => sync();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_KEY, handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_KEY, handleCustom);
    };
  }, [sync]);

  const isBookmarked = useCallback(
    (id: number, mediaType?: 'movie' | 'tv') => {
      return bookmarks.some(
        (b) => b.id === id && (!mediaType || b.media_type === mediaType)
      );
    },
    [bookmarks]
  );

  const toggleBookmark = useCallback((media: TMDBMedia, forcedType?: 'movie' | 'tv') => {
    try {
      const mediaType: 'movie' | 'tv' =
        forcedType ||
        (media.media_type === 'tv' || media.first_air_date || media.number_of_seasons ? 'tv' : 'movie');

      const existing: BookmarkItem[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );
      const index = existing.findIndex(
        (b) => b.id === media.id && b.media_type === mediaType
      );

      let updated: BookmarkItem[];
      if (index >= 0) {
        // remove
        updated = existing.filter((_, i) => i !== index);
      } else {
        // add
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
        updated = [newItem, ...existing];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setBookmarks(updated);
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch (err) {
      console.error('Failed to update bookmarks:', err);
    }
  }, []);

  const removeBookmark = useCallback((id: number, mediaType: 'movie' | 'tv') => {
    try {
      const existing: BookmarkItem[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );
      const updated = existing.filter(
        (b) => !(b.id === id && b.media_type === mediaType)
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setBookmarks(updated);
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  }, []);

  const clearBookmarks = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setBookmarks([]);
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch (err) {
      console.error('Failed to clear bookmarks:', err);
    }
  }, []);

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    clearBookmarks,
  };
}
