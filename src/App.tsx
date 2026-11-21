import React, { lazy, Suspense, useEffect, useState } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { ClerkBridgeProvider, useClerkAuth } from './context/ClerkBridgeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthModalProvider, useAuthModal } from './context/AuthModalContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { WatchHistoryProvider } from './context/WatchHistoryContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';

const ClerkAuthRuntime = lazy(() => import('./components/ClerkAuthRuntime'));
const PhantomGhost = lazy(() =>
  import('./components/PhantomGhost').then((m) => ({ default: m.PhantomGhost }))
);
const OfflineIndicator = lazy(() =>
  import('./components/OfflineIndicator').then((m) => ({ default: m.OfflineIndicator }))
);

// Route-level code splitting for non-home views
const DetailsView = lazy(() =>
  import('./views/DetailsView').then((m) => ({ default: m.DetailsView }))
);
const WatchPlayerView = lazy(() =>
  import('./views/WatchPlayerView').then((m) => ({ default: m.WatchPlayerView }))
);
const ExploreView = lazy(() =>
  import('./views/ExploreView').then((m) => ({ default: m.ExploreView }))
);
const SearchView = lazy(() =>
  import('./views/SearchView').then((m) => ({ default: m.SearchView }))
);
const PersonView = lazy(() =>
  import('./views/PersonView').then((m) => ({ default: m.PersonView }))
);
const MyListView = lazy(() =>
  import('./views/MyListView').then((m) => ({ default: m.MyListView }))
);
const DownloadAppView = lazy(() =>
  import('./views/DownloadAppView').then((m) => ({ default: m.DownloadAppView }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[75dvh] flex flex-col items-center justify-center gap-3 text-slate-400">
    <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
    <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Loading view...</span>
  </div>
);

const DeferredAuthGate: React.FC = () => {
  const { shouldLoadClerk, clerkReady, requestClerkLoad } = useClerkAuth();
  const { isOpen, closeAuthModal } = useAuthModal();
  const { route } = useRouter();

  // Trigger Clerk hydration when user visits protected/account routes or interacts
  useEffect(() => {
    if (route.type === 'mylist' || route.type === 'profile') {
      requestClerkLoad(false);
    }
  }, [route.type, requestClerkLoad]);

  useEffect(() => {
    if (shouldLoadClerk) return;

    const triggerLoad = () => {
      requestClerkLoad(false);
    };

    window.addEventListener('pointerdown', triggerLoad, { once: true, passive: true });
    window.addEventListener('keydown', triggerLoad, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', triggerLoad);
      window.removeEventListener('keydown', triggerLoad);
    };
  }, [shouldLoadClerk, requestClerkLoad]);

  return (
    <>
      {isOpen && !clerkReady && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={closeAuthModal}
          role="dialog"
          aria-modal="true"
          aria-label="Loading Sign In"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] rounded-2xl bg-[#0d0e14] border border-white/10 p-8 flex flex-col items-center gap-3 shadow-2xl"
          >
            <div className="w-7 h-7 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-300">Loading secure sign-in...</span>
          </div>
        </div>
      )}
      {shouldLoadClerk && (
        <Suspense fallback={null}>
          <ClerkAuthRuntime />
        </Suspense>
      )}
    </>
  );
};

const MainContent: React.FC = () => {
  const { route } = useRouter();
  const [mountGhost, setMountGhost] = useState(false);
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  const isWatchPage =
    route.type === 'watch-movie' ||
    route.type === 'watch-tv';

  // Only mount OfflineIndicator when user actually goes offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Defer desktop ambient ghost until after initial load + idle
  useEffect(() => {
    if (isWatchPage || typeof window === 'undefined' || window.innerWidth < 1024) {
      return;
    }

    let cancelled = false;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const scheduleMount = () => {
      if (cancelled) return;
      const win = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (typeof win.requestIdleCallback === 'function') {
        idleId = win.requestIdleCallback(
          () => {
            if (!cancelled) setMountGhost(true);
          },
          { timeout: 3500 }
        );
      } else {
        timerId = globalThis.setTimeout(() => {
          if (!cancelled) setMountGhost(true);
        }, 3500);
      }
    };

    if (document.readyState === 'complete') {
      scheduleMount();
    } else {
      window.addEventListener('load', scheduleMount, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', scheduleMount);
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }, [isWatchPage]);

  const renderView = () => {
    switch (route.type) {
      case 'home':
        return <HomeView />;
      case 'movie':
        return <DetailsView id={route.params.id || ''} mediaType="movie" />;
      case 'tv':
        return <DetailsView id={route.params.id || ''} mediaType="tv" />;
      case 'watch-movie':
        return <WatchPlayerView id={route.params.id || ''} mediaType="movie" />;
      case 'watch-tv':
        return (
          <WatchPlayerView
            id={route.params.id || ''}
            mediaType="tv"
            season={route.params.season}
            episode={route.params.episode}
          />
        );
      case 'explore':
        return <ExploreView initialType={route.params.mediaType === 'tv' ? 'tv' : 'movie'} />;
      case 'search':
        return <SearchView />;
      case 'person':
        return <PersonView id={route.params.id || ''} />;
      case 'mylist':
        return <MyListView />;
      case 'download-app':
        return <DownloadAppView platform={(route.params.platform as 'android' | 'windows') || 'android'} />;
      case 'profile':
        return <MyListView />;
      default:
        return <HomeView />;
    }
  };

  const hasHeroOrTopCover =
    route.type === 'home' ||
    route.type === 'movie' ||
    route.type === 'tv' ||
    route.type === 'person';

  return (
    <div className="flex flex-col min-h-[100dvh] w-full overflow-x-hidden bg-[#07080a] text-slate-100 antialiased selection:bg-[#e50914] selection:text-white">
      {!isWatchPage && <Navbar />}
      <main className={`flex-1 w-full relative ${!isWatchPage && !hasHeroOrTopCover ? 'mt-20 sm:mt-24' : ''}`}>
        <div className="w-full">
          {route.type === 'home' ? (
            <HomeView />
          ) : (
            <Suspense fallback={<RouteLoadingFallback />}>
              {renderView()}
            </Suspense>
          )}
        </div>
      </main>
      {!isWatchPage && <Footer />}
      {!isWatchPage && mountGhost && (
        <Suspense fallback={null}>
          <PhantomGhost />
        </Suspense>
      )}
      {isOffline && (
        <Suspense fallback={null}>
          <OfflineIndicator />
        </Suspense>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ClerkBridgeProvider>
      <ToastProvider>
        <AuthModalProvider>
          <WatchlistProvider>
            <WatchHistoryProvider>
              <RouterProvider>
                <MainContent />
                <DeferredAuthGate />
              </RouterProvider>
            </WatchHistoryProvider>
          </WatchlistProvider>
        </AuthModalProvider>
      </ToastProvider>
    </ClerkBridgeProvider>
  );
}

