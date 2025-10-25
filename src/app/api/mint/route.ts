import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { 
  processX402Payment,
  createPaymentResponseHeader 
} from '@/lib/x402';
import { getNetworkConfig, getCurrentNetworkName, isMainnet } from '@/lib/network-config';
import { initializeCDP, getMintingAccount } from '@/lib/cdp-client';

// NFT Contract ABI (updated for CDP Server Wallets)
const NFT_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "string", "name": "paymentMethod", "type": "string"},
      {"internalType": "string", "name": "network", "type": "string"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address[]", "name": "recipients", "type": "address[]"},
      {"internalType": "string[]", "name": "paymentMethods", "type": "string[]"},
      {"internalType": "string[]", "name": "networks", "type": "string[]"}
    ],
    "name": "batchMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isSoldOut",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address - set after deployment (server-side env var)
const NFT_CONTRACT_ADDRESS = (isMainnet() 
  ? process.env.NFT_CONTRACT_ADDRESS 
  : process.env.NFT_CONTRACT_ADDRESS_TESTNET) as `0x${string}` | undefined;

// Log for debugging
console.log('NFT Contract Address:', NFT_CONTRACT_ADDRESS);
console.log('Is Mainnet:', isMainnet());

interface MintRequest {
  recipientWallet: string;
  paymentMethod: 'email' | 'sms';
  quantity?: number; // Number of NFTs to mint (1-5)
}

// Get public client for reading blockchain state
const getPublicClient = () => {
  const chain = isMainnet() ? base : baseSepolia;
  const networkConfig = getNetworkConfig();
  
  return createPublicClient({
    chain,
    transport: http(networkConfig.rpcUrl)
  });
};

/**
 * Get or create the server wallet account for minting
 */
async function getServerWalletAccount() {
  return getMintingAccount();
}

