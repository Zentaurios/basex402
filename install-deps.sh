#!/bin/bash

# Core Coinbase SDK
npm install @coinbase/cdp-sdk

# Web3 and Ethereum utilities  
npm install viem @rainbow-me/rainbowkit wagmi

# UI and utilities
npm install lucide-react framer-motion clsx class-variance-authority

# Development tools
npm install dotenv tsx

echo "✅ Dependencies installed successfully!"
echo "Run the following to complete setup:"
echo "1. chmod +x install-deps.sh && ./install-deps.sh"
echo "2. Copy the .env.local.example to .env.local and add your keys"
