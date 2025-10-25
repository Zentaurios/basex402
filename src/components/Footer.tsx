import Link from "next/link";
import Image from "next/image";

interface FooterProps {
  isMainnet: boolean;
  networkName: string;
}

export function Footer({ isMainnet, networkName }: FooterProps) {
  return (
    <footer className="mt-20 border-t" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--card-border)' }}>
      <div className="mx-auto flex w-full max-w-[clamp(1024px,calc(1024px+(100vw-1024px)*0.25),1248px)] justify-center px-4 md:px-6 lg:px-8">
        <div className="w-full py-12 space-y-12">
          {/* x402 Pioneers Section */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4 space-x-3">
                <Image
                  src="/images/logo-64.png"
                  alt="X402"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-[4px]"
                />
                <span className="font-sans text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                  x402 Pioneers
                </span>
              </div>
              <p className="max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
                Mint and trade x402 micropayments on {networkName}. 
                Built with Coinbase Developer Platform.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>BaseX402</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/about" 
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    About
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://x.com/basex402" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    X
                  </a>
                </li>
                <li>
                  <a 
                    href="https://t.me/basex402"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Telegram
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/terms"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/privacy"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Base Section */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4 space-x-3">
                <div className="h-8 w-8 bg-base-blue rounded-[4px]"></div>
                <span className="font-sans text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                  Base
                </span>
              </div>
              <p className="max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
                Base is a secure, low-cost Ethereum Layer 2 blockchain built by Coinbase. 
                Bringing the next billion users onchain.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Base Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://base.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Website
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.base.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Base Docs
                  </a>
                </li>
                <li>
                  <a 
                    href={isMainnet ? "https://basescan.org" : "https://sepolia.basescan.org"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    BaseScan
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Base Community</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://x.com/base" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    X
                  </a>
                </li>
                <li>
                  <a 
                    href="https://discord.com/invite/buildonbase" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/base-org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Coinbase Section */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="relative h-8" style={{ width: '120px' }}>
                  <Image
                    src="/images/Coinbase_Wordmark.svg"
                    alt="Coinbase"
                    width={120}
                    height={32}
                    className="h-8 w-auto"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(214deg) brightness(97%) contrast(102%)'
                    }}
                  />
                </div>
              </div>
              <p className="max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
                Coinbase Developer Platform provides the tools and infrastructure to build the next generation of onchain applications.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Coinbase Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://docs.cdp.coinbase.com/x402/welcome" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    x402 Docs
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.cdp.coinbase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    CDP Docs
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.cdp.coinbase.com/wallet-sdk/docs/welcome" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Smart Wallet Docs
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Coinbase Community</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://www.coinbase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Website
                  </a>
                </li>
                <li>
                  <a 
                    href="https://x.com/CoinbaseDev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    X
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.coinbase.com/blog" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-sm tracking-wide uppercase transition-colors hover:text-base-blue"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="pt-8 mt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <div className="max-w-4xl mx-auto">
              <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <strong className="font-medium">Disclaimer:</strong> x402 NFTs are digital collectibles created to celebrate and demonstrate the x402 micropayments protocol. This project is independently developed and is not officially affiliated with, endorsed by, or sponsored by Base or Coinbase.
              </p>
            </div>
          </div>
          
          <div className="pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex flex-col items-center justify-between text-sm md:flex-row" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Built on Base using Coinbase Developer Platform
              </p>
              <div className="flex items-center mt-4 space-x-4 md:mt-0">
                <span className="font-mono">
                  {isMainnet ? 'Production' : 'Development'} • {networkName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
