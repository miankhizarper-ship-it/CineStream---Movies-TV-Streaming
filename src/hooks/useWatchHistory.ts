import { useState, useEffect, useCallback } from 'react';

export interface WatchHistoryItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  season?: number;
  episode?: number;
  lastWatched: number;
  progress?: number; // 0 to 100 percentage
}

const STORAGE_KEY = 'cinestream_history';
const EVENT_KEY = 'cinestream_history_updated';

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => {
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
      setHistory(stored ? JSON.parse(stored) : []);
    } catch {
      setHistory([]);
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

  const addOrUpdateHistory = useCallback((item: Omit<WatchHistoryItem, 'lastWatched'>) => {
    try {
      const existing: WatchHistoryItem[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );
      
      const filtered = existing.filter(
        (h) => !(h.id === item.id && h.media_type === item.media_type)
      );

      const entry: WatchHistoryItem = {
        ...item,
        lastWatched: Date.now(),
      };

      const updated = [entry, ...filtered].slice(0, 50); // retain last 50
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistory(updated);
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch (err) {
      console.error('Failed to update watch history:', err);
    }
  }, []);

  const removeHistoryItem = useCallback((id: number, mediaType: 'movie' | 'tv') => {
    try {
      const existing: WatchHistoryItem[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );
      const updated = existing.filter(
        (h) => !(h.id === id && h.media_type === mediaType)
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistory(updated);
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch (err) {
      console.error('Failed to remove history item:', err);
    }
  }, []);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, []);

  return {
    history,
    addOrUpdateHistory,
    removeHistoryItem,
    clearHistory,
  };
}
