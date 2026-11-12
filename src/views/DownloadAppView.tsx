import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  Sparkles,
  Maximize2,
  Laptop,
  Monitor,
  Cpu,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useRouter } from '../context/RouterContext';
import { ImageViewerModal, ImageViewerItem } from '../components/ImageViewerModal';
import { DesktopInstallModal } from '../components/DesktopInstallModal';

interface AppScreenshot {
  id: string;
  title: string;
  subtitle: string;
  imagePath: string;
}

// Android App Screenshots (Vertical / Mobile Aspect)
const ANDROID_SCREENSHOTS: AppScreenshot[] = [
  {
    id: 'android-home',
    title: 'Home & Spotlight',
    subtitle: 'Immersive cinematic hero banner with trending highlights and quick actions',
    imagePath: '/assets/aistudio/CineStream Home & Spotlight.png',
  },
  {
    id: 'android-details',
    title: 'Title Details & Overview',
    subtitle: 'Comprehensive overview, cast list, and recommendations',
    imagePath: '/assets/aistudio/Title Details & Overview.png',
  },
  {
    id: 'android-explore',
    title: 'Explore & Category Discovery',
    subtitle: 'Curated genres, release year filters, and trending movie catalogs',
    imagePath: '/assets/aistudio/Explore & Category Discovery.png',
  },
  {
    id: 'android-search',
    title: 'Instant Multi-Search',
    subtitle: 'Lightning-fast predictive search for titles, actors, and directors',
    imagePath: '/assets/aistudio/Instant Multi-Search.png',
  },
  {
    id: 'android-player',
    title: 'Ultra HD Video Player',
    subtitle: 'Immersive streaming player with theater dim mode and server switcher',
    imagePath: '/assets/aistudio/Ultra HD Video Player.png',
  },
  {
    id: 'android-episodes',
    title: 'Seasons & Episodes Selector',
    subtitle: 'Compact season tabs and episode lists with thumbnails and durations',
    imagePath: '/assets/aistudio/Seasons & Episodes Selector.png',
  },
  {
    id: 'android-watchlist',
    title: 'My Watchlist & Library',
    subtitle: 'Saved movie bookmarks and continue-watching history tracking',
    imagePath: '/assets/aistudio/My Watchlist & Library.png',
  },
];

// Windows Desktop App Screenshots (Horizontal / Landscape 16:9 Aspect)
const WINDOWS_SCREENSHOTS: AppScreenshot[] = [
  {
    id: 'windows-home',
    title: 'Home & Spotlight',
    subtitle: 'Full-width cinematic spotlight view designed for widescreen PC monitors',
    imagePath: '/assets/aistudio/home_b3b198ff.png',
  },
  {
    id: 'windows-details',
    title: 'Title Details & Overview',
    subtitle: 'Rich cast billing, movie overview, rating badges, and recommendations',
    imagePath: '/assets/aistudio/details_8dc1056d.png',
  },
  {
    id: 'windows-explore',
    title: 'Explore & Category Discovery',
    subtitle: 'Grid catalog with instant genre filters, sorting, and 4K media cards',
    imagePath: '/assets/aistudio/explore_4dddd803.png',
  },
  {
    id: 'windows-search',
    title: 'Instant Multi-Search',
    subtitle: 'Instant search grid results for movies, TV series, and creators',
    imagePath: '/assets/aistudio/search_8cdaf272.png',
  },
  {
    id: 'windows-player',
    title: 'Ultra HD Video Player',
    subtitle: 'Theater mode player with multi-server failover, resolution selector & hotkeys',
    imagePath: '/assets/aistudio/player_f77b264d.png',
  },
  {
    id: 'windows-episodes',
    title: 'Seasons & Episodes Selector',
    subtitle: 'Comprehensive episode grid and arc preview thumbnails with descriptions',
    imagePath: '/assets/aistudio/episode_692ff127.png',
  },
  {
    id: 'windows-watchlist',
    title: 'My Watchlist & Library',
    subtitle: 'Cloud-synced library across devices with quick bookmark management',
    imagePath: '/assets/aistudio/watchlist_c827db15.png',
  },
];

const ANDROID_RELEASE_URL =
  'https://github.com/miankhizarper-ship-it/CineStream---Movies-TV-Streaming/releases/download/1.0.14/cinestream.apk';

