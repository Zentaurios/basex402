/**
 * Etherscan V2 API Integration using environment variables
 * Supports both Base and Sepolia based on configuration
 */

import { getNetworkConfig } from './network-config';

const ETHERSCAN_V2_URL = 'https://api.etherscan.io/v2/api';

interface EtherscanV2Response<T = any> {
  status: string;
  message: string;
  result: T;
}

/**
 * Base class for Etherscan V2 API calls
 */
class EtherscanV2API {
  private apiKey: string;
  private baseUrl: string;
  private chainId: number;

  constructor() {
    const networkConfig = getNetworkConfig();
    
    this.apiKey = process.env.ETHERSCAN_API_KEY!;
    this.baseUrl = ETHERSCAN_V2_URL;
    this.chainId = networkConfig.chainId;

    if (!this.apiKey) {
      throw new Error('ETHERSCAN_API_KEY is required');
    }

    console.log(`🔍 Etherscan V2 API initialized for Chain ID: ${this.chainId}`);
  }

  /**
   * Make API request to Etherscan V2
   */
  private async makeRequest<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl);
    url.searchParams.append('chainid', this.chainId.toString());
    url.searchParams.append('apikey', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log(`🔍 Etherscan V2 API request: Chain ${this.chainId}, Module: ${params.module}, Action: ${params.action}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
    }

    const data: EtherscanV2Response<T> = await response.json();
    
    if (data.status === '0') {
      throw new Error(`Etherscan API error: ${data.message}`);
    }

    return data.result;
  }

  /**
   * Get account balance (ETH)
   */
  async getBalance(address: string): Promise<string> {
    return this.makeRequest({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest'
    });
  }

  /**
   * Get token balance for address (e.g., USDC)
   */
  async getTokenBalance(address: string, contractAddress: string): Promise<string> {
    return this.makeRequest({
      module: 'account',
      action: 'tokenbalance',
      contractaddress: contractAddress,
      address,
      tag: 'latest'
    });
  }

  /**
   * Get transaction details
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    return this.makeRequest({
      module: 'proxy',
      action: 'eth_getTransactionReceipt',
      txhash: txHash
    });
  }

  /**
   * Get contract ABI (if verified)
   */
  async getContractABI(contractAddress: string): Promise<any[]> {
    return this.makeRequest({
      module: 'contract',
      action: 'getabi',
      address: contractAddress
    });
  }

  /**
   * Verify contract source code
   */
  async verifyContract(params: {
    contractAddress: string;
    sourceCode: string;
    contractName: string;
    compilerVersion: string;
    optimizationUsed: boolean;
    runs?: number;
    constructorArguments?: string;
  }): Promise<string> {
    const requestParams = {
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: params.contractAddress,
      sourceCode: params.sourceCode,
      codeformat: 'solidity-single-file',
      contractname: params.contractName,
      compilerversion: params.compilerVersion,
      optimizationUsed: params.optimizationUsed ? '1' : '0',
      runs: (params.runs || 200).toString(),
      constructorArguements: params.constructorArguments || ''
    };

    return this.makeRequest(requestParams);
  }

  /**
   * Check contract verification status
   */
  async checkVerificationStatus(guid: string): Promise<string> {
    return this.makeRequest({
      module: 'contract',
      action: 'checkverifystatus',
      guid
    });
  }

  /**
   * Get list of transactions for address
   */
  async getTransactions(address: string, startBlock?: number, endBlock?: number): Promise<any[]> {
    const params: Record<string, string> = {
      module: 'account',
      action: 'txlist',
      address,
      sort: 'desc'
    };

    if (startBlock) params.startblock = startBlock.toString();
    if (endBlock) params.endblock = endBlock.toString();

    return this.makeRequest(params);
  }

  /**
   * Get contract creation transaction
   */
  async getContractCreation(contractAddress: string): Promise<any> {
    return this.makeRequest({
      module: 'contract',
      action: 'getcontractcreation',
      contractaddresses: contractAddress
    });
  }
}

// Singleton instance
let etherscanAPI: EtherscanV2API | null = null;

/**
 * Get Etherscan V2 API instance
 */
export function getEtherscanAPI(): EtherscanV2API {
  if (!etherscanAPI) {
    etherscanAPI = new EtherscanV2API();
  }
  return etherscanAPI;
}

/**
 * Get contract address from deployment transaction
 */
export async function getContractAddressFromTx(txHash: string): Promise<string | null> {
  try {
    const api = getEtherscanAPI();
    const receipt = await api.getTransactionReceipt(txHash);
    
    return receipt?.contractAddress || null;
  } catch (error) {
    console.error('❌ Failed to get contract address from transaction:', error);
    return null;
  }
}

/**
 * Wait for transaction confirmation and get contract address
 */
export async function waitForDeployment(
  txHash: string, 
  maxAttempts: number = 30,
  delayMs: number = 2000
): Promise<{ contractAddress: string | null; confirmed: boolean }> {
  const api = getEtherscanAPI();
  const networkConfig = getNetworkConfig();
  
  console.log(`⏳ Waiting for transaction confirmation on ${networkConfig.name}...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const receipt = await api.getTransactionReceipt(txHash);
      
      if (receipt && receipt.status === '0x1') {
        console.log(`✅ Transaction confirmed on ${networkConfig.name}`);
        return {
          contractAddress: receipt.contractAddress || null,
          confirmed: true
        };
      }
      
      if (receipt && receipt.status === '0x0') {
        // Transaction failed
        console.log(`❌ Transaction failed on ${networkConfig.name}`);
        return {
          contractAddress: null,
          confirmed: false
        };
      }
      
      // Transaction still pending
      console.log(`⏳ Waiting for confirmation... (${attempt + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
    } catch (error) {
      console.log(`⏳ Transaction not yet confirmed... (${attempt + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return {
    contractAddress: null,
    confirmed: false
  };
}

/**
 * Get USDC balance for address on current network
 */
export async function getUSDCBalance(address: string): Promise<string> {
  try {
    const api = getEtherscanAPI();
    const networkConfig = getNetworkConfig();
    
    const balance = await api.getTokenBalance(address, networkConfig.usdc.address);
    return balance;
  } catch (error) {
    console.error('❌ Failed to get USDC balance:', error);
    return '0';
  }
}

/**
 * Verify deployed contract on current network
 */
export async function verifyDeployedContract(
  contractAddress: string,
  sourceCode: string,
  contractName: string,
  constructorArgs?: string
): Promise<{ success: boolean; guid?: string; error?: string }> {
  try {
    const api = getEtherscanAPI();
    const networkConfig = getNetworkConfig();
    
    console.log(`📋 Verifying contract on ${networkConfig.name}...`);
    
    const guid = await api.verifyContract({
      contractAddress,
      sourceCode,
      contractName,
      compilerVersion: 'v0.8.19+commit.7dd6d404', // Default Solidity version
      optimizationUsed: true,
      runs: 200,
      constructorArguments: constructorArgs
    });

    console.log(`✅ Contract verification submitted on ${networkConfig.name}, GUID: ${guid}`);
    
    return { success: true, guid };
  } catch (error) {
    const networkConfig = getNetworkConfig();
    console.error(`❌ Contract verification failed on ${networkConfig.name}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if contract is verified
 */
export async function isContractVerified(contractAddress: string): Promise<boolean> {
  try {
    const api = getEtherscanAPI();
    const abi = await api.getContractABI(contractAddress);
    
    return abi && abi.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get network-specific explorer name
 */
export function getExplorerName(): string {
  const networkConfig = getNetworkConfig();
  return networkConfig.chainId === 8453 ? 'BaseScan' : 'BaseScan Sepolia';
}
