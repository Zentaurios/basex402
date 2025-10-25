#!/bin/bash

echo "🚀 x402Contract Factory - Environment-Based Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
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

print_feature() {
    echo -e "${PURPLE}[FEATURE]${NC} $1"
}

echo "This setup script configures x402Contract Factory to work with:"
echo "• Base (real payments) OR Base Sepolia (testnet)"
echo "• Official x402 Protocol v0.6.4"
echo "• Server Wallets v2 (General Availability)"
echo "• Embedded Wallets (Beta)"
echo "• Etherscan V2 API with Base support"
echo ""

# Step 1: Install updated dependencies
print_status "Installing updated dependencies..."

# Remove old packages
npm uninstall @coinbase/cdp-sdk 2>/dev/null

# Install official current packages
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

echo ""

# Step 2: Environment configuration
print_status "Setting up environment configuration..."

if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    print_success "Created .env.local from template"
else
    print_warning ".env.local already exists"
    read -p "Do you want to backup and replace it with the new template? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv .env.local .env.local.backup
        cp .env.local.example .env.local
        print_success "Backed up existing .env.local and created new one"
    else
        print_warning "Keeping existing .env.local - you may need to manually update it"
    fi
fi

echo ""

# Step 3: Check implementation files
print_status "Checking implementation files..."

FILES_TO_CHECK=(
    "src/lib/network-config.ts"
    "src/lib/server-wallets.ts"
    "src/lib/x402.ts"
    "src/lib/embedded-wallets.ts"
    "src/lib/etherscan-v2.ts"
    "src/app/api/deploy/route.ts"
    "src/app/page.tsx"
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

if [ "$ALL_FILES_EXIST" = false ]; then
    print_error "Some implementation files are missing!"
    print_warning "Please ensure all updated files are in place"
    echo ""
fi

# Step 4: Configuration guidance
echo ""
echo "=================================================="
print_feature "🔧 CONFIGURATION REQUIRED"
echo "=================================================="
echo ""

echo "You need to configure the following in .env.local:"
echo ""

print_warning "1. CHOOSE YOUR NETWORK:"
echo "   • For Base (real payments): NEXT_PUBLIC_ENABLE_MAINNET=true"
echo "   • For Base Sepolia (testnet): NEXT_PUBLIC_ENABLE_MAINNET=false"
echo ""

print_warning "2. ADD CDP API KEYS (REQUIRED):"
echo "   • Get from: https://portal.cdp.coinbase.com/"
echo "   • CDP_API_KEY_ID=your_api_key_id"
echo "   • CDP_API_KEY_SECRET=your_api_key_secret"
echo "   • NEXT_PUBLIC_CDP_PROJECT_ID=your_project_id"
echo ""

print_warning "3. ADD ETHERSCAN API KEY (REQUIRED):"
echo "   • Get from: https://etherscan.io/apis"
echo "   • ETHERSCAN_API_KEY=your_etherscan_key"
echo "   • Single key works for both Base AND Sepolia!"
echo ""

print_warning "4. SET PAYMENT RECIPIENT:"
echo "   • X402_RECIPIENT_ADDRESS=your_wallet_address"
echo "   • This is where you'll receive $0.05 USDC payments"
echo ""

# Step 5: Network-specific information
echo ""
echo "=================================================="
print_feature "🌐 NETWORK INFORMATION"
echo "=================================================="
echo ""

echo "Your app automatically adapts based on NEXT_PUBLIC_ENABLE_MAINNET:"
echo ""

print_success "Base (NEXT_PUBLIC_ENABLE_MAINNET=true):"
echo "  ✅ Real USDC payments (non-refundable)"
echo "  ✅ Production environment"
echo "  ✅ Chain ID: 8453"
echo "  ✅ USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
echo "  ✅ Explorer: https://basescan.org"
echo "  ✅ Gasless USDC transfers"
echo "  ❌ No testnet faucets (need real ETH for gas)"
echo ""

print_success "BASE SEPOLIA (NEXT_PUBLIC_ENABLE_MAINNET=false):"
echo "  ✅ Testnet USDC (safe for development)"
echo "  ✅ Development environment"
echo "  ✅ Chain ID: 84532"
echo "  ✅ USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e"
echo "  ✅ Explorer: https://sepolia.basescan.org"
echo "  ✅ Testnet faucet funding"
echo "  ❌ No gasless transfers"
echo ""

# Step 6: Features summary
echo ""
echo "=================================================="
print_feature "🎉 FEATURES ENABLED"
echo "=================================================="
echo ""

echo "Your x402Contract Factory now includes:"
echo ""
print_success "⚡ x402 Protocol v0.6.4 (Official Coinbase package)"
print_success "🏗️ Server Wallets v2 (General Availability with 99.9% SLA)"
print_success "💳 Embedded Wallets (Beta with 4.1% USDC rewards)"
print_success "📊 Etherscan V2 API (Base support with single API key)"
print_success "🌐 Environment-based configuration (Mainnet/Sepolia)"
print_success "🔍 Automatic contract verification"
print_success "💰 Real micropayment economics"
echo ""

# Step 7: Next steps
echo ""
echo "=================================================="
print_feature "📋 NEXT STEPS"
echo "=================================================="
echo ""

echo "1. Edit .env.local with your API keys and settings"
echo "2. Choose your network (mainnet vs sepolia)"
echo "3. Fund your CDP wallet if using mainnet"
echo "4. Run: npm run dev"
echo "5. Visit: http://localhost:3000"
echo "6. Test deployment at: /deploy"
echo ""

print_warning "🚨 IMPORTANT REMINDERS:"
echo ""
echo "• MAINNET uses REAL money (USDC payments are non-refundable)"
echo "• SEPOLIA is safe for testing (free testnet tokens)"
echo "• Single Etherscan API key works for both networks"
echo "• Your app automatically adapts to the chosen network"
echo "• Always test on Sepolia first if you're unsure"
echo ""

# Step 8: Final status
echo ""
echo "=================================================="
if [ "$ALL_FILES_EXIST" = true ]; then
    print_success "✅ SETUP COMPLETE!"
else
    print_warning "⚠️ SETUP PARTIALLY COMPLETE"
fi
echo "=================================================="
echo ""

if [ "$ALL_FILES_EXIST" = true ]; then
    echo "🎊 Your x402Contract Factory is ready!"
    echo ""
    echo "Key advantages of your updated project:"
    echo "• Uses production-ready technology (not experimental)"
    echo "• Flexible mainnet/testnet configuration"
    echo "• Official packages throughout the stack"
    echo "• Real micropayment economics demonstration"
    echo "• Enterprise-grade infrastructure"
    echo ""
    print_feature "🚀 Ready to showcase cutting-edge payment technology!"
else
    echo "Please ensure all files are in place and try again."
fi

echo ""
print_success "Happy building! 🎉"
