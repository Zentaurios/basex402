import { NextRequest, NextResponse } from 'next/server';
import { getContract } from 'viem';
import { createPublicRpcClient } from '@/lib/rpc-config';
import { 
  processX402Payment,
  createPaymentResponseHeader 
} from '@/lib/x402';
import { getNetworkConfig, getCurrentNetworkName, isMainnet } from '@/lib/network-config';
import { initializeCDP, getMintingAccount } from '@/lib/cdp-client';
import { 
  getClientIp, 
  checkMintRateLimit, 
  checkSuccessfulMintLimit,
  trackSuccessfulMint,
  getRateLimitHeaders,
} from '@/lib/rate-limit/mint-rate-limiter';

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
  },
  {
    "inputs": [],
    "name": "MINTER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "serverWallet",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address - set after deployment (server-side env var)
const NFT_CONTRACT_ADDRESS = (isMainnet() 
  ? process.env.NFT_CONTRACT_ADDRESS 
  : process.env.NFT_CONTRACT_ADDRESS_TESTNET) as `0x${string}` | undefined;

interface MintRequest {
  recipientWallet: string;
  paymentMethod: 'email' | 'sms';
  quantity?: number; // Number of NFTs to mint (1-5)
}

// Get public client for reading blockchain state (using centralized RPC config)
const getPublicClient = createPublicRpcClient;

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
    
    // Get client IP for rate limiting
    const clientIp = getClientIp(request);
    
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
    
    // ✅ RATE LIMITING ENABLED FOR PRODUCTION
    // Strategy: Check 24h limits BEFORE payment, hourly limits AFTER payment verification
    // 
    // Flow:
    // 1. Check 24h successful mint limits (fast-fail before payment signature)
    //    - 5 mints per wallet per 24h (matches contract's permanent limit)
    //    - 10 mints per IP per 24h (prevents multi-wallet bypass)
    // 2. Process x402 payment (protocol provides spam protection)
    // 3. Check hourly limits for valid payments only
    //    - 20 valid payment attempts per hour per wallet
    // 4. Track successful mint (updates 24h counters)
    // 
    // This approach:
    // - Saves users from wasting payment signatures if already at 24h limit
    // - Only counts legitimate payment attempts (not failed dev/test attempts)
    // - x402 protocol prevents spam from invalid payments
    // - Contract enforces 5 mints per wallet forever (our limit is just optimization)
    
    // RATE LIMITING: Check 24h successful mint limits BEFORE payment (prevents wasting signature)
    const successLimitCheck = checkSuccessfulMintLimit(mintRequest.recipientWallet, clientIp);
    if (!successLimitCheck.allowed) {
      console.warn(`⚠️ 24h mint limit exceeded: ${successLimitCheck.reason}`);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: successLimitCheck.reason, 
            code: 'MINT_LIMIT_EXCEEDED',
            resetTime: successLimitCheck.resetTime 
          } 
        },
        { status: 429 }
      );
    }

    // Validate payment method
    if (!mintRequest.paymentMethod || !['email'].includes(mintRequest.paymentMethod)) {
      return NextResponse.json(
        { success: false, error: { message: 'Payment method must be email', code: 'INVALID_PAYMENT_METHOD' } },
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
    
    // Process x402 payment with calculated amount (don't fetch nextTokenId yet to avoid slow RPC on 402)
    const paymentResult = await processX402Payment(
      request,
      '/api/mint',
      `Mint ${quantity} x402 Protocol Pioneer NFT${quantity > 1 ? 's' : ''} on ${networkName}`,
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
      const errorMessage = paymentResult.settlementInfo?.error 
        ? `Payment settlement failed: ${paymentResult.settlementInfo.error}`
        : 'Payment verification failed';
      
      console.error('❌ Payment processing failed:', errorMessage);
      
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: errorMessage, 
            code: 'PAYMENT_FAILED',
            details: paymentResult.settlementInfo 
          } 
        },
        { status: 402 }
      );
    }

    // CRITICAL SECURITY: Verify the NFT recipient matches the payment sender
    const paymentSender = paymentResult.paymentHeader?.payload.authorization.from;
    
    console.log('🔐 [SECURITY CHECK]:', {
      paymentSender: paymentSender,
      nftRecipient: mintRequest.recipientWallet,
      match: paymentSender?.toLowerCase() === mintRequest.recipientWallet.toLowerCase()
    });
    
    if (paymentSender && paymentSender.toLowerCase() !== mintRequest.recipientWallet.toLowerCase()) {
      console.error(`❌ Security violation: Payment sender (${paymentSender}) does not match NFT recipient (${mintRequest.recipientWallet})`);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'NFT recipient must match payment sender for security', 
            code: 'RECIPIENT_MISMATCH' 
          } 
        },
        { status: 403 }
      );
    }

    console.log(`✅ Payment verified successfully, proceeding with mint`);

    // RATE LIMITING: Check hourly limit AFTER payment (only counts valid payment attempts)
    // This is 20 valid payment attempts per hour per wallet
    const rateLimitCheck = checkMintRateLimit(clientIp, mintRequest.recipientWallet);
    if (!rateLimitCheck.allowed) {
      console.warn(`⚠️ Hourly rate limit exceeded: ${rateLimitCheck.reason}`);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: rateLimitCheck.reason, 
            code: 'RATE_LIMIT_EXCEEDED',
            resetTime: rateLimitCheck.resetTime 
          } 
        },
        { 
          status: 429,
          headers: rateLimitCheck.resetTime && rateLimitCheck.remainingRequests !== undefined
            ? getRateLimitHeaders(rateLimitCheck.remainingRequests, rateLimitCheck.resetTime)
            : {}
        }
      );
    }

    // Now fetch the next token ID (only after payment is verified)
    const nextTokenId = await getNextTokenId();
    console.log(`🎫 Next token ID(s): #${nextTokenId}${quantity > 1 ? ` - #${nextTokenId + quantity - 1}` : ''}`);

    // Get CDP client and server wallet
    const cdp = initializeCDP();
    const serverAccount = await getServerWalletAccount();
    
    // Get public client for reading contract state
    const publicClient = getPublicClient();
    
    // CRITICAL: Check server wallet has ETH for gas
    console.log('💰 Checking server wallet balance...');
    const balance = await publicClient.getBalance({ 
      address: serverAccount.address as `0x${string}` 
    });
    const ethBalance = Number(balance) / 1e18;
    console.log(`💰 Server wallet balance: ${ethBalance.toFixed(6)} ETH`);
    
    if (ethBalance < 0.001) {
      console.error(`❌ Insufficient ETH for gas. Server wallet has ${ethBalance.toFixed(6)} ETH, needs at least 0.001 ETH`);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Server wallet has insufficient ETH for gas (${ethBalance.toFixed(6)} ETH). Please contact support.`, 
            code: 'INSUFFICIENT_GAS' 
          } 
        },
        { status: 500 }
      );
    }

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

    // CRITICAL: Check if server wallet is authorized
    console.log('🔐 Checking server wallet authorization...');
    try {
      const contractServerWallet = await contract.read.serverWallet();
      console.log(`   Contract serverWallet: ${contractServerWallet}`);
      console.log(`   Our minting wallet: ${serverAccount.address}`);
      
      if (contractServerWallet.toLowerCase() !== serverAccount.address.toLowerCase()) {
        console.error(`❌ Server wallet mismatch!`);
        console.error(`   Contract expects: ${contractServerWallet}`);
        console.error(`   We are using: ${serverAccount.address}`);
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: `Server wallet mismatch. The contract expects ${contractServerWallet} but the current minting wallet is ${serverAccount.address}. The contract owner must call updateServerWallet() to authorize the current minting wallet.`, 
              code: 'SERVER_WALLET_MISMATCH',
              details: {
                contractServerWallet: contractServerWallet,
                currentMintingWallet: serverAccount.address
              }
            } 
          },
          { status: 500 }
        );
      }
      
      console.log(`✅ Server wallet is authorized`);
    } catch (error) {
      console.warn('⚠️ Could not check serverWallet (contract might use different access control):', error);
      // Try MINTER_ROLE as fallback
      try {
        const MINTER_ROLE = await contract.read.MINTER_ROLE();
        const hasMinterRole = await contract.read.hasRole([MINTER_ROLE, serverAccount.address as `0x${string}`]);
        
        if (!hasMinterRole) {
          console.error(`❌ Server wallet ${serverAccount.address} does NOT have MINTER_ROLE!`);
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                message: `Server wallet needs MINTER_ROLE in the contract.`, 
                code: 'MISSING_MINTER_ROLE'
              } 
            },
            { status: 500 }
          );
        }
        console.log(`✅ Server wallet has MINTER_ROLE`);
      } catch (roleError) {
        console.warn('⚠️ Could not check MINTER_ROLE either - continuing anyway');
      }
    }
    
    // Mint the NFT(s) using CDP Server Wallets
    console.log(`🎨 Minting ${quantity} NFT(s) to ${mintRequest.recipientWallet} using CDP Server Wallets...`);
    
    const currentNetwork = isMainnet() ? 'base' : 'base-sepolia';

    // Prepare transaction data for minting
    const { encodeFunctionData } = await import('viem');
    
    let mintFunctionData: `0x${string}`;
    
    // IMPORTANT: Contract requires paymentMethod to be "x402"
    const contractPaymentMethod = "x402";
    
    if (quantity === 1) {
      // Single mint
      mintFunctionData = encodeFunctionData({
        abi: NFT_CONTRACT_ABI,
        functionName: 'mint',
        args: [
          mintRequest.recipientWallet as `0x${string}`,
          contractPaymentMethod,  // Always "x402" for the contract
          currentNetwork
        ]
      });
    } else {
      // Batch mint - all NFTs go to the same recipient
      const recipients = Array(quantity).fill(mintRequest.recipientWallet);
      const paymentMethods = Array(quantity).fill(contractPaymentMethod);  // Always "x402"
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

    console.log('✅ Transaction confirmed, reading updated supply...');
    
    // Get updated totals and calculate minted token IDs
    const newTotalSupply = await contract.read.totalSupply();
    console.log(`📊 Total supply after mint: ${newTotalSupply}`);
    
    const endTokenId = Number(newTotalSupply);
    const startTokenId = endTokenId - quantity + 1;
    
    console.log(`🎫 Calculated token IDs: #${startTokenId} to #${endTokenId}`);
    
    // Validate token IDs are positive
    if (startTokenId < 1 || endTokenId < 1) {
      console.error(`❌ Invalid token ID calculation! startTokenId: ${startTokenId}, endTokenId: ${endTokenId}, totalSupply: ${newTotalSupply}`);
      // Fall back to using the nextTokenId we calculated before
      const fallbackTokenIds = Array.from({ length: quantity }, (_, i) => nextTokenId + i);
      console.log(`📋 Using fallback token IDs: ${fallbackTokenIds}`);
      
      const mintResult = {
        success: true,
        quantity,
        tokenIds: fallbackTokenIds,
        tokenId: nextTokenId,
        transactionHash: txHash,
        contractAddress: NFT_CONTRACT_ADDRESS,
        recipientWallet: mintRequest.recipientWallet,
        paymentMethod: 'x402', // Always x402 in the contract
        network: currentNetwork,
        serverWallet: serverAccount.address,
        
        // Collection stats
        totalMinted: nextTokenId + quantity - 1,
        remainingSupply: 402 - (nextTokenId + quantity - 1),
        
        // URLs
        transactionUrl: `${getNetworkConfig().explorerUrl}/tx/${txHash}`,
        nftUrl: `${getNetworkConfig().explorerUrl}/token/${NFT_CONTRACT_ADDRESS}?a=${nextTokenId}`,
        metadataUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/metadata/${nextTokenId}`,
        openseaUrl: `https://opensea.io/${NFT_CONTRACT_ADDRESS}${isMainnet() ? '?chains=base' : '?chains=base_sepolia'}`,
        
        // Payment info
        paymentSettlement: paymentResult.settlementInfo,
        timestamp: Date.now()
      };
      
      console.log(`✅ ${quantity} NFT(s) minted successfully to ${mintRequest.recipientWallet}: #${nextTokenId}${quantity > 1 ? ` - #${nextTokenId + quantity - 1}` : ''}`);
      
      // Track successful mint for rate limiting
      trackSuccessfulMint(mintRequest.recipientWallet, clientIp);
      console.log('📋 Successful mint tracked for rate limiting');

      // Create payment response headers
      const paymentResponseHeaders = createPaymentResponseHeader(txHash);

      return NextResponse.json(
        { success: true, data: mintResult },
        { 
          status: 200,
          headers: {
            ...paymentResponseHeaders,
            ...getRateLimitHeaders(rateLimitCheck.remainingRequests || 0, rateLimitCheck.resetTime || Date.now()),
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Generate array of minted token IDs
    const tokenIds = Array.from({ length: quantity }, (_, i) => startTokenId + i);

    console.log(`✅ ${quantity} NFT(s) minted successfully to ${mintRequest.recipientWallet}: #${startTokenId}${quantity > 1 ? ` - #${endTokenId}` : ''}`);

    // Track successful mint for rate limiting
    trackSuccessfulMint(mintRequest.recipientWallet, clientIp);
    console.log('📋 Successful mint tracked for rate limiting');

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
          ...getRateLimitHeaders(rateLimitCheck.remainingRequests || 0, rateLimitCheck.resetTime || Date.now()),
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    const networkName = getCurrentNetworkName();
    console.error(`❌ NFT mint failed on ${networkName}:`, error);
    
    let errorMessage = error instanceof Error ? error.message : 'Unknown minting error';
    let errorCode = 'MINT_FAILED';
    
    // Provide more specific error messages for common CDP errors
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('unable to estimate gas') || msg.includes('gas estimation failed')) {
        errorMessage = 'Unable to mint: This wallet may have already reached the maximum mint limit (5 NFTs per wallet), or the collection is sold out.';
        errorCode = 'GAS_ESTIMATION_FAILED';
        
        // Log additional context for debugging
        console.error('💡 Gas estimation failed - likely causes:');
        console.error('   1. Wallet has already minted 5 NFTs (contract limit)');
        console.error('   2. Collection is sold out');
        console.error('   3. Contract is paused');
        console.error('   4. Insufficient USDC balance');
      } else if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
        errorMessage = 'Insufficient funds: The minting wallet does not have enough ETH for gas fees.';
        errorCode = 'INSUFFICIENT_FUNDS';
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: errorMessage, 
          code: errorCode,
          network: networkName,
          originalError: error instanceof Error ? error.message : undefined
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
      // Silently handle error
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