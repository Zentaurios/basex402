import { initializeCDP, getMintingAccount, callContractFunction, checkAccountBalance } from '@/lib/cdp-client';
import { getNetworkConfig, getCurrentNetworkName } from '@/lib/network-config';

/**
 * Execute the X402 Protocol Pioneers Airdrop
 * 
 * This will mint 47 NFTs to 27 recipients in a single transaction
 * Can only be executed once and only by the server wallet
 */

// Contract ABI for executeAirdrop function
const AIRDROP_ABI = [
  {
    "inputs": [],
    "name": "executeAirdrop",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "canExecuteAirdrop",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAirdropStatus",
    "outputs": [
      {"internalType": "bool", "name": "ready", "type": "bool"},
      {"internalType": "bool", "name": "completed", "type": "bool"}
    ],
    "stateMutability": "view",
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
    "name": "airdropCompleted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

interface AirdropResult {
  success: boolean;
  transactionHash?: string;
  explorerUrl?: string;
  totalRecipients?: number;
  totalNFTs?: number;
  error?: string;
}

/**
 * Check if the airdrop can be executed
 */
export async function checkAirdropStatus(contractAddress: string): Promise<{
  canExecute: boolean;
  completed: boolean;
  currentSupply: number;
  remainingSlots: number;
}> {
  try {
    const { createPublicClient, http } = await import('viem');
    const { base, baseSepolia } = await import('viem/chains');
    const { isMainnet } = await import('@/lib/network-config');
    
    const chain = isMainnet() ? base : baseSepolia;
    const publicClient = createPublicClient({
      chain,
      transport: http()
    });

    // Read contract state
    const [canExecute, totalSupply, completed] = await Promise.all([
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: 'canExecuteAirdrop',
      }),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: 'totalSupply',
      }),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: 'airdropCompleted',
      })
    ]);

    const currentSupply = Number(totalSupply);
    const MAX_SUPPLY = 402;
    const AIRDROP_SIZE = 47;

    return {
      canExecute: Boolean(canExecute),
      completed: Boolean(completed),
      currentSupply,
      remainingSlots: MAX_SUPPLY - currentSupply
    };

  } catch (error) {
    console.error('❌ Failed to check airdrop status:', error);
    throw error;
  }
}

/**
 * Execute the airdrop
 * 
 * ⚠️ IMPORTANT:
 * - Can only be executed once
 * - Must have at least 47 slots remaining (totalSupply <= 355)
 * - Will cost significant gas (~3-5M gas)
 * - Must be called by the server wallet address
 */
