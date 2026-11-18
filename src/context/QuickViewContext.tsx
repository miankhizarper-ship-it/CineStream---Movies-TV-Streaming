import React, { createContext, useContext, useState, useCallback } from 'react';

interface QuickViewContextType {
  isWatchlistPanelOpen: boolean;
  openWatchlistPanel: () => void;
  closeWatchlistPanel: () => void;
}

const QuickViewContext = createContext<QuickViewContextType | null>(null);

export const QuickViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWatchlistPanelOpen, setIsWatchlistPanelOpen] = useState(false);

  const openWatchlistPanel = useCallback(() => {
    setIsWatchlistPanelOpen(true);
  }, []);

  const closeWatchlistPanel = useCallback(() => {
    setIsWatchlistPanelOpen(false);
  }, []);

  return (
    <QuickViewContext.Provider
      value={{
        isWatchlistPanelOpen,
        openWatchlistPanel,
        closeWatchlistPanel,
      }}
    >
      {children}
    </QuickViewContext.Provider>
  );
};

export function useQuickView() {
  const context = useContext(QuickViewContext);
  if (!context) {
    throw new Error('useQuickView must be used within a QuickViewProvider');
  }
  return context;
}

