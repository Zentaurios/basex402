#!/usr/bin/env tsx
/**
 * Deploy X402 Protocol Pioneers NFT to Base Mainnet
 * 
 * This script:
 * 1. Compiles the contract with Foundry
 * 2. Deploys to Base mainnet using CDP Server Wallets
 * 3. Transfers ownership to your wallet
 * 4. Saves the contract address
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync } from 'fs';
import { createPublicClient, http, encodeAbiParameters, parseAbiParameters } from 'viem';
import { base } from 'viem/chains';
import dotenv from 'dotenv';
import { CdpClient } from '@coinbase/cdp-sdk';

dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

// Configuration
const OWNER_WALLET = '0xe5b0AE2782a61169218Da729EE40caa25eF47885';
const ROYALTY_RECEIVER = '0xe5b0AE2782a61169218Da729EE40caa25eF47885';
const BASE_URI = 'https://basex402.com/api/metadata/';
const NETWORK = 'base';

async function main() {
  console.log('🚀 Deploying X402 Protocol Pioneers to Base Mainnet\n');
  console.log('Configuration:');
  console.log('  Owner:', OWNER_WALLET);
  console.log('  Royalty Receiver:', ROYALTY_RECEIVER);
  console.log('  Base URI:', BASE_URI);
  console.log('  Network:', NETWORK);
  console.log('\n⏳ Step 1: Compiling contract...\n');

  // Compile contract
  try {
    const { stdout, stderr } = await execAsync('forge build --force');
    if (stderr && !stderr.includes('Compiler run successful')) {
      console.error('Compilation warnings/errors:', stderr);
    }
    console.log('✅ Contract compiled successfully\n');
  } catch (error) {
    console.error('❌ Compilation failed:', error);
    process.exit(1);
  }

  console.log('⏳ Step 2: Reading contract bytecode...\n');

  // Read compiled contract
  let contractJson;
  try {
    const contractPath = './forge-out/X402ProtocolPioneers.sol/X402ProtocolPioneers.json';
    contractJson = JSON.parse(readFileSync(contractPath, 'utf8'));
    console.log('✅ Bytecode loaded\n');
  } catch (error) {
    console.error('❌ Failed to read compiled contract:', error);
    process.exit(1);
  }

  // Initialize CDP
  console.log('⏳ Step 3: Initializing CDP client...\n');
  
  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    walletSecret: process.env.CDP_WALLET_SECRET!,
  });

  // Get deployer account
  const deployerAccount = await cdp.evm.getOrCreateAccount({ 
    name: 'x402-contract-deployer' 
  });
  console.log('📧 Deployer address:', deployerAccount.address);

  // Get server wallet (for minting)
  const serverAccount = await cdp.evm.getOrCreateAccount({ 
    name: 'x402-minting-wallet' 
  });
  console.log('🏭 Server wallet:', serverAccount.address);
  console.log('');

  // Check deployer balance
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  });

  const balance = await publicClient.getBalance({ 
    address: deployerAccount.address as `0x${string}` 
  });
  const ethBalance = Number(balance) / 1e18;
  
  console.log('💰 Deployer balance:', ethBalance.toFixed(6), 'ETH');
  
  if (balance < BigInt(3e14)) { // 0.0003 ETH (~$1 at current prices)
    console.error('❌ Insufficient ETH for deployment. Need at least 0.0003 ETH');
    console.error('   Please fund the deployer wallet:', deployerAccount.address);
    process.exit(1);
  }
  console.log('✅ Sufficient balance for deployment\n');

  // Encode constructor parameters
  console.log('⏳ Step 4: Encoding constructor parameters...\n');
  
  const constructorParams = encodeAbiParameters(
    parseAbiParameters('address, string, address'),
    [
      serverAccount.address as `0x${string}`,
      BASE_URI,
      ROYALTY_RECEIVER as `0x${string}`
    ]
  );

  // Combine bytecode with constructor params
  const deployBytecode = (contractJson.bytecode.object + constructorParams.slice(2)) as `0x${string}`;
  
  console.log('Constructor parameters:');
  console.log('  Server Wallet:', serverAccount.address);
  console.log('  Base URI:', BASE_URI);
  console.log('  Royalty Receiver:', ROYALTY_RECEIVER);
  console.log('');

  // Deploy contract
  console.log('⏳ Step 5: Deploying contract to Base mainnet...\n');
  console.log('⚠️  This will cost approximately $0.50-2 in gas fees on Base');
  console.log('');

  let hash: `0x${string}`;
  try {
    // Use CDP's invokeContract method for deployment
    const result = await cdp.evm.sendTransaction({
      address: deployerAccount.address as `0x${string}`,
      network: NETWORK,
      transaction: {
        // For contract deployment, don't include 'to' field
        data: deployBytecode,
        value: '0x0', // Hex format for 0
      },
    });

    hash = result.transactionHash as `0x${string}`;
    console.log('📋 Transaction hash:', hash);
    console.log('⏳ Waiting for confirmation...\n');
  } catch (error) {
    console.error('❌ Deployment transaction failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   Try funding the deployer with more ETH:');
    console.log('   Address:', deployerAccount.address);
    console.log('   Or check if CDP SDK needs updating: npm update @coinbase/cdp-sdk');
    process.exit(1);
  }

  // Wait for deployment
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  if (!receipt.contractAddress) {
    console.error('❌ No contract address in receipt');
    process.exit(1);
  }

  const contractAddress = receipt.contractAddress;
  const gasUsed = Number(receipt.gasUsed);
  const effectiveGasPrice = Number(receipt.effectiveGasPrice || 0n);
  const deploymentCost = (gasUsed * effectiveGasPrice) / 1e18;

  console.log('✅ Contract deployed successfully!\n');
  console.log('📋 Deployment Details:');
  console.log('  Contract Address:', contractAddress);
  console.log('  Transaction:', hash);
  console.log('  Gas Used:', gasUsed.toLocaleString());
  console.log('  Cost:', deploymentCost.toFixed(6), 'ETH (~$' + (deploymentCost * 3000).toFixed(2) + ')');
  console.log('  Explorer:', `https://basescan.org/address/${contractAddress}`);
  console.log('');

  // Transfer ownership
  console.log('⏳ Step 6: Transferring ownership to your wallet...\n');

  const { encodeFunctionData } = await import('viem');
  
  const transferData = encodeFunctionData({
    abi: [{
      "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    functionName: 'transferOwnership',
    args: [OWNER_WALLET as `0x${string}`]
  });

  const transferResult = await cdp.evm.sendTransaction({
    address: deployerAccount.address as `0x${string}`,
    network: NETWORK,
    transaction: {
      to: contractAddress,
      data: transferData,
      value: '0x0'
    }
  });

  const transferHash = transferResult.transactionHash as `0x${string}`;
  console.log('📋 Transfer transaction:', transferHash);
  
  await publicClient.waitForTransactionReceipt({
    hash: transferHash,
  });

  console.log('✅ Ownership transferred to:', OWNER_WALLET);
  console.log('');

  // Save deployment info
  console.log('⏳ Step 7: Saving deployment info...\n');

  const deploymentInfo = {
    network: 'base-mainnet',
    contractAddress,
    ownerWallet: OWNER_WALLET,
    serverWallet: serverAccount.address,
    royaltyReceiver: ROYALTY_RECEIVER,
    deploymentTx: hash,
    ownershipTransferTx: transferHash,
    gasUsed,
    deploymentCost: deploymentCost.toFixed(6) + ' ETH',
    timestamp: new Date().toISOString(),
    explorerUrl: `https://basescan.org/address/${contractAddress}`,
  };

  writeFileSync(
    './deployment-mainnet.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('✅ Deployment info saved to deployment-mainnet.json\n');

  // Update .env.local
  console.log('⏳ Step 8: Updating .env.local...\n');
  
  let envContent = readFileSync('.env.local', 'utf8');
  envContent = envContent.replace(
    /NEXT_PUBLIC_NFT_CONTRACT=.*/,
    `NEXT_PUBLIC_NFT_CONTRACT=${contractAddress}`
  );
  envContent = envContent.replace(
    /NFT_CONTRACT_ADDRESS=.*/,
    `NFT_CONTRACT_ADDRESS=${contractAddress}`
  );
  
  // Add if not exists
  if (!envContent.includes('NFT_CONTRACT_ADDRESS=')) {
    envContent += `\nNFT_CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  
  writeFileSync('.env.local', envContent);
  
  console.log('✅ .env.local updated with contract address\n');

  // Final summary
  console.log('🎉 DEPLOYMENT COMPLETE!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Contract Address:', contractAddress);
  console.log('Owner:', OWNER_WALLET);
  console.log('Server Wallet:', serverAccount.address);
  console.log('Royalty Receiver:', ROYALTY_RECEIVER);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Verify contract on BaseScan (optional but recommended)');
  console.log('2. Fund the server wallet with ETH for minting:');
  console.log('   Address:', serverAccount.address);
  console.log('   Recommended: 0.01 ETH (~100 mints)');
  console.log('3. Test minting via your app');
  console.log('4. Execute airdrop when ready:');
  console.log('   - Go to your app');
  console.log('   - Use server wallet to call executeAirdrop()');
  console.log('');
  console.log('🔗 View on BaseScan:');
  console.log(`   https://basescan.org/address/${contractAddress}`);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
