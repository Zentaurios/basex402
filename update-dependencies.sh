#!/bin/bash

echo "🚀 Installing updated Coinbase dependencies..."

# Remove old dependencies
npm uninstall @coinbase/cdp-sdk

# Install official current packages
npm install @coinbase/coinbase-sdk@^0.25.0   # Server Wallets v2 (GA)
npm install @coinbase/x402@^0.6.4           # Official x402 implementation  
npm install x402-next@^0.6.1               # Next.js x402 middleware
npm install @coinbase/cdp-core@^0.0.31      # Embedded Wallets core
npm install @coinbase/cdp-react@^0.0.31     # Embedded Wallets React components
npm install @coinbase/cdp-hooks@^0.0.31     # Embedded Wallets React hooks

echo "✅ Updated dependencies installed!"
echo ""
echo "📋 Next steps:"
echo "1. Update import statements to use new packages"
echo "2. Replace custom x402 implementation with official one"
echo "3. Implement real embedded wallets"
echo "4. Update Server Wallets to GA API"
