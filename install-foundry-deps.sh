#!/bin/bash

# Install Foundry Dependencies for x402 Protocol Pioneers NFT Contract

echo "🔧 Installing Foundry Dependencies..."
echo "====================================="

cd /Users/Ryan/builds/x402-contract-deployer

# Initialize git if not already done (required for forge install)
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit" --quiet
fi

# Install forge-std 
echo "Installing forge-std..."
forge install foundry-rs/forge-std --no-commit

# Install OpenZeppelin contracts for Foundry
echo "Installing OpenZeppelin contracts..."
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Install Chainlink contracts
echo "Installing Chainlink CCIP contracts..."
forge install smartcontractkit/chainlink-brownie-contracts --no-commit

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "📁 Directory structure:"
ls -la lib/ 2>/dev/null || echo "lib/ directory not created yet"

echo ""
echo "🔄 Now run the tests again:"
echo "./run-tests.sh"
