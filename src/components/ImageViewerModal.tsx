import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ImageViewerItem {
  id: string;
  title: string;
  subtitle?: string;
  imagePath: string;
  badge?: string;
}

interface ImageViewerModalProps {
  item: ImageViewerItem | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ item, onClose }) => {
  // Prevent background scrolling when modal preview is open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && item) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-hidden"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center justify-center bg-[#12131a] border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20 cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image */}
            <div className="relative h-[55vh] sm:h-[60vh] w-auto aspect-[9/19] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl my-1">
              <img
                src={item.imagePath}
                alt={item.title}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Title & Description */}
            <div className="text-center mt-2 max-w-md space-y-0.5">
              {item.badge && (
                <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 inline-block mb-1">
                  {item.badge}
                </span>
              )}
              <h3 className="text-sm sm:text-base font-black text-white">{item.title}</h3>
              {item.subtitle && (
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed line-clamp-2">{item.subtitle}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
