#!/bin/bash

# x402 Protocol Pioneers NFT Contract - Test Runner
# This script runs the comprehensive test suite for the contract

echo "🔥 x402 Protocol Pioneers NFT Contract Test Suite"
echo "================================================="

cd /Users/Ryan/builds/x402-contract-deployer

echo "📁 Current directory: $(pwd)"
echo ""

# Check if forge is available
if ! command -v forge &> /dev/null; then
    echo "❌ Forge not found. Please install Foundry first."
    echo "Visit: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

echo "✅ Forge found: $(forge --version)"
echo ""

echo "🧪 Running critical tests..."
echo ""

echo "1️⃣ PRIORITY 1: Airdrop Gas Consumption Test"
echo "   Testing that airdrop stays under 20M gas safety buffer"
forge test --match-test testGas_AirdropGasConsumption -vv

echo ""
echo "2️⃣ PRIORITY 2: Wallet Limits Tests"
echo "   Testing 5 NFT per wallet limit including airdrops"
forge test --match-contract X402WalletLimitsTest -v

echo ""
echo "3️⃣ PRIORITY 3: Automatic Airdrop Trigger"
echo "   Testing airdrop triggers when NFT #225 is minted"
forge test --match-test test_AutomaticAirdropTrigger -v

echo ""
echo "4️⃣ Core Functionality Tests"
echo "   Testing basic contract functionality"
forge test --match-contract X402ProtocolPioneersTest -v

echo ""
echo "5️⃣ Comprehensive Airdrop Tests"
echo "   Testing all airdrop scenarios"
forge test --match-contract X402AirdropTest -v

echo ""
echo "6️⃣ Fuzz Tests"
echo "   Running randomized testing"
forge test --match-contract X402FuzzTest

echo ""
echo "7️⃣ CCIP Bridge Tests"
echo "   Testing cross-chain functionality"
forge test --match-contract X402CCIPTest -v

echo ""
echo "8️⃣ Gas Report"
echo "   Generating comprehensive gas usage report"
forge test --gas-report

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "✅ Fixed rarity tier breakpoints (10, 100, 225, 402)"
echo "✅ Added wallet limits testing (5 NFT max per wallet)"
echo "✅ Added critical airdrop gas testing (must be <20M gas)"
echo "✅ Added automatic airdrop trigger testing (at NFT #225)"
echo "✅ Added airdrop + purchase interaction testing"
echo "✅ Updated payment method validation"
echo ""
echo "🚀 Ready for deployment once all tests pass!"
