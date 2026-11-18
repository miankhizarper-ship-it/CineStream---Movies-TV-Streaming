import React, { useEffect } from 'react';
import { SignIn, SignUp, useUser } from '@clerk/react';
import { dark } from '@clerk/ui/themes';
import { AnimatePresence, motion } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';

export const SignInModal: React.FC = () => {
  const { isOpen, mode, setMode, closeAuthModal } = useAuthModal();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };

    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeAuthModal]);

  if (!isOpen || (isLoaded && isSignedIn)) {
    return null;
  }

  const currentUrl =
    typeof window !== 'undefined' ? window.location.href : '/';

  const sharedAppearance = {
    theme: dark,
    variables: {
      colorPrimary: '#e50914',
      colorBackground: '#0d0e14',
      colorInput: '#161822',
      colorForeground: '#f8fafc',
      colorInputForeground: '#ffffff',
    },
    elements: {
      rootBox: 'w-full flex justify-center',
      cardBox: 'w-full shadow-none border-0 bg-transparent',
      card: 'w-full bg-transparent shadow-none border-0 px-5 pb-5 pt-2',
      footer: 'hidden',
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={mode === 'sign-in' ? 'Sign In to CineStream' : 'Create CineStream Account'}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[440px] max-h-[92dvh] overflow-y-auto rounded-2xl bg-[#0d0e14] border border-white/10 shadow-2xl shadow-black/95 text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/logo_1fdc68d7.png"
                    alt="CineStream"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-black tracking-tight text-white">
                  CINE<span className="text-[#e50914]">STREAM</span>
                </span>
              </div>

              <button
                onClick={closeAuthModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close sign in modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="px-5 pt-4">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#161822] border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setMode('sign-in')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'sign-in'
                      ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('sign-up')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'sign-up'
                      ? 'bg-[#e50914] text-white shadow-md shadow-rose-950/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Embedded Clerk Flow (virtual routing prevents off-domain redirects) */}
            {!isLoaded ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#e50914]" />
                <span className="text-xs font-medium">Loading secure sign-in...</span>
              </div>
            ) : mode === 'sign-in' ? (
              <SignIn
                routing="hash"
                withSignUp={true}
                fallbackRedirectUrl={currentUrl}
                oauthFlow="popup"
                appearance={sharedAppearance}
              />
            ) : (
              <SignUp
                routing="hash"
                fallbackRedirectUrl={currentUrl}
                oauthFlow="popup"
                appearance={sharedAppearance}
              />
            )}

            {/* Modal Footer Switcher */}
            <div className="px-5 pb-4 pt-2 border-t border-white/[0.06] text-center text-xs text-slate-400">
              {mode === 'sign-in' ? (
                <span>
                  New to CineStream?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('sign-up')}
                    className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    Create an account
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('sign-in')}
                    className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
