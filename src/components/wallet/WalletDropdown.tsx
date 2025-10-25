'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  useIsSignedIn, 
  useEvmAddress, 
  useSignOut,
  useCurrentUser,
  useSolanaAddress,
  useExportEvmAccount,
  useExportSolanaAccount
} from '@coinbase/cdp-hooks';
import { useDisconnect } from 'wagmi';
import { useWallet as useWalletContext } from '@/components/wallet/WalletProvider';
import { 
  Wallet, 
  Copy, 
  LogOut, 
  Send, 
  Key, 
  Image as ImageIcon,
  ChevronDown,
  Check,
  AlertTriangle,
  X,
  ArrowLeft,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { getTokenBalances } from '@/app/actions/token-balances';
import { getSolanaTokenBalances } from '@/app/actions/solana-token-balances';
import { formatTokenAmount } from '@/lib/utils/token';
import { SendTab } from './SendTab';
import { filterTokens, sortTokens, type FilteredToken } from '@/lib/tokens';

type Chain = 'ethereum' | 'solana';
type ExportStep = 'warning' | 'exporting' | 'success';

type TokenBalance = {
  amount: {
    amount: string;
    decimals: number;
  };
  token: {
    network?: string;
    symbol?: string;
    name?: string;
    contractAddress?: string; // For EVM
    mintAddress?: string;     // For Solana
  };
};

interface WalletDropdownProps {
  isMobileMenu?: boolean;
}

export function WalletDropdown({ isMobileMenu = false }: WalletDropdownProps) {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { solanaAddress } = useSolanaAddress();
  const { signOut } = useSignOut();
  const { currentUser } = useCurrentUser();
  const { exportEvmAccount } = useExportEvmAccount();
  const { exportSolanaAccount } = useExportSolanaAccount();
  const { disconnect } = useDisconnect();
  const { address: walletAddress, walletType: connectedWalletType } = useWalletContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeChain, setActiveChain] = useState<Chain>('ethereum');
  const [activeTab, setActiveTab] = useState<'assets' | 'nfts' | 'send'>('assets');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStep, setExportStep] = useState<ExportStep>('warning');
  const [privateKey, setPrivateKey] = useState('');
  const [exportError, setExportError] = useState('');
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showUnverified, setShowUnverified] = useState(false); // Toggle for spam tokens
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close menu if clicking outside of it
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      
      // Close dropdown if clicking outside of it
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowMenu(false);
        if (showExportModal) {
          setShowExportModal(false);
          setExportStep('warning');
          setPrivateKey('');
          setExportError('');
        }
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showExportModal]);

  // Hold-down button progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isHolding && holdProgress < 100) {
      interval = setInterval(() => {
        setHoldProgress(prev => {
          const next = prev + 2; // 2% per 100ms = 5 seconds total
          if (next >= 100) {
            setIsHolding(false);
            // Trigger export when hold completes
            setTimeout(() => handleExportKey(), 0);
            return 100;
          }
          return next;
        });
      }, 100);
    } else if (!isHolding && holdProgress > 0 && holdProgress < 100) {
      // Reset if released early
      setHoldProgress(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHolding, holdProgress]);

  // Fetch token balances (only if API credentials are configured)
  useEffect(() => {
    async function fetchBalances() {
      if (!activeTab || (activeTab !== 'assets' && activeTab !== 'send')) return;

      setLoadingBalances(true);
      try {
        let tokenBalances: TokenBalance[] = [];
        
        if (activeChain === 'ethereum' && evmAddress) {
          tokenBalances = await getTokenBalances(evmAddress);
        } else if (activeChain === 'solana' && solanaAddress) {
          tokenBalances = await getSolanaTokenBalances(solanaAddress);
        }
        
        setBalances(tokenBalances);
      } catch (error) {
        console.error('Failed to fetch balances:', error);
        // Set empty array so we show "No assets found" instead of loading forever
        setBalances([]);
      } finally {
        setLoadingBalances(false);
      }
    }

    fetchBalances();
  }, [activeChain, evmAddress, solanaAddress, activeTab]);

  const handleCopyAddress = async () => {
    const address = activeChain === 'ethereum' ? evmAddress : solanaAddress;
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleCopyPrivateKey = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy private key:', error);
    }
  };

  const handleExportKey = async () => {
    setExportStep('exporting');
    setExportError('');

    try {
      let key: string;
      
      if (activeChain === 'ethereum') {
        // For smart accounts, we need to export the owner EOA, not the smart account itself
        const ownerEoa = currentUser?.evmAccounts?.[0];
        if (!ownerEoa) throw new Error('No Ethereum owner account available');
        
        // Export the owner EOA that controls the smart account
        // Note: CDP SDK may log a temporary secret warning to console, but export still succeeds
        const result = await exportEvmAccount({
          evmAccount: ownerEoa
        });
        key = result.privateKey;
      } else {
        // For Solana, export the solana account
        const solAccount = currentUser?.solanaAccounts?.[0] || solanaAddress;
        if (!solAccount) throw new Error('No Solana account available');
        
        const result = await exportSolanaAccount({
          solanaAccount: solAccount
        });
        key = result.privateKey;
      }

      setPrivateKey(key);
      setExportStep('success');
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Failed to export private key');
      setExportStep('warning');
    }
  };

  const handleCloseExport = () => {
    setShowExportModal(false);
    setExportStep('warning');
    setPrivateKey('');
    setExportError('');
    setKeyCopied(false);
    setHoldProgress(0);
    setIsHolding(false);
  };

  const handleSignOut = async () => {
    try {
      // Set a flag BEFORE signing out to prevent auto-restore
      try {
        localStorage.setItem('cdp-force-signout', 'true');
        sessionStorage.setItem('cdp-force-signout', 'true');
      } catch (e) {
        // Ignore
      }
      
      setIsOpen(false);
      
      // Disconnect external wallet if connected
      if (connectedWalletType === 'external') {
        console.log('Disconnecting external wallet');
        disconnect();
      }
      
      // Sign out of CDP embedded wallet if signed in
      if (isSignedIn) {
        console.log('Signing out of CDP wallet');
        await signOut();
      }
      
      // Clear all storage
      const storageKeys = [
        'cdp:session',
        'cdp:user',
        'cdp:wallet',
        'cdp:auth',
        'cdp-session',
        'cdp-user',
        'cdp-auth-token',
        'wagmi.store',
        'wagmi.cache',
        'wagmi.connected',
      ];
      
      storageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          // Ignore
        }
      });
      
      // Clear any keys starting with 'cdp' or 'wagmi'
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('cdp') || key.startsWith('wagmi')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('cdp') || key.startsWith('wagmi')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        // Ignore
      }
      
      // Force a page reload
      window.location.href = '/?t=' + Date.now();
    } catch (error) {
      console.error('Sign out failed:', error);
      window.location.href = '/?t=' + Date.now();
    }
  };

  if (!walletAddress) {
    // Return null - the parent EmbeddedWalletHeader will show the login button
    return null;
  }

  // Use CDP address for embedded wallet, or walletAddress for external wallet
  const displayAddress = evmAddress || walletAddress;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const currentAddress = activeChain === 'ethereum' ? evmAddress : solanaAddress;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-opacity-80 ${
          isMobileMenu ? 'w-full justify-between' : ''
        }`}
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
            {formatAddress(displayAddress)}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          style={{ color: 'var(--text-muted)' }} 
        />
      </button>

      {isOpen && (
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
          {showExportModal ? (
            <>
              {exportStep === 'warning' && (
                <>
                  <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCloseExport}
                        className="p-1 rounded transition-colors hover:bg-opacity-80"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          Export Owner Private Key
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {activeChain === 'ethereum' ? 'Owner EOA that controls your Smart Account' : 'Solana Wallet'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    <div className="p-3 rounded-lg bg-negative/10 border border-negative/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-negative mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-negative mb-1">
                            Critical Security Warning
                          </p>
                          <p className="text-xs text-negative">
                            Anyone with your private key has complete control of your wallet.
                          </p>
                        </div>
                      </div>
                    </div>

                    {activeChain === 'ethereum' && (
                      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--card-border)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          ℹ️ About Smart Accounts
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          You're exporting the private key for the EOA (owner account) that controls your Smart Account. This key gives full control over your Smart Account and all its assets.
                        </p>
                      </div>
                )}

                    <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        You must understand:
                      </p>
                      <ul className="space-y-1.5 ml-3">
                        <li className="flex gap-2">
                          <span className="text-negative">•</span>
                          <span>Never share your private key</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-negative">•</span>
                          <span>Store it securely offline</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-negative">•</span>
                          <span>Clear clipboard after copying</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-negative">•</span>
                          <span>We cannot recover stolen keys</span>
                        </li>
                      </ul>
                    </div>

                    {exportError && (
                      <div className="p-2 rounded bg-negative/10 border border-negative/20">
                        <p className="text-xs text-negative">{exportError}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--card-border)' }}>
                    <button
                      onMouseDown={() => setIsHolding(true)}
                      onMouseUp={() => setIsHolding(false)}
                      onMouseLeave={() => setIsHolding(false)}
                      onTouchStart={() => setIsHolding(true)}
                      onTouchEnd={() => setIsHolding(false)}
                      className="w-full relative px-4 py-3 rounded-lg text-sm font-medium text-white overflow-hidden transition-opacity"
                      style={{ backgroundColor: 'var(--negative)' }}
                    >
                      <div
                        className="absolute inset-0 bg-white/20 transition-all"
                        style={{
                          width: `${holdProgress}%`,
                          transition: isHolding ? 'none' : 'width 0.2s ease-out'
                        }}
                      />
                      <span className="relative z-10">
                        {holdProgress === 0 ? 'Hold to Export Private Key' : 
                         holdProgress < 100 ? `Hold... ${Math.ceil((100 - holdProgress) / 20)}s` : 
                         'Exporting...'}
                      </span>
                    </button>
                    <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                      Release early to cancel
                    </p>
                    <button
                      onClick={handleCloseExport}
                      className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {exportStep === 'exporting' && (
                <div className="p-8">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 border-4 border-base-blue border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      Exporting private key...
                    </p>
                  </div>
                </div>
              )}

              {exportStep === 'success' && (
                <>
                  <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        Private Key Exported
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {activeChain === 'ethereum' ? 'Owner EOA Key' : 'Private Key'}
                      </p>
                    </div>
                    <button
                      onClick={handleCloseExport}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    <div className="p-2 rounded bg-negative/10 border border-negative/20">
                      <p className="text-xs text-negative">
                        ⚠️ Store this key securely. Anyone with this key controls your wallet.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Your Private Key
                      </label>
                      <div 
                        className="p-2 rounded border font-mono text-[10px] break-all leading-relaxed"
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
                      onClick={handleCopyPrivateKey}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      style={{ 
                        backgroundColor: keyCopied ? 'var(--positive)' : 'var(--surface)', 
                        color: keyCopied ? 'white' : 'var(--text-primary)' 
                      }}
                    >
                      {keyCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy to Clipboard
                        </>
                      )}
                    </button>

                    <div className="p-2 rounded text-xs" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                      <strong className="block mb-1" style={{ color: 'var(--text-primary)' }}>Next steps:</strong>
                      1. Paste into secure storage<br/>
                      2. Clear your clipboard<br/>
                      3. Never share this key
                    </div>
                  </div>

                  <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                    <button
                      onClick={handleCloseExport}
                      className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-base-blue text-white hover:bg-base-blue/90 transition-colors"
                    >
                      Done - I've Saved My Key
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>  
              <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-center relative">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveChain('ethereum')}
                      className="flex items-center justify-center p-2 rounded-lg transition-all"
                      style={{
                        backgroundColor: activeChain === 'ethereum' ? 'var(--surface)' : 'transparent',
                      }}
                      title="Ethereum"
                    >
                      <EthereumLogo active={activeChain === 'ethereum'} />
                    </button>
                    {/* Only show Solana for embedded wallets */}
                    {connectedWalletType === 'embedded' && (
                      <button
                        onClick={() => setActiveChain('solana')}
                        className="flex items-center justify-center p-2 rounded-lg transition-all"
                        style={{
                          backgroundColor: activeChain === 'solana' ? 'var(--surface)' : 'transparent',
                        }}
                        title="Solana"
                      >
                        <SolanaLogo active={activeChain === 'solana'} />
                      </button>
                    )}
                  </div>
                  
                  {/* Menu Button - Absolute positioned on right */}
                  <div className="absolute right-0" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
                      style={{ backgroundColor: showMenu ? 'var(--surface)' : 'transparent' }}
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showMenu && (
                      <div 
                        className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-[300]"
                        style={{ 
                          backgroundColor: 'var(--card)', 
                          borderColor: 'var(--card-border)' 
                        }}
                      >
                        <button
                          onClick={() => {
                            setShowUnverified(!showUnverified);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 px-4 py-3 text-sm transition-colors rounded-t-lg"
                          style={{ 
                            color: 'var(--text-primary)',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {showUnverified ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          <span>{showUnverified ? 'Hide' : 'Show'} Unverified Tokens</span>
                        </button>
                        {/* Only show export private key for embedded wallets */}
                        {connectedWalletType === 'embedded' && (
                          <button
                            onClick={() => {
                              setShowExportModal(true);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-3 text-sm transition-colors rounded-b-lg"
                            style={{ 
                              color: 'var(--text-primary)',
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Key className="w-4 h-4" />
                            <span>Export Private Key</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {activeChain === 'ethereum' ? 'Ethereum' : 'Solana'} Address
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
                  {currentAddress || 'No address available'}
                </div>
              </div>

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

              <div className="p-4 overflow-y-auto flex-1">
                {activeTab === 'assets' && (
                  loadingBalances ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-base-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : balances && balances.length > 0 ? (
                          <div className="space-y-2">
                            {(() => {
                              // Filter spam tokens
                              const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
                              const filteredBalances = sortTokens(filterTokens(balances, {
                                chain: activeChain,
                                network: isMainnet ? 'mainnet' : 'testnet',
                                showUnverified: showUnverified, // Use state for toggle
                              }));
                              
                              console.log('WalletDropdown filtering:', {
                                chain: activeChain,
                                total: balances.length,
                                filtered: filteredBalances.length,
                                hidden: balances.length - filteredBalances.length,
                              });
                              
                              if (filteredBalances.length === 0) {
                                return (
                                  <div className="text-center py-8">
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                      No verified tokens found
                                    </p>
                                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                      Spam tokens are hidden for your safety
                                    </p>
                                  </div>
                                );
                              }
                              
                              return filteredBalances.map((balance, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-opacity-50"
                                  style={{ backgroundColor: 'var(--surface)' }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: 'var(--card-border)' }}
                                    >
                                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {balance.token.symbol?.slice(0, 1) || '?'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {balance.token.symbol || 'Unknown'}
                                      </p>
                                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {balance.token.name || 
                                          (balance.token.contractAddress 
                                            ? balance.token.contractAddress.slice(0, 6) + '...' + balance.token.contractAddress.slice(-4)
                                            : balance.token.mintAddress 
                                              ? balance.token.mintAddress.slice(0, 6) + '...' + balance.token.mintAddress.slice(-4)
                                              : 'Unknown'
                                          )
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                                      {formatTokenAmount(balance.amount.amount, balance.amount.decimals)}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                      {balance.token.symbol}
                                    </p>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              No assets found
                            </p>
                          </div>
                        )
                    )}
                {activeTab === 'nfts' && (
                  <div className="text-center py-8 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    NFTs coming soon
                  </div>
                )}
                {activeTab === 'send' && (
                  <SendTab
                    chain={activeChain}
                    userAddress={currentAddress || ''}
                    balances={balances || []}
                  />
                )}
              </div>

              <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-opacity-80"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EthereumLogo({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" 
        fill={active ? '#0000ff' : '#8A92A6'} />
    </svg>
  );
}

function SolanaLogo({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4.08 17.37a.7.7 0 01.5-.2h16.42a.35.35 0 01.25.6l-2.92 2.92a.7.7 0 01-.5.2H1.41a.35.35 0 01-.25-.6l2.92-2.92zm0-14.74a.7.7 0 01.5-.2h16.42a.35.35 0 01.25.6L18.33 5.95a.7.7 0 01-.5.2H1.41a.35.35 0 01-.25-.6l2.92-2.92zM18.33 11.31a.7.7 0 00-.5-.2H1.41a.35.35 0 00-.25.6l2.92 2.92a.7.7 0 00.5.2h16.42a.35.35 0 00.25-.6l-2.92-2.92z" 
        fill={active ? '#14F195' : '#8A92A6'} />
    </svg>
  );
}

function SolanaPlaceholder() {
  return (
    <div className="text-center py-8">
      <div className="mb-4 flex justify-center">
        <SolanaLogo active={true} />
      </div>
      <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
        You have a Solana wallet.
      </p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Functionality coming soon.
      </p>
    </div>
  );
}
