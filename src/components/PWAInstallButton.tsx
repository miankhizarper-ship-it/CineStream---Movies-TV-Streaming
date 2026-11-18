import React, { useState } from 'react';
import { Download, Monitor, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DesktopInstallModal } from './DesktopInstallModal';

interface PWAInstallButtonProps {
  variant?: 'nav-desktop' | 'nav-mobile' | 'hero' | 'footer';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav-desktop',
  className = '',
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already running in standalone PWA window, don't show prompt
  if (isInstalled) {
    if (variant === 'nav-desktop' || variant === 'nav-mobile') {
      return null;
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Installed as App</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'manual') {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  if (variant === 'nav-desktop') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#e50914] text-slate-200 hover:text-white border border-white/10 hover:border-transparent text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap group shrink-0 ${className}`}
          title="Install CineStream Desktop Web App"
        >
          <Monitor className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors shrink-0" />
          <span className="hidden xl:inline 2xl:hidden">Install App</span>
          <span className="hidden 2xl:inline">Install Web App</span>
        </button>
        <DesktopInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (variant === 'nav-mobile') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-[#e50914]/20 to-rose-950/20 border border-[#e50914]/40 text-white font-semibold text-sm transition-all cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-rose-400" />
            <span>Install CineStream App</span>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#e50914] text-white">
            PWA
          </span>
        </button>
        <DesktopInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (variant === 'footer') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer ${className}`}
        >
          <Monitor className="w-4 h-4 text-rose-500" />
          <span>Install Desktop Web App</span>
        </button>
        <DesktopInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // default / hero
  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#e50914] hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/60 active:scale-95 transition-all cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Install Desktop Web App</span>
      </button>
      <DesktopInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
