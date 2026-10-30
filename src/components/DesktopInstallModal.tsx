import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Monitor, Download, CheckCircle2, Sparkles, Laptop, Shield, Zap } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isInstalled } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const res = await install();
    if (res === 'accepted') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0f1016] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/90 text-white overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#e50914]/20 rounded-full blur-[90px] pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#e50914]/15 border border-[#e50914]/30 flex items-center justify-center text-rose-500 shrink-0">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 px-2 py-0.5 rounded-md bg-[#e50914]/10 border border-[#e50914]/20">
                  Desktop Web App (PWA)
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Standalone Ready
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mt-1">
                Install CineStream on Desktop
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Install CineStream as a standalone desktop application on Windows, macOS, or Linux. Enjoy a borderless, immersive theater experience with zero browser tabs, dedicated windowing, and instant dock launch.
          </p>

          {/* Key Advantages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-left">
              <Zap className="w-4 h-4 text-amber-400 mb-1.5" />
              <div className="text-xs font-bold text-white">Instant Launch</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Launches from Taskbar & Dock</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-left">
              <Laptop className="w-4 h-4 text-rose-400 mb-1.5" />
              <div className="text-xs font-bold text-white">Full Immersion</div>
              <div className="text-[11px] text-slate-400 mt-0.5">No URL bars or tab clutter</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-left">
              <Shield className="w-4 h-4 text-emerald-400 mb-1.5" />
              <div className="text-xs font-bold text-white">Offline Library</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Access bookmarks anywhere</div>
            </div>
          </div>

          {/* Installation Action */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>CineStream is already installed and running on your desktop!</span>
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#e50914] hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950/60 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install CineStream Desktop App</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>How to install via your desktop browser:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-[11px] sm:text-xs">
                  <li>
                    Look for the <strong>Install CineStream</strong> icon in your browser's address bar (at the far right of the URL bar).
                  </li>
                  <li>
                    Or open browser menu (<strong>⋮</strong> or <strong>⋯</strong>) &rarr; select <strong>Save and share</strong> / <strong>Apps</strong> &rarr; click <strong>Install CineStream</strong>.
                  </li>
                  <li>
                    On macOS Safari: Click <strong>File</strong> &rarr; <strong>Add to Dock...</strong>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Try Triggering Install Prompt</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
