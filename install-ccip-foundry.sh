#!/bin/bash
set -e

echo "Installing CCIP dependencies via Foundry..."

# Navigate to project directory
cd /Users/Ryan/builds/x402-contract-deployer

# Install CCIP dependencies via Foundry
forge install smartcontractkit/ccip@v1.6.1 --no-commit

# Install chainlink contracts for additional dependencies  
forge install smartcontractkit/chainlink@v2.12.0 --no-commit

echo "CCIP dependencies installed successfully!"