/**
 * POST /api/mint
 * 
 * x402 Payment → mint NFT flow using CDP Server Wallets v2
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const networkName = getCurrentNetworkName();
    
    // Parse request body
    let mintRequest: MintRequest;
    try {
      mintRequest = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request body', code: 'INVALID_JSON' } },
        { status: 400 }
      );
    }

    // Validate recipient wallet address
    if (!mintRequest.recipientWallet || !/^0x[a-fA-F0-9]{40}$/.test(mintRequest.recipientWallet)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid recipient wallet address', code: 'INVALID_WALLET' } },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!mintRequest.paymentMethod || !['email', 'sms'].includes(mintRequest.paymentMethod)) {
      return NextResponse.json(
        { success: false, error: { message: 'Payment method must be email or sms', code: 'INVALID_PAYMENT_METHOD' } },
        { status: 400 }
      );
    }

    // Validate quantity (1-5 NFTs)
    const quantity = mintRequest.quantity || 1;
    if (quantity < 1 || quantity > 5) {
      return NextResponse.json(
        { success: false, error: { message: 'Quantity must be between 1 and 5', code: 'INVALID_QUANTITY' } },
        { status: 400 }
      );
    }

    // Check if contract is deployed
    if (!NFT_CONTRACT_ADDRESS) {
      return NextResponse.json(
        { success: false, error: { message: 'NFT contract not deployed yet', code: 'CONTRACT_NOT_DEPLOYED' } },
        { status: 503 }
      );
    }

    console.log(`💳 Processing NFT mint request for ${quantity} NFT(s) to ${mintRequest.recipientWallet} on ${networkName}...`);
    console.log(`💰 Expected payment: ${quantity}.00 USDC (${quantity * 1_000_000} atomic units)`);

    // Calculate payment amount: quantity × 1 USDC (1,000,000 atomic units)
    const paymentAmount = quantity * 1_000_000;
    const nextTokenId = await getNextTokenId();
    
    // Process x402 payment with calculated amount
    const paymentResult = await processX402Payment(
      request,
      '/api/mint',
      `Mint ${quantity} x402 Protocol Pioneer NFT${quantity > 1 ? 's' : ''} #${nextTokenId}${quantity > 1 ? `-#${nextTokenId + quantity - 1}` : ''} on ${networkName}`,
      paymentAmount
    );

    if (paymentResult.requiresPayment) {
      console.log(`💳 No payment provided, returning 402 Payment Required`);
      return new NextResponse(paymentResult.response!.body, {
        status: paymentResult.response!.status,
        headers: paymentResult.response!.headers
      });
    }

    if (!paymentResult.paymentValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Payment verification failed', code: 'PAYMENT_VERIFICATION_FAILED' } },
        { status: 402 }
      );
    }

    console.log(`✅ Payment verified successfully, proceeding with mint`);

    // Get CDP client and server wallet
    const cdp = initializeCDP();
    const serverAccount = await getServerWalletAccount();
    
    // Get public client for reading contract state
    const publicClient = getPublicClient();

    // Get contract instance for reading
    const contract = getContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: NFT_CONTRACT_ABI,
      client: publicClient
    });

    // Check current supply and if public minting is closed
    const totalSupply = await contract.read.totalSupply();
    const currentSupply = Number(totalSupply);
    
    // Reserve last 47 slots for airdrop (stop public minting at 355)
    const MAX_PUBLIC_SUPPLY = 355;
    if (currentSupply >= MAX_PUBLIC_SUPPLY) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Public minting closed. Last 47 NFTs reserved for airdrop to early supporters.', 
            code: 'PUBLIC_MINTING_CLOSED' 
          } 
        },
        { status: 400 }
      );
    }
    
    // Check if collection is sold out (should never happen with above check)
    const isSoldOut = await contract.read.isSoldOut();
    if (isSoldOut) {
      return NextResponse.json(
        { success: false, error: { message: 'NFT collection is sold out', code: 'SOLD_OUT' } },
        { status: 400 }
      );
    }

    // Mint the NFT(s) using CDP Server Wallets
    console.log(`🎨 Minting ${quantity} NFT(s) to ${mintRequest.recipientWallet} using CDP Server Wallets...`);
    
    const currentNetwork = isMainnet() ? 'base-mainnet' : 'base-sepolia';

    // Prepare transaction data for minting
    const { encodeFunctionData } = await import('viem');
    
    let mintFunctionData: `0x${string}`;
    
    if (quantity === 1) {
      // Single mint
      mintFunctionData = encodeFunctionData({
        abi: NFT_CONTRACT_ABI,
        functionName: 'mint',
        args: [
          mintRequest.recipientWallet as `0x${string}`,
          mintRequest.paymentMethod,
          currentNetwork
        ]
      });
    } else {
      // Batch mint - all NFTs go to the same recipient
      const recipients = Array(quantity).fill(mintRequest.recipientWallet);
      const paymentMethods = Array(quantity).fill(mintRequest.paymentMethod);
      const networks = Array(quantity).fill(currentNetwork);
      
      mintFunctionData = encodeFunctionData({
        abi: NFT_CONTRACT_ABI,
        functionName: 'batchMint',
        args: [
          recipients as `0x${string}`[],
          paymentMethods,
          networks
        ]
      });
    }

    // Send transaction using CDP Server Wallets
    const transactionResult = await cdp.evm.sendTransaction({
      address: serverAccount.address as `0x${string}`,
      transaction: {
        to: NFT_CONTRACT_ADDRESS,
        data: mintFunctionData,
        value: 0n
      },
      network: currentNetwork as any
    });

    const txHash = transactionResult.transactionHash;
    console.log(`🔗 Mint transaction submitted: ${txHash}`);

    // Wait for transaction confirmation
    console.log(`⏳ Waiting for transaction confirmation...`);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      confirmations: 1
    });

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    // Get updated totals and calculate minted token IDs
    const newTotalSupply = await contract.read.totalSupply();
    const endTokenId = Number(newTotalSupply);
    const startTokenId = endTokenId - quantity + 1;
    
    // Generate array of minted token IDs
    const tokenIds = Array.from({ length: quantity }, (_, i) => startTokenId + i);

    console.log(`✅ ${quantity} NFT(s) minted successfully to ${mintRequest.recipientWallet}: #${startTokenId}${quantity > 1 ? ` - #${endTokenId}` : ''}`);

    // Create payment response headers
    const paymentResponseHeaders = createPaymentResponseHeader(txHash);

    // Build response
    const mintResult = {
      success: true,
      quantity,
      tokenIds,
      tokenId: startTokenId, // For backward compatibility
      transactionHash: txHash,
      contractAddress: NFT_CONTRACT_ADDRESS,
      recipientWallet: mintRequest.recipientWallet,
      paymentMethod: mintRequest.paymentMethod,
      network: currentNetwork,
      serverWallet: serverAccount.address,
      
      // Collection stats
      totalMinted: Number(newTotalSupply),
      remainingSupply: 402 - Number(newTotalSupply),
      
      // URLs
      transactionUrl: `${getNetworkConfig().explorerUrl}/tx/${txHash}`,
      nftUrl: `${getNetworkConfig().explorerUrl}/token/${NFT_CONTRACT_ADDRESS}?a=${startTokenId}`,
      metadataUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/metadata/${startTokenId}`,
      openseaUrl: `https://opensea.io/assets/${isMainnet() ? 'base' : 'base-sepolia'}/${NFT_CONTRACT_ADDRESS}/${startTokenId}`,
      
      // Payment info
      paymentSettlement: paymentResult.settlementInfo,
      timestamp: Date.now()
    };

    return NextResponse.json(
      { success: true, data: mintResult },
      { 
        status: 200,
        headers: {
          ...paymentResponseHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    const networkName = getCurrentNetworkName();
    console.error(`❌ NFT mint failed on ${networkName}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown minting error';
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: errorMessage, 
          code: 'MINT_FAILED',
          network: networkName
        } 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mint
 * 
 * Get mint status and collection information
 */
