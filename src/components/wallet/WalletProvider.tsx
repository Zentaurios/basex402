'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useIsSignedIn, useEvmAddress, useCurrentUser } from '@coinbase/cdp-hooks';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi'; // ✅ Add useSwitchChain
import { base, baseSepolia } from 'viem/chains';
import toast from 'react-hot-toast';

type WalletContextType = {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  isConnected: boolean;
  address: string | undefined;
  eoaAddress: string | undefined;
  smartAccountAddress: string | undefined;
  walletType: 'embedded' | 'external' | null;
  customDisconnect: () => void;
  isWrongNetwork: boolean; // ✅ Add this
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ✅ Add expected chain configuration
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const expectedChain = isMainnet ? base : baseSepolia;

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
  
  const cdpEoaAddress = currentUser?.evmAccounts?.[0];
  
  // Wagmi External Wallet state
  const { isConnected: isWagmiConnected, address: wagmiAddress, chain } = useAccount(); // ✅ Add chain
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain(); // ✅ Add this
  
  // ✅ Check if external wallet is on wrong network
  const isWrongNetwork = isWagmiConnected && chain?.id !== expectedChain.id;
  
  // Initialize: Check for cross-contamination on mount
  useEffect(() => {
    if (!hasInitialized) {
      if (cdpAddress && isCdpSignedIn && isWagmiConnected) {
        setBlockWagmiReconnect(true);
        disconnect();
      }
      setHasInitialized(true);
    }
  }, [hasInitialized, cdpAddress, isCdpSignedIn, isWagmiConnected, disconnect]);
  
  // ✅ Better network switching with error handling
  useEffect(() => {
    if (isWagmiConnected && wagmiAddress && chain && chain.id !== expectedChain.id) {
      const switchNetwork = async () => {
        try {
          await switchChain({ chainId: expectedChain.id });
          toast.success(`Switched to ${expectedChain.name}`);
        } catch (error: any) {
          // Some wallets (like Phantom) don't support programmatic network switching
          console.warn('Failed to switch network automatically:', error);
          
          // Show persistent warning with instructions
          toast.error(
            `⚠️ Wrong Network!\n\nDisconnect and switch to ${expectedChain.name} in your wallet, then reconnect.\n\nPhantom/some wallets connect to Ethereum by default.`,
            { duration: 15000 }
          );
        }
      };
      
      switchNetwork();
    }
  }, [isWagmiConnected, wagmiAddress, chain, switchChain]);
  
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
  
  if (forceDisconnected) {
    if (cdpAddress && isCdpSignedIn) {
      address = cdpAddress;
      eoaAddress = cdpEoaAddress;
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
    if (wagmiAddress && isWagmiConnected) {
      address = wagmiAddress;
      eoaAddress = wagmiAddress;
      smartAccountAddress = undefined;
      walletType = 'external';
      isConnected = true;
    } else if (cdpAddress && isCdpSignedIn) {
      address = cdpAddress;
      eoaAddress = cdpEoaAddress;
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
    setBlockWagmiReconnect(false);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const customDisconnect = async () => {
    disconnect();
  }

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
        customDisconnect,
        isWrongNetwork, // ✅ Add this
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