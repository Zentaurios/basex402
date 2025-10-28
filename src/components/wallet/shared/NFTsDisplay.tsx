'use client';

import { useState } from 'react';
import { type NFTWithMetadata } from '@/app/actions/nft-balances';
import { NFTCard } from './NFTCard';
import { NFTDetailModal } from './NFTDetailModal';
import { Image as ImageIcon } from 'lucide-react';

interface NFTsDisplayProps {
  nfts: NFTWithMetadata[] | null;
  loading: boolean;
  onSendNFT?: (nft: NFTWithMetadata) => void;
}

export function NFTsDisplay({ nfts, loading, onSendNFT }: NFTsDisplayProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFTWithMetadata | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-base-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="flex justify-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <ImageIcon className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            No NFTs Found
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            You don't own any x402 Protocol Pioneer NFTs yet
          </p>
        </div>
      </div>
    );
  }

  // Show detail view if an NFT is selected
  if (selectedNFT) {
    return (
      <NFTDetailModal
        nft={selectedNFT}
        onBack={() => setSelectedNFT(null)}
        onSend={onSendNFT}
      />
    );
  }

  // Show grid view
  return (
    <div className="space-y-3">
      {/* NFT Count Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {nfts.length} {nfts.length === 1 ? 'NFT' : 'NFTs'}
        </p>
        
        {/* Rarity Distribution */}
        <div className="flex items-center space-x-2 text-xs">
          {(() => {
            const rarities = nfts.reduce((acc, nft) => {
              acc[nft.rarityTier] = (acc[nft.rarityTier] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            return Object.entries(rarities).map(([tier, count]) => (
              <span 
                key={tier}
                className="px-2 py-0.5 rounded"
                style={{ 
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-secondary)'
                }}
              >
                {count} {tier}
              </span>
            ));
          })()}
        </div>
      </div>
      
      {/* NFT Grid */}
      <div className="grid grid-cols-2 gap-3">
        {nfts.map((nft) => (
          <NFTCard
            key={nft.tokenId.toString()}
            nft={nft}
            onClick={() => setSelectedNFT(nft)}
          />
        ))}
      </div>
    </div>
  );
}