const WINDOWS_RELEASE_URL =
  'https://github.com/miankhizarper-ship-it/CineStream---Movies-TV-Streaming/releases/download/v1.0.4/CineStream-1.0.4-Setup.exe';

interface DownloadAppViewProps {
  platform: 'android' | 'windows';
}

export const DownloadAppView: React.FC<DownloadAppViewProps> = ({ platform }) => {
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [modalScreenshot, setModalScreenshot] = useState<ImageViewerItem | null>(null);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);

  const isAndroid = platform === 'android';
  const fileName = isAndroid ? 'cinestream.apk' : 'CineStream-1.0.4-Setup.exe';
  const fileUrl = isAndroid ? ANDROID_RELEASE_URL : WINDOWS_RELEASE_URL;
  const currentScreenshots = isAndroid ? ANDROID_SCREENSHOTS : WINDOWS_SCREENSHOTS;

  const handleDownload = () => {
    setDownloading(true);
    const msg = isAndroid
      ? 'Starting Android APK download (v1.0.14)...'
      : 'Starting Windows Installer (CineStream-1.0.4-Setup.exe) download...';
    showToast(msg, 'info');

    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', fileName);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      showToast(`${fileName} download initiated successfully!`, 'success');
    }, 2000);
  };

  const handlePlatformSwitch = (newPlatform: 'android' | 'windows') => {
    if (newPlatform === 'windows') {
      navigate('/download-app/windows');
    } else {
      navigate('/download-app');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 w-full pb-28 space-y-10">
      {/* Top Platform Selector Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12131a] p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e50914] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-rose-400">
              CineStream Official Releases
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Select Your Operating System
          </h1>
          <p className="text-xs text-slate-400">
            Choose between our high-performance Android APK and Windows Desktop Installer.
          </p>
        </div>

        {/* Platform Tabs Switcher */}
        <div className="flex items-center bg-black/55 p-1.5 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => handlePlatformSwitch('android')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAndroid
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/60 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android APK</span>
          </button>
          <button
            onClick={() => handlePlatformSwitch('windows')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isAndroid
                ? 'bg-[#e50914] text-white shadow-lg shadow-rose-950/60 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Windows (setup.exe)</span>
          </button>
        </div>
      </div>

      {/* Desktop PWA Quick Banner */}
      <div
        onClick={() => setDesktopModalOpen(true)}
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#12131e] via-[#0d0e15] to-[#140b0e] border border-white/[0.12] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group hover:border-rose-500/50 transition-all"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-500 mt-0.5 group-hover:scale-105 transition-transform">
            <Laptop className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-rose-400 uppercase tracking-wider text-[11px]">
                Instant Web App (PWA)
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                All Browsers
              </span>
            </div>
            <h3 className="text-base font-black text-white group-hover:text-rose-400 transition-colors">
              Looking for instant browser installation? Install PWA
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Add CineStream directly to your desktop or home screen without installer setup.
            </p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-xl bg-white/10 group-hover:bg-[#e50914] text-white text-xs font-bold transition-all shrink-0">
          Learn More
        </button>
      </div>

      <DesktopInstallModal isOpen={desktopModalOpen} onClose={() => setDesktopModalOpen(false)} />

      {/* Hero Header Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#181926] via-[#101119] to-[#07080a] p-6 sm:p-10 border border-white/[0.1] shadow-2xl shadow-black/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-900/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e50914]/20 border border-[#e50914]/40 text-rose-400 font-extrabold text-xs tracking-wider uppercase">
            {isAndroid ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            <span>{isAndroid ? 'Official Android Application' : 'Official Windows Desktop Release'}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
            CineStream <span className="text-[#e50914]">{isAndroid ? 'for Mobile & Tablet' : 'for Windows 10 & 11'}</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            {isAndroid
              ? 'Stream thousands of movies and TV series in 4K Ultra HD on your phone or tablet with zero ads, hardware-accelerated video player, and customized episode drawer navigation.'
              : 'Experience CineStream as a native Windows desktop app featuring borderless design, hardware-accelerated 60fps video decoding, global keyboard shortcuts, and offline watchlist syncing.'}
          </p>

          {/* Quick Specs Badges */}
          <div className="flex flex-wrap gap-2 text-xs text-slate-300 font-semibold pt-1">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAndroid ? 'v1.0.14 APK (Signed)' : 'v1.0.4 Setup.exe (64-bit)'}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              {isAndroid ? <Smartphone className="w-4 h-4 text-rose-400" /> : <Cpu className="w-4 h-4 text-blue-400" />}
              <span>{isAndroid ? 'Android 8.0+ Required' : 'Windows 10 / 11 (x64 / ARM64)'}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>GitHub Release Fast Download</span>
            </span>
          </div>

          {/* Download CTA Button */}
          <div className="pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#e50914] hover:bg-rose-500 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-950/80 active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? `Downloading ${fileName}...` : `Download ${fileName}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isAndroid ? (
          <>
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
          </>
        ) : (
          <>
            <div className="p-5 rounded-2xl bg-[#12131a] border border-white/[0.08] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-2">
                <Monitor className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Native Windows Window</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clean frameless window integration with custom titlebar controls, window minimize, maximize, and close buttons.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#12131a] border border-white/[0.08] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-2">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Hardware GPU Acceleration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated Direct3D / OpenGL hardware decoding for crystal clear 4K Ultra HD streaming without CPU spikes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#12131a] border border-white/[0.08] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Keyboard Shortcuts & Tray</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quick media hotkeys (Space to play/pause, F for fullscreen, M for mute) and system tray background controls.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Interactive App Screenshots Gallery (Android: Vertical Aspect | Windows: Horizontal Aspect) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight">
              <span className="w-1.5 h-4 bg-[#e50914] rounded-full inline-block" />
              {isAndroid ? 'Android App Interface Screenshots' : 'Windows Desktop App Interface Screenshots (Horizontal View)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAndroid
                ? 'Click any screenshot below to inspect the full mobile interface.'
                : 'Showing desktop screenshots in full horizontal widescreen aspect. Click any screenshot to open the preview.'}
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {currentScreenshots.length} Screenshots
          </span>
        </div>

        {/* Gallery Grid: Android uses 7-col vertical aspect; Windows uses horizontal widescreen cards */}
        {isAndroid ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {currentScreenshots.map((screen) => (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentScreenshots.map((screen) => (
              <button
                key={screen.id}
                onClick={() => setModalScreenshot(screen)}
                className="group text-left p-2.5 rounded-2xl bg-[#12131a] border border-white/[0.08] hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-950/40 transition-all cursor-pointer relative"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative mb-2.5 border border-white/5">
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
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {screen.subtitle}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen Lightbox Modal Preview Component */}
      <ImageViewerModal
        item={modalScreenshot ? { ...modalScreenshot, badge: isAndroid ? 'Android App View' : 'Windows Desktop View' } : null}
        onClose={() => setModalScreenshot(null)}
      />

      {/* Installation Guide */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#12131a] border border-white/[0.08] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-rose-400 font-black text-sm">
            ?
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              {isAndroid ? 'How to Install Android APK' : 'How to Install Windows Setup.exe'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAndroid
                ? 'Step-by-step process for sideloading the APK on your Android phone or tablet.'
                : 'Step-by-step process for running the installer and launching CineStream on Windows.'}
            </p>
          </div>
        </div>

        {isAndroid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">1</span>
              <h4 className="text-xs font-bold text-white">Download APK</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Tap download to save `cinestream.apk` v1.0.14 from GitHub.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">2</span>
              <h4 className="text-xs font-bold text-white">Open File Manager</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Locate `cinestream.apk` in your Downloads folder and tap it.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">3</span>
              <h4 className="text-xs font-bold text-white">Allow Unknown Sources</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Enable installation from trusted browser/file sources if prompted.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">4</span>
              <h4 className="text-xs font-bold text-white">Launch & Stream</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Tap Install, open CineStream, and enjoy ad-free 4K streaming.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">1</span>
              <h4 className="text-xs font-bold text-white">Download Setup.exe</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Click download to get `CineStream-1.0.4-Setup.exe` from GitHub release v1.0.4.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">2</span>
              <h4 className="text-xs font-bold text-white">Run Installer</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Double-click `CineStream-1.0.4-Setup.exe`. If Windows SmartScreen appears, click "More info" then "Run anyway".</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">3</span>
              <h4 className="text-xs font-bold text-white">Select Destination</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Choose installation folder (or keep default AppData) and create desktop shortcut.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e50914] text-white text-xs font-black flex items-center justify-center">4</span>
              <h4 className="text-xs font-bold text-white">Launch App</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Open CineStream from desktop shortcut or start menu and start streaming!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
