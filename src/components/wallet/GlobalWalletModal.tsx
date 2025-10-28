'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AuthButton } from '@coinbase/cdp-react/components/AuthButton';
import { Mail, Link as LinkIcon } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { useAccount, useDisconnect } from 'wagmi';
import { OnchainKitWalletBridge } from '@/components/wallet/OnchainKitWalletBridge';
import { ExternalWalletConnect } from './ExternalWalletConnect';

type LoginMethod = 'embedded' | 'external';

export function GlobalWalletModal() {
  const { isModalOpen, closeModal, isConnected } = useWallet();
  const [selectedMethod, setSelectedMethod] = useState<LoginMethod>('embedded');
  const [mounted, setMounted] = useState(false);
  const [wasConnectedOnOpen, setWasConnectedOnOpen] = useState(false);
  
  // Get wagmi state to check for external wallet connections
  const { isConnected: isWagmiConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track connection state when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setWasConnectedOnOpen(isConnected);
    }
  }, [isModalOpen, isConnected]);

  // Close modal when external wallet connects
  useEffect(() => {
    if (isModalOpen && isWagmiConnected && selectedMethod === 'external' && !wasConnectedOnOpen) {
      console.log('✅ External wallet connected, closing modal');
      closeModal();
    }
  }, [isWagmiConnected, isModalOpen, selectedMethod, wasConnectedOnOpen, closeModal]);
  
  // Also close if custom provider detects connection
  useEffect(() => {
    if (isModalOpen && isConnected && !wasConnectedOnOpen) {
      console.log('✅ Wallet connected via custom provider, closing modal');
      closeModal();
    }
  }, [isConnected, isModalOpen, wasConnectedOnOpen, closeModal]);
  
  // Disconnect wagmi when switching to embedded wallet tab
  useEffect(() => {
    if (selectedMethod === 'embedded' && isWagmiConnected) {
      console.log('🔄 Switching to embedded wallet, disconnecting external wallet');
      disconnect();
    }
  }, [selectedMethod, isWagmiConnected, disconnect]);

  if (!mounted || !isModalOpen) {
    return null;
  }

  const modalContent = (
    <>
      <OnchainKitWalletBridge />
      <div 
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={closeModal}
    >
      <div 
        className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden my-8 relative z-[9999]"
        style={{ backgroundColor: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Connect to BaseX402
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Choose your preferred login method
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={() => setSelectedMethod('embedded')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              selectedMethod === 'embedded' ? 'border-b-2' : ''
            }`}
            style={{
              color: selectedMethod === 'embedded' ? 'var(--base-blue)' : 'var(--text-secondary)',
              borderColor: selectedMethod === 'embedded' ? 'var(--base-blue)' : 'transparent',
            }}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => setSelectedMethod('external')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              selectedMethod === 'external' ? 'border-b-2' : ''
            }`}
            style={{
              color: selectedMethod === 'external' ? 'var(--base-blue)' : 'var(--text-secondary)',
              borderColor: selectedMethod === 'external' ? 'var(--base-blue)' : 'transparent',
            }}
          >
            <LinkIcon className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>

        {/* Tab Content - Only render the active tab to avoid authentication conflicts */}
        <div className="p-6" key={selectedMethod}>
          {selectedMethod === 'embedded' && (
            <div className="space-y-4">
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Create a wallet instantly using your email. No extensions or seed phrases needed.
              </p>
              <div className="space-y-3">
                <div 
                  className="w-full flex items-center justify-center px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <AuthButton />
                </div>
              </div>
              <div className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
                If you do not have one, a wallet will be created automatically
              </div>
            </div>
          )}
          
          {selectedMethod === 'external' && (
            <div className="space-y-4">
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Connect using Coinbase Wallet, MetaMask, or other wallets.
              </p>
              <div className="py-2">
                <ExternalWalletConnect />
              </div>
              <div className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
                Coinbase Wallet, MetaMask, and Phantom supported
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={closeModal}
            className="w-full py-2 text-sm font-medium rounded-lg transition-colors hover:bg-opacity-80"
            style={{ 
              backgroundColor: 'var(--surface)', 
              color: 'var(--text-secondary)' 
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
