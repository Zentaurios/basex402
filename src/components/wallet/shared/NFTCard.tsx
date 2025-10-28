'use client';

import { useState, useEffect } from 'react';
import { type NFTWithMetadata } from '@/app/actions/nft-balances';
import { fetchNFTMetadata, type NFTMetadata } from '@/app/actions/nft-metadata';
import { ImageIcon, Calendar, Zap, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface NFTCardProps {
  nft: NFTWithMetadata;
  onClick?: () => void;
}

/**
 * Get rarity tier color based on tier name
 */
function getRarityColor(tier: string): string {
  switch (tier) {
    case 'Genesis':
      return '#FFD700'; // Gold
    case 'Pioneer':
      return '#C0C0C0'; // Silver
    case 'Early Adopter':
      return '#CD7F32'; // Bronze
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function NFTCard({ nft, onClick }: NFTCardProps) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const rarityColor = getRarityColor(nft.rarityTier);

  // Fetch metadata from tokenURI
  useEffect(() => {
    async function loadMetadata() {
      try {
        setMetadataLoading(true);
        setMetadataError(false);
        const data = await fetchNFTMetadata(nft.tokenURI);
        
        if (data) {
          setMetadata(data);
        } else {
          setMetadataError(true);
        }
      } catch (error) {
        console.error('Failed to load NFT metadata:', error);
        setMetadataError(true);
      } finally {
        setMetadataLoading(false);
      }
    }

    loadMetadata();
  }, [nft.tokenURI]);

  return (
    <button
      onClick={onClick}
      className="w-full group relative rounded-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ 
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--card-border)'
      }}
    >
      {/* NFT Image/Placeholder */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        {metadataLoading ? (
          // Loading state
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-base-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : metadataError || imageError || !metadata?.image ? (
          // Error or no image state
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
            {metadataError ? (
              <>
                <AlertCircle className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs px-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Failed to load
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  #{nft.tokenId.toString()}
                </p>
              </>
            )}
          </div>
        ) : (
          // Display actual NFT image
          <Image
            src={metadata.image}
            alt={metadata.name || `x402 Pioneer #${nft.tokenId.toString()}`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 50vw, 160px"
            unoptimized // Allow external images
          />
        )}
        
        {/* Rarity Badge */}
        <div 
          className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold backdrop-blur-sm z-10"
          style={{ 
            backgroundColor: `${rarityColor}20`,
            color: rarityColor,
            border: `1px solid ${rarityColor}40`
          }}
        >
          {nft.rarityTier}
        </div>
      </div>
      
      {/* NFT Info */}
      <div className="p-3 space-y-2">
        {/* Token Name/ID */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {metadata?.name || `x402 Pioneer #${nft.tokenId.toString()}`}
          </h3>
        </div>
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
            <Calendar className="w-3 h-3" />
            <span>{formatDate(nft.mintData.timestamp)}</span>
          </div>
          <div className="flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
            <Zap className="w-3 h-3" />
            <span className="uppercase">{nft.mintData.network}</span>
          </div>
        </div>
      </div>
      
      {/* Hover Overlay */}
      <div 
        className="absolute inset-0 bg-base-blue/0 group-hover:bg-base-blue/5 transition-all pointer-events-none"
      />
    </button>
  );
}