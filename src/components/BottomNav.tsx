import React from 'react';
import { Home, Compass, Search, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from '../context/RouterContext';
import { useBookmarks } from '../hooks/useBookmarks';

export const BottomNav: React.FC = () => {
  const { route, navigate } = useRouter();
  const { bookmarks } = useBookmarks();

  // Hide the bottom nav automatically when watching videos on the WatchPlayerView
  if (route.type === 'watch-movie' || route.type === 'watch-tv') {
    return null;
  }

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: Home,
      isActive: route.type === 'home',
    },
    {
      id: 'explore',
      label: 'Explore',
      path: '/explore/movie',
      icon: Compass,
      isActive: route.type === 'explore' || route.type === 'categories',
    },
    {
      id: 'search',
      label: 'Search',
      path: '/search',
      icon: Search,
      isActive: route.type === 'search',
    },
    {
      id: 'mylist',
      label: 'My List',
      path: '/mylist',
      icon: Bookmark,
      isActive: route.type === 'mylist',
      badge: bookmarks.length > 0 ? bookmarks.length : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-[#07080a]/90 backdrop-blur-xl border-t border-white/10 pb-safe shadow-2xl">
      <div className="grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center h-full min-h-[48px] min-w-[40px] relative group text-center focus-visible:outline-none"
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    tab.isActive
                      ? 'text-[#e50914] stroke-[2.5]'
                      : tab.id === 'app'
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold rounded-full bg-[#e50914] text-white tabular-nums border border-[#07080a]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors duration-200 ${
                  tab.isActive
                    ? 'text-[#e50914] font-semibold'
                    : tab.id === 'app'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>

              {tab.isActive && (
                <motion.span
                  layoutId="bottomNavDot"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-[#e50914]"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
