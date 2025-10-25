/**
 * Transfer Contract Ownership Script
 * 
 * Use this script to transfer ownership of the NFT contract
 * to your personal wallet after deployment
 */

import { transferOwnership } from '../contracts/deploy';

const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;
const NEW_OWNER = '0xe5b0AE2782a61169218Da729EE40caa25eF47885'; // Your personal wallet
const NETWORK = (process.env.NEXT_PUBLIC_NETWORK || 'base-sepolia') as 'base-sepolia' | 'base-mainnet';

async function main() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('NFT_CONTRACT_ADDRESS not set in .env.local');
  }

  console.log('🔐 Transferring Ownership\n');
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`New Owner: ${NEW_OWNER}`);
  console.log(`Network: ${NETWORK}\n`);

  const result = await transferOwnership(
    CONTRACT_ADDRESS,
    NEW_OWNER,
    NETWORK
  );

  console.log('\n✅ Ownership transfer complete!');
  console.log(`\nTransaction: ${result.transactionHash}`);
  console.log(`\n📋 Important:`);
  console.log(`   - The contract owner is now: ${NEW_OWNER}`);
  console.log(`   - Admin functions (updateBaseURI, updateServerWallet, etc.) must be called from this address`);
  console.log(`   - The server wallet can still mint NFTs`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
