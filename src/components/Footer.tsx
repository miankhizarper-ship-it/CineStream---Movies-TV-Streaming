import React from 'react';
import { Film, Shield } from 'lucide-react';
import { useRouter } from '../context/RouterContext';

export const Footer: React.FC = () => {
  const { navigate, route } = useRouter();

  if (route.type === 'watch-movie' || route.type === 'watch-tv') {
    return null; // hide on player view for maximum cinematic immersion
  }

  return (
    <footer className="hidden md:block w-full bg-[#050608] border-t border-white/[0.08] py-12 px-6 md:px-12 mt-12 text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        {/* Brand statement */}
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-white mb-2.5">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden flex items-center justify-center bg-black/40">
              <img src="/assets/aistudio/logo_1fdc68d7.png" alt="CineStream Logo" className="w-full h-full object-cover" />
            </div>
            <span>CINE<span className="text-[#e50914]">STREAM</span></span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            A native-feel cinematic streaming platform delivering instant movie and TV exploration.
            Discover trending titles, browse curated genres, manage your personal watchlist, and stream with our embedded player.
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <h5 className="font-semibold text-slate-200 mb-2.5 uppercase tracking-wider text-[10px]">
              Explore
            </h5>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-white transition-colors"
                >
                  Featured Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/explore/movie')}
                  className="hover:text-white transition-colors"
                >
                  Popular Movies
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/explore/tv')}
                  className="hover:text-white transition-colors"
                >
                  Top TV Shows
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/categories')}
                  className="hover:text-white transition-colors"
                >
                  All Genres
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 mb-2.5 uppercase tracking-wider text-[10px]">
              Library & App
            </h5>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => navigate('/mylist')}
                  className="hover:text-white transition-colors"
                >
                  My Saved List
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/search')}
                  className="hover:text-white transition-colors"
                >
                  Search Database
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/download-app')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Android App (v1.0.0 APK)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">NEW</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 mb-2.5 uppercase tracking-wider text-[10px]">
              Attribution
            </h5>
            <p className="text-[11px] text-slate-500 leading-normal">
              Media metadata and imagery provided by{' '}
              <span className="text-slate-400">TMDB</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
        <div>
          © {new Date().getFullYear()} CineStream. Native Mobile-First Web Experience.
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#e50914]" />
          <span>FMOV Embedded Player</span>
        </div>
      </div>
    </footer>
  );
};
