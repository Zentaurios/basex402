'use client';

import { WalletDropdown } from '@/components/wallet/WalletDropdown';
import { WalletButton } from '@/components/wallet/WalletButton';
import { ConnectedWallet } from '@/components/wallet/ConnectedWallet';
import { useWallet } from '@/components/wallet/WalletProvider';

interface EmbeddedWalletHeaderProps {
  isMobileMenu?: boolean;
}

export function EmbeddedWalletHeader({ isMobileMenu = false }: EmbeddedWalletHeaderProps) {
  const { isConnected, address, walletType } = useWallet();
  
  // If not connected, show connect button
  if (!isConnected || !address) {
    return (
      <WalletButton 
        className={isMobileMenu ? 'w-full' : ''}
        variant="default"
        size="md"
      >
        {isMobileMenu ? 'Connect Wallet' : 'Connect'}
      </WalletButton>
    );
  }
  
  // If connected with EMBEDDED wallet, use WalletDropdown (NOT ConnectedWallet)
  if (walletType === 'embedded') {
    return <WalletDropdown isMobileMenu={isMobileMenu} />;
  }
  
  // If connected with EXTERNAL wallet, use ConnectedWallet
  return <ConnectedWallet isMobileMenu={isMobileMenu} />;
}
