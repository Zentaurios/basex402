import { NextRequest, NextResponse } from 'next/server';
import { isMainnet } from '@/lib/network-config';

// Production domain for NFT metadata (hardcoded to ensure permanence)
const PRODUCTION_DOMAIN = "https://basex402.com";

export async function GET(): Promise<NextResponse> {
  const networkName = isMainnet() ? 'Base' : 'Base Sepolia';
  
  // Hardcoded collection metadata - no database needed!
  const contractMetadata = {
    name: "x402 Protocol Pioneers",
    description: `A limited collection of 402 NFTs commemorating the early adopters of the x402 micropayment protocol. Each NFT represents proof of participation in the revolutionary payment system deployed on ${networkName}.

🏆 Genesis (1-10): Ultra-rare legendary pioneers
🚀 Pioneer (11-100): Rare early adopters  
⚡ Early Adopter (101-300): Forward-thinking users
🌐 Protocol User (301-402): Verified participants

Each NFT is dynamically generated based on mint order and payment method, making every token unique while maintaining fair rarity distribution.`,
    
    image: `${PRODUCTION_DOMAIN}/images/collection-banner.png`,
    banner_image: `${PRODUCTION_DOMAIN}/images/collection-banner.png`,
    featured_image: `${PRODUCTION_DOMAIN}/images/collection-featured.png`,
    external_link: PRODUCTION_DOMAIN,
    
    // Collection details
    total_supply: 402,
    network: networkName,
    blockchain: "Base",
    
    // Royalty information  
    seller_fee_basis_points: 500, // 5% royalty
    fee_recipient: process.env.X402_RECIPIENT_ADDRESS || "",
    
    // Collection properties
    properties: {
      rarity_tiers: 4,
      payment_methods: ["EMAIL", "SMS"],
      networks: [networkName],
      max_per_wallet: 5,
      mint_price: "1.00 USDC"
    },
    
    // Social links
    social: {
      twitter: "https://twitter.com/x402 Protocol", 
      discord: "https://discord.gg/x402 Protocol",
      website: PRODUCTION_DOMAIN,
      docs: "https://docs.x402 Protocol.com"
    },
    
    // Additional metadata for tools/analytics
    compiler: "x402-contract-deployer",
    version: "1.0.0",
    created_by: "x402 Protocol Team",
    category: "Utility"
  };

  return NextResponse.json(contractMetadata, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Type': 'application/json'
    }
  });
}
