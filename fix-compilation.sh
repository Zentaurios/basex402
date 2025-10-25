#!/bin/bash

# Fix compilation errors in test files

echo "🔧 Fixing compilation errors..."

cd /Users/Ryan/builds/x402-contract-deployer

# Fix Unicode characters in test files
echo "Fixing Unicode characters..."

# Fix X402Airdrop.t.sol
sed -i '' 's/🔥/===/g' test/X402Airdrop.t.sol
sed -i '' 's/🎯/===/g' test/X402Airdrop.t.sol

# Fix X402Gas.t.sol  
sed -i '' 's/🔥/===/g' test/X402Gas.t.sol

# Fix escaped quotes in X402WalletLimits.t.sol
sed -i '' 's/\\"Exceeds wallet limit\\"/\"Exceeds wallet limit\"/g' test/X402WalletLimits.t.sol
sed -i '' 's/\\"Recipient would exceed wallet limit\\"/\"Recipient would exceed wallet limit\"/g' test/X402WalletLimits.t.sol

echo "✅ Fixed compilation errors!"
echo "Now run: ./run-tests.sh"
