import { CdpClient } from '@coinbase/cdp-sdk';
import type { ServerWalletConfig, DeploymentResult } from '@/types';
import { getNetworkConfig, isMainnet, getCurrentNetworkName } from './network-config';
import { createPublicClient, http, parseEther } from 'viem';
import { baseSepolia, base } from 'viem/chains';

/**
 * CDP Server Wallets v2 - Unified Implementation
 * Handles both contract deployment and minting using the new CDP SDK
 */

// Global CDP client instance
let cdpClient: CdpClient | null = null;

/**
 * Initialize CDP client with environment configuration
 */
export function initializeCDP(): CdpClient {
  if (cdpClient) {
    return cdpClient;
  }

  const config: ServerWalletConfig = {
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    walletSecret: process.env.CDP_WALLET_SECRET!,
    network: (process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true' ? 'base-mainnet' : 'base-sepolia') as 'base-sepolia' | 'base-mainnet'
  };

  // Validate required environment variables
  if (!config.apiKeyId || !config.apiKeySecret || !config.walletSecret) {
    throw new Error('Missing required CDP environment variables. Check .env.local file.');
  }

  try {
    cdpClient = new CdpClient({
      apiKeyId: config.apiKeyId,
      apiKeySecret: config.apiKeySecret,
      walletSecret: config.walletSecret,
    });

    console.log(`✅ CDP Server Wallet v2 initialized for ${config.network}`);
    return cdpClient;
  } catch (error) {
    console.error('❌ Failed to initialize CDP client:', error);
    throw new Error(`CDP initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get existing CDP client instance
 */
export function getCDPClient(): CdpClient {
  if (!cdpClient) {
    throw new Error('CDP client not initialized. Call initializeCDP() first.');
  }
  return cdpClient;
}

/**
 * Get viem public client for the current network
 */
export function getPublicClient() {
  const chain = isMainnet() ? base : baseSepolia;
  return createPublicClient({ 
    chain, 
    transport: http() 
  });
}

/**
 * Get or create the deployer account for contract deployment
 */
export async function getDeployerAccount() {
  try {
    const cdp = initializeCDP();
    const networkName = getCurrentNetworkName();
    
    // Use a named account for consistent deployment address
    const account = await cdp.evm.getOrCreateAccount({ 
      name: 'x402-contract-deployer' 
    });
    
    console.log(`📱 Deployer account: ${account.address} on ${networkName}`);
    return account;
  } catch (error) {
    console.error('❌ Failed to get deployer account:', error);
    throw new Error(`Failed to get deployer account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get or create the minting wallet account
 */
export async function getMintingAccount() {
  try {
    const cdp = initializeCDP();
    const account = await cdp.evm.getOrCreateAccount({ 
      name: 'x402-minting-wallet' 
    });
    
    console.log(`📱 Minting account: ${account.address}`);
    return account;
  } catch (error) {
    console.error('❌ Failed to get minting account:', error);
    throw new Error(`Failed to get minting account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check account balance (ETH)
 */
export async function checkAccountBalance(address: string): Promise<{ eth: string }> {
  try {
    const publicClient = getPublicClient();
    const networkName = getCurrentNetworkName();
    
    console.log(`💰 Checking ${networkName} balance for: ${address}`);

    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    const ethBalance = (Number(balance) / 1e18).toFixed(6);

    const balances = {
      eth: ethBalance
    };

    console.log(`💰 ${networkName} account balance:`, balances);
    return balances;
  } catch (error) {
    console.error('❌ Failed to check account balance:', error);
    throw error;
  }
}

/**
 * Fund account with testnet tokens (only works on Sepolia)
 */
export async function fundAccountIfNeeded(address: string): Promise<void> {
  const networkName = getCurrentNetworkName();
  
  if (isMainnet()) {
    console.log(`⚠️ Skipping faucet funding on ${networkName} (mainnet)`);
    return;
  }

  try {
    const cdp = initializeCDP();
    console.log(`💧 Attempting faucet funding on ${networkName}...`);
    
    const faucetResp = await cdp.evm.requestFaucet({
      address,
      network: 'base-sepolia',
      token: 'eth',
    });

    const publicClient = getPublicClient();
    await publicClient.waitForTransactionReceipt({
      hash: faucetResp.transactionHash as `0x${string}`,
    });

    console.log(`✅ Faucet funding successful: ${faucetResp.transactionHash}`);
  } catch (error) {
    console.warn(`⚠️ Faucet funding failed on ${networkName} (might already be funded):`, error);
    // Don't throw - account might already have funds
  }
}

/**
 * Deploy contract using CDP Server Wallets v2
 */
export async function deployContract(
  contractBytecode: string,
  accountAddress: string,
  constructorArgs: any[] = []
): Promise<DeploymentResult> {
  try {
    const cdp = initializeCDP();
    const networkName = getCurrentNetworkName();
    const network = isMainnet() ? 'base-mainnet' : 'base-sepolia';
    const networkConfig = getNetworkConfig();
    
    console.log(`🚀 Deploying contract to ${networkName} using CDP Server Wallets v2`);

    // Check account has sufficient ETH for gas
    const balances = await checkAccountBalance(accountAddress);
    const ethBalance = parseFloat(balances.eth);
    
    const minEthRequired = isMainnet() ? 0.005 : 0.001;
    if (ethBalance < minEthRequired) {
      throw new Error(
        `Insufficient ETH balance for gas on ${networkName}. ` +
        `Have: ${ethBalance} ETH, need at least ${minEthRequired} ETH`
      );
    }

    // If constructor args provided, encode them
    let deployBytecode = contractBytecode;
    if (constructorArgs.length > 0) {
      const { encodeAbiParameters } = await import('viem');
      
      // Build parameter types from constructor args
      const paramTypes: any[] = constructorArgs.map((arg: any) => {
        if (typeof arg === 'string' && arg.startsWith('0x')) {
          return { type: 'address' };
        } else if (typeof arg === 'string') {
          return { type: 'string' };
        } else if (typeof arg === 'bigint') {
          return { type: 'uint256' };
        } else if (typeof arg === 'boolean') {
          return { type: 'bool' };
        } else {
          return { type: 'string' };
        }
      });

      const encodedArgs = encodeAbiParameters(paramTypes, constructorArgs);
      deployBytecode = (contractBytecode + encodedArgs.slice(2)) as `0x${string}`;
    }

    console.log(`📋 Deploying from account: ${accountAddress}`);

    // Deploy using CDP SDK
    const txResult = await cdp.evm.sendTransaction({
      address: accountAddress as `0x${string}`,
      network: network as any,
      transaction: {
        data: deployBytecode as `0x${string}`,
      },
    });

    console.log(`📋 Transaction broadcasted: ${txResult.transactionHash}`);

    // Wait for confirmation
    const publicClient = getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txResult.transactionHash as `0x${string}`,
    });

    const contractAddress = receipt.contractAddress;
    
    if (!contractAddress) {
      throw new Error('Contract address not found in transaction receipt');
    }

    const result: DeploymentResult = {
      success: true,
      transactionHash: txResult.transactionHash,
      contractAddress,
      explorerUrl: `${networkConfig.explorerUrl}/tx/${txResult.transactionHash}`,
      gasUsed: Number(receipt.gasUsed),
      timestamp: Date.now()
    };

    console.log(`✅ Contract deployed successfully on ${networkName}:`, result);
    return result;

  } catch (error) {
    const networkName = getCurrentNetworkName();
    console.error(`❌ Contract deployment failed on ${networkName}:`, error);
    
    const result: DeploymentResult = {
      success: false,
      transactionHash: '',
      explorerUrl: '',
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    };

    return result;
  }
}

/**
 * Send a transaction to call a contract function
 */
export async function sendContractTransaction(
  accountAddress: string,
  contractAddress: string,
  functionData: `0x${string}`,
  value: bigint = 0n
): Promise<{ transactionHash: string; explorerUrl: string }> {
  try {
    const cdp = initializeCDP();
    const networkName = getCurrentNetworkName();
    const network = isMainnet() ? 'base-mainnet' : 'base-sepolia';
    const networkConfig = getNetworkConfig();
    
    console.log(`📞 Sending transaction to ${contractAddress} on ${networkName}`);

    // Send transaction
    const txResult = await cdp.evm.sendTransaction({
      address: accountAddress as `0x${string}`,
      network: network as any,
      transaction: {
        to: contractAddress as `0x${string}`,
        data: functionData,
        value,
      },
    });

    console.log(`✅ Transaction sent: ${txResult.transactionHash}`);

    // Wait for confirmation
    const publicClient = getPublicClient();
    await publicClient.waitForTransactionReceipt({
      hash: txResult.transactionHash as `0x${string}`,
    });

    const explorerUrl = `${networkConfig.explorerUrl}/tx/${txResult.transactionHash}`;
    console.log(`✅ Transaction confirmed: ${explorerUrl}`);

    return {
      transactionHash: txResult.transactionHash,
      explorerUrl,
    };

  } catch (error) {
    const networkName = getCurrentNetworkName();
    console.error(`❌ Transaction failed on ${networkName}:`, error);
    throw error;
  }
}

/**
 * Call contract function (like executeAirdrop or mint)
 */
export async function callContractFunction(
  accountAddress: string,
  contractAddress: string,
  functionName: string,
  args: any[] = [],
  abi: any[]
): Promise<{ transactionHash: string; explorerUrl: string }> {
  try {
    const networkName = getCurrentNetworkName();
    console.log(`📞 Calling ${functionName} on ${contractAddress} (${networkName})`);

    // Encode function call
    const { encodeFunctionData } = await import('viem');
    const data = encodeFunctionData({
      abi,
      functionName,
      args,
    });

    // Use the generic transaction sender
    return await sendContractTransaction(accountAddress, contractAddress, data);

  } catch (error) {
    const networkName = getCurrentNetworkName();
    console.error(`❌ Contract function call failed on ${networkName}:`, error);
    throw error;
  }
}

/**
 * Estimate gas cost for deployment
 */
export function estimateDeploymentCost(gasEstimate: number): {
  gasEstimate: number;
  estimatedETHCost: string;
  isMainnet: boolean;
} {
  const networkName = getCurrentNetworkName();
  
  // Rough estimation (actual costs will vary)
  const avgGasPriceGwei = isMainnet() ? 0.05 : 0.01; // Base is very cheap
  const ethCostWei = gasEstimate * (avgGasPriceGwei * 1e9);
  const ethCost = ethCostWei / 1e18;

  return {
    gasEstimate,
    estimatedETHCost: ethCost.toFixed(6),
    isMainnet: isMainnet()
  };
}

/**
 * Get account details with current network specifics
 */
export async function getAccountDetails(address: string): Promise<{
  address: string;
  network: string;
  balances: { eth: string };
}> {
  try {
    const networkName = getCurrentNetworkName();
    const balances = await checkAccountBalance(address);

    return {
      address,
      network: networkName.toLowerCase().replace(' ', '-'),
      balances,
    };
  } catch (error) {
    console.error('❌ Failed to get account details:', error);
    throw error;
  }
}

// Backward compatibility exports
export const initializeCoinbaseSDK = initializeCDP;
export const getDeployerWallet = getDeployerAccount;
export const checkWalletBalance = async (account: any) => {
  return checkAccountBalance(account.address);
};
export const fundWalletIfNeeded = async (account: any) => {
  return fundAccountIfNeeded(account.address);
};
