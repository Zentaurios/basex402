// Script to check if Solana hooks are available in @coinbase/cdp-hooks
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for Solana support in @coinbase/cdp-hooks...\n');

try {
  // Check if cdp-hooks is installed
  const cdpHooksPath = path.join(process.cwd(), 'node_modules', '@coinbase', 'cdp-hooks');
  
  if (!fs.existsSync(cdpHooksPath)) {
    console.log('❌ @coinbase/cdp-hooks not found. Run: npm install @coinbase/cdp-hooks');
    process.exit(1);
  }

  // Check package.json version
  const packageJsonPath = path.join(cdpHooksPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`📦 Installed version: ${packageJson.version}\n`);

  // Try to import and check for Solana hooks
  const cdpHooks = require('@coinbase/cdp-hooks');
  
  const solanaHooks = [
    'useSolanaAddress',
    'useSolanaBalance', 
    'useSignSolanaMessage',
    'useSignSolanaTransaction',
    'useSendSolanaTransaction'
  ];

  console.log('Available Solana hooks:');
  let hasAnySolanaSupport = false;
  
  solanaHooks.forEach(hookName => {
    const exists = typeof cdpHooks[hookName] !== 'undefined';
    if (exists) hasAnySolanaSupport = true;
    console.log(`  ${exists ? '✅' : '❌'} ${hookName}`);
  });

  console.log('\n' + (hasAnySolanaSupport 
    ? '✅ Solana support is available!' 
    : '⚠️  Solana hooks not found. You may need to update to a newer version.'));

  // List all available exports
  console.log('\n📋 All available exports:');
  Object.keys(cdpHooks)
    .filter(key => !key.startsWith('_'))
    .sort()
    .forEach(key => {
      console.log(`  - ${key}`);
    });

} catch (error) {
  console.error('❌ Error checking CDP hooks:', error.message);
  process.exit(1);
}
