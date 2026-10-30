import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { RouterProvider, useRouter } from './context/RouterContext';
import { ToastProvider } from './context/ToastContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PhantomGhost } from './components/PhantomGhost';
import { OfflineIndicator } from './components/OfflineIndicator';

// Views
import { HomeView } from './views/HomeView';
import { DetailsView } from './views/DetailsView';
import { WatchPlayerView } from './views/WatchPlayerView';
import { ExploreView } from './views/ExploreView';
import { CategoriesView } from './views/CategoriesView';
import { SearchView } from './views/SearchView';
import { PersonView } from './views/PersonView';
import { MyListView } from './views/MyListView';
import { DownloadAppView } from './views/DownloadAppView';
import { ProfileView } from './views/ProfileView';

const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_b3B0aW1hbC1xdWFnZ2EtMzQ5NC5jbGVyay5hY2NvdW50cy5kZXYk';

const MainContent: React.FC = () => {
  const { route } = useRouter();

  const isWatchPage = route.type === 'watch-movie' || route.type === 'watch-tv';

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
        return <ExploreView initialType={route.params.mediaType || 'movie'} />;
      case 'categories':
        return <CategoriesView />;
      case 'search':
        return <SearchView />;
      case 'person':
        return <PersonView id={route.params.id || ''} />;
      case 'mylist':
        return <MyListView />;
      case 'download-app':
        return <DownloadAppView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full overflow-x-hidden bg-[#07080a] text-slate-100 antialiased selection:bg-[#e50914] selection:text-white">
      {!isWatchPage && <Navbar />}
      <main className={`flex-1 w-full relative ${!isWatchPage ? 'mt-20 sm:mt-24' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={route.rawPath}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full transform-gpu"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      {!isWatchPage && <Footer />}
      {!isWatchPage && <PhantomGhost />}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#e50914',
          colorBackground: '#0d0e14',
          colorInputBackground: '#161822',
          colorText: '#f8fafc',
          colorInputText: '#ffffff',
        },
      }}
    >
      <ToastProvider>
        <WatchlistProvider>
          <RouterProvider>
            <MainContent />
          </RouterProvider>
        </WatchlistProvider>
      </ToastProvider>
    </ClerkProvider>
  );
}
