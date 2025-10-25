'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { EmbeddedWalletHeader } from '@/components/auth/EmbeddedWalletHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';

interface HeaderProps {
  isMainnet: boolean;
  networkName: string;
}

export function Header({ isMainnet, networkName }: HeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Helper to check if link is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  // Get link classes with active state
  const getLinkClasses = (path: string) => {
    const baseClasses = "text-sm font-medium transition-colors hover:text-base-blue focus:outline-none focus:ring-2 focus:ring-base-blue focus:ring-offset-2 rounded-sm px-1 py-1";
    const activeClasses = isActive(path) 
      ? "text-base-blue border-b-2 border-base-blue" 
      : "";
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <>
      {/* Skip to main content link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-base-blue focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-base-blue"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-[150] border-b backdrop-blur-sm" style={{ 
        borderColor: 'var(--card-border)',
        backgroundColor: 'var(--background)',
        opacity: 0.95
      }}>
        <div className="mx-auto flex w-full max-w-[clamp(1024px,calc(1024px+(100vw-1024px)*0.25),1248px)] justify-center px-4 md:px-6 lg:px-8">
          <div className="flex h-[72px] w-full items-center justify-between">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-base-blue focus:ring-offset-2 rounded-sm"
              aria-label="x402 Pioneers home"
            >
              <Image
                src="/images/logo-64.png"
                alt="X402"
                width={32}
                height={32}
                className="h-8 w-8 rounded-[4px]"
                priority
              />
              <span className="hidden font-sans text-xl font-medium sm:block" style={{ color: 'var(--text-primary)' }}>
                x402 Pioneers
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="items-center hidden space-x-8 md:flex" aria-label="Primary navigation">
              <Link 
                href="/" 
                className={getLinkClasses('/')}
                aria-current={isActive('/') ? 'page' : undefined}
              >
                Home
              </Link>
              <Link 
                href="/mint" 
                className={getLinkClasses('/mint')}
                aria-current={isActive('/mint') ? 'page' : undefined}
              >
                Mint
              </Link>
              <a 
                href="https://docs.cdp.coinbase.com/x402/welcome" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors hover:text-base-blue focus:outline-none focus:ring-2 focus:ring-base-blue focus:ring-offset-2 rounded-sm px-1 py-1 inline-flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Docs
                <svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                  />
                </svg>
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </nav>

            {/* Network Status, Theme Toggle & Wallet */}
            <div className="flex items-center space-x-4">
              {/* Network Status Indicator */}
              <div 
                className="hidden sm:flex items-center space-x-2" 
                role="status" 
                aria-label={`Connected to ${networkName} network`}
                aria-live="polite"
              >
                <div 
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    isMainnet ? 'bg-positive' : 'bg-warning'
                  }`}
                  aria-hidden="true"
                  title={isMainnet ? 'Mainnet' : 'Testnet'}
                ></div>
                <span className={`text-sm font-medium font-mono ${
                  isMainnet ? 'text-positive' : 'text-warning'
                }`}>
                  {networkName}
                </span>
              </div>
              
              {/* Theme Toggle - Hidden on mobile, shown on desktop */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              
              {/* Embedded Wallet Status - Hidden on mobile, shown on desktop */}
              <div className="hidden md:block">
                <EmbeddedWalletHeader />
              </div>
              
              {/* Mobile menu button */}
              <button 
                className="p-2 md:hidden hover:text-base-blue transition-colors focus:outline-none focus:ring-2 focus:ring-base-blue focus:ring-offset-2 rounded-sm"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  aria-hidden="true"
                >
                  {isMobileMenuOpen ? (
                    <path 
                      d="M6 18L18 6M6 6l12 12" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                  ) : (
                    <path 
                      d="M3 12h18M3 6h18M3 18h18" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div 
            id="mobile-menu" 
            className="md:hidden border-t overflow-y-auto"
            style={{
              borderColor: 'var(--card-border)',
              backgroundColor: 'var(--background)',
              minHeight: 'calc(100vh - 72px)'
            }}
            role="navigation" 
            aria-label="Mobile navigation"
          >
          <div className="px-4 py-4 space-y-3">
            {/* Wallet - First item in mobile menu */}
            <div className="mb-4">
              <EmbeddedWalletHeader isMobileMenu={true} />
            </div>
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/') 
                  ? 'text-base-blue' 
                  : 'hover:text-base-blue'
              }`}
              style={!isActive('/') ? { color: 'var(--text-secondary)' } : {}}
              aria-current={isActive('/') ? 'page' : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/mint" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/mint') 
                  ? 'text-base-blue' 
                  : 'hover:text-base-blue'
              }`}
              style={!isActive('/mint') ? { color: 'var(--text-secondary)' } : {}}
              aria-current={isActive('/mint') ? 'page' : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Mint
            </Link>
            <Link 
              href="https://docs.cdp.coinbase.com/x402/welcome" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium hover:text-base-blue transition-colors items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Docs
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                />
              </svg>
              <span className="sr-only">(opens in new tab)</span>
            </Link>
            
            {/* Theme toggle and network status in mobile menu */}
            <div className="px-3 py-2 border-t mt-2 pt-4 space-y-3" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Theme</span>
                <ThemeToggle />
              </div>
              <div 
                className="flex items-center space-x-2" 
                role="status" 
                aria-label={`Connected to ${networkName} network`}
              >
                <div 
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    isMainnet ? 'bg-positive' : 'bg-warning'
                  }`}
                  aria-hidden="true"
                ></div>
                <span className={`text-sm font-medium font-mono ${
                  isMainnet ? 'text-positive' : 'text-warning'
                }`}>
                  {networkName}
                </span>
              </div>
            </div>
          </div>
        </div>
        )}
      </header>
    </>
  );
}
