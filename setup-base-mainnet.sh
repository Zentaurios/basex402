#!/bin/bash

echo "🚀 Setting up x402Contract Factory for Base..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Install updated dependencies
print_status "Installing updated Coinbase dependencies for Base..."

npm uninstall @coinbase/cdp-sdk 2>/dev/null

npm install \
  @coinbase/coinbase-sdk@^0.25.0 \
  @coinbase/x402@^0.6.4 \
  x402-next@^0.6.1 \
  @coinbase/cdp-core@^0.0.31 \
  @coinbase/cdp-react@^0.0.31 \
  @coinbase/cdp-hooks@^0.0.31

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Update environment variables
print_status "Setting up Base environment configuration..."

if [ ! -f .env.local ]; then
    cp .env.local.mainnet .env.local
    print_success "Created .env.local from Base template"
    print_warning "⚠️  IMPORTANT: You need to add your API keys to .env.local"
    echo ""
    echo "Required API keys:"
    echo "  - CDP_API_KEY_ID and CDP_API_KEY_SECRET (from portal.cdp.coinbase.com)"
    echo "  - NEXT_PUBLIC_CDP_PROJECT_ID (for embedded wallets)"
    echo "  - ETHERSCAN_API_KEY (from etherscan.io/apis - supports Base)"
    echo "  - X402_RECIPIENT_ADDRESS (where you want payments to go)"
    echo ""
else
    print_warning ".env.local already exists. Please manually update it with Base settings from .env.local.mainnet"
fi

# Step 3: Update implementation files
print_status "Updating implementation files for Base..."

# Replace API route
if [ -f src/app/api/deploy/route-mainnet.ts ]; then
    mv src/app/api/deploy/route.ts src/app/api/deploy/route.backup.ts 2>/dev/null
    cp src/app/api/deploy/route-mainnet.ts src/app/api/deploy/route.ts
    print_success "Updated deployment API for Base"
fi

# Replace landing page
if [ -f src/app/page-mainnet.tsx ]; then
    mv src/app/page.tsx src/app/page.backup.tsx 2>/dev/null
    cp src/app/page-mainnet.tsx src/app/page.tsx
    print_success "Updated landing page for Base"
fi

# Step 4: Create lib imports file for easy importing
print_status "Creating unified imports for Base..."

cat > src/lib/index.ts << 'EOF'
/**
 * Unified exports for Base implementation
 * Use these imports throughout the application
 */

// Network Configuration
export * from './network-config';

// Server Wallets v2 (GA)
export * from './server-wallets-mainnet';

// x402 Protocol (Official)
export * from './x402-mainnet';

// Embedded Wallets (Beta)
export * from './embedded-wallets';

// Etherscan V2 API
export * from './etherscan-v2';

// Contract Templates
export * from './contracts';
EOF

print_success "Created unified imports"

# Step 5: Update TypeScript paths (if using path mapping)
print_status "Checking TypeScript configuration..."

if grep -q "\"@/*\"" tsconfig.json; then
    print_success "TypeScript path mapping already configured"
else
    print_warning "Consider adding path mapping to tsconfig.json for cleaner imports"
fi

# Step 6: Validate setup
print_status "Validating Base setup..."

# Check if key files exist
FILES_TO_CHECK=(
    "src/lib/network-config.ts"
    "src/lib/server-wallets-mainnet.ts" 
    "src/lib/x402-mainnet.ts"
    "src/lib/embedded-wallets.ts"
    "src/lib/etherscan-v2.ts"
    ".env.local"
)

ALL_FILES_EXIST=true

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file"
    else
        print_error "✗ Missing: $file"
        ALL_FILES_EXIST=false
    fi
done

echo ""
echo "=================================================="
echo "🎉 Base Setup Complete!"
echo "=================================================="
echo ""

if [ "$ALL_FILES_EXIST" = true ]; then
    print_success "All required files are in place"
    echo ""
    echo "🔥 KEY FEATURES ENABLED:"
    echo "  ⚡ x402 Protocol v0.6.4 (Production Ready)"
    echo "  🏗️  Server Wallets v2 (General Availability)"
    echo "  💳 Embedded Wallets (Beta)"
    echo "  📊 Etherscan V2 API (Base Support)"
    echo "  🌐 Base (Chain ID: 8453)"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "  1. Add your API keys to .env.local"
    echo "  2. Fund your CDP wallet with ETH for gas"
    echo "  3. Set your X402_RECIPIENT_ADDRESS"
    echo "  4. Run: npm run dev"
    echo "  5. Test deployment at http://localhost:3000/deploy"
    echo ""
    echo "💰 PAYMENT INFO:"
    echo "  • Cost: \$0.05 USDC per contract deployment"
    echo "  • Network: Base (real payments)"
    echo "  • Gas: Handled by Server Wallets v2"
    echo ""
    echo "🔗 USEFUL LINKS:"
    echo "  • CDP Portal: https://portal.cdp.coinbase.com/"
    echo "  • Base Explorer: https://basescan.org"
    echo "  • x402 Docs: https://docs.cdp.coinbase.com/x402/welcome"
    echo "  • Etherscan API: https://etherscan.io/apis"
else
    print_error "Some files are missing. Please check the setup."
fi

echo ""
echo "🚨 IMPORTANT REMINDERS:"
echo "  • This uses REAL USDC on Base (not testnet)"
echo "  • Ensure your wallet has sufficient ETH for gas fees"
echo "  • x402 payments are non-refundable"
echo "  • Always test small amounts first"
echo ""

print_warning "Ready to deploy to production! 🚀"
