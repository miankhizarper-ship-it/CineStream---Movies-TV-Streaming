import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ClerkUserLike {
  id?: string;
  unsafeMetadata?: Record<string, any>;
  update?: (params: any) => Promise<any>;
}

export interface ClerkAuthBridgeValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: ClerkUserLike | null;
  clerkReady: boolean;
  shouldLoadClerk: boolean;
  pendingSignIn: boolean;
  requestClerkLoad: (openAfterLoad?: boolean) => void;
  clearPendingSignIn: () => void;
  UserButtonSlot: React.ComponentType<{ onMyListClick: () => void }> | null;
  syncClerkState: (next: {
    isLoaded: boolean;
    isSignedIn: boolean;
    user: ClerkUserLike | null;
    UserButtonSlot?: React.ComponentType<{ onMyListClick: () => void }> | null;
  }) => void;
}

function hasLikelyClerkSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem('cinestream_clerk_active') === '1') return true;
    if (document.cookie.includes('__session') || document.cookie.includes('__client_uat')) {
      return true;
    }
    if (window.location.pathname.startsWith('/mylist')) return true;
  } catch {
    // Ignore storage access errors
  }
  return false;
}

const ClerkBridgeContext = createContext<ClerkAuthBridgeValue>({
  isLoaded: false,
  isSignedIn: false,
  user: null,
  clerkReady: false,
  shouldLoadClerk: false,
  pendingSignIn: false,
  requestClerkLoad: () => {},
  clearPendingSignIn: () => {},
  UserButtonSlot: null,
  syncClerkState: () => {},
});

export const ClerkBridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldLoadClerk, setShouldLoadClerk] = useState<boolean>(() => hasLikelyClerkSession());
  const [pendingSignIn, setPendingSignIn] = useState(false);
  const [authState, setAuthState] = useState<{
    isLoaded: boolean;
    isSignedIn: boolean;
    user: ClerkUserLike | null;
    clerkReady: boolean;
    UserButtonSlot: React.ComponentType<{ onMyListClick: () => void }> | null;
  }>({
    isLoaded: false,
    isSignedIn: false,
    user: null,
    clerkReady: false,
    UserButtonSlot: null,
  });

  const requestClerkLoad = useCallback((openAfterLoad = false) => {
    setShouldLoadClerk(true);
    if (openAfterLoad) {
      setPendingSignIn(true);
    }
  }, []);

  const clearPendingSignIn = useCallback(() => {
    setPendingSignIn(false);
  }, []);

  const syncClerkState = useCallback(
    (next: {
      isLoaded: boolean;
      isSignedIn: boolean;
      user: ClerkUserLike | null;
      UserButtonSlot?: React.ComponentType<{ onMyListClick: () => void }> | null;
    }) => {
      try {
        if (next.isLoaded) {
          if (next.isSignedIn) {
            localStorage.setItem('cinestream_clerk_active', '1');
          } else {
            localStorage.removeItem('cinestream_clerk_active');
          }
        }
      } catch {
        // Ignore storage errors
      }
      setAuthState((prev) => ({
        isLoaded: next.isLoaded,
        isSignedIn: next.isSignedIn,
        user: next.user,
        clerkReady: true,
        UserButtonSlot: next.UserButtonSlot !== undefined ? next.UserButtonSlot : prev.UserButtonSlot,
      }));
    },
    []
  );

  return (
    <ClerkBridgeContext.Provider
      value={{
        ...authState,
        shouldLoadClerk,
        pendingSignIn,
        requestClerkLoad,
        clearPendingSignIn,
        syncClerkState,
      }}
    >
      {children}
    </ClerkBridgeContext.Provider>
  );
};

export function useClerkAuth() {
  return useContext(ClerkBridgeContext);
}
