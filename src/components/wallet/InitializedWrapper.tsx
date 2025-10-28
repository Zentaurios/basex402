'use client';

import { ReactNode, useEffect } from 'react';
import { useSignOut, useIsSignedIn } from '@coinbase/cdp-hooks';
import { useDisconnect, useAccount } from 'wagmi';

interface InitializedWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that allows CDP SDK to initialize in the background.
 * 
 * CDP automatically handles session persistence - it checks for existing
 * session tokens and restores them silently on mount. We don't need to
 * block the UI during this process.
 * 
 * The SDK will restore wallet state (isSignedIn, addresses, etc.) automatically
 * via its hooks once initialization completes. Components using CDP hooks
 * will re-render with the correct state.
 * 
 * For authenticated-only routes, add a loading check at the PAGE level,
 * not globally.
 */
export function InitializedWrapper({ children }: InitializedWrapperProps) {
  const { signOut } = useSignOut();
  const { isSignedIn } = useIsSignedIn();
  const { disconnect } = useDisconnect();
  const { isConnected: isWagmiConnected } = useAccount();
  
  // Check if user deliberately signed out and prevent auto-restore
  useEffect(() => {
    const checkForceSignout = async () => {
      try {
        const forceSignout = localStorage.getItem('cdp-force-signout') || 
                           sessionStorage.getItem('cdp-force-signout');
        
        if (forceSignout === 'true') {
          console.log('Force signout flag detected, preventing session restore');
          
          // Clear the flag
          localStorage.removeItem('cdp-force-signout');
          sessionStorage.removeItem('cdp-force-signout');
          
          // If CDP restored the session, sign out again
          if (isSignedIn) {
            console.log('CDP session was restored, signing out again');
            await signOut();
          }
          
          // If Wagmi has a connected wallet, disconnect it
          if (isWagmiConnected) {
            console.log('Wagmi wallet is connected, disconnecting');
            disconnect();
          }
          
          // Clear all CDP and wagmi storage again
          const storageKeys = [
            'cdp:session',
            'cdp:user',
            'cdp:wallet',
            'cdp:auth',
            'cdp-session',
            'cdp-user',
            'cdp-auth-token',
            'wagmi.store',
            'wagmi.cache',
            'wagmi.connected',
            'wagmi.wallet',
            'wagmi.recentConnectorId',
          ];
          
          storageKeys.forEach(key => {
            try {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
            } catch (e) {
              // Ignore
            }
          });
          
          // Clear any keys starting with 'cdp', 'wagmi', or '@w3m'
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('cdp') || key.startsWith('wagmi') || key.startsWith('@w3m')) {
                localStorage.removeItem(key);
              }
            });
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('cdp') || key.startsWith('wagmi') || key.startsWith('@w3m')) {
                sessionStorage.removeItem(key);
              }
            });
          } catch (e) {
            // Ignore
          }
        }
      } catch (e) {
        console.error('Error checking force signout:', e);
      }
    };
    
    // Run check after a brief delay to let CDP initialize
    const timer = setTimeout(checkForceSignout, 100);
    return () => clearTimeout(timer);
  }, [isSignedIn, isWagmiConnected, signOut, disconnect]);
  
  // CDP initializes in the background and restores sessions automatically
  // No need to block UI - just render children immediately
  return <>{children}</>;
}
