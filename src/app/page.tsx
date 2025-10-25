import Link from 'next/link';
import { ArrowRight, Zap, Award, Code, ExternalLink } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { generatePageMetadata } from '@/lib/metadata';
import { HeroStats, StatsSection, UrgencyAlert } from '@/components/NFTStats';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const networkName = isMainnet ? 'Base' : 'Base Sepolia';
const networkStatus = isMainnet ? 'Production' : 'Testnet';
const explorerUrl = isMainnet ? 'https://basescan.org' : 'https://sepolia.basescan.org';

// Total supply constant
const TOTAL_SUPPLY = 402;

export const metadata = generatePageMetadata(
  "x402 Pioneers | Limited Edition x402 Micropayments NFTs on Base",
  "Mint exclusive x402 NFTs celebrating the revolutionary x402 micropayments protocol. Only 402 collectible NFTs at $1 USDC each on Base blockchain.",
  "/images/og-home.png",
  ["Pioneer NFTs", "HTTP 402", "limited edition", "collectibles"]
);

export default function HomePage() {
  // Structured data for SEO - Product/Offer schema
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "x402NFT Collection",
    "description": "Limited collection of 402 NFTs commemorating early adoption of the x402 micropayments protocol",
    "mainEntity": {
      "@type": "Product",
      "name": "x402 Pioneer NFT",
      "description": "Limited edition NFT proving early adoption of Coinbase's x402 micropayments protocol",
      "brand": {
        "@type": "Organization",
        "name": "x402 Pioneers"
      },
      "offers": {
        "@type": "Offer",
        "price": "1",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": "https://basex402.com/mint",
        "itemCondition": "https://schema.org/NewCondition"
      },
      "aggregateRating": {
        "@type": "AggregateOffer",
        "offerCount": TOTAL_SUPPLY.toString(),
        "lowPrice": "1",
        "highPrice": "1",
        "priceCurrency": "USD"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <main className="mx-auto flex w-full max-w-[clamp(1024px,calc(1024px+(100vw-1024px)*0.25),1248px)] justify-center px-4 md:px-6 lg:px-8">
        <div className="w-full">
          {/* Hero Section */}
          <section aria-labelledby="hero-heading" className="mx-auto mb-[72px] grid w-full grid-cols-9 gap-x-[min(2.25vw,_32px)] lg:mb-20 lg:py-8 pt-8 md:pt-12">
            <div className="col-span-full">
              <div className="relative col-span-full min-h-[500px] md:min-h-[450px] w-full pb-0 lg:h-[40vh] lg:min-h-[500px] xl:h-[40vh] flex items-center justify-center">
                <div className="max-w-4xl text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-mono uppercase tracking-wide mb-6 ${
                    isMainnet 
                      ? 'bg-base-blue/10 text-base-blue' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    <Award className="w-4 h-4 mr-2" aria-hidden="true" />
                    Limited Edition • {networkName} • x402 Protocol
                  </div>
                  
                  <h1 
                    id="hero-heading"
                    className="text-currentColor text-balance font-sans text-[2.75rem] sm:text-[3.5rem] lg:text-[5rem] leading-[100%] tracking-[-0.175rem] lg:tracking-[-0.25rem] mb-6"
                  >
                    <span className="block">x402 Protocol</span>
                    <span className="block text-base-blue">Pioneer NFTs</span>
                  </h1>
                  
                  <p 
                    className="text-currentColor text-pretty font-sans-text text-[1.125rem] leading-[130%] tracking-[-0.015625rem] mb-8 max-w-2xl mx-auto"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Exclusive collectible NFTs proving early adoption of Coinbase's revolutionary x402 payment protocol.{' '}
                    <strong>Only 402 will ever exist.</strong>
                  </p>

                  {/* Collection Stats */}
                  <HeroStats />
                  
                  <nav aria-label="Primary actions" className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Link 
                      href="/mint"
                      className="group relative flex h-[2.5rem] w-fit items-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-sans font-medium transition-all duration-300 active:scale-95 bg-base-blue text-white hover:bg-base-black hover:text-base-blue border border-base-blue hover:border-base-black"
                      aria-label="Mint your x402NFT for 1 USDC"
                    >
                      <div className="z-10 flex items-center justify-end w-0 h-5 overflow-visible transition-all duration-300 opacity-0 md:w-5 md:opacity-100 md:group-hover:w-0 md:group-hover:opacity-0" aria-hidden="true">
                        <div className="h-5 w-5 flex-shrink-0 rounded-[2px] bg-white"></div>
                      </div>
                      <span className="z-10 font-medium whitespace-nowrap">Mint Your NFT</span>
                      <ArrowRight className="z-10 w-4 h-4 transition-all duration-300 opacity-100 md:w-0 md:opacity-0 md:group-hover:w-4 md:group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                    
                    <a 
                      href="https://docs.cdp.coinbase.com/x402/welcome"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex h-[2.5rem] w-fit items-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-sans font-normal transition-all duration-200 active:scale-95 bg-base-gray-50 text-base-black hover:bg-base-gray-100"
                      aria-label="Learn about x402 protocol (opens in new tab)"
                    >
                      <span className="z-10 whitespace-nowrap">Learn x402</span>
                      <ExternalLink className="z-10 w-4 h-4 ml-2" aria-hidden="true" />
                    </a>
                  </nav>

                  {/* Urgency messaging */}
                  <UrgencyAlert />
                </div>
              </div>
            </div>
          </section>

          {/* Collection Features Section */}
          <section aria-labelledby="features-heading" className="relative z-20 mx-auto mb-[72px] grid w-full grid-cols-9 gap-x-[min(2.25vw,_32px)] lg:mb-20 lg:py-8">
            <div className="col-span-full grid grid-cols-12 gap-x-[min(2.25vw,_32px)] gap-y-6 lg:gap-y-8">
              <div className="col-span-full lg:col-span-6 lg:max-w-[400px]">
                <h2 id="features-heading" className="text-currentColor text-balance font-sans text-[2.25rem] text-3xl leading-[1.125] tracking-[-0.96px]">
                  Exclusive x402 collectibles
                </h2>
              </div>
              <div className="flex flex-col gap-6 col-span-full lg:col-span-6 lg:mt-0">
                <div className="col-span-full lg:col-span-6 lg:max-w-[400px]">
                  <p className="text-currentColor text-pretty font-sans-text text-[1.125rem] leading-[130%] tracking-[-0.015625rem]" style={{ color: 'var(--text-secondary)' }}>
                    The world's first NFT collection minted entirely using Coinbase's x402 micropayment protocol. 
                    Each NFT is proof of your participation in this groundbreaking moment in internet payment history.
                  </p>
                </div>
              </div>
              
              <div className="col-span-full grid grid-cols-9 gap-x-[min(2.25vw,_32px)] gap-y-10 pt-2">
                <div className="col-span-full grid grid-cols-1 gap-x-[min(2.25vw,_32px)] gap-y-[min(2.25vw,_32px)] lg:grid-cols-3">
                  
                  {/* Feature 1 */}
                  <article className="p-6 transition-all duration-200 rounded-lg card">
                    <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-lg bg-base-blue/10" aria-hidden="true">
                      <Award className="w-6 h-6 text-base-blue" />
                    </div>
                    <h3 className="text-currentColor text-balance font-sans text-[1.5rem] leading-[110%] tracking-[-0.03125rem] mb-4">
                      Limited to 402 NFTs
                    </h3>
                    <p className="text-currentColor text-pretty font-sans-text text-[1rem] leading-[130%]" style={{ color: 'var(--text-secondary)' }}>
                      Matching the x402 protocol name, only 402 NFTs will ever be minted. 
                      Once they're gone, no more can ever be created.
                    </p>
                  </article>

                  {/* Feature 2 */}
                  <article className="p-6 transition-all duration-200 rounded-lg card">
                    <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-lg bg-positive/10" aria-hidden="true">
                      <Zap className="w-6 h-6 text-positive" />
                    </div>
                    <h3 className="text-currentColor text-balance font-sans text-[1.5rem] leading-[110%] tracking-[-0.03125rem] mb-4">
                      x402 Payment Experience
                    </h3>
                    <p className="text-currentColor text-pretty font-sans-text text-[1rem] leading-[130%]" style={{ color: 'var(--text-secondary)' }}>
                      Experience HTTP 402 Payment Required responses and instant USDC micropayments. 
                      Your NFT proves you used this revolutionary protocol.
                    </p>
                  </article>

                  {/* Feature 3 */}
                  <article className="p-6 transition-all duration-200 rounded-lg card">
                    <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-lg bg-warning/10" aria-hidden="true">
                      <Code className="w-6 h-6 text-warning" />
                    </div>
                    <h3 className="text-currentColor text-balance font-sans text-[1.5rem] leading-[110%] tracking-[-0.03125rem] mb-4">
                      {networkName} Native
                    </h3>
                    <p className="text-currentColor text-pretty font-sans-text text-[1rem] leading-[130%]" style={{ color: 'var(--text-secondary)' }}>
                      Minted directly on <strong>{networkName}</strong> with embedded wallet technology. 
                      No browser extensions needed - just email authentication.
                    </p>
                  </article>
                </div>
              </div>
            </div>
          </section>

          {/* Rarity Tiers */}
          <section aria-labelledby="rarity-heading" className="relative z-20 mx-auto mb-[72px] grid w-full grid-cols-9 gap-x-[min(2.25vw,_32px)] lg:mb-20 lg:py-8" style={{ color: 'var(--text-primary)' }}>
            <div className="col-span-full grid grid-cols-12 gap-x-[min(2.25vw,_32px)] gap-y-6 lg:gap-y-8">
              <header className="col-span-full">
                <h2 id="rarity-heading" className="text-currentColor text-balance font-sans text-[2.25rem] text-3xl leading-[1.125] tracking-[-0.96px] lg:-mb-8 -mb-6">
                  Rarity Tiers
                </h2>
              </header>
              <div className="col-span-full lg:col-span-6 lg:max-w-[400px]">
                <p className="text-currentColor text-balance font-sans text-[2.25rem] text-3xl leading-[1.125] tracking-[-0.96px] text-base-gray-200">
                  Earlier mints unlock special artwork and traits
                </p>
              </div>
              
              <div className="col-span-full grid grid-cols-9 gap-x-[min(2.25vw,_32px)] gap-y-10 pt-2">
                <div className="grid grid-cols-1 gap-8 col-span-full lg:grid-cols-4">
                  
                  <article className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#ffd12f] to-[#cc9e00]" aria-hidden="true">
                      <span className="text-2xl" role="img" aria-label="Trophy">🏆</span>
                    </div>
                    <h3 className="mb-4 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Genesis</h3>
                    <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>#1 - #10</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Golden artwork with special founder traits</p>
                  </article>

                  <article className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#0000ff] to-[#0000cc]" aria-hidden="true">
                      <span className="text-2xl" role="img" aria-label="Rocket">🚀</span>
                    </div>
                    <h3 className="mb-4 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Pioneer</h3>
                    <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>#11 - #100</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Silver artwork with early adopter status</p>
                  </article>

                  <article className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#000000]" aria-hidden="true">
                      <span className="text-2xl" role="img" aria-label="Lightning">⚡</span>
                    </div>
                    <h3 className="mb-4 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Early Adopter</h3>
                    <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>#101 - #225</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bronze artwork with adoption proof</p>
                  </article>

                  <article className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#ffffff] to-[#e0e0e0]" aria-hidden="true">
                      <span className="text-2xl" role="img" aria-label="Diamond">💎</span>
                    </div>
                    <h3 className="mb-4 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Protocol User</h3>
                    <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>#226 - #402</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Standard artwork with protocol proof</p>
                  </article>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section aria-label="Collection statistics" className="relative z-20 mx-auto mb-[72px] grid w-full grid-cols-9 gap-x-[min(2.25vw,_32px)] lg:mb-20 lg:py-8 rounded-lg p-8 card">
            <div className="col-span-full">
              <StatsSection isMainnet={isMainnet} networkStatus={networkStatus} />
            </div>
          </section>

          {/* Technology Stack */}
          <section aria-labelledby="technology-heading" className="relative z-20 mx-auto mb-[72px] grid w-full grid-cols-9 gap-x-[min(2.25vw,_32px)] lg:mb-20 lg:py-8">
            <div className="text-center col-span-full">
              <h2 id="technology-heading" className="mb-8 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Powered by Cutting-Edge Technology
              </h2>
              <ul className="flex flex-wrap items-center justify-center gap-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                <li className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-base-blue" aria-hidden="true"></div>
                  <span className="font-mono">x402 Protocol</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-positive" aria-hidden="true"></div>
                  <span className="font-mono">Embedded Wallets</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-warning" aria-hidden="true"></div>
                  <span className="font-mono">Server Wallets v2</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-negative" aria-hidden="true"></div>
                  <span className="font-mono">ERC-721 Standard</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA Section */}
          <section aria-labelledby="cta-heading" className="relative z-20 mx-auto mb-[72px] grid w-full grid-cols-9 gap-x-[min(2.25vw,_32px)] lg:mb-20 lg:py-8 bg-base-blue rounded-lg p-12 text-center">
            <div className="col-span-full">
              <h2 id="cta-heading" className="mb-4 text-3xl font-bold text-white">
                Claim Your x402 Pioneer Status
              </h2>
              <p className="max-w-2xl mx-auto mb-8 text-xl text-white/80">
                Join the exclusive group of 402 pioneers who experienced the future of internet payments.
              </p>
              <nav aria-label="Call to action" className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link 
                  href="/mint"
                  className="group relative flex h-[2.5rem] w-fit items-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-sans font-normal transition-all duration-200 active:scale-95 bg-white text-base-blue hover:bg-base-gray-30 mx-auto"
                  aria-label="Mint your x402NFT for 1 USDC"
                >
                  <span className="z-10 whitespace-nowrap">Mint Your NFT ($1 USDC)</span>
                  <ArrowRight className="z-10 w-4 h-4 ml-2" aria-hidden="true" />
                </Link>
                <a 
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-[2.5rem] w-fit items-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-sans font-normal transition-all duration-200 active:scale-95 bg-transparent text-white border border-white/30 hover:bg-white/10 mx-auto"
                  aria-label={`View ${isMainnet ? 'Base' : 'Base Sepolia'} blockchain explorer (opens in new tab)`}
                >
                  <span className="z-10 whitespace-nowrap">View {isMainnet ? 'Base' : 'Base Sepolia'} Explorer</span>
                  <ExternalLink className="z-10 w-4 h-4 ml-2" aria-hidden="true" />
                </a>
              </nav>
            </div>
          </section>
        </div>
      </main>

      <Footer isMainnet={isMainnet} networkName={networkName} />
    </>
  );
}
