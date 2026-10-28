import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type RouteType =
  | 'home'
  | 'movie'
  | 'tv'
  | 'watch-movie'
  | 'watch-tv'
  | 'explore'
  | 'categories'
  | 'search'
  | 'person'
  | 'mylist'
  | 'download-app';

export interface RouteState {
  type: RouteType;
  params: {
    id?: string;
    season?: string;
    episode?: string;
    mediaType?: 'movie' | 'tv';
  };
  query: Record<string, string>;
  rawPath: string;
}

interface RouterContextType {
  route: RouteState;
  navigate: (path: string) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

function parsePath(fullPath: string): RouteState {
  const [pathname, search] = fullPath.split('?');
  const searchParams = new URLSearchParams(search || '');
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const segments = clean ? clean.split('/') : [];

  // /watch/movie/:id
  if (segments[0] === 'watch' && segments[1] === 'movie' && segments[2]) {
    return {
      type: 'watch-movie',
      params: { id: segments[2], mediaType: 'movie' },
      query,
      rawPath: fullPath,
    };
  }

  // /watch/tv/:id/:season/:episode
  if (segments[0] === 'watch' && segments[1] === 'tv' && segments[2]) {
    return {
      type: 'watch-tv',
      params: {
        id: segments[2],
        season: segments[3] || '1',
        episode: segments[4] || '1',
        mediaType: 'tv',
      },
      query,
      rawPath: fullPath,
    };
  }

  // /movie/:id
  if (segments[0] === 'movie' && segments[1]) {
    return {
      type: 'movie',
      params: { id: segments[1], mediaType: 'movie' },
      query,
      rawPath: fullPath,
    };
  }

  // /tv/:id
  if (segments[0] === 'tv' && segments[1]) {
    return {
      type: 'tv',
      params: { id: segments[1], mediaType: 'tv' },
      query,
      rawPath: fullPath,
    };
  }

  // /explore/:type
  if (segments[0] === 'explore') {
    return {
      type: 'explore',
      params: { mediaType: segments[1] === 'tv' ? 'tv' : 'movie' },
      query,
      rawPath: fullPath,
    };
  }

  // /categories
  if (segments[0] === 'categories') {
    return {
      type: 'categories',
      params: {},
      query,
      rawPath: fullPath,
    };
  }

  // /search
  if (segments[0] === 'search') {
    return {
      type: 'search',
      params: {},
      query,
      rawPath: fullPath,
    };
  }

  // /person/:id
  if (segments[0] === 'person' && segments[1]) {
    return {
      type: 'person',
      params: { id: segments[1] },
      query,
      rawPath: fullPath,
    };
  }

  // /mylist
  if (segments[0] === 'mylist') {
    return {
      type: 'mylist',
      params: {},
      query,
      rawPath: fullPath,
    };
  }

  // /download-app, /download, /apk
  if (segments[0] === 'download-app' || segments[0] === 'download' || segments[0] === 'apk') {
    return {
      type: 'download-app',
      params: {},
      query,
      rawPath: fullPath,
    };
  }

  // Default home
  return {
    type: 'home',
    params: {},
    query,
    rawPath: fullPath || '/',
  };
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search;
  });

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    if (path === window.location.pathname + window.location.search) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  }, [navigate]);

  const routeState = parsePath(currentPath);

  return (
    <RouterContext.Provider value={{ route: routeState, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
