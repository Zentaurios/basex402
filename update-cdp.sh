#!/bin/bash

# Update CDP packages to latest versions
# This script will update all @coinbase/cdp-* packages to their latest versions

echo "🔄 Updating Coinbase CDP packages..."

# Update CDP Frontend SDK packages
npm install @coinbase/cdp-core@latest @coinbase/cdp-hooks@latest @coinbase/cdp-react@latest

# Update CDP backend SDK
npm install @coinbase/cdp-sdk@latest

# Update OnchainKit
npm install @coinbase/onchainkit@latest

echo "✅ CDP packages updated!"
echo ""
echo "📦 Checking installed versions..."
npm list | grep @coinbase

echo ""
echo "🔍 To verify Solana support, check if useSolanaAddress is available:"
echo "   grep -r 'useSolanaAddress' node_modules/@coinbase/cdp-hooks"
