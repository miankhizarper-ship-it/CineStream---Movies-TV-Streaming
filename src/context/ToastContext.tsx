import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Bookmark, Share2, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'bookmark' | 'share' | 'info' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'bookmark':
        return <Bookmark className="w-4 h-4 text-[#e50914] fill-[#e50914]" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-cyan-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-sky-400" />;
      case 'success':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-[#12131a]/90 backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-black/80 text-xs font-semibold text-slate-100"
            >
              <div className="p-1 rounded-lg bg-white/5 border border-white/10 shrink-0">
                {getIcon(toast.type)}
              </div>
              <span className="flex-1 line-clamp-2">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
