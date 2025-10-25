'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, CheckCircle2, Mail, Timer } from 'lucide-react';
import { useWallet } from '@/components/wallet/WalletProvider';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useState, useEffect } from 'react';
import { getContractStats } from '@/app/actions/contract-stats';
import { useAccount } from 'wagmi';
import { useWalletClient } from 'wagmi';
import { makeX402Request } from '@/lib/x402-client';

// Force dynamic rendering - no static generation or caching
export const dynamic = 'force-dynamic';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const networkName = isMainnet ? 'Base' : 'Base Sepolia';

// Determine rarity tier for next mint
function getRarityTier(tokenId: number) {
  if (tokenId <= 10) return { 
    name: 'Genesis', 
    color: 'from-yellow-400 to-yellow-600', 
    emoji: '🏆',
    animation: '/animations/genesis.gif'
  };
  if (tokenId <= 100) return { 
    name: 'Pioneer', 
    color: 'from-gray-300 to-gray-500', 
    emoji: '🚀',
    animation: '/animations/pioneer.gif'
  };
  if (tokenId <= 300) return { 
    name: 'Early Adopter', 
    color: 'from-orange-400 to-orange-600', 
    emoji: '⚡',
    animation: '/animations/early-adopter.gif'
  };
  return { 
    name: 'Protocol User', 
    color: 'from-blue-400 to-blue-600', 
    emoji: '💎',
    animation: '/animations/protocol-user.gif'
  };
}

