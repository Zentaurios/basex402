'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AuthButton } from '@coinbase/cdp-react/components/AuthButton';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Mail, Link as LinkIcon } from 'lucide-react';
import { useWallet } from './WalletProvider';

type LoginMethod = 'embedded' | 'external';

export function GlobalWalletModal() {
  const { isModalOpen, closeModal, isConnected } = useWallet();
  const [selectedMethod, setSelectedMethod] = useState<LoginMethod>('embedded');
  const [mounted, setMounted] = useState(false);
  const [wasConnectedOnOpen, setWasConnectedOnOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track connection state when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setWasConnectedOnOpen(isConnected);
    }
  }, [isModalOpen, isConnected]);

  // Only close modal if wallet connects AFTER modal was opened while disconnected
  useEffect(() => {
    if (isModalOpen && isConnected && !wasConnectedOnOpen) {
      closeModal();
    }
  }, [isConnected, isModalOpen, wasConnectedOnOpen, closeModal]);

  if (!mounted || !isModalOpen) {
    return null;
  }

  const modalContent = (
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

        {/* Tab Content */}
        <div className="p-6">
          {selectedMethod === 'embedded' ? (
            <div className="space-y-4">
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Create a wallet instantly using your email. No extensions or seed phrases needed.
              </p>
              <div className="flex justify-center py-4">
                <AuthButton />
              </div>
              <div className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
                If you do not have one, a wallet will be created automatically
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Connect using Coinbase Wallet, MetaMask, Phantom, or any wallet via WalletConnect.
              </p>
              <div className="flex justify-center py-4">
                <Wallet>
                  <ConnectWallet 
                    disconnectedLabel="Connect Wallet"
                    className="ock-wallet-button"
                  />
                </Wallet>
              </div>
              <div className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
                Supports Coinbase Wallet, MetaMask, Phantom & more
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
  );

  return createPortal(modalContent, document.body);
}
