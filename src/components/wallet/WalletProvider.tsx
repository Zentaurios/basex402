'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useIsSignedIn, useEvmAddress, useCurrentUser } from '@coinbase/cdp-hooks';
import { useAccount, useDisconnect } from 'wagmi';

type WalletContextType = {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  isConnected: boolean;
  address: string | undefined;
  eoaAddress: string | undefined;  // EOA address for x402 payments
  smartAccountAddress: string | undefined;  // Smart account for display
  walletType: 'embedded' | 'external' | null;
  customDisconnect: () => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [forceDisconnected, setForceDisconnected] = useState(false);
  const [lastActiveWalletType, setLastActiveWalletType] = useState<'embedded' | 'external' | null>(null);
  const [blockWagmiReconnect, setBlockWagmiReconnect] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // CDP Embedded Wallet state
  const { isSignedIn: isCdpSignedIn } = useIsSignedIn();
  const { evmAddress: cdpAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  
  // Get EOA owner address from CDP (the actual owner of the smart account)
  const cdpEoaAddress = currentUser?.evmAccounts?.[0];
  
  // Wagmi External Wallet state
  const { isConnected: isWagmiConnected, address: wagmiAddress } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Initialize: Check for cross-contamination on mount
  useEffect(() => {
    if (!hasInitialized) {
      // If CDP wallet is active and wagmi is also connected, disconnect wagmi
      if (cdpAddress && isCdpSignedIn && isWagmiConnected) {
        setBlockWagmiReconnect(true);
        disconnect();
      }
      
      setHasInitialized(true);
    }
  }, [hasInitialized, cdpAddress, isCdpSignedIn, isWagmiConnected, disconnect]);
  
  // Track active wallet type changes
  useEffect(() => {
    if (isWagmiConnected && wagmiAddress) {
      if (lastActiveWalletType !== 'external') {
        setLastActiveWalletType('external');
        setForceDisconnected(false);
      }
    } else if (cdpAddress && isCdpSignedIn) {
      if (lastActiveWalletType !== 'embedded') {
        setLastActiveWalletType('embedded');
        setForceDisconnected(false);
      }
    } else if (lastActiveWalletType !== null) {
      setLastActiveWalletType(null);
    }
  }, [isWagmiConnected, wagmiAddress, cdpAddress, isCdpSignedIn, lastActiveWalletType]);
  
  // Determine active wallet and address
  let address: string | undefined;
  let eoaAddress: string | undefined;
  let smartAccountAddress: string | undefined;
  let walletType: 'embedded' | 'external' | null;
  let isConnected: boolean;
  
  // If force disconnected, ignore wagmi state completely
  if (forceDisconnected) {
    // Only consider CDP wallet
    if (cdpAddress && isCdpSignedIn) {
      address = cdpAddress;  // Display address (smart account)
      eoaAddress = cdpEoaAddress;  // EOA for payments
      smartAccountAddress = cdpAddress;
      walletType = 'embedded';
      isConnected = true;
    } else {
      address = undefined;
      eoaAddress = undefined;
      smartAccountAddress = undefined;
      walletType = null;
      isConnected = false;
    }
  } else {
    // Normal flow - check wagmi first, then CDP
    if (wagmiAddress && isWagmiConnected) {
      // For external wallets, address and EOA are the same
      address = wagmiAddress;
      eoaAddress = wagmiAddress;
      smartAccountAddress = undefined;
      walletType = 'external';
      isConnected = true;
    } else if (cdpAddress && isCdpSignedIn) {
      // For CDP wallets, separate smart account and EOA
      address = cdpAddress;  // Display address (smart account)
      eoaAddress = cdpEoaAddress;  // EOA for payments
      smartAccountAddress = cdpAddress;
      walletType = 'embedded';
      isConnected = true;
    } else {
      address = undefined;
      eoaAddress = undefined;
      smartAccountAddress = undefined;
      walletType = null;
      isConnected = false;
    }
  }

  const openModal = () => {
    // Clear the block when user opens modal - they want to connect
    setBlockWagmiReconnect(false);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  // Custom disconnect function
  const customDisconnect = async () => {
    // Disconnect wagmi
    disconnect();
  }

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <WalletContext.Provider 
      value={{ 
        isModalOpen, 
        openModal, 
        closeModal, 
        isConnected,
        address,
        eoaAddress,
        smartAccountAddress,
        walletType,
        customDisconnect
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
