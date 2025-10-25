'use client';

import { createContext, useContext, ReactNode } from 'react';

type ExportModalContextType = {
  showExportModal: (chain: 'ethereum' | 'solana', address: string) => void;
  hideExportModal: () => void;
};

const ExportModalContext = createContext<ExportModalContextType | undefined>(undefined);

export function ExportModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chain, setChain] = useState<'ethereum' | 'solana'>('ethereum');
  const [address, setAddress] = useState('');

  const showExportModal = (chain: 'ethereum' | 'solana', address: string) => {
    setChain(chain);
    setAddress(address);
    setIsOpen(true);
  };

  const hideExportModal = () => {
    setIsOpen(false);
  };

  return (
    <ExportModalContext.Provider value={{ showExportModal, hideExportModal }}>
      {children}
      {isOpen && (
        <ExportModalPortal 
          chain={chain} 
          address={address} 
          onClose={hideExportModal} 
        />
      )}
    </ExportModalContext.Provider>
  );
}

export function useExportModal() {
  const context = useContext(ExportModalContext);
  if (!context) {
    throw new Error('useExportModal must be used within ExportModalProvider');
  }
  return context;
}

// Portal component
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useExportEvmAccount, useExportSolanaAccount } from '@coinbase/cdp-hooks';
import { AlertTriangle, Copy, X, Check } from 'lucide-react';

type ExportStep = 'warning' | 'exporting' | 'success';

function ExportModalPortal({ 
  chain, 
  address, 
  onClose 
}: { 
  chain: 'ethereum' | 'solana'; 
  address: string; 
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<ExportStep>('warning');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { exportEvmAccount } = useExportEvmAccount();
  const { exportSolanaAccount } = useExportSolanaAccount();

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleExport = async () => {
    setStep('exporting');
    setError('');

    try {
      let key: string;
      
      if (chain === 'ethereum') {
        const result = await exportEvmAccount({ evmAccount: address.startsWith('0x') ? address as `0x${string}` : `0x${address}` as `0x${string}` });
        key = result.privateKey;
      } else {
        const result = await exportSolanaAccount({ solanaAccount: address });
        key = result.privateKey;
      }

      setPrivateKey(key);
      setStep('success');
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to export private key');
      setStep('warning');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 99999 
      }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'warning' && (
          <>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-negative/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-negative" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Export Private Key
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {chain === 'ethereum' ? 'Ethereum' : 'Solana'} Wallet
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
                style={{ backgroundColor: 'var(--surface)' }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-negative/10 border border-negative/20">
                <p className="text-sm text-negative font-medium mb-2">
                  ⚠️ Critical Security Warning
                </p>
                <p className="text-sm text-negative">
                  Anyone with your private key has <strong>complete control</strong> of your wallet and can steal all your assets.
                </p>
              </div>

              <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Before proceeding, you must understand:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-negative mt-0.5">•</span>
                    <span>Never share your private key with anyone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-negative mt-0.5">•</span>
                    <span>Store it securely offline in a safe location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-negative mt-0.5">•</span>
                    <span>Clear your clipboard immediately after copying</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-negative mt-0.5">•</span>
                    <span>We cannot recover lost or stolen private keys</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-negative/10 border border-negative/20">
                  <p className="text-sm text-negative">{error}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3" style={{ borderColor: 'var(--card-border)' }}>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-negative text-white hover:bg-negative/90 transition-colors"
              >
                I Understand, Export Key
              </button>
            </div>
          </>
        )}

        {step === 'exporting' && (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-base-blue border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Exporting private key...
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <>
            <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Private Key Exported
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Copy your key and store it securely
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-negative/10 border border-negative/20">
                <p className="text-xs text-negative mb-2 font-medium">
                  ⚠️ This key will only be shown once
                </p>
                <p className="text-xs text-negative">
                  Make sure to copy and store it securely before closing this window.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Your Private Key
                </label>
                <div 
                  className="p-3 rounded-lg border font-mono text-xs break-all"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {privateKey}
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: copied ? 'var(--positive)' : 'var(--surface)', 
                  color: copied ? 'white' : 'var(--text-primary)' 
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>

              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <strong className="block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Next steps:
                  </strong>
                  1. Paste into secure storage<br/>
                  2. Clear your clipboard<br/>
                  3. Never share this key
                </p>
              </div>
            </div>

            <div className="p-6 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-base-blue text-white hover:bg-base-blue/90 transition-colors"
              >
                Done - I've Saved My Key
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
