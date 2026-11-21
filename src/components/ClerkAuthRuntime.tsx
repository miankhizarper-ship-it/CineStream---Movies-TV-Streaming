import React, { useEffect } from 'react';
import { ClerkProvider, UserButton, useUser } from '@clerk/react';
import { ui } from '@clerk/ui';
import { dark } from '@clerk/ui/themes';
import { Bookmark } from 'lucide-react';
import { useClerkAuth } from '../context/ClerkBridgeContext';
import { SignInModal } from './SignInModal';

const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_live_Y2xlcmsuY2luZXN0cmVhbXMubmV0JA';

const NavbarUserButton: React.FC<{ onMyListClick: () => void }> = ({ onMyListClick }) => (
  <UserButton
    appearance={{
      theme: dark,
      variables: {
        colorPrimary: '#e50914',
      },
      elements: {
        avatarBox:
          'w-8 h-8 xl:w-9 xl:h-9 rounded-full border border-white/20 hover:border-[#e50914] transition-all cursor-pointer shadow-md shadow-black/40',
        userButtonTrigger: 'focus:shadow-none focus:outline-none',
      },
    }}
  >
    <UserButton.MenuItems>
      <UserButton.Action
        label="My Watchlist"
        labelIcon={<Bookmark className="w-4 h-4 text-[#e50914]" />}
        onClick={onMyListClick}
      />
    </UserButton.MenuItems>
  </UserButton>
);

const ClerkStateSync: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { syncClerkState } = useClerkAuth();

  useEffect(() => {
    syncClerkState({
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      user: user || null,
      UserButtonSlot: NavbarUserButton,
    });
  }, [isLoaded, isSignedIn, user, syncClerkState]);

  return null;
};

const ClerkAuthRuntime: React.FC = () => {
  return (
    <ClerkProvider
      ui={ui}
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: '#e50914',
          colorBackground: '#0d0e14',
          colorInput: '#161822',
          colorForeground: '#f8fafc',
          colorInputForeground: '#ffffff',
        },
      }}
    >
      <ClerkStateSync />
      <SignInModal />
    </ClerkProvider>
  );
};

export default ClerkAuthRuntime;