export async function GET(): Promise<NextResponse> {
  try {
    if (!NFT_CONTRACT_ADDRESS) {
      return NextResponse.json({
        success: true,
        data: {
          contractDeployed: false,
          message: 'NFT contract not deployed yet',
          network: getCurrentNetworkName()
        }
      });
    }

    // Get collection stats from contract
    const publicClient = getPublicClient();
    const contract = getContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: NFT_CONTRACT_ABI,
      client: publicClient
    });

    const [totalSupply, isSoldOut] = await Promise.all([
      contract.read.totalSupply(),
      contract.read.isSoldOut()
    ]);

    // Get server wallet info
    let serverWalletAddress = '';
    try {
      const serverAccount = await getServerWalletAccount();
      serverWalletAddress = serverAccount.address;
    } catch (error) {
      console.warn('Could not get server wallet address:', error);
    }

    const collectionInfo = {
      contractDeployed: true,
      contractAddress: NFT_CONTRACT_ADDRESS,
      serverWalletAddress,
      network: getCurrentNetworkName(),
      
      // Collection stats
      totalSupply: 402,
      totalMinted: Number(totalSupply),
      remainingSupply: 402 - Number(totalSupply),
      isSoldOut,
      
      // Rarity breakdown
      rarityTiers: [
        { name: 'Genesis', range: '1-10', total: 10, minted: Math.min(10, Number(totalSupply)) },
        { name: 'Pioneer', range: '11-100', total: 90, minted: Math.min(90, Math.max(0, Number(totalSupply) - 10)) },
        { name: 'Early Adopter', range: '101-300', total: 200, minted: Math.min(200, Math.max(0, Number(totalSupply) - 100)) },
        { name: 'Protocol User', range: '301-402', total: 102, minted: Math.min(102, Math.max(0, Number(totalSupply) - 300)) }
      ],
      
      // Mint settings
      mintPrice: '1.00 USDC',
      paymentMethods: ['email', 'sms'],
      
      // URLs
      contractUrl: `${getNetworkConfig().explorerUrl}/address/${NFT_CONTRACT_ADDRESS}`,
      metadataUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/metadata/`,
      openseaUrl: `https://opensea.io/collection/x402-protocol-pioneers${isMainnet() ? '' : '-testnet'}`
    };

    return NextResponse.json({
      success: true,
      data: collectionInfo
    });

  } catch (error) {
    console.error('❌ Failed to get collection info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to get collection information', 
          code: 'INFO_FETCH_FAILED' 
        } 
      },
      { status: 500 }
    );
  }
}

// Helper function to get next token ID
async function getNextTokenId(): Promise<number> {
  if (!NFT_CONTRACT_ADDRESS) return 1;
  
  try {
    const publicClient = getPublicClient();
    const contract = getContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: NFT_CONTRACT_ABI,
      client: publicClient
    });
    
    const totalSupply = await contract.read.totalSupply();
    return Number(totalSupply) + 1;
  } catch {
    return 1;
  }
}

/**
 * OPTIONS /api/mint
 * Handle CORS for x402
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-PAYMENT, Content-Type, Authorization',
      'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE',
      'Access-Control-Max-Age': '86400',
    }
  });
}