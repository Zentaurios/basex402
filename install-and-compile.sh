#!/bin/bash
set -e

echo "Installing CCIP and testing compilation..."

# Navigate to project directory
cd /Users/Ryan/builds/x402-contract-deployer

# Install CCIP dependencies via Foundry
echo "Installing CCIP..."
forge install smartcontractkit/ccip@v1.6.1 --no-commit

# Check if compilation works
echo "Testing compilation..."
forge build

echo "Installation and compilation completed!"
