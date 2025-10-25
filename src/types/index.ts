// Core types for the x402Contract Deployer application

// x402 Payment Protocol Types
export interface X402PaymentRequest {
  scheme: 'exact';
  network: 'base-sepolia' | 'base-mainnet';
  maxAmountRequired: string; // USDC amount in atomic units (6 decimals)
  resource: string;
  description: string;
  mimeType: string;
  payTo: string; // Recipient address
  maxTimeoutSeconds: number;
  asset: string; // USDC contract address
  extra: {
    name: string;
    version: string;
  };
}

export interface X402PaymentHeader {
  x402Version: '0.0.1';
  scheme: 'exact';
  network: 'base-sepolia' | 'base-mainnet';
  paymentPayload: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
    v: number;
    r: string;
    s: string;
  };
}

// Contract Template Types
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'storage' | 'token' | 'nft' | 'defi';
  gasEstimate: number;
  parameters: ContractParameter[];
  bytecode: string;
  abi: readonly any[];
  verified: boolean;
  features?: string[]; // Optional array of feature descriptions
}

export interface ContractParameter {
  name: string;
  type: 'string' | 'uint256' | 'address' | 'bool';
  description: string;
  defaultValue?: string;
  required: boolean;
  placeholder?: string;
}

// Deployment Types
export interface DeploymentRequest {
  templateId: string;
  parameters: Record<string, any>;
  userAddress?: string;
}

export interface DeploymentResult {
  success: boolean;
  transactionHash: string;
  contractAddress?: string;
  explorerUrl: string;
  gasUsed?: number;
  timestamp: number;
  error?: string;
}

export interface DeploymentStatus {
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  transactionHash?: string;
  contractAddress?: string;
  confirmations: number;
  error?: string;
}

// Server Wallet Types  
export interface ServerWalletConfig {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret: string;
  network: 'base-sepolia' | 'base-mainnet';
}

// Embedded Wallet Types (Beta - may change)
export interface EmbeddedWalletConfig {
  appId: string;
  network: 'base-sepolia' | 'base-mainnet';
}

export interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  isConnected: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Payment Flow States
export type PaymentFlowState = 
  | 'idle'
  | 'payment-required'  
  | 'payment-pending'
  | 'payment-confirmed'
  | 'deployment-pending'
  | 'deployment-confirmed'
  | 'error';

export interface PaymentFlowContext {
  state: PaymentFlowState;
  template?: ContractTemplate;
  parameters?: Record<string, any>;
  paymentRequest?: X402PaymentRequest;
  deploymentResult?: DeploymentResult;
  error?: string;
}

// App Configuration
export interface AppConfig {
  network: 'base-sepolia' | 'base-mainnet';
  usdcAddress: string;
  explorerUrl: string;
  rpcUrl: string;
  paymentAmount: string;
  recipientAddress: string;
  enableMainnet: boolean;
}

// Event Types for Real-time Updates
export interface DeploymentEvent {
  type: 'payment-confirmed' | 'deployment-started' | 'deployment-confirmed' | 'deployment-failed';
  data: {
    transactionHash?: string;
    contractAddress?: string;
    error?: string;
    timestamp: number;
  };
}

// Component Props Types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PaymentFlowProps extends ComponentProps {
  template: ContractTemplate;
  parameters: Record<string, any>;
  onPaymentComplete: (result: DeploymentResult) => void;
  onError: (error: string) => void;
}

export interface ContractSelectorProps extends ComponentProps {
  templates: ContractTemplate[];
  selectedTemplate?: ContractTemplate;
  onTemplateSelect: (template: ContractTemplate) => void;
}

export interface DeploymentStatusProps extends ComponentProps {
  status: DeploymentStatus;
  explorerUrl?: string;
}

// NFT Types for x402 Protocol Pioneers
export interface NFTMintData {
  timestamp: bigint;
  paymentMethod: string;
  network: string;
}

export interface NFTWithMetadata {
  tokenId: bigint;
  tokenURI: string;
  rarityTier: string;
  mintData: NFTMintData;
  isLocked: boolean;
}

export interface NFTCollectionData {
  nfts: NFTWithMetadata[];
  totalCount: number;
  owner: string;
}

// Rarity tier types
export type RarityTier = 'Genesis' | 'Pioneer' | 'Early Adopter' | 'Protocol User';

// NFT Component Props
export interface NFTCardProps extends ComponentProps {
  nft: NFTWithMetadata;
  onSelect?: (nft: NFTWithMetadata) => void;
}

export interface NFTGalleryProps extends ComponentProps {
  nfts: NFTWithMetadata[];
  isLoading?: boolean;
  error?: string;
}
