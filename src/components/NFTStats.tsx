'use client';

import { useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT as `0x${string}`;
const TOTAL_SUPPLY = 402;

const NFT_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useNFTStats() {
  const { data: totalSupply, isLoading } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'totalSupply',
    chainId: base.id,
    query: {
      refetchInterval: 30_000,
      staleTime: 10_000,
    },
  });

  const minted = totalSupply ? Number(totalSupply) : 0;
  const remaining = TOTAL_SUPPLY - minted;
  const percentage = Math.round((minted / TOTAL_SUPPLY) * 100);

  return { minted, remaining, percentage, isLoading };
}

// Hero Stats Component
export function HeroStats() {
  const { minted, remaining, isLoading } = useNFTStats();

  return (
    <div className="flex justify-center mb-8" role="region" aria-label="Collection statistics">
      <div className="inline-block p-4 sm:p-6 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
        <div className="flex items-center space-x-4 sm:space-x-8">
          <div className="text-center">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-base-blue" aria-label={`${minted} NFTs minted`}>
              {isLoading ? '...' : minted}
            </div>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>Minted</div>
          </div>
          <div className="w-px h-12" style={{ backgroundColor: 'var(--card-border)' }} aria-hidden="true"></div>
          <div className="text-center">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-warning" aria-label={`${remaining} NFTs remaining`}>
              {isLoading ? '...' : remaining}
            </div>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>Remaining</div>
          </div>
          <div className="w-px h-12" style={{ backgroundColor: 'var(--card-border)' }} aria-hidden="true"></div>
          <div className="text-center">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-positive" aria-label="Price: 1 dollar USDC">$1</div>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>USDC</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Section Component
interface StatsSectionProps {
  isMainnet: boolean;
  networkStatus: string;
}

export function StatsSection({ isMainnet, networkStatus }: StatsSectionProps) {
  const { percentage, isLoading } = useNFTStats();

  return (
    <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
      <div>
        <div className="mb-2 font-mono text-3xl font-bold text-base-blue">402</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Supply</div>
      </div>
      <div>
        <div className="mb-2 font-mono text-3xl font-bold text-positive">$1</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>USDC each</div>
      </div>
      <div>
        <div className="mb-2 font-mono text-3xl font-bold text-warning">{isLoading ? '...' : `${percentage}%`}</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Minted</div>
      </div>
      <div>
        <div className={`text-3xl font-bold mb-2 font-mono ${isMainnet ? 'text-negative' : 'text-base-blue'}`}>
          {isMainnet ? 'Mainnet' : 'Sepolia'}
        </div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{networkStatus}</div>
      </div>
    </div>
  );
}

// Urgency Alert Component
export function UrgencyAlert() {
  const { remaining } = useNFTStats();

  if (remaining > 50) return null;

  return (
    <aside className="inline-flex items-center px-4 py-2 mt-6 text-sm font-medium rounded-lg bg-negative/10 text-negative" role="alert">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Only {remaining} NFTs left - Collection almost sold out!
    </aside>
  );
}