export default function MintPage() {
  const { isConnected, address, walletType } = useWallet();
  const { connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [mintStep, setMintStep] = useState<'wallet' | 'mint' | 'success'>('wallet');
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Contract stats state
  const [contractStats, setContractStats] = useState<{
    totalSupply: number;
    maxSupply: number;
    remaining: number;
    nextTokenId: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Calculate max mintable based on remaining supply
  const maxMintable = Math.min(5, contractStats?.remaining || 0);
  const TOTAL_SUPPLY = contractStats?.maxSupply || 402;
  const MINTED_COUNT = contractStats?.totalSupply || 0;
  const REMAINING = contractStats?.remaining || 0;
  const NEXT_TOKEN_ID = contractStats?.nextTokenId || 1;

  const rarityTier = getRarityTier(NEXT_TOKEN_ID);

  // Fetch contract stats on mount
  useEffect(() => {
    async function fetchStats() {
      setIsLoadingStats(true);
      try {
        const stats = await getContractStats();
        setContractStats(stats);
      } catch (error) {
        console.error('Failed to fetch contract stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  // Update mint step based on wallet connection
  useEffect(() => {
    // Check if user just signed out
    const forceSignout = typeof window !== 'undefined' && 
      (localStorage.getItem('cdp-force-signout') === 'true' || 
       sessionStorage.getItem('cdp-force-signout') === 'true');
    
    if (forceSignout) {
      // Keep on wallet step if sign out is in progress
      setMintStep('wallet');
      return;
    }
    
    if (isConnected && address) {
      if (mintStep === 'wallet') {
        setMintStep('mint');
      }
    } else {
      setMintStep('wallet');
    }
  }, [isConnected, address, mintStep]);

  const handleMint = async () => {
    if (!address) return;
    
    if (!walletClient) {
      alert('Wallet client not ready. Please reconnect your wallet.');
      return;
    }
    
    setIsMinting(true);
    try {
      console.log(`Starting x402 payment and NFT mint for ${quantity} NFT(s)...`);
      
      // Call the mint API with x402 payment handling
      const response = await makeX402Request(
        '/api/mint',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientWallet: address,
            paymentMethod: 'email',
            quantity: quantity
          }),
        },
        walletClient,
        address
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Minting failed');
      }

      console.log('✅ NFT(s) minted successfully:', data);
      
      setMintResult({
        tokenIds: data.data.tokenIds || [data.data.tokenId],
        quantity: data.data.quantity || 1,
        transactionHash: data.data.transactionHash,
        contractAddress: data.data.contractAddress,
        explorerUrl: data.data.transactionUrl,
        openseaUrl: data.data.openseaUrl,
      });
      setMintStep('success');
      
      // Refresh contract stats after successful mint
      const updatedStats = await getContractStats();
      setContractStats(updatedStats);
      
    } catch (error) {
      console.error('❌ Minting failed:', error);
      alert(error instanceof Error ? error.message : 'Minting failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  // Show loading state while fetching contract stats
  if (isLoadingStats) {
    return (
      <main className="mx-auto flex w-full max-w-[clamp(1024px,calc(1024px+(100vw-1024px)*0.25),1248px)] justify-center px-4 md:px-6 lg:px-8">
        <div className="w-full">
          <nav aria-label="Breadcrumb" className="py-4 mb-8">
            <Link 
              href="/"
              className="inline-flex items-center hover:text-base-blue transition-colors font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to Home
            </Link>
          </nav>
          
          <section className="max-w-2xl mx-auto text-center py-20">
            <div className="w-20 h-20 bg-base-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" aria-hidden="true">
              <Zap className="w-10 h-10 text-base-blue" />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Loading Collection Data...</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Fetching current mint stats from the blockchain
            </p>
          </section>
        </div>
      </main>
    );
  }

  // Check if collection is sold out
  if (REMAINING <= 0) {
    return (
      <main className="mx-auto flex w-full max-w-[clamp(1024px,calc(1024px+(100vw-1024px)*0.25),1248px)] justify-center px-4 md:px-6 lg:px-8">
        <div className="w-full">
          <nav aria-label="Breadcrumb" className="py-4 mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-gray-700 hover:text-base-blue transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to Home
            </Link>
          </nav>
          
          <section aria-labelledby="sold-out-heading" className="max-w-2xl mx-auto text-center py-20">
            <div className="w-20 h-20 bg-negative/10 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
              <span className="text-4xl" role="img" aria-label="Fire emoji">🔥</span>
            </div>
            <h1 id="sold-out-heading" className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Collection Sold Out!</h1>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
              All 402 x402 Protocol Pioneer NFTs have been minted. 
              Check secondary markets to acquire one from existing holders.
            </p>
            <nav aria-label="Secondary market options" className="flex justify-center gap-4">
              <a
                href={`https://${isMainnet ? '' : 'testnets.'}opensea.io/collection/x402-protocol-pioneers`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-base-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-base-blue/90"
                aria-label="View x402collection on OpenSea (opens in new tab)"
              >
                View on OpenSea
              </a>
              <Link 
                href="/" 
                className="px-6 py-3 rounded-lg font-medium btn-secondary"
              >
                Back to Home
              </Link>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[clamp(1024px,calc(1024px+(100vw-1024px)*0.25),1248px)] justify-center px-4 md:px-6 lg:px-8">
      <div className="w-full">
        {/* Back Navigation */}
        <nav aria-label="Breadcrumb" className="py-4 mb-8">
          <Link 
            href="/"
            className="inline-flex items-center hover:text-base-blue transition-colors font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back to Home
          </Link>
        </nav>

        {/* Collection Progress Bar */}
        <section aria-label="Collection minting progress" className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{MINTED_COUNT} minted</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{TOTAL_SUPPLY} total</span>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--surface)' }} role="progressbar" aria-valuenow={(MINTED_COUNT / TOTAL_SUPPLY) * 100} aria-valuemin={0} aria-valuemax={100} aria-label={`${MINTED_COUNT} of ${TOTAL_SUPPLY} NFTs minted`}>
              <div 
                className="bg-base-blue h-2 rounded-full transition-all duration-500"
                style={{ width: `${(MINTED_COUNT / TOTAL_SUPPLY) * 100}%` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <span className="text-lg font-bold text-base-blue">{REMAINING} remaining</span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          
          {/* Step 1: Wallet Connection */}
          {mintStep === 'wallet' && (
            <section aria-labelledby="wallet-heading">
              <header className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-mono uppercase tracking-wide mb-6 bg-base-blue/10 text-base-blue">
                  <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                  Connect Wallet • {networkName}
                </div>
                
                <h1 id="wallet-heading" className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Mint x402 Protocol NFT
                </h1>
                
                <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  Connect your wallet to mint NFT #{NEXT_TOKEN_ID} and join the exclusive group of x402 pioneers
                </p>
              </header>

              {/* Wallet Connection Card */}
              <div className="max-w-md mx-auto">
                <div className="rounded-lg p-8 card border-2" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Connect Your Wallet
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Sign in to create or connect your wallet and mint your x402 Protocol Pioneer NFT for $1 USDC.
                    </p>
                  </div>

                  <WalletButton size="lg" className="w-full mb-6">
                    Connect to Mint
                  </WalletButton>

                  <div className="space-y-3 pt-6 border-t" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <Zap className="w-4 h-4" aria-hidden="true" />
                      <span>Instant wallet creation with email</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Or connect your existing wallet</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Secure & non-custodial</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Mint NFT */}
          {mintStep === 'mint' && (
            <section aria-labelledby="mint-heading">
              <header className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-mono uppercase tracking-wide mb-6 bg-warning/10 text-warning">
                  <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
                  x402 Payment • {networkName}
                </div>
                
                <h1 id="mint-heading" className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Mint NFT #{NEXT_TOKEN_ID}
                </h1>
                
                <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  You're about to mint a {rarityTier.name} tier NFT using the x402 protocol on {networkName}
                </p>
              </header>

              {/* NFT Preview */}
              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* NFT Artwork Preview */}
                  <div>
                    <article className="rounded-lg overflow-hidden bg-black aspect-square flex items-center justify-center" role="figure" aria-label={`Preview of x402 Protocol Pioneer NFT #${NEXT_TOKEN_ID}, ${rarityTier.name} tier`}>
                      <img 
                        src={rarityTier.animation} 
                        alt={`${rarityTier.name} tier NFT animation`}
                        className="w-full h-full object-cover"
                      />
                    </article>
                    
                    {/* NFT Info */}
                    <div className="mt-4 text-center">
                      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        x402 Protocol Pioneer #{NEXT_TOKEN_ID}
                      </h2>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                        <span className="mr-1">{rarityTier.emoji}</span>
                        {rarityTier.name}
                      </div>
                    </div>
                    
                    {REMAINING <= 25 && (
                      <aside className="mt-4 bg-negative/10 border border-negative/20 rounded-lg p-3 text-center" role="alert">
                        <div className="flex items-center justify-center space-x-2 text-negative">
                          <Timer className="w-4 h-4" aria-hidden="true" />
                          <span className="text-sm font-medium">Only {REMAINING} left!</span>
                        </div>
                      </aside>
                    )}
                  </div>

                  {/* NFT Details */}
                  <div className="space-y-6">
                    {/* Quantity Selector */}
                    <article className="rounded-lg p-6 card">
                      <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Select Quantity</h3>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            onClick={() => setQuantity(num)}
                            disabled={num > maxMintable}
                            className={`py-3 px-4 rounded-lg font-medium transition-all ${
                              quantity === num
                                ? 'bg-base-blue text-white'
                                : num > maxMintable
                                ? 'bg-base-gray-100 text-base-gray-400 cursor-not-allowed'
                                : 'bg-base-gray-100 text-base-black hover:bg-base-gray-200'
                            }`}
                            aria-label={`Mint ${num} NFT${num > 1 ? 's' : ''}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Total Price:</span>
                        <span className="font-mono text-base-blue font-bold text-lg">${quantity}.00 USDC</span>
                      </div>
                    </article>

                    <article className="rounded-lg p-6 card">
                      <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>NFT Details</h3>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Quantity:</dt>
                          <dd className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{quantity} NFT{quantity > 1 ? 's' : ''}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Starting Token ID:</dt>
                          <dd className="font-mono" style={{ color: 'var(--text-primary)' }}>#{NEXT_TOKEN_ID}{quantity > 1 ? ` - #${NEXT_TOKEN_ID + quantity - 1}` : ''}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Rarity Tier:</dt>
                          <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{rarityTier.name}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Collection:</dt>
                          <dd className="font-mono" style={{ color: 'var(--text-primary)' }}>x402 Protocol Pioneers</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Price per NFT:</dt>
                          <dd className="font-mono" style={{ color: 'var(--text-primary)' }}>$1.00 USDC</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Total Price:</dt>
                          <dd className="font-mono text-base-blue font-bold">${quantity}.00 USDC</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Network:</dt>
                          <dd className="font-mono" style={{ color: 'var(--text-primary)' }}>{networkName}</dd>
                        </div>
                      </dl>
                    </article>

                    <button
                      onClick={handleMint}
                      disabled={isMinting}
                      className="w-full bg-base-blue text-white py-4 rounded-lg font-medium hover:bg-base-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label={isMinting ? `Minting ${quantity} NFT${quantity > 1 ? 's' : ''} in progress` : `Mint ${quantity} x402 Protocol NFT${quantity > 1 ? 's' : ''} for ${quantity} dollar${quantity > 1 ? 's' : ''} USDC`}
                    >
                      {isMinting 
                        ? `Minting ${quantity} NFT${quantity > 1 ? 's' : ''}...` 
                        : `Mint ${quantity} NFT${quantity > 1 ? 's' : ''} (${quantity} USDC)`
                      }
                    </button>

                    <aside className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm text-center">
                        💳 Payment will be processed via x402 protocol using your wallet's USDC
                      </p>
                    </aside>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Success */}
          {mintStep === 'success' && mintResult && (
            <section aria-labelledby="success-heading">
              <header className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-mono uppercase tracking-wide mb-6 bg-positive/10 text-positive">
                  <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Success • {networkName}
                </div>
                
                <h1 id="success-heading" className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  NFT{mintResult.quantity > 1 ? 's' : ''} Minted!
                </h1>
                
                <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  Congratulations! You've successfully minted {mintResult.quantity} x402 Protocol Pioneer NFT{mintResult.quantity > 1 ? 's' : ''}
                  {mintResult.tokenIds && ` #${mintResult.tokenIds[0]}${mintResult.quantity > 1 ? ` - #${mintResult.tokenIds[mintResult.tokenIds.length - 1]}` : ''}`}
                </p>
              </header>

              {/* Success Details */}
              <div className="max-w-2xl mx-auto">
                <article className="bg-positive/5 border border-positive/20 rounded-lg p-8">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4 bg-black" aria-hidden="true">
                      <img 
                        src={rarityTier.animation} 
                        alt={`${rarityTier.name} tier NFT animation`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h2 className="text-2xl font-bold text-positive mb-2">
                      Welcome, x402 Pioneer!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      You're now part of an exclusive group of {MINTED_COUNT + 1} people who've experienced x402 payments
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg p-6 card">
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Quantity Minted:</dt>
                          <dd className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{mintResult.quantity} NFT{mintResult.quantity > 1 ? 's' : ''}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Token ID{mintResult.quantity > 1 ? 's' : ''}:</dt>
                          <dd className="font-mono" style={{ color: 'var(--text-primary)' }}>
                            {mintResult.tokenIds ? (
                              mintResult.quantity === 1 ? `#${mintResult.tokenIds[0]}` : `#${mintResult.tokenIds[0]} - #${mintResult.tokenIds[mintResult.tokenIds.length - 1]}`
                            ) : 'Loading...'}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Transaction:</dt>
                          <dd className="font-mono" style={{ color: 'var(--text-primary)' }}>
                            {mintResult.transactionHash.slice(0, 10)}...{mintResult.transactionHash.slice(-8)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Total Paid:</dt>
                          <dd className="font-mono text-base-blue font-bold">${mintResult.quantity} USDC</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--text-secondary)' }}>Network:</dt>
                          <dd className="font-mono" style={{ color: 'var(--text-primary)' }}>{networkName}</dd>
                        </div>
                      </dl>
                    </div>

                    <nav aria-label="Post-mint actions" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <a
                        href={mintResult.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-base-blue text-white text-center py-3 rounded-lg font-medium hover:bg-base-blue/90 transition-colors text-sm"
                        aria-label="View transaction on block explorer (opens in new tab)"
                      >
                        View Transaction
                      </a>
                      <a
                        href={mintResult.openseaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                        aria-label="View NFT on OpenSea (opens in new tab)"
                      >
                        View on OpenSea
                      </a>
                      <button
                        onClick={() => {
                          setMintStep('mint');
                          setMintResult(null);
                        }}
                        disabled={REMAINING <= 1}
                        className="bg-base-gray-100 text-base-black text-center py-3 rounded-lg font-medium hover:bg-base-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        aria-label={REMAINING <= 1 ? 'Collection sold out' : 'Mint another NFT'}
                      >
                        {REMAINING <= 1 ? 'Sold Out' : 'Mint Another'}
                      </button>
                    </nav>

                    {/* Social sharing suggestion */}
                    <aside className="mt-6 p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Share your achievement!</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Show the world you're an x402 protocol pioneer 🚀
                      </p>
                    </aside>
                  </div>
                </article>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
