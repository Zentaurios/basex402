#!/bin/bash
# Make all Python generator scripts executable

echo "🔧 Making x402generator scripts executable..."

chmod +x generate-collection-banner.py
chmod +x generate-gifs-improved.py
chmod +x generate-png-improved.py
chmod +x regenerate-assets.py

echo "✅ All scripts are now executable!"
echo ""
echo "📋 Available commands:"
echo "  ./generate-collection-banner.py  - Generate collection banner"
echo "  ./generate-gifs-improved.py      - Generate all GIF animations"
echo "  ./generate-png-improved.py       - Generate all PNG static images"
echo "  ./regenerate-assets.py           - Regenerate all assets at once"
echo ""
echo "🎨 All scripts now use official Base brand colors!"
