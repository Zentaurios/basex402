import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Award, Zap, Users, Sparkles, ShoppingCart, Code, TrendingUp } from 'lucide-react';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const networkName = isMainnet ? 'Base' : 'Base Sepolia';

export const metadata = {
  title: "About x402 Pioneers | Revolutionary x402 Micropayments NFTs",
  description: "Learn about x402 Pioneers's limited edition NFTs celebrating the x402 micropayments protocol. Only 402 NFTs commemorating early adoption on Base blockchain.",
  openGraph: {
    title: "About x402 Pioneers | x402 Micropayments NFTs",
    description: "Limited collection of 402 NFTs commemorating early adoption of Coinbase's x402 micropayments protocol on Base.",
    type: "website",
    url: "https://basex402.com/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About x402 Pioneers",
    description: "Only 402 NFTs celebrating the x402 micropayments protocol on Base blockchain.",
  }
};

export default function AboutPage() {
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About x402 Pioneers",
    "description": "x402 Pioneers is a limited collection of 402 NFTs commemorating early adoption of the x402 micropayments protocol on Base blockchain.",
    "mainEntity": {
      "@type": "Organization",
      "name": "x402 Pioneers",
      "url": "https://basex402.com",
      "description": "Limited edition NFT collection celebrating the x402 micropayments protocol",
      "foundingDate": "2025",
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <main className="mx-auto flex w-full max-w-[clamp(1024px,calc(1024px+(100vw-1024px)*0.25),1248px)] justify-center px-4 md:px-6 lg:px-8">
        <article className="w-full py-12">
          {/* Hero Section */}
          <section aria-label="Introduction" className="mb-20 text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <Link 
                href="/"
                className="inline-flex items-center text-sm text-gray-600 hover:text-base-blue transition-colors"
              >
                ← Back to Home
              </Link>
            </nav>
            
            <div className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-mono uppercase tracking-wide mb-6 bg-base-blue/10 text-base-blue">
              <Award className="w-4 h-4 mr-2" aria-hidden="true" />
              About x402 Pioneers
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-base-black mb-6 px-4">
              Celebrating the Future of <span className="text-base-blue">Micropayments</span>
            </h1>
            
            <p className="text-xl text-gray-700 max-w-3xl mx-auto px-4">
              x402 Pioneers is a limited collection of 402 NFTs commemorating early adoption of 
              Coinbase's revolutionary x402 micropayments protocol on {networkName}.
            </p>
          </section>

          {/* The x402 Protocol Section */}
          <section aria-labelledby="protocol-heading" className="mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="px-4">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-base-blue rounded-lg flex items-center justify-center mr-4 flex-shrink-0" aria-hidden="true">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h2 id="protocol-heading" className="text-3xl font-bold text-base-black">The x402 Protocol</h2>
                </div>
                
                <p className="text-gray-700 mb-6 text-lg">
                  The x402 protocol brings <strong>HTTP 402 Payment Required</strong> to life, enabling instant 
                  micropayments in USDC for web content and services.
                </p>
                
                <p className="text-gray-700 mb-8">
                  Built by Coinbase on the Base blockchain, x402 makes it possible to charge fractions of a cent 
                  for API calls, content access, or computational resources—unlocking entirely new business models 
                  for the internet.
                </p>

                <div className="bg-base-gray-25 p-6 rounded-lg border border-base-gray-100 mb-8">
                  <h3 className="font-semibold text-base-black mb-4">Why x402 Matters:</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-base-blue mr-3 mt-0.5" aria-hidden="true">•</span>
                      <span>Instant, programmable payments without intermediaries</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-base-blue mr-3 mt-0.5" aria-hidden="true">•</span>
                      <span>Enables pay-per-use models for AI, APIs, and digital services</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-base-blue mr-3 mt-0.5" aria-hidden="true">•</span>
                      <span>No credit cards, subscriptions, or payment processing delays</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-base-blue mr-3 mt-0.5" aria-hidden="true">•</span>
                      <span>Built on Base for low-cost, fast transactions</span>
                    </li>
                  </ul>
                </div>

                <a 
                  href="https://docs.cdp.coinbase.com/x402/welcome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-base-blue hover:underline font-medium"
                >
                  Read the x402 Documentation →
                </a>
              </div>

              <div className="px-4">
                <div className="bg-gradient-to-br from-base-blue to-base-black p-8 rounded-lg text-white" role="figure" aria-label="x402 protocol payment flow example">
                  <div className="mb-6">
                    <div className="text-sm font-mono mb-3 text-white/80">HTTP Response</div>
                    <div className="bg-black/30 p-4 rounded font-mono text-sm">
                      <div className="text-negative">402 Payment Required</div>
                      <div className="text-white/60 mt-2">X-Payment-Address: 0x...</div>
                      <div className="text-white/60">X-Payment-Amount: 0.001 USDC</div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-sm font-mono mb-3 text-white/80">Payment Sent</div>
                    <div className="bg-black/30 p-4 rounded font-mono text-sm">
                      <div className="text-positive">✓ Payment Confirmed</div>
                      <div className="text-white/60 mt-2">Block: 12345678</div>
                      <div className="text-white/60">Gas: 0.000021 ETH</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-mono mb-3 text-white/80">Content Unlocked</div>
                    <div className="bg-black/30 p-4 rounded font-mono text-sm">
                      <div className="text-base-blue">200 OK</div>
                      <div className="text-white/60 mt-2">Content-Type: application/json</div>
                      <div className="text-white mt-2">{'{ "data": "..." }'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* The Collectibles Section */}
          <section aria-labelledby="collectibles-heading" className="mb-24">
            <div className="bg-base-gray-25 rounded-lg p-8 md:p-12">
              <header className="text-center mb-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center mr-4" aria-hidden="true">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h2 id="collectibles-heading" className="text-3xl font-bold text-base-black">Limited Edition Collectibles</h2>
                </div>
                
                <p className="text-xl text-gray-700 max-w-2xl mx-auto px-4">
                  Only <strong className="text-base-blue">402 NFTs</strong> will ever exist—one for each member 
                  of the x402 pioneer community.
                </p>
              </header>

              <div className="grid md:grid-cols-3 gap-8 mb-10">
                <div className="text-center px-4">
                  <div className="text-4xl font-bold text-base-blue mb-2">402</div>
                  <div className="text-gray-600 font-medium">Total Supply</div>
                  <div className="text-sm text-gray-500 mt-2">Matching the x402 protocol name</div>
                </div>
                
                <div className="text-center px-4">
                  <div className="text-4xl font-bold text-positive mb-2">$1</div>
                  <div className="text-gray-600 font-medium">USDC Each</div>
                  <div className="text-sm text-gray-500 mt-2">Accessible to everyone</div>
                </div>
                
                <div className="text-center px-4">
                  <div className="text-4xl font-bold text-warning mb-2">4</div>
                  <div className="text-gray-600 font-medium">Rarity Tiers</div>
                  <div className="text-sm text-gray-500 mt-2">Genesis, Pioneer, Early Adopter, Protocol User</div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-lg border border-base-gray-100">
                <h3 className="font-semibold text-base-black mb-6">What Makes Each NFT Special:</h3>
                <ul className="grid md:grid-cols-2 gap-6">
                  <li className="flex items-start">
                    <span className="text-base-blue text-xl mr-4 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                    <div>
                      <div className="font-medium text-base-black mb-1">Proof of Early Adoption</div>
                      <div className="text-sm text-gray-600">Your NFT proves you were among the first 402 to use x402</div>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="text-base-blue text-xl mr-4 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                    <div>
                      <div className="font-medium text-base-black mb-1">Unique Token ID</div>
                      <div className="text-sm text-gray-600">Each NFT has a permanent number from 1 to 402</div>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="text-base-blue text-xl mr-4 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                    <div>
                      <div className="font-medium text-base-black mb-1">Custom Image</div>
                      <div className="text-sm text-gray-600">Upload your own artwork to personalize your NFT</div>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="text-base-blue text-xl mr-4 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                    <div>
                      <div className="font-medium text-base-black mb-1">On-Chain Forever</div>
                      <div className="text-sm text-gray-600">Permanently recorded on {networkName}</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* What's Coming Section */}
          <section aria-labelledby="future-heading" className="mb-24 px-4">
            <header className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-positive rounded-lg flex items-center justify-center mr-4" aria-hidden="true">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 id="future-heading" className="text-3xl font-bold text-base-black">The Future is Bright</h2>
              </div>
              
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                x402 Pioneers is just getting started. We're building a platform where your NFT becomes 
                more than just a collectible.
              </p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Marketplace */}
              <article className="bg-white p-6 rounded-lg border-2 border-base-gray-100 hover:border-base-blue transition-colors">
                <div className="w-10 h-10 bg-base-blue/10 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
                  <ShoppingCart className="w-5 h-5 text-base-blue" />
                </div>
                <h3 className="text-xl font-semibold text-base-black mb-3">x402 Marketplace</h3>
                <p className="text-gray-600 mb-4">
                  Trade your NFTs peer-to-peer using x402 micropayments. Instant, low-fee secondary sales.
                </p>
                <div className="text-sm font-mono text-base-blue">Coming Soon</div>
              </article>

              {/* Custom Pages */}
              <article className="bg-white p-6 rounded-lg border-2 border-base-gray-100 hover:border-base-blue transition-colors">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
                  <Code className="w-5 h-5 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-base-black mb-3">Your /[tokenId] Page</h3>
                <p className="text-gray-600 mb-4">
                  Create personalized content pages, sell digital goods, or showcase your work—all powered by x402.
                </p>
                <div className="text-sm font-mono text-warning">In Development</div>
              </article>

              {/* AI Tools */}
              <article className="bg-white p-6 rounded-lg border-2 border-base-gray-100 hover:border-base-blue transition-colors">
                <div className="w-10 h-10 bg-positive/10 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
                  <Sparkles className="w-5 h-5 text-positive" />
                </div>
                <h3 className="text-xl font-semibold text-base-black mb-3">AI-Powered Creation</h3>
                <p className="text-gray-600 mb-4">
                  Use AI to generate pages, blogs, and content routes—all monetized through x402 micropayments.
                </p>
                <div className="text-sm font-mono text-positive">Planned</div>
              </article>

              {/* Content Monetization */}
              <article className="bg-white p-6 rounded-lg border-2 border-base-gray-100 hover:border-base-blue transition-colors">
                <div className="w-10 h-10 bg-negative/10 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
                  <TrendingUp className="w-5 h-5 text-negative" />
                </div>
                <h3 className="text-xl font-semibold text-base-black mb-3">Monetize Your Content</h3>
                <p className="text-gray-600 mb-4">
                  Charge micropayments for access to your blog posts, code snippets, or AI agents using x402.
                </p>
                <div className="text-sm font-mono text-negative">Future Feature</div>
              </article>

              {/* Direct Wallet Connection */}
              <article className="bg-white p-6 rounded-lg border-2 border-base-gray-100 hover:border-base-blue transition-colors">
                <div className="w-10 h-10 bg-base-blue/10 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
                  <Users className="w-5 h-5 text-base-blue" />
                </div>
                <h3 className="text-xl font-semibold text-base-black mb-3">Direct Wallet Support</h3>
                <p className="text-gray-600 mb-4">
                  Connect with MetaMask, Coinbase Wallet, or other popular wallets in addition to embedded wallets.
                </p>
                <div className="text-sm font-mono text-base-blue">Coming Soon</div>
              </article>

              {/* Community Features */}
              <article className="bg-white p-6 rounded-lg border-2 border-base-gray-100 hover:border-base-blue transition-colors">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
                  <Award className="w-5 h-5 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-base-black mb-3">Pioneer Community</h3>
                <p className="text-gray-600 mb-4">
                  Exclusive access to new features, community events, and the x402 ecosystem as it grows.
                </p>
                <div className="text-sm font-mono text-warning">Evolving</div>
              </article>
            </div>
          </section>

          {/* Vision Statement */}
          <section aria-labelledby="vision-heading" className="mb-24">
            <div className="bg-gradient-to-br from-base-blue to-base-black rounded-lg p-10 md:p-16 text-white text-center">
              <h2 id="vision-heading" className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 px-4">
                We believe micropayments will revolutionize how value flows on the internet. x402 Pioneers is 
                more than NFTs—it's a community of pioneers building the future of digital commerce.
              </p>
              <p className="text-lg text-white/80 max-w-2xl mx-auto px-4">
                Every x402NFT holder is part of this journey. As the x402 protocol grows, so does the utility 
                and significance of being an early adopter.
              </p>
            </div>
          </section>

          {/* Why Base */}
          <section aria-labelledby="base-heading" className="mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 px-4">
                <div className="bg-base-blue/10 p-8 rounded-lg border border-base-blue/30">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-base-blue rounded-lg mr-3 flex-shrink-0" aria-hidden="true"></div>
                    <div className="text-2xl font-bold text-base-black">Built on Base</div>
                  </div>
                  
                  <ul className="space-y-5">
                    <li className="flex items-start">
                      <span className="text-base-blue text-xl mr-4 mt-0.5 flex-shrink-0" aria-hidden="true">⚡</span>
                      <div>
                        <div className="font-medium text-base-black mb-1">Lightning Fast</div>
                        <div className="text-sm text-gray-600">Transactions confirm in seconds, not minutes</div>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <span className="text-base-blue text-xl mr-4 mt-0.5 flex-shrink-0" aria-hidden="true">💰</span>
                      <div>
                        <div className="font-medium text-base-black mb-1">Ultra Low Fees</div>
                        <div className="text-sm text-gray-600">Gas fees measured in cents, perfect for micropayments</div>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <span className="text-base-blue text-xl mr-4 mt-0.5 flex-shrink-0" aria-hidden="true">🔒</span>
                      <div>
                        <div className="font-medium text-base-black mb-1">Ethereum Security</div>
                        <div className="text-sm text-gray-600">Layer 2 built on Ethereum's proven security</div>
                      </div>
                    </li>
                    
                    <li className="flex items-start">
                      <span className="text-base-blue text-xl mr-4 mt-0.5 flex-shrink-0" aria-hidden="true">🚀</span>
                      <div>
                        <div className="font-medium text-base-black mb-1">Coinbase Ecosystem</div>
                        <div className="text-sm text-gray-600">Access to Coinbase's developer tools and infrastructure</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="order-1 md:order-2 px-4">
                <h2 id="base-heading" className="text-3xl font-bold text-base-black mb-6">Why We Chose {networkName}</h2>
                <p className="text-gray-700 mb-6 text-lg">
                  Base is the perfect home for x402 micropayments. As Coinbase's Layer 2, it combines 
                  enterprise-grade reliability with the speed and cost efficiency needed for real-time micropayments.
                </p>
                <p className="text-gray-700 mb-8">
                  Whether you're minting an NFT, trading on the marketplace, or charging fractions of a cent 
                  for content access, Base makes it seamless and affordable.
                </p>
                
                <a 
                  href="https://docs.base.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-base-blue hover:underline font-medium"
                >
                  Learn More About Base →
                </a>
              </div>
            </div>
          </section>

          {/* Join the Movement CTA */}
          <section aria-labelledby="cta-heading" className="mb-12">
            <div className="bg-base-gray-25 rounded-lg p-10 md:p-12 text-center">
              <h2 id="cta-heading" className="text-3xl font-bold text-base-black mb-4">
                Be Part of the x402 Pioneer Community
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8 px-4">
                With only 402 NFTs ever minted, spots are limited. Claim your place in internet payment history.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/mint"
                  className="inline-flex items-center justify-center px-8 py-3 bg-base-blue text-white rounded-lg font-medium hover:bg-base-black transition-colors"
                  aria-label="Mint your x402NFT for 1 USDC"
                >
                  Mint Your NFT ($1 USDC)
                </Link>
                
                <a 
                  href="https://docs.cdp.coinbase.com/x402/welcome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-base-black border border-base-gray-200 rounded-lg font-medium hover:bg-base-gray-50 transition-colors"
                  aria-label="Read x402 protocol documentation"
                >
                  Read x402 Docs
                </a>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <aside className="mb-12 px-4" role="note">
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-sm text-gray-700">
                <strong>Disclaimer:</strong> x402 NFTs are digital collectibles created to celebrate and demonstrate 
                the x402 micropayments protocol. This project is independently developed and is not officially 
                affiliated with, endorsed by, or sponsored by Base or Coinbase.
              </p>
            </div>
          </aside>
        </article>
      </main>
      
      <Footer isMainnet={isMainnet} networkName={networkName} />
    </>
  );
}
