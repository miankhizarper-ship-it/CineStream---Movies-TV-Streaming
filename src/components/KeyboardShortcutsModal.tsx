import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const shortcuts = [
    { key: '/', description: 'Focus live search bar' },
    { key: 'Esc', description: 'Close active modal, drawer, or search' },
    { key: '← / →', description: 'Navigate Hero carousel slides' },
    { key: '?', description: 'Toggle this keyboard shortcuts guide' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-md rounded-2xl bg-[#12131a] border border-white/10 p-6 shadow-2xl text-white relative"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-5 h-5 text-[#e50914]" />
                <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                aria-label="Close shortcuts modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {shortcuts.map((sc) => (
                <div
                  key={sc.key}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="text-xs text-slate-300">{sc.description}</span>
                  <kbd className="px-2 py-1 rounded bg-[#1a1c28] border border-white/10 text-xs font-mono font-bold text-[#e50914]">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#e50914] text-white text-xs font-bold hover:bg-rose-500 transition-colors"
              >
                Got It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
