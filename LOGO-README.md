# x402Logo Generation

## Quick Start

Run the logo generation script:

```bash
python3 generate-logos.py
```

This will generate:

### Logos
- `public/images/logo.png` (512x512) - Main logo
- `public/images/logo-transparent.png` - Transparent background version
- Multiple sizes: 256, 128, 64, 32

### Favicons
- `public/favicon.ico` - Multi-size favicon
- `public/apple-touch-icon.png` - Apple devices
- `public/icons/favicon-*.png` - Various sizes

### Social Sharing (OpenGraph)
- `public/images/og-default.png` (1200x630) - Default
- `public/images/og-home.png` - Homepage
- `public/images/og-mint.png` - Mint page

### Collection Banner
- `public/images/collection-banner.png` (1200x400) - Marketplace banner

## Design

**Colorful x402Logo:**
- Blue background (#0000ff - Base brand)
- White **X**
- Red **4** (#fc401f)
- Yellow **0** (#ffd12f)
- Green **2** (#66c800)

All colors from the official Base brand kit!

## Requirements

```bash
pip install Pillow
```

## Next Steps

After generating, update your Next.js metadata in `src/app/layout.tsx` to use the new images.
