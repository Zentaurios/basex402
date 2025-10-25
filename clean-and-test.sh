#!/bin/bash

echo "🧹 Cleaning forge build artifacts..."
rm -rf cache out

echo "✅ Cache cleaned!"
echo ""
echo "🔨 Rebuilding and running tests..."
forge test -vv

echo ""
echo "✅ Done!"
