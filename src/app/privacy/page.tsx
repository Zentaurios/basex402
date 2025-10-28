import Link from 'next/link';
import { Footer } from '@/components/Footer';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const networkName = isMainnet ? 'Base' : 'Base Sepolia';

export const metadata = {
  title: "Privacy Policy | x402 Pioneers",
  description: "Privacy Policy for x402NFT Collective",
};

export default function PrivacyPage() {
  // Structured data for privacy policy page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - x402 Pioneers",
    "description": "Privacy Policy for x402NFT Collective platform",
    "dateModified": "2025-09-30"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <main className="mx-auto flex w-full max-w-[clamp(1024px,calc(1024px+(100vw-1024px)*0.25),1248px)] justify-center px-4 md:px-6 lg:px-8">
        <article className="w-full max-w-4xl py-12">
          <nav aria-label="Breadcrumb" className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-sm hover:text-base-blue transition-colors mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Back to Home
            </Link>
          </nav>
          
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-secondary)' }}><time dateTime="2025-09-30">Last Updated: September 30, 2025</time></p>
          </header>

          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>1. Introduction</h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                x402 Pioneers ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we 
                collect, use, and protect information when you use our Platform at basex402.com.
              </p>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                By using the Platform, you agree to this Privacy Policy. If you do not agree, please do not use 
                the Platform.
              </p>
            </section>

            {/* Important Note */}
            <section className="mb-8">
              <div className="p-6 border rounded-lg" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--card-border)' }}>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Important: What We Don't Collect</h3>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  <strong>We do not collect or store your email address.</strong> Email authentication for embedded 
                  wallets is handled entirely by Coinbase. We only see your public wallet address.
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>Blockchain data is public.</strong> All wallet addresses, NFT ownership, and transactions 
                  are publicly visible on the {networkName} blockchain.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2.1 Wallet Information</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li><strong>Public wallet addresses:</strong> When you connect a wallet (embedded or external), we see your public wallet address</li>
                <li><strong>Transaction history:</strong> Your NFT purchases, sales, and transfers are publicly visible on the blockchain</li>
                <li><strong>NFT ownership:</strong> We track which wallets own which x402 NFTs</li>
              </ul>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                <strong>Note:</strong> Embedded wallet authentication (email) is handled by Coinbase. We do not receive 
                or store your email address.
              </p>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2.2 User-Uploaded Content</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li><strong>Images:</strong> Photos or artwork you upload for your NFT</li>
                <li><strong>Custom pages:</strong> Content you create for /[tokenId] pages (coming soon)</li>
                <li><strong>AI-generated content:</strong> Content created using AI tools (coming soon)</li>
                <li><strong>Metadata:</strong> File size, type, upload timestamp</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2.3 Usage Data</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li><strong>IP addresses:</strong> Your device's IP address when accessing the Platform</li>
                <li><strong>Browser information:</strong> Browser type, version, and operating system</li>
                <li><strong>Page views:</strong> Which pages you visit and how long you stay</li>
                <li><strong>Click data:</strong> What buttons and links you interact with</li>
                <li><strong>Device information:</strong> Device type, screen size, and settings</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2.4 Marketplace Data (Coming Soon)</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li><strong>Listing information:</strong> NFTs you list for sale and asking prices</li>
                <li><strong>Offers and bids:</strong> Purchase offers you make or receive</li>
                <li><strong>Transaction history:</strong> Sales you complete (also public on blockchain)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2.5 Cookies & Tracking</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Session management (keeping you logged in)</li>
                <li>Analytics (understanding how the Platform is used)</li>
                <li>Performance optimization</li>
              </ul>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                You can disable cookies in your browser settings, but some Platform features may not work properly.
              </p>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>3. How We Use Information</h2>
              
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                We use collected information to:
              </p>
              
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3.1 Provide Services</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Process NFT minting and transactions</li>
                <li>Display your uploaded images on NFTs</li>
                <li>Enable /[tokenId] custom pages</li>
                <li>Facilitate marketplace transactions</li>
                <li>Process x402 micropayments</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3.2 Improve & Maintain Platform</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Analyze usage patterns and optimize performance</li>
                <li>Fix bugs and technical issues</li>
                <li>Develop new features</li>
                <li>Ensure Platform security</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3.3 Content Moderation</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Review uploaded images for prohibited content</li>
                <li>Enforce Terms of Service</li>
                <li>Respond to DMCA and other legal requests</li>
                <li>Blacklist wallets that violate our policies</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3.4 Legal Compliance</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Comply with legal obligations</li>
                <li>Respond to law enforcement requests</li>
                <li>Prevent fraud and illegal activity</li>
                <li>Enforce our Terms of Service</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>4. Information Sharing & Disclosure</h2>
              
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4.1 Public Blockchain Data</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                <strong>Your wallet address, NFT ownership, and all blockchain transactions are publicly visible 
                to anyone.</strong> This is the nature of blockchain technology and cannot be made private.
              </p>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4.2 Publicly Displayed Content</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Content you upload is displayed publicly:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>NFT images are visible to all Platform users</li>
                <li>/[tokenId] pages are publicly accessible</li>
                <li>Marketplace listings are public</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4.3 Third-Party Service Providers</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                We share information with trusted service providers:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li><strong>Coinbase:</strong> Embedded wallet authentication and wallet infrastructure (they collect your email, we don't)</li>
                <li><strong>Vercel:</strong> Platform hosting and content delivery</li>
                <li><strong>Cloud storage providers:</strong> Image and content storage</li>
                <li><strong>Analytics services:</strong> Usage analytics (anonymized where possible)</li>
                <li><strong>AI providers:</strong> OpenAI, Anthropic for AI features (coming soon)</li>
              </ul>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                These providers may have their own privacy policies. We encourage you to review:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li><a href="https://www.coinbase.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline">Coinbase Privacy Policy</a></li>
                <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline">Vercel Privacy Policy</a></li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4.4 Legal Requirements</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                We may disclose information when required by law:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>In response to subpoenas or court orders</li>
                <li>To law enforcement investigating illegal activity</li>
                <li>To comply with DMCA takedown requests</li>
                <li>To protect our rights, property, or safety</li>
                <li>To report child sexual abuse material (CSAM)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4.5 Business Transfers</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                If x402 Pioneers is acquired or merged, your information may be transferred to the new owner.
              </p>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4.6 What We Don't Share</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>We don't sell your personal information to third parties</li>
                <li>We don't share information for marketing purposes (except our own)</li>
                <li>We don't have access to your email or embedded wallet credentials</li>
              </ul>
            </section>

            {/* Data Storage & Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>5. Data Storage & Security</h2>
              
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>5.1 Where We Store Data</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li><strong>Images:</strong> Stored on secure cloud infrastructure (Vercel Blob Storage or similar)</li>
                <li><strong>Blockchain data:</strong> Stored permanently on the {networkName} blockchain (decentralized)</li>
                <li><strong>Usage data:</strong> Stored on secure servers in the United States</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>5.2 How We Protect Data</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>HTTPS encryption for all Platform communications</li>
                <li>Secure cloud storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited employee access to user data</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>5.3 Data Retention</h3>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li><strong>Blockchain data:</strong> Permanent and cannot be deleted</li>
                <li><strong>Uploaded images:</strong> Retained as long as NFT exists or until you request deletion</li>
                <li><strong>Usage data:</strong> Retained for up to 2 years for analytics</li>
                <li><strong>Blacklisted wallets:</strong> Retained indefinitely for security</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>5.4 Security Limitations</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                <strong>No system is 100% secure.</strong> While we implement reasonable security measures, we cannot 
                guarantee absolute security. You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Securing your wallet credentials</li>
                <li>Protecting your device and internet connection</li>
                <li>Reporting suspected security breaches</li>
              </ul>
            </section>

            {/* Your Rights & Choices */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>6. Your Rights & Choices</h2>
              
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6.1 Access Your Data</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                You can request access to information we hold about you by contacting privacy@basex402.com.
              </p>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6.2 Delete Your Data</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                You can request deletion of:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Uploaded images (removed from our servers)</li>
                <li>/[tokenId] pages and custom content</li>
                <li>Usage and analytics data</li>
              </ul>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                <strong>Important limitations:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Blockchain data (wallet addresses, transactions, NFT ownership) cannot be deleted</li>
                <li>Data required for legal compliance may be retained</li>
                <li>Cached or backed-up data may take time to remove</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6.3 Export Your Data</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                You can request a copy of your data in a portable format.
              </p>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6.4 Opt-Out of Analytics</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                You can disable analytics cookies in your browser settings or use browser extensions like Privacy Badger.
              </p>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6.5 GDPR Rights (EU Users)</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                If you're in the EU, you have additional rights under GDPR:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Right to access</li>
                <li>Right to rectification (correction)</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6.6 CCPA Rights (California Users)</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                If you're in California, you have rights under CCPA:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of sale (we don't sell your data)</li>
                <li>Right to non-discrimination</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>7. Children's Privacy</h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                <strong>The Platform is not intended for users under 18 years old.</strong> We do not knowingly 
                collect information from children. If you are under 18, do not use the Platform.
              </p>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                If we discover we've collected information from a child under 18, we will delete it promptly. 
                Parents or guardians who believe their child has provided information should contact us immediately.
              </p>
            </section>

            {/* International Users */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>8. International Users</h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                The Platform is hosted in the United States. If you access the Platform from outside the US:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Your information may be transferred to and stored in the US</li>
                <li>US privacy laws may differ from your country's laws</li>
                <li>By using the Platform, you consent to this transfer</li>
              </ul>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                For EU users, we comply with GDPR where applicable. However, blockchain data is decentralized 
                and not subject to traditional data residency requirements.
              </p>
            </section>

            {/* Third-Party Links */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>9. Third-Party Links & Services</h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                The Platform may contain links to third-party websites or services:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Base blockchain explorers (BaseScan)</li>
                <li>Coinbase wallet services</li>
                <li>Social media platforms</li>
                <li>Documentation and resources</li>
              </ul>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                <strong>We are not responsible for the privacy practices of third-party sites.</strong> Please 
                review their privacy policies before providing information.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>10. Changes to This Privacy Policy</h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                We may update this Privacy Policy from time to time. Changes will be posted with a new "Last Updated" 
                date at the top of this page.
              </p>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                For material changes that significantly affect your privacy, we will provide notice through:
              </p>
              <ul className="list-disc pl-6 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Prominent notice on the Platform</li>
                <li>Email (if we have your contact information)</li>
              </ul>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Continued use of the Platform after changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Do Not Track */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>11. Do Not Track Signals</h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Some browsers have "Do Not Track" features. Currently, there is no industry standard for 
                responding to these signals. We do not respond to Do Not Track signals at this time.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>12. Contact Us</h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                For questions about this Privacy Policy or to exercise your privacy rights, contact us at:
              </p>
              <ul className="list-none mb-4" style={{ color: 'var(--text-secondary)' }}>
                <li>Contact information coming soon</li>
                <li><strong>Website:</strong> <Link href="/" className="text-base-blue hover:underline">basex402.com</Link></li>
              </ul>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                We will respond to privacy requests within 30 days.
              </p>
            </section>

            {/* Summary */}
            <section className="mb-8">
              <div className="p-6 border rounded-lg card">
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Privacy Summary</h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--text-secondary)' }}>
                  <li><strong>We don't collect your email</strong> - Coinbase handles embedded wallet authentication</li>
                  <li><strong>Blockchain data is public</strong> - wallet addresses and transactions are visible to everyone</li>
                  <li><strong>We collect:</strong> wallet addresses, uploaded images, usage data, IP addresses</li>
                  <li><strong>We use data to:</strong> provide services, moderate content, improve the Platform, comply with laws</li>
                  <li><strong>We share with:</strong> service providers (Coinbase, Vercel), law enforcement (when required), the public (blockchain data)</li>
                  <li><strong>Your rights:</strong> access, delete, export your data (except blockchain data which is immutable)</li>
                  <li><strong>We don't:</strong> sell your data, share for marketing, or access your email/wallet credentials</li>
                </ul>
              </div>
            </section>
          </div>
        </article>
      </main>
      
      <Footer isMainnet={isMainnet} networkName={networkName} />
    </>
  );
}
