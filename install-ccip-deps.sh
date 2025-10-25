#!/bin/bash

echo "Installing CCIP Dependencies via Foundry"
echo "========================================"

cd /Users/Ryan/builds/x402-contract-deployer

# Install CCIP via Foundry
echo "Installing Chainlink CCIP v1.6.1..."
forge install smartcontractkit/ccip@v1.6.1 --no-commit

# Verify OpenZeppelin is properly installed
echo "Verifying OpenZeppelin contracts..."
if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "OpenZeppelin not found, installing..."
    forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
fi

echo "Updating git submodules..."
git submodule update --init --recursive

echo "Cleaning build cache..."
forge clean

echo "Testing compilation..."
forge build

echo "Done!"
