#!/bin/bash

# Simple test runner for critical airdrop gas test

echo "x402CRITICAL AIRDROP GAS TEST"
echo "================================"

cd /Users/Ryan/builds/x402-contract-deployer

echo "Current directory: $(pwd)"
echo ""

# Check if forge is available
if ! command -v forge &> /dev/null; then
    echo "Forge not found. Please install Foundry first."
    exit 1
fi

echo "Forge found: $(forge --version)"
echo ""

echo "Running CRITICAL airdrop gas consumption test..."
echo "This is the most important test from the handoff document"
echo ""

# Run the critical test
forge test --match-contract X402AirdropGasTest --match-test test_AirdropGasConsumption -vvv

echo ""
echo "Additional Tests:"

echo ""
echo "Testing wallet limits..."
forge test --match-contract X402AirdropGasTest --match-test test_WalletLimitsWithAirdrop -v

echo ""
echo "Testing rarity tiers..."
forge test --match-contract X402AirdropGasTest --match-test test_RarityTiers -v

echo ""
echo "Gas Report for airdrop function:"
forge test --match-contract X402AirdropGasTest --gas-report

echo ""
echo "SUMMARY"
echo "=========="
echo "This tests the CRITICAL requirement from handoff:"
echo "   - Airdrop gas consumption must be < 20M gas safety buffer"
echo "   - Base network limit: 25M gas per transaction"
echo "   - Our safety target: < 20M gas (80% of limit)"
echo ""
echo "If the test passes, the contract is ready for deployment!"
echo "If it fails, gas optimization is needed in _executeFullAirdrop()"
