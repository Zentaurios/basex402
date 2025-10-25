'use client';

import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';

/**
 * Test component to verify OnchainKit ConnectWallet works outside the custom modal
 * This helps diagnose if the issue is with the modal wrapper or the wagmi configuration
 */
export function TestConnectWallet() {
  return (
    <div className="fixed bottom-4 right-4 z-[10001]">
      <Wallet>
        <ConnectWallet />
      </Wallet>
    </div>
  );
}
