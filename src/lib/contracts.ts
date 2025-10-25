import type { ContractTemplate } from '@/types';

/**
 * Smart Contract Templates for Deployment
 */

// x402 Protocol Pioneers NFT ABI (the important functions)
const X402_NFT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_serverWallet", "type": "address"},
      {"internalType": "string", "name": "_baseURI", "type": "string"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint8", "name": "paymentMethod", "type": "uint8"},
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
      {"internalType": "uint8[]", "name": "paymentMethods", "type": "uint8[]"},
      {"internalType": "string[]", "name": "networks", "type": "string[]"}
    ],
    "name": "batchMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
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
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getRarityTier",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "pure",
    "type": "function"
  },
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
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "getNFTsOwned",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "string", "name": "tokenURI", "type": "string"},
          {"internalType": "string", "name": "rarityTier", "type": "string"},
          {
            "components": [
              {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
              {"internalType": "string", "name": "paymentMethod", "type": "string"},
              {"internalType": "string", "name": "network", "type": "string"}
            ],
            "internalType": "struct X402ProtocolPioneers.MintData",
            "name": "mintData",
            "type": "tuple"
          },
          {"internalType": "bool", "name": "isLocked", "type": "bool"}
        ],
        "internalType": "struct X402ProtocolPioneers.TokenWithMetadata[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "getTokenIdsOwned",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * Available contract templates
 */
export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'x402-protocol-pioneers',
    name: 'x402 Protocol Pioneers NFT',
    description: 'Limited collection of 402 NFTs proving early adoption of x402 payment protocol. 4 rarity tiers based on mint order.',
    category: 'nft',
    gasEstimate: 800000, // Higher gas for NFT contract
    parameters: [
      {
        name: 'serverWallet',
        type: 'address',
        description: 'Address that will have minting permissions (your server wallet)',
        required: true,
        placeholder: '0x...'
      },
      {
        name: 'baseURI',
        type: 'string',
        description: 'Base URI for NFT metadata (e.g., https://yourdomain.com/api/metadata/)',
        defaultValue: `${process.env.NEXT_PUBLIC_APP_URL}/api/metadata/`,
        required: true,
        placeholder: 'https://yourdomain.com/api/metadata/'
      }
    ],
    // TODO: Add actual compiled bytecode from your X402ProtocolPioneers.sol
    bytecode: '0x608060405234801561001057600080fd5b50', // PLACEHOLDER - needs real bytecode
    abi: X402_NFT_ABI,
    verified: true, // Will verify on Etherscan after deployment
    // sourceCode: '// Contract source code would go here for verification', // TODO: Add actual source if needed
    features: [
      'ERC-721 compliant',
      '402 max supply',
      '5 per wallet limit', 
      '4 rarity tiers',
      'Dynamic metadata',
      'Batch minting',
      'OpenSea compatible'
    ]
  },

  // Keep your existing templates...
  {
    id: 'simple-storage',
    name: 'Simple Storage',
    description: 'Store and retrieve text data on the blockchain. Perfect for learning smart contract basics.',
    category: 'storage',
    gasEstimate: 200000,
    parameters: [
      {
        name: 'initialData',
        type: 'string',
        description: 'Initial text to store in the contract',
        defaultValue: 'Hello, Base!',
        required: true,
        placeholder: 'Enter your message...'
      }
    ],
    bytecode: '0x608060405234801561001057600080fd5b50',
    abi: [] as const,
    verified: false
  }
];

/**
 * Get contract template by ID
 */
export function getContractTemplate(id: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find(template => template.id === id);
}

/**
 * Get all contract templates by category
 */
export function getContractTemplatesByCategory(category: ContractTemplate['category']): ContractTemplate[] {
  return CONTRACT_TEMPLATES.filter(template => template.category === category);
}

/**
 * Validate contract parameters
 */
export function validateContractParameters(
  template: ContractTemplate,
  parameters: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const param of template.parameters) {
    const value = parameters[param.name];
    
    // Check required parameters
    if (param.required && (!value || value.toString().trim() === '')) {
      errors.push(`${param.name} is required`);
      continue;
    }
    
    // Type-specific validation
    switch (param.type) {
      case 'string':
        if (value && typeof value !== 'string') {
          errors.push(`${param.name} must be a string`);
        }
        break;
        
      case 'uint256':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) {
          errors.push(`${param.name} must be a positive number`);
        }
        break;
        
      case 'address':
        if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
          errors.push(`${param.name} must be a valid Ethereum address`);
        }
        break;
        
      case 'bool':
        if (value !== undefined && typeof value !== 'boolean') {
          errors.push(`${param.name} must be true or false`);
        }
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get deployment bytecode with constructor parameters  
 */
export function getDeploymentBytecode(
  template: ContractTemplate,
  parameters: Record<string, any>
): string {
  // TODO: Implement proper constructor parameter encoding
  // For now, return the base bytecode
  return template.bytecode;
}

/**
 * Calculate deployment cost
 */
export function calculateDeploymentCost(template: ContractTemplate): {
  gasEstimate: number;
  x402Payment: string;
  totalUsdcCost: string;
} {
  const gasEstimate = template.gasEstimate;
  const x402Payment = process.env.X402_PAYMENT_AMOUNT || '1000000'; // 1.00 USDC
  
  return {
    gasEstimate,
    x402Payment,
    totalUsdcCost: x402Payment
  };
}
