'use server';

import { CdpClient } from '@coinbase/cdp-sdk';

/**
 * Simple test function to check what CDP returns for a specific address
 * Call this from a page to debug balance issues
 */
export async function testCdpBalances(address: string, network: 'base' | 'base-sepolia' = 'base-sepolia') {
  console.log('\n🧪 === CDP BALANCE TEST ===');
  console.log('Address:', address);
  console.log('Network:', network);
  
  try {
    const cdp = new CdpClient();
    
    const result = await cdp.evm.listTokenBalances({
      address: address as `0x${string}`,
      network: network,
    });

    console.log('\n✅ CDP Response:');
    console.log('Total balances found:', result.balances.length);
    
    result.balances.forEach((balance, index) => {
      console.log(`\n[${index}] ${balance.token.symbol || 'Unknown'}`);
      console.log('  Amount:', balance.amount.amount.toString());
      console.log('  Decimals:', balance.amount.decimals);
      console.log('  Contract:', balance.token.contractAddress);
      console.log('  Name:', balance.token.name);
    });
    
    // Check if ETH is included
    const ethBalance = result.balances.find(b => b.token.symbol === 'ETH');
    if (ethBalance) {
      console.log('\n💰 ETH Balance Found!');
      console.log('  Amount:', ethBalance.amount.amount.toString());
      console.log('  In ETH:', (Number(ethBalance.amount.amount) / 1e18).toFixed(6));
    } else {
      console.log('\n❌ No ETH balance in CDP response');
    }
    
    console.log('\n🧪 === END TEST ===\n');
    
    return {
      success: true,
      balances: result.balances,
      hasEth: !!ethBalance,
    };
  } catch (error) {
    console.error('\n❌ CDP Test Error:', error);
    console.log('\n🧪 === END TEST ===\n');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
