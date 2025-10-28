'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { Wallet as WalletIcon } from 'lucide-react';

/**
 * Simple external wallet connector using wagmi directly
 * No OnchainKit wallet components - just pure wagmi hooks
 * Provides separate buttons for MetaMask and Phantom using specific connectors
 */
export function ExternalWalletConnect() {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected } = useAccount();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);

  useEffect(() => {
    // Check if MetaMask is installed
    setHasMetaMask(typeof window !== 'undefined' && window.ethereum?.isMetaMask === true);
    
    // Check if Phantom is installed
    setHasPhantom(typeof window !== 'undefined' && window.phantom?.ethereum !== undefined);
    
    // Debug: Log available connectors
    console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
  }, [connectors]);

  if (isConnected) {
    return null; // Already connected
  }

  // Find specific connectors by their target
  const metaMaskConnector = connectors.find((c) => 
    c.id.includes('metaMask') || c.name.toLowerCase().includes('metamask')
  );
  
  const phantomConnector = connectors.find((c) => 
    c.id.includes('phantom') || c.name.toLowerCase().includes('phantom')
  );
  
  // Find the Coinbase Wallet connector
  const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');

  console.log('🔍 Found connectors:', {
    metaMask: metaMaskConnector ? { id: metaMaskConnector.id, name: metaMaskConnector.name } : null,
    phantom: phantomConnector ? { id: phantomConnector.id, name: phantomConnector.name } : null,
    coinbase: coinbaseConnector ? { id: coinbaseConnector.id, name: coinbaseConnector.name } : null,
  });

  const handleMetaMaskConnect = async () => {
    if (!metaMaskConnector || !hasMetaMask) return;
    
    console.log('🦊 Connecting to MetaMask with connector:', metaMaskConnector.id);
    setSelectedWallet('metamask');
    
    try {
      await connect({ connector: metaMaskConnector });
    } catch (error) {
      console.error('MetaMask connection error:', error);
      setSelectedWallet(null);
    }
  };

  const handlePhantomConnect = async () => {
    if (!phantomConnector || !hasPhantom) return;
    
    console.log('👻 Connecting to Phantom with connector:', phantomConnector.id);
    setSelectedWallet('phantom');
    
    try {
      await connect({ connector: phantomConnector });
    } catch (error) {
      console.error('Phantom connection error:', error);
      setSelectedWallet(null);
    }
  };

  const handleCoinbaseConnect = () => {
    if (!coinbaseConnector) return;
    
    console.log('🔵 Connecting to Coinbase Wallet...');
    setSelectedWallet('coinbase');
    connect({ connector: coinbaseConnector });
  };

  return (
    <div className="space-y-3">
      {/* Coinbase Wallet */}
      {coinbaseConnector && (
        <button
          onClick={handleCoinbaseConnect}
          disabled={isPending}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="flex items-center gap-3">
            <WalletIcon className="w-5 h-5" />
            <span className="font-medium">Coinbase Wallet</span>
          </div>
          {isPending && selectedWallet === 'coinbase' && (
            <div className="w-4 h-4 border-2 border-base-blue border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      )}

      {/* MetaMask */}
      {hasMetaMask && metaMaskConnector && (
        <button
          onClick={handleMetaMaskConnect}
          disabled={isPending}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="flex items-center gap-3">
            <WalletIcon className="w-5 h-5" />
            <span className="font-medium">MetaMask</span>
          </div>
          {isPending && selectedWallet === 'metamask' && (
            <div className="w-4 h-4 border-2 border-base-blue border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      )}

      {/* Phantom */}
      {hasPhantom && phantomConnector && (
        <button
          onClick={handlePhantomConnect}
          disabled={isPending}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="flex items-center gap-3">
            <WalletIcon className="w-5 h-5" />
            <span className="font-medium">Phantom</span>
          </div>
          {isPending && selectedWallet === 'phantom' && (
            <div className="w-4 h-4 border-2 border-base-blue border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      )}

      {/* Show message if no wallets detected */}
      {!hasMetaMask && !hasPhantom && !coinbaseConnector && (
        <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-sm mb-2">No wallet extensions detected</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Please install MetaMask, Phantom, or Coinbase Wallet
          </p>
        </div>
      )}
    </div>
  );
}
