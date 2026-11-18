import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/react';

export type AuthModalMode = 'sign-in' | 'sign-up';

interface AuthModalContextValue {
  isOpen: boolean;
  mode: AuthModalMode;
  openSignInModal: () => void;
  openSignUpModal: () => void;
  setMode: (mode: AuthModalMode) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>('sign-in');

  // Automatically close modal once authentication completes
  useEffect(() => {
    if (isLoaded && isSignedIn && isOpen) {
      setIsOpen(false);
    }
  }, [isLoaded, isSignedIn, isOpen]);

  const openSignInModal = useCallback(() => {
    setMode('sign-in');
    setIsOpen(true);
  }, []);

  const openSignUpModal = useCallback(() => {
    setMode('sign-up');
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        openSignInModal,
        openSignUpModal,
        setMode,
        closeAuthModal,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return ctx;
}