export async function executeAirdrop(contractAddress: string): Promise<AirdropResult> {
  try {
    const networkName = getCurrentNetworkName();
    const networkConfig = getNetworkConfig();
    
    console.log(`🎁 Starting airdrop execution on ${networkName}...`);
    console.log(`📋 Contract: ${contractAddress}`);

    // Initialize CDP and get minting account (server wallet)
    initializeCDP();
    const mintingAccount = await getMintingAccount();
    
    console.log(`📱 Server wallet: ${mintingAccount.address}`);

    // Check airdrop status
    const status = await checkAirdropStatus(contractAddress);
    
    console.log(`📊 Airdrop Status:`);
    console.log(`   Current Supply: ${status.currentSupply}/402`);
    console.log(`   Remaining Slots: ${status.remainingSlots}`);
    console.log(`   Can Execute: ${status.canExecute}`);
    console.log(`   Already Completed: ${status.completed}`);

    // Validate airdrop can be executed
    if (status.completed) {
      return {
        success: false,
        error: 'Airdrop has already been completed'
      };
    }

    if (!status.canExecute) {
      return {
        success: false,
        error: 'Airdrop cannot be executed at this time'
      };
    }

    if (status.remainingSlots < 47) {
      return {
        success: false,
        error: `Insufficient slots remaining. Need 47, have ${status.remainingSlots}. Execute airdrop before token #356 is minted!`
      };
    }

    // Check account has sufficient ETH for gas
    const balance = await checkAccountBalance(mintingAccount.address);
    const ethBalance = parseFloat(balance.eth);
    
    const MIN_ETH_REQUIRED = 0.01; // Airdrop will need more gas
    if (ethBalance < MIN_ETH_REQUIRED) {
      return {
        success: false,
        error: `Insufficient ETH for gas. Have: ${ethBalance} ETH, need at least ${MIN_ETH_REQUIRED} ETH for airdrop execution`
      };
    }

    console.log(`⛽ Gas balance OK: ${ethBalance} ETH`);
    console.log(`🚀 Executing airdrop (this will mint 47 NFTs to 27 recipients)...`);

    // Execute the airdrop
    const result = await callContractFunction(
      mintingAccount.address,
      contractAddress,
      'executeAirdrop',
      [], // No arguments needed
      AIRDROP_ABI
    );

    console.log(`✅ Airdrop executed successfully!`);
    console.log(`🔗 Transaction: ${result.transactionHash}`);
    console.log(`🌐 Explorer: ${result.explorerUrl}`);

    return {
      success: true,
      transactionHash: result.transactionHash,
      explorerUrl: result.explorerUrl,
      totalRecipients: 27,
      totalNFTs: 47
    };

  } catch (error) {
    const networkName = getCurrentNetworkName();
    console.error(`❌ Airdrop execution failed on ${networkName}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown airdrop execution error'
    };
  }
}

/**
 * Preview airdrop recipients (without executing)
 */
export function getAirdropRecipients(): Array<{ address: string; amount: number }> {
  return [
    { address: '0x6b4d1927e81338EA8330B36ea2096432662bfb70', amount: 5 },
    { address: '0x68D79808A9757f5a29393a67BFc17dff1396F8a9', amount: 4 },
    { address: '0x416AA2d7adBB3F599F42768636a761C9BAF0C8E4', amount: 3 },
    { address: '0xad9cC1a85e74Bd1300c57082ba86Ed21E6AAA5e8', amount: 3 },
    { address: '0xB3CcE18DDA084502ba37a454563fF835559f89a8', amount: 3 },
    { address: '0x003bd719c43D683335513e1435Ff976FE73Ab65E', amount: 2 },
    { address: '0x18717190340A530A4b74BfA823CdC70fDC7d813B', amount: 2 },
    { address: '0x5660E1a26B68f50B4DabB92d4271aa5035b476ac', amount: 2 },
    { address: '0x5bD75193b70050A40EDDFb13d1AA1851236d1012', amount: 2 },
    { address: '0x968974717B8209006a661657c1F2852ffc6870bd', amount: 2 },
    { address: '0xBc364A87a5257957679BaDEcE3E3610FaaA91511', amount: 2 },
    { address: '0xe68bc10cB855b108dedc1cFE6E77B089d46CD45A', amount: 2 },
    { address: '0x120f6EBdE2B8582C569903AC76A8F150bBd0a6BD', amount: 1 },
    { address: '0x1DB3FEd7AaA3418AAACA6d2094717Dc214f1b0c2', amount: 1 },
    { address: '0x3D5AE9E34ab7d7b06156cF831f73A9955619f28f', amount: 1 },
    { address: '0x461acd846B4cc249b96242F1AB7c72a39d94747c', amount: 1 },
    { address: '0x703EDc0c7e64d30F52073650bf7860b26d9949cF', amount: 1 },
    { address: '0x78f52b01D061b8C71f8ACBC8fDc7D111C9d6d9F9', amount: 1 },
    { address: '0x7F854378EC0D23346f16F17A161383CDd00438Bd', amount: 1 },
    { address: '0x8B6B94Bab1097E7c2c06D16cf48A9e8959DB92F8', amount: 1 },
    { address: '0x8e225dae9B895Ea75feE06c64E1899CbA23355EA', amount: 1 },
    { address: '0x943590A42C27D08e3744202c4Ae5eD55c2dE240D', amount: 1 },
    { address: '0xA487b2e2B9028D3C6b9783fe517519f108c133ce', amount: 1 },
    { address: '0xB458D89B71a1ad74Ff5D509B96e666c1B0130C28', amount: 1 },
    { address: '0xc54A1BdB11D728373c79db86F042582aD9F04452', amount: 1 },
    { address: '0xc634c79097ae12C3c6484aDad9cF4d91aA7B6e2a', amount: 1 },
    { address: '0xf1eFAf60F6a3d28b78D2614E08200d379DF4d591', amount: 1 }
  ];
}
