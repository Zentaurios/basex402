'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useIsSignedIn, useEvmAddress } from '@coinbase/cdp-hooks';
import { useAccount } from 'wagmi';

type WalletContextType = {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  isConnected: boolean;
  address: string | undefined;
  walletType: 'embedded' | 'external' | null;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // CDP Embedded Wallet state
  const { isSignedIn: isCdpSignedIn } = useIsSignedIn();
  const { evmAddress: cdpAddress } = useEvmAddress();
  
  // Wagmi External Wallet state
  const { isConnected: isWagmiConnected, address: wagmiAddress } = useAccount();
  
  const isConnected = isCdpSignedIn || isWagmiConnected;
  const address = cdpAddress || wagmiAddress;
  const walletType = isCdpSignedIn ? 'embedded' : isWagmiConnected ? 'external' : null;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

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
        walletType
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
