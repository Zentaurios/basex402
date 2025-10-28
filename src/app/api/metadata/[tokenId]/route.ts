// Simplified hardcoded metadata - no database needed!
import { NextRequest, NextResponse } from 'next/server';
import { getContract } from 'viem';
import { createPublicRpcClient } from '@/lib/rpc-config';
import { isMainnet } from '@/lib/network-config';

// Contract ABI - just the functions we need
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getMintData",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "string", "name": "paymentMethod", "type": "string"},
          {"internalType": "string", "name": "network", "type": "string"}
        ],
        "internalType": "struct X402ProtocolPioneers.MintData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getRarityTier", 
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address (you'll set this after deployment)
const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;

// Create viem client (using centralized RPC config)
const getClient = createPublicRpcClient;

// Production domain for NFT metadata (hardcoded to ensure permanence)
const PRODUCTION_DOMAIN = "https://basex402.com";

// 4 Hardcoded metadata templates
// Note: animation_url and image are set per-token below for dynamic routes
const METADATA_TEMPLATES = {
  "Genesis": {
    name: "x402 Protocol Pioneer #{tokenId} - Genesis",
    description: "🏆 Genesis Pioneer: One of the first 10 adopters of the revolutionary x402 micropayment protocol. This ultra-rare NFT represents true pioneering spirit in decentralized payments.",
    background_color: "1a1a2e",
    attributes: [
      { trait_type: "Rarity Tier", value: "Genesis" },
      { trait_type: "Tier Rank", value: "Legendary", display_type: "string" },
      { trait_type: "Total in Tier", value: 10, display_type: "number" },
      { trait_type: "Rarity Score", value: 100, display_type: "number" }
    ]
  },
  
  "Pioneer": {
    name: "x402 Protocol Pioneer #{tokenId} - Pioneer", 
    description: "🚀 Pioneer: Among the first 100 early adopters of x402 payment protocol. A rare NFT commemorating early participation in the future of micropayments.",
    background_color: "16213e",
    attributes: [
      { trait_type: "Rarity Tier", value: "Pioneer" },
      { trait_type: "Tier Rank", value: "Epic", display_type: "string" },
      { trait_type: "Total in Tier", value: 90, display_type: "number" },
      { trait_type: "Rarity Score", value: 75, display_type: "number" }
    ]
  },
  
  "Early Adopter": {
    name: "x402 Protocol Pioneer #{tokenId} - Early Adopter",
    description: "⚡ Early Adopter: One of the first 225 users to embrace x402 micropayments. This NFT proves your forward-thinking approach to decentralized payment solutions.",
    background_color: "0f3460", 
    attributes: [
      { trait_type: "Rarity Tier", value: "Early Adopter" },
      { trait_type: "Tier Rank", value: "Rare", display_type: "string" },
      { trait_type: "Total in Tier", value: 125, display_type: "number" },
      { trait_type: "Rarity Score", value: 50, display_type: "number" }
    ]
  },
  
  "Protocol User": {
    name: "x402 Protocol Pioneer #{tokenId} - Protocol User",
    description: "🌐 Protocol User: A verified user of the x402 payment protocol. This NFT represents your participation in the decentralized micropayment revolution.",
    background_color: "533483",
    attributes: [
      { trait_type: "Rarity Tier", value: "Protocol User" },
      { trait_type: "Tier Rank", value: "Common", display_type: "string" },
      { trait_type: "Total in Tier", value: 177, display_type: "number" },
      { trait_type: "Rarity Score", value: 25, display_type: "number" }
    ]
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
): Promise<NextResponse> {
  try {
    const { tokenId: tokenIdParam } = await params;
    const tokenId = parseInt(tokenIdParam);
    
    // Validate token ID
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 402) {
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 404 }
      );
    }

    if (!CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: 'Contract not deployed yet' },
        { status: 503 }
      );
    }

    // Get client and contract
    const client = getClient();
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      client
    });

    // Check if token exists (has been minted)
    const totalSupply = await contract.read.totalSupply();
    if (tokenId > Number(totalSupply)) {
      return NextResponse.json(
        { error: 'Token not yet minted' },
        { status: 404 }
      );
    }

    // Get on-chain data
    const [mintDataResult, rarityTier] = await Promise.all([
      contract.read.getMintData([BigInt(tokenId)]),
      contract.read.getRarityTier([BigInt(tokenId)])
    ]);

    // Extract mint data from struct (returned as object by viem)
    const timestamp = mintDataResult.timestamp;
    const paymentMethod = mintDataResult.paymentMethod; // Always "x402" for privacy
    const network = mintDataResult.network;
    const mintDate = new Date(Number(timestamp) * 1000);

    // Get the hardcoded template
    const template = METADATA_TEMPLATES[rarityTier as keyof typeof METADATA_TEMPLATES];
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid rarity tier' },
        { status: 500 }
      );
    }

    // Build metadata by replacing placeholders
    const metadata = {
      ...template,
      name: template.name.replace('{tokenId}', tokenId.toString()),
      image: `${PRODUCTION_DOMAIN}/${tokenId}/image`,
      animation_url: `${PRODUCTION_DOMAIN}/${tokenId}/animation`,
      external_url: `${PRODUCTION_DOMAIN}/${tokenId}`,
      
      // Combine template attributes with dynamic ones
      attributes: [
        ...template.attributes,
        {
          trait_type: "Payment Method",
          value: paymentMethod
        },
        {
          trait_type: "Network", 
          value: network
        },
        {
          trait_type: "Pioneer Number",
          value: tokenId,
          display_type: "number"
        },
        {
          trait_type: "Mint Date",
          value: Math.floor(mintDate.getTime() / 1000),
          display_type: "date"
        },
        {
          trait_type: "Day Minted",
          value: mintDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }
      ]
    };

    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours (immutable data)
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Metadata API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token metadata' },
      { status: 500 }
    );
  }
}
