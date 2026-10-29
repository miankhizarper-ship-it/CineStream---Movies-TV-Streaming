import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  Sparkles,
  Maximize2,
  Laptop,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ImageViewerModal, ImageViewerItem } from '../components/ImageViewerModal';

interface AppScreenshot {
  id: string;
  title: string;
  subtitle: string;
  imagePath: string;
}

const APP_SCREENSHOTS: AppScreenshot[] = [
  {
    id: 'screen1',
    title: 'CineStream Home & Spotlight',
    subtitle: 'Immersive cinematic hero banner with trending highlights and quick actions',
    imagePath: '/assets/aistudio/CineStream%20Home%20%26%20Spotlight.png',
  },
  {
    id: 'screen2',
    title: 'Explore & Category Discovery',
    subtitle: 'Curated genres, release year filters, and trending movie catalogs',
    imagePath: '/assets/aistudio/Explore%20%26%20Category%20Discovery.png',
  },
  {
    id: 'screen3',
    title: 'Instant Multi-Search',
    subtitle: 'Lightning-fast predictive search for titles, actors, and directors',
    imagePath: '/assets/aistudio/Instant%20Multi-Search.png',
  },
  {
    id: 'screen4',
    title: 'My Watchlist & Library',
    subtitle: 'Saved movie bookmarks and continue-watching history tracking',
    imagePath: '/assets/aistudio/My%20Watchlist%20%26%20Library.png',
  },
  {
    id: 'screen5',
    title: 'Title Details & Overview',
    subtitle: 'Comprehensive overview, cast list, and recommendations',
    imagePath: '/assets/aistudio/Title%20Details%20%26%20Overview.png',
  },
  {
    id: 'screen6',
    title: 'Seasons & Episodes Selector',
    subtitle: 'Compact season tabs and episode lists with thumbnails and durations',
    imagePath: '/assets/aistudio/Seasons%20%26%20Episodes%20Selector.png',
  },
  {
    id: 'screen7',
    title: 'Ultra HD Video Player',
    subtitle: 'Immersive streaming player with theater dim mode and server switcher',
    imagePath: '/assets/aistudio/Ultra%20HD%20Video%20Player.png',
  },
];

export const DownloadAppView: React.FC = () => {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [modalScreenshot, setModalScreenshot] = useState<ImageViewerItem | null>(null);
  const directApkUrl = '/apkfile/cinestream.apk';

  const handleDirectDownload = () => {
    setDownloading(true);
    showToast('Starting Android APK download...', 'info');

    const link = document.createElement('a');
    link.href = directApkUrl;
    link.download = 'cinestream.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 w-full pb-28 space-y-10">
      {/* Desktop Notice Banner */}
      <div className="hidden lg:flex items-center justify-between p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-semibold gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-amber-300 uppercase tracking-wider text-xs block mb-0.5">
              Mobile & Tablet Device Notice
            </span>
            <p className="text-amber-200/90 font-medium">
              The CineStream Android APK is designed for Android phones and tablets. Please visit this page on your mobile device or tablet for the optimal experience.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#181926] via-[#101119] to-[#07080a] p-6 sm:p-10 border border-white/[0.1] shadow-2xl shadow-black/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-900/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e50914]/20 border border-[#e50914]/40 text-rose-400 font-extrabold text-xs tracking-wider uppercase">
            <Smartphone className="w-4 h-4" />
            <span>Official Android Application</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
            CineStream <span className="text-[#e50914]">for Mobile & Tablet</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Stream thousands of movies and TV series in 4K Ultra HD on your phone or tablet with zero ads, hardware-accelerated video player, and customized episode drawer navigation.
          </p>

          {/* Quick Specs Badges */}
          <div className="flex flex-wrap gap-2 text-xs text-slate-300 font-semibold pt-1">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>v1.0.0 APK</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Smartphone className="w-4 h-4 text-rose-400" />
              <span>Android 8.0+ Required</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Direct Fast Download</span>
            </span>
          </div>

          {/* Direct APK Download Button */}
          <div className="pt-2">
            <button
              onClick={handleDirectDownload}
              disabled={downloading}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#e50914] hover:bg-rose-500 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-950/80 active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? 'Downloading APK...' : 'Download cinestream.apk'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#12131a] border border-white/[0.08] space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-rose-400 mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Ultra-Fast Playback</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hardware acceleration delivers instant buffering and 60fps video playback on Android phones & tablets.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131a] border border-white/[0.08] space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Theater Dim & Controls</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Custom streaming player controls with ambient blackout dim mode and slide-up episode selector.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131a] border border-white/[0.08] space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">100% Free Mobile App</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No sign-up required, no popups, and no fees. Save titles locally to your watchlist.
          </p>
        </div>
      </div>

      {/* Interactive App Screenshots Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight">
              <span className="w-1.5 h-4 bg-[#e50914] rounded-full inline-block" />
              App Interface Screenshots
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any image below to view its full high-resolution preview with title details.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {APP_SCREENSHOTS.length} Screenshots
          </span>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {APP_SCREENSHOTS.map((screen) => (
            <button
              key={screen.id}
              onClick={() => setModalScreenshot(screen)}
              className="group text-left p-2 rounded-2xl bg-[#12131a] border border-white/[0.08] hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-950/40 transition-all cursor-pointer relative"
            >
              <div className="aspect-[9/16] w-full rounded-xl overflow-hidden bg-black relative mb-2">
                <img
                  src={screen.imagePath}
                  alt={screen.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                  <div className="w-8 h-8 rounded-full bg-[#e50914] flex items-center justify-center shadow-lg">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                {screen.title}
              </h4>
            </button>
          ))}
        </div>
      </div>

      {/* Full-Screen Lightbox Modal Preview Component */}
      <ImageViewerModal
        item={modalScreenshot ? { ...modalScreenshot, badge: 'Android App View' } : null}
        onClose={() => setModalScreenshot(null)}
      />

      {/* How to Install APK Guide */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#12131a] border border-white/[0.08] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-rose-400 font-black text-sm">
            ?
          </div>
          <div>
            <h2 className="text-base font-black text-white">How to Install on Android</h2>
            <p className="text-xs text-slate-400">Step-by-step process for installing the APK on your phone or tablet.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-white">Download APK</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tap the download button to download `cinestream.apk`.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-white">Open Downloads</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Open Downloads or Files on your phone and tap the downloaded APK.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-white">Allow Installation</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enable "Allow installation from unknown sources" if prompted by Android.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">
              4
            </span>
            <h4 className="text-xs font-bold text-white">Launch & Enjoy</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tap Install, open CineStream, and enjoy streaming!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
