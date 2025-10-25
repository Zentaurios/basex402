/**
 * Etherscan API V2 Client
 * Unified multichain API client supporting 60+ networks
 * 
 * Migration from V1:
 * - Base URL: https://api.etherscan.io/v2/api
 * - Requires chainid parameter for target network
 * - Single API key works across all chains
 */

import { getNetworkConfig, isMainnet } from '@/lib/network-config';

const ETHERSCAN_V2_BASE_URL = 'https://api.etherscan.io/v2/api';

// Chain IDs for supported networks
const CHAIN_IDS = {
  'ethereum': 1,
  'base': 8453,
  'base-sepolia': 84532,
  'polygon': 137,
  'optimism': 10,
  'arbitrum': 42161,
} as const;

/**
 * Get chain ID for current network
 */
function getCurrentChainId(): number {
  return isMainnet() ? CHAIN_IDS['base'] : CHAIN_IDS['base-sepolia'];
}

/**
 * Get Etherscan API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error('ETHERSCAN_API_KEY not configured in environment');
  }
  return apiKey;
}

/**
 * Make a request to Etherscan API V2
 */
async function makeEtherscanRequest(params: Record<string, string | number>): Promise<any> {
  const chainid = getCurrentChainId();
  const apiKey = getApiKey();
  
  const queryParams = new URLSearchParams({
    chainid: chainid.toString(),
    apikey: apiKey,
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, value.toString()])
    ),
  });

  const url = `${ETHERSCAN_V2_BASE_URL}?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Etherscan API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data.status === '0' && data.message === 'NOTOK') {
      throw new Error(`Etherscan API error: ${data.result}`);
    }
    
    return data;
  } catch (error) {
    console.error('Etherscan API request failed:', error);
    throw error;
  }
}

/**
 * Get ETH balance for an address
 */
export async function getBalance(address: string): Promise<string> {
  const data = await makeEtherscanRequest({
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  });
  
  return data.result;
}

/**
 * Get ERC-20 token balance for an address
 */
export async function getTokenBalance(
  address: string,
  contractAddress: string
): Promise<string> {
  const data = await makeEtherscanRequest({
    module: 'account',
    action: 'tokenbalance',
    contractaddress: contractAddress,
    address,
    tag: 'latest',
  });
  
  return data.result;
}

/**
 * Get transaction receipt status
 */
export async function getTransactionStatus(txHash: string): Promise<{
  status: '0' | '1'; // 0 = failed, 1 = success
  blockNumber: string;
  gasUsed: string;
}> {
  const data = await makeEtherscanRequest({
    module: 'transaction',
    action: 'gettxreceiptstatus',
    txhash: txHash,
  });
  
  return {
    status: data.result.status,
    blockNumber: data.result.blockNumber || '0',
    gasUsed: data.result.gasUsed || '0',
  };
}

/**
 * Get contract ABI
 */
export async function getContractABI(contractAddress: string): Promise<any> {
  const data = await makeEtherscanRequest({
    module: 'contract',
    action: 'getabi',
    address: contractAddress,
  });
  
  return JSON.parse(data.result);
}

/**
 * Get contract source code
 */
export async function getContractSource(contractAddress: string): Promise<any> {
  const data = await makeEtherscanRequest({
    module: 'contract',
    action: 'getsourcecode',
    address: contractAddress,
  });
  
  return data.result[0];
}

/**
 * Verify contract on Etherscan
 * Note: This requires additional parameters specific to your contract
 */
export async function verifyContract(params: {
  contractAddress: string;
  sourceCode: string;
  contractName: string;
  compilerVersion: string;
  optimizationUsed: 0 | 1;
  runs?: number;
  constructorArguments?: string;
  evmVersion?: string;
  licenseType?: number;
}): Promise<string> {
  const data = await makeEtherscanRequest({
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: params.contractAddress,
    sourceCode: params.sourceCode,
    codeformat: 'solidity-single-file',
    contractname: params.contractName,
    compilerversion: params.compilerVersion,
    optimizationUsed: params.optimizationUsed.toString(),
    runs: (params.runs || 200).toString(),
    constructorArguements: params.constructorArguments || '',
    evmversion: params.evmVersion || 'default',
    licenseType: (params.licenseType || 1).toString(),
  });
  
  return data.result; // Returns GUID for checking verification status
}

/**
 * Check contract verification status
 */
export async function checkVerificationStatus(guid: string): Promise<{
  status: string;
  result: string;
}> {
  const data = await makeEtherscanRequest({
    module: 'contract',
    action: 'checkverifystatus',
    guid,
  });
  
  return {
    status: data.status,
    result: data.result,
  };
}

/**
 * Get list of transactions for an address
 */
export async function getTransactions(
  address: string,
  startBlock: number = 0,
  endBlock: number = 99999999,
  page: number = 1,
  offset: number = 10,
  sort: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  const data = await makeEtherscanRequest({
    module: 'account',
    action: 'txlist',
    address,
    startblock: startBlock,
    endblock: endBlock,
    page,
    offset,
    sort,
  });
  
  return data.result;
}

/**
 * Get list of ERC-20 token transfers for an address
 */
export async function getTokenTransfers(
  address: string,
  contractAddress?: string,
  startBlock: number = 0,
  endBlock: number = 99999999,
  page: number = 1,
  offset: number = 10,
  sort: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  const params: Record<string, any> = {
    module: 'account',
    action: 'tokentx',
    address,
    startblock: startBlock,
    endblock: endBlock,
    page,
    offset,
    sort,
  };
  
  if (contractAddress) {
    params.contractaddress = contractAddress;
  }
  
  const data = await makeEtherscanRequest(params);
  return data.result;
}

/**
 * Get list of ERC-721 NFT transfers for an address
 */
export async function getNFTTransfers(
  address: string,
  contractAddress?: string,
  startBlock: number = 0,
  endBlock: number = 99999999,
  page: number = 1,
  offset: number = 10,
  sort: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  const params: Record<string, any> = {
    module: 'account',
    action: 'tokennfttx',
    address,
    startblock: startBlock,
    endblock: endBlock,
    page,
    offset,
    sort,
  };
  
  if (contractAddress) {
    params.contractaddress = contractAddress;
  }
  
  const data = await makeEtherscanRequest(params);
  return data.result;
}

/**
 * Get current gas price
 */
export async function getGasPrice(): Promise<string> {
  const data = await makeEtherscanRequest({
    module: 'proxy',
    action: 'eth_gasPrice',
  });
  
  return data.result;
}

/**
 * Get estimated gas for a transaction
 */
export async function estimateGas(params: {
  from: string;
  to: string;
  value?: string;
  data?: string;
}): Promise<string> {
  const data = await makeEtherscanRequest({
    module: 'proxy',
    action: 'eth_estimateGas',
    to: params.to,
    value: params.value || '0x0',
    data: params.data || '0x',
    from: params.from,
  });
  
  return data.result;
}

/**
 * Utility: Format explorer URL for transaction
 */
export function getExplorerTxUrl(txHash: string): string {
  const config = getNetworkConfig();
  return `${config.explorerUrl}/tx/${txHash}`;
}

/**
 * Utility: Format explorer URL for address
 */
export function getExplorerAddressUrl(address: string): string {
  const config = getNetworkConfig();
  return `${config.explorerUrl}/address/${address}`;
}

/**
 * Utility: Format explorer URL for token
 */
export function getExplorerTokenUrl(contractAddress: string, tokenId?: string): string {
  const config = getNetworkConfig();
  const baseUrl = `${config.explorerUrl}/token/${contractAddress}`;
  return tokenId ? `${baseUrl}?a=${tokenId}` : baseUrl;
}
