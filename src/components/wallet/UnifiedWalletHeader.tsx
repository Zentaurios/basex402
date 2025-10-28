'use client';

import { useWallet } from './WalletProvider';
import { WalletButton } from './WalletButton';
import { WalletDropdown } from './WalletDropdown';
import { ConnectedWallet } from './ConnectedWallet';
import { OnchainKitWalletBridge } from '@/components/wallet/OnchainKitWalletBridge';

interface UnifiedWalletHeaderProps {
  isMobileMenu?: boolean;
}

/**
 * Unified Wallet Header Component
 * 
 * This component provides a complete wallet UI without using OnchainKit's wallet components.
 * It uses only custom components to maintain full control over the wallet functionality.
 * 
 * Flow:
 * 1. Not connected → WalletButton (opens GlobalWalletModal)
 * 2. Connected with embedded wallet → WalletDropdown (CDP/custom UI)
 * 3. Connected with external wallet → ConnectedWallet (wagmi/custom UI)
 * 
 * The OnchainKitWalletBridge monitors connection state for debugging.
 */
export function UnifiedWalletHeader({ isMobileMenu = false }: UnifiedWalletHeaderProps) {
  const { isConnected, address, walletType } = useWallet();
  
  return (
    <>
      <OnchainKitWalletBridge />
      {!isConnected || !address ? (
        // Not connected - show connect button that opens GlobalWalletModal
        <WalletButton className={isMobileMenu ? 'w-full' : ''}>
          Connect Wallet
        </WalletButton>
      ) : walletType === 'embedded' ? (
        // Connected with embedded wallet - use WalletDropdown
        <WalletDropdown isMobileMenu={isMobileMenu} />
      ) : (
        // Connected with external wallet - use ConnectedWallet
        <ConnectedWallet isMobileMenu={isMobileMenu} />
      )}
    </>
  );
}
