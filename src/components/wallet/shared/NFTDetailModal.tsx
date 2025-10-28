'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { type NFTWithMetadata } from '@/app/actions/nft-balances';
import { fetchNFTMetadata, type NFTMetadata } from '@/app/actions/nft-metadata';
import { SendNFTModal } from './SendNFTModal';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Zap, 
  Send,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

interface NFTDetailViewProps {
  nft: NFTWithMetadata;
  onBack: () => void;
  onSend?: (nft: NFTWithMetadata) => void;
}

/**
 * Get rarity tier color based on tier name
 */
function getRarityColor(tier: string): string {
  switch (tier) {
    case 'Genesis':
      return '#FFD700';
    case 'Pioneer':
      return '#C0C0C0';
    case 'Early Adopter':
      return '#CD7F32';
    default:
      return '#6B7280';
  }
}

/**
 * Format timestamp to readable date and time
 */
function formatDateTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Inline NFT detail view that displays within the wallet dropdown
 * Replaces the grid view when an NFT is selected
 */
export function NFTDetailModal({ nft, onBack, onSend }: NFTDetailViewProps) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  
  const rarityColor = getRarityColor(nft.rarityTier);
  const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
  const explorerUrl = isMainnet 
    ? 'https://basescan.org' 
    : 'https://sepolia.basescan.org';
  const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT;

  // Fetch metadata
  useEffect(() => {
    async function loadMetadata() {
      try {
        setLoading(true);
        setError(false);
        const data = await fetchNFTMetadata(nft.tokenURI);
        
        if (data) {
          setMetadata(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadMetadata();
  }, [nft.tokenURI]);

  // Show send modal instead of detail view
  if (showSendModal) {
    return (
      <SendNFTModal
        nft={nft}
        onClose={() => setShowSendModal(false)}
        onSuccess={() => {
          setShowSendModal(false);
          onBack(); // Go back to grid after successful send
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-opacity-80"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Back
          </span>
        </button>
        
        <div
          className="px-3 py-1 rounded-lg text-xs font-bold"
          style={{
            backgroundColor: `${rarityColor}20`,
            color: rarityColor,
            border: `1px solid ${rarityColor}40`
          }}
        >
          {nft.rarityTier}
        </div>
      </div>

      {/* NFT Image */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : error || imageError || !metadata?.image ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
            <AlertCircle className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs px-4 text-center" style={{ color: 'var(--text-muted)' }}>
              {error ? 'Failed to load metadata' : 'Image not available'}
            </p>
          </div>
        ) : (
          <Image
            src={metadata.image}
            alt={metadata.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="320px"
            unoptimized
          />
        )}
      </div>

      {/* NFT Name */}
      <div>
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          {metadata?.name || `x402 Pioneer #${nft.tokenId.toString()}`}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          Token ID #{nft.tokenId.toString()}
        </p>
      </div>

      {/* Description */}
      {metadata?.description && (
        <div className="space-y-1">
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Description
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {metadata.description}
          </p>
        </div>
      )}

      {/* Attributes */}
      {metadata?.attributes && metadata.attributes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Attributes
          </p>
          <div className="grid grid-cols-2 gap-2">
            {metadata.attributes.map((attr, index) => (
              <div
                key={index}
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--surface)' }}
              >
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  {attr.trait_type}
                </p>
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {attr.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Minted</span>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatDateTime(nft.mintData.timestamp)}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Network</span>
          </div>
          <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-primary)' }}>
            {nft.mintData.network}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {nftContractAddress && (
          <Link
            href={`${explorerUrl}/token/${nftContractAddress}?a=${nft.tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
          >
            <ExternalLink className="w-3 h-3" />
            Explorer
          </Link>
        )}
        
        <button
          onClick={() => setShowSendModal(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-base-blue text-white hover:bg-base-blue/90 transition-colors"
        >
          <Send className="w-3 h-3" />
          Send NFT
        </button>
      </div>
    </div>
  );
}