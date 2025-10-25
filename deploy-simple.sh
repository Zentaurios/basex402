#!/bin/bash
# Simple deployment using Foundry with your own wallet
# No CDP complexity - just works!

set -e

echo "🚀 Deploying X402 Protocol Pioneers to Base Mainnet"
echo ""

# Configuration
OWNER_WALLET="0xe5b0AE2782a61169218Da729EE40caa25eF47885"
ROYALTY_RECEIVER="0xe5b0AE2782a61169218Da729EE40caa25eF47885"
BASE_URI="https://basex402.com/api/metadata/"
RPC_URL="https://mainnet.base.org"

# Get server wallet from CDP (for constructor)
echo "⏳ Getting CDP server wallet address..."
SERVER_WALLET=$(node -e "
const { CdpClient } = require('@coinbase/cdp-sdk');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
(async () => {
  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
  });
  const serverAccount = await cdp.evm.getOrCreateAccount({ name: 'x402-minting-wallet' });
  console.log(serverAccount.address);
})();
")

echo "✅ Server Wallet (for minting): $SERVER_WALLET"
echo ""

echo "Configuration:"
echo "  Owner: $OWNER_WALLET"
echo "  Server Wallet: $SERVER_WALLET"
echo "  Royalty Receiver: $ROYALTY_RECEIVER"
echo "  Base URI: $BASE_URI"
echo ""

echo "⏳ Compiling contract..."
forge build --force

echo ""
echo "📝 Ready to deploy!"
echo ""
echo "You need a private key with ~0.001 ETH on Base mainnet"
echo "(You can use Coinbase Wallet, MetaMask, or any wallet)"
echo ""
read -s -p "Paste private key (0x...): " PRIVATE_KEY
echo ""
echo ""

echo "⏳ Deploying contract..."
echo ""

# Deploy with forge create
DEPLOY_OUTPUT=$(forge create contracts/X402ProtocolPioneers.sol:X402ProtocolPioneers \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --constructor-args "$SERVER_WALLET" "$BASE_URI" "$ROYALTY_RECEIVER" \
  --json 2>&1)

# Extract contract address
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o '"deployedTo":"0x[a-fA-F0-9]*"' | cut -d'"' -f4)

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "❌ Deployment failed!"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo ""
echo "✅ Contract deployed!"
echo "   Address: $CONTRACT_ADDRESS"
echo ""

# Transfer ownership if deployer is not the owner
DEPLOYER=$(cast wallet address --private-key "$PRIVATE_KEY")
if [ "$DEPLOYER" != "$OWNER_WALLET" ]; then
  echo "⏳ Transferring ownership to $OWNER_WALLET..."
  cast send "$CONTRACT_ADDRESS" \
    "transferOwnership(address)" \
    "$OWNER_WALLET" \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY"
  echo "✅ Ownership transferred!"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Owner: $OWNER_WALLET"
echo "Server Wallet: $SERVER_WALLET"
echo "Royalty Receiver: $ROYALTY_RECEIVER"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🔗 View on BaseScan:"
echo "   https://basescan.org/address/$CONTRACT_ADDRESS"
echo ""

# Save to deployment file
cat > deployment-mainnet.json <<EOF
{
  "network": "base-mainnet",
  "contractAddress": "$CONTRACT_ADDRESS",
  "ownerWallet": "$OWNER_WALLET",
  "serverWallet": "$SERVER_WALLET",
  "royaltyReceiver": "$ROYALTY_RECEIVER",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "explorerUrl": "https://basescan.org/address/$CONTRACT_ADDRESS"
}
EOF

echo "✅ Saved to deployment-mainnet.json"
echo ""
echo "Next Steps:"
echo "1. Update .env.local with: NEXT_PUBLIC_NFT_CONTRACT=$CONTRACT_ADDRESS"
echo "2. Fund server wallet ($SERVER_WALLET) with ~0.01 ETH for minting"
echo "3. Test minting via your app!"
