'use client';

import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Avatar, Name } from '@coinbase/onchainkit/identity';
import { WalletDropdown } from '@/components/wallet/WalletDropdown';
import { ConnectedWallet } from '@/components/wallet/ConnectedWallet';
import { useWallet } from '@/components/wallet/WalletProvider';
import { OnchainKitWalletBridge } from '@/components/wallet/OnchainKitWalletBridge';

interface EmbeddedWalletHeaderProps {
  isMobileMenu?: boolean;
}

export function EmbeddedWalletHeader({ isMobileMenu = false }: EmbeddedWalletHeaderProps) {
  const { isConnected, address, walletType } = useWallet();
  
  console.log('📄 EmbeddedWalletHeader rendering:', {
    isConnected,
    address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'none',
    walletType,
    willRender: !isConnected ? 'ConnectWallet' : walletType === 'embedded' ? 'WalletDropdown' : 'ConnectedWallet'
  });
  
  // If not connected, wrap in OnchainKit Wallet component for proper connection
  if (!isConnected || !address) {
    return (
      <>
        <OnchainKitWalletBridge />
        <Wallet>
          <ConnectWallet className={isMobileMenu ? 'w-full' : ''}>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
        </Wallet>
      </>
    );
  }
  
  // If connected with EMBEDDED wallet, use custom WalletDropdown
  if (walletType === 'embedded') {
    return <WalletDropdown isMobileMenu={isMobileMenu} />;
  }
  
  // If connected with EXTERNAL wallet, use custom ConnectedWallet
  return <ConnectedWallet isMobileMenu={isMobileMenu} />;
}
