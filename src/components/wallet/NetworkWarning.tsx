'use client';

import { useAccount } from 'wagmi';
import { base, baseSepolia } from 'viem/chains';

const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const expectedChain = isMainnet ? base : baseSepolia;

export function NetworkWarning() {
  const { chain, isConnected } = useAccount();
  
  if (!isConnected || !chain || chain.id === expectedChain.id) {
    return null;
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 text-center shadow-lg">
      <p className="font-bold text-lg mb-1">
        ⚠️ Wrong Network Detected!
      </p>
      <p className="font-semibold mb-2">
        Please switch your wallet to <span className="underline">{expectedChain.name}</span>
      </p>
      <p className="text-sm opacity-90">
        Currently on: {chain.name} (Chain ID: {chain.id}) • Required: {expectedChain.name} (Chain ID: {expectedChain.id})
      </p>
      <div className="mt-2 text-xs opacity-80">
        💡 Open your wallet extension → Click network dropdown → Select "{expectedChain.name}"
      </div>
    </div>
  );
}
