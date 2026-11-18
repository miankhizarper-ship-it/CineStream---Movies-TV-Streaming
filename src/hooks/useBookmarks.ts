import { useWatchlist, BookmarkItem } from '../context/WatchlistContext';

export type { BookmarkItem };

export function useBookmarks() {
  return useWatchlist();
}
