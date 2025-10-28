'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from './WalletProvider';

/**
 * Bridge component that syncs OnchainKit/wagmi connection state
 * with our custom WalletProvider
 * 
 * This ensures that when a user connects via OnchainKit's ConnectWallet button,
 * the connection is properly reflected in our custom WalletProvider context
 */
export function OnchainKitWalletBridge() {
  const { isConnected: isWagmiConnected, address: wagmiAddress, connector } = useAccount();
  const { isConnected: isCustomConnected, walletType } = useWallet();
  
  useEffect(() => {
    if (isWagmiConnected && wagmiAddress) {
      console.log('🌉 OnchainKitWalletBridge: External wallet connected via OnchainKit', {
        address: wagmiAddress,
        connector: connector?.name,
        customProviderSees: isCustomConnected,
        walletType,
      });
    }
  }, [isWagmiConnected, wagmiAddress, connector, isCustomConnected, walletType]);
  
  // This component doesn't render anything - it just monitors state
  return null;
}
