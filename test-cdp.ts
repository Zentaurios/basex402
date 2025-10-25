// test-cdp.ts - Quick test script for CDP Server Wallets v2
import { CdpClient } from '@coinbase/cdp-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testCDPSetup() {
  console.log('🧪 Testing CDP Server Wallets v2 Setup...');
  console.log('==========================================');
  
  // Check environment variables
  const requiredVars = ['CDP_API_KEY_ID', 'CDP_API_KEY_SECRET', 'CDP_WALLET_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('   Please check your .env.local file');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
  
  try {
    // Initialize CDP client
    console.log('\n📡 Initializing CDP client...');
    const cdp = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID!,
      apiKeySecret: process.env.CDP_API_KEY_SECRET!,
      walletSecret: process.env.CDP_WALLET_SECRET!,
    });
    
    console.log('✅ CDP client initialized successfully');
    
    // Test account creation
    console.log('\n📱 Testing account creation...');
    const account = await cdp.evm.getOrCreateAccount({ name: 'test-wallet-setup' });
    
    console.log(`✅ Account created/retrieved successfully: ${account.address}`);
    
    console.log('\n✅ CDP setup test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ CDP setup test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCDPSetup().catch(console.error);