'use client';

import { useState, useEffect, useRef } from 'react';
import { useTokenBalances } from './shared/useTokenBalances';
import { AssetsDisplay } from './shared/AssetsDisplay';
import { NFTsDisplay, useNFTBalances } from './shared';
import { SendTab } from './SendTab';
import { 
  Wallet as WalletIcon, 
  Copy,
  Check,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useWallet } from './WalletProvider';
import { WalletButton } from './WalletButton';

interface ConnectedWalletProps {
  isMobileMenu?: boolean;
}

export function ConnectedWallet({ isMobileMenu = false }: ConnectedWalletProps) {
  const { isConnected, walletType, address, customDisconnect } = useWallet();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'nfts' | 'send'>('assets');
  const [copied, setCopied] = useState(false);
  const [showUnverified, setShowUnverified] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 ConnectedWallet rendered:', {
      isConnected,
      walletType,
      address,
      component: 'ConnectedWallet'
    });
  }, [isConnected, walletType, address]);
  
  // Log dropdown state changes
  useEffect(() => {
    console.log('📋 ConnectedWallet dropdown state:', isDropdownOpen);
  }, [isDropdownOpen]);
  
  // Fetch balances for external wallet when dropdown is open
  const { balances: externalBalances, loading: externalBalancesLoading } = useTokenBalances(
    'ethereum',
    address,
    walletType === 'external' && isDropdownOpen
  );
  
  // Fetch NFTs for external wallet when NFT tab is active
  const { nfts, loading: loadingNFTs } = useNFTBalances(
    address,
    walletType === 'external' && isDropdownOpen && activeTab === 'nfts'
  );
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setIsDropdownOpen(false);
    }
  }, [isConnected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCopyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleDisconnect = async () => {
    // Close dropdown immediately
    setIsDropdownOpen(false);
    
    // Use custom disconnect function that clears OnchainKit FIRST, then wagmi
    await customDisconnect();
  };

  const formatAddress = (addr?: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Not connected - show login button
  if (!isConnected) {
    return <WalletButton />;
  }

  // This component only handles EXTERNAL wallets
  // Embedded wallets use WalletDropdown.tsx
  if (walletType !== 'external') {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Connect Button - matches WalletDropdown mobile styles */}
      <button
        onClick={() => {
          console.log('👆 ConnectedWallet button clicked, toggling dropdown:', !isDropdownOpen);
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-opacity-80 ${
          isMobileMenu ? 'w-full justify-between' : ''
        }`}
        style={{ backgroundColor: 'var(--surface)' }}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center space-x-2">
          <WalletIcon className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
            {formatAddress(address)}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          style={{ color: 'var(--text-muted)' }} 
        />
      </button>

      {/* CDP-Style Dropdown - matches WalletDropdown mobile styles */}
      {isDropdownOpen && (
        <div 
          className={`rounded-lg shadow-lg border flex flex-col ${
            isMobileMenu 
              ? 'w-full mt-2' 
              : 'absolute right-0 mt-2 w-80'
          }`}
          style={{ 
            backgroundColor: 'var(--card)', 
            borderColor: 'var(--card-border)',
            maxHeight: isMobileMenu ? '70vh' : 'calc(100vh - 100px)',
            zIndex: 200
          }}
        >
          {/* Header with address */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                External Wallet
              </span>
              <button
                onClick={handleCopyAddress}
                className="flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors"
                style={{ 
                  color: copied ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: copied ? 'var(--surface)' : 'transparent'
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-sm break-all" style={{ color: 'var(--text-primary)' }}>
              {address}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--card-border)' }}>
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'assets' ? 'border-b-2 border-base-blue' : ''
              }`}
              style={{ 
                color: activeTab === 'assets' ? 'var(--text-primary)' : 'var(--text-secondary)' 
              }}
            >
              Assets
            </button>
            <button
              onClick={() => setActiveTab('nfts')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'nfts' ? 'border-b-2 border-base-blue' : ''
              }`}
              style={{ 
                color: activeTab === 'nfts' ? 'var(--text-primary)' : 'var(--text-secondary)' 
              }}
            >
              NFTs
            </button>
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'send' ? 'border-b-2 border-base-blue' : ''
              }`}
              style={{ 
                color: activeTab === 'send' ? 'var(--text-primary)' : 'var(--text-secondary)' 
              }}
            >
              Send
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {activeTab === 'assets' && (
              <AssetsDisplay 
                balances={externalBalances}
                loading={externalBalancesLoading}
                chain="ethereum"
                showUnverified={showUnverified}
              />
            )}
            {activeTab === 'nfts' && (
              <NFTsDisplay
                nfts={nfts}
                loading={loadingNFTs}
              />
            )}
            {activeTab === 'send' && (
              <SendTab
                chain="ethereum"
                userAddress={address || ''}
                balances={externalBalances || []}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--card-border)' }}>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-opacity-80"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